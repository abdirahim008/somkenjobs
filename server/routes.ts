import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { jobFetcher } from "./services/jobFetcher";
import { seedDatabase } from "./seed";
import { z } from "zod";
import { insertUserSchema, loginUserSchema, insertJobSchema, type User, insertCountrySchema, insertCitySchema, insertSectorSchema } from "@shared/schema";
import { extractJobIdFromSlug, generateJobSlug } from "@shared/utils";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { fileURLToPath } from 'url';
import multer from "multer";
import { parse as csvParse } from "csv-parse/sync";
import { sanitizeJobContentFields, sanitizeRichHtml } from "./utils/sanitizeHtml";
import { generateJobPostingJsonLd, getJobCanonicalUrl, getJobLastModified, isGoogleIndexableJob } from "./utils/googleJobs";
import { googleIndexing } from "./services/googleIndexing";
import { 
  isBotUserAgent, 
  generateHomepageHTML, 
  generateJobsPageHTML, 
  generateJobDetailsHTML, 
  extractJobIdFromSlug as ssrExtractJobIdFromSlug 
} from "./utils/ssrUtils";
import { jobsCache } from "./services/jobsCache";

const JWT_SECRET = (() => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production");
  }
  console.warn("JWT_SECRET is not set; using a development-only fallback secret.");
  return "development-only-jwt-secret-change-me";
})();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const generatePrivateToken = () => randomBytes(32).toString("hex");

const escapeHtml = (text: string | null | undefined) => String(text || "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const safeUrl = (url: string | null | undefined) => {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return ["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol) ? parsed.toString() : "";
  } catch {
    return "";
  }
};

const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

interface AuthRequest extends Request {
  user?: User;
}

// Authentication middleware
const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const user = await storage.getUser(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Admin middleware
const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

const requireAdminOrCronSecret = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization === `Bearer ${cronSecret}`) {
    return next();
  }

  return authenticate(req, res, () => requireAdmin(req, res, next));
};

const profileUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  companyName: z.string().min(1).optional(),
  jobTitle: z.string().min(1).optional(),
  phoneNumber: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
}).strict();

// Helper function to transform string or string[] to string[]
const arrayTransform = z.union([z.string(), z.array(z.string())]).transform((val) => 
  Array.isArray(val) ? val : [val]
);

const jobFiltersSchema = z.object({
  country: arrayTransform.optional(),
  organization: arrayTransform.optional(),
  sector: arrayTransform.optional(),
  datePosted: z.string().optional(),
  search: z.string().optional(),
});

const lightweightJobFiltersSchema = z.object({
  country: arrayTransform.optional(),
  sector: arrayTransform.optional(),
  search: z.string().optional(),
  limit: z.string().optional().transform((val) => val ? parseInt(val) : undefined),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed database with sample data on startup
  await seedDatabase();
  
  // Start the job scheduler (skip on Vercel — handled by Vercel Cron via /api/trigger-fetch)
  if (!process.env.VERCEL) {
    jobFetcher.startScheduler();
  }

  // Set up uploads directory for file storage
  const uploadsDir = process.env.VERCEL
    ? path.join('/tmp', 'uploads')
    : path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  // Serve uploaded files as downloads so active content cannot execute on the main origin.
  app.use('/uploads', express.static(uploadsDir, {
    setHeaders: (res, filePath) => {
      const filename = path.basename(filePath).replace(/"/g, "");
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  }));

  // File upload endpoint
  app.post('/api/upload', authenticate, upload.single('file'), async (req: AuthRequest, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file provided' });
      const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename = `${Date.now()}-${safeName}`;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, req.file.buffer);
      res.json({ url: `/uploads/${filename}`, originalName: req.file.originalname });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ message: 'Failed to upload file' });
    }
  });

  // 301 Redirects for SEO - Handle old URL patterns
  app.get("/help-center", (req, res) => {
    res.redirect(301, "/help");
  });
  
  app.get("/privacy-policy", (req, res) => {
    res.redirect(301, "/privacy");
  });
  
  app.get("/terms-of-service", (req, res) => {
    res.redirect(301, "/terms");
  });
  
  app.get("/career-guide", (req, res) => {
    res.redirect(301, "/career-resources");
  });
  
  app.get("/job-board", (req, res) => {
    res.redirect(301, "/jobs");
  });
  
  app.get("/humanitarian-jobs", (req, res) => {
    res.redirect(301, "/jobs");
  });
  
  app.get("/ngo-jobs", (req, res) => {
    res.redirect(301, "/jobs");
  });

  // Simple test endpoint
  app.get("/api/ssr/test", (req, res) => {
    console.log('Test endpoint hit');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send('<html><head><title>SSR Test</title></head><body><h1>SSR is working!</h1></body></html>');
  });

  // SSR API endpoints that serve HTML for bots
  app.get("/api/ssr/homepage", async (req, res) => {
    console.log('SSR Homepage endpoint hit');
    try {
      // Fetch job data and stats
      const allJobs = await storage.getAllJobsWithDetails();
      console.log('Fetched', allJobs.length, 'jobs for SSR');
      const recentJobs = allJobs
        .filter(job => job.type !== 'tender' || !job.type) // Filter out tenders
        .sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime())
        .slice(0, 10);
        
      // Calculate stats
      const jobStats = {
        totalJobs: allJobs.length,
        organizations: new Set(allJobs.map(job => job.organization)).size,
        newToday: allJobs.filter(job => {
          const today = new Date();
          const jobDate = new Date(job.datePosted);
          const createdDate = (job as any).createdAt ? new Date((job as any).createdAt) : null;
          return jobDate.toDateString() === today.toDateString() || 
                 (createdDate && createdDate.toDateString() === today.toDateString());
        }).length
      };

      const html = generateHomepageHTML(jobStats, recentJobs);
      console.log('Generated HTML length:', html.length);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      console.error('Error generating homepage SSR:', error);
      res.status(500).json({ 
        error: 'SSR generation failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.get("/api/ssr/jobs", async (req, res) => {
    try {
      // Fetch all jobs, filter out tenders
      const allJobs = await storage.getAllJobsWithDetails();
      const jobs = allJobs
        .filter(job => job.type !== 'tender' || !job.type) // Filter out tenders
        .sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime());

      const html = generateJobsPageHTML(jobs, jobs.length);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      console.error('Error generating jobs page SSR:', error);
      res.status(500).json({ error: 'SSR generation failed' });
    }
  });

  app.get("/api/ssr/job/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const jobId = ssrExtractJobIdFromSlug(slug);
      
      if (!jobId) {
        return res.status(404).json({ error: 'Invalid job slug' });
      }

      const job = await storage.getJobById(jobId);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      const html = generateJobDetailsHTML(job);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      console.error('Error generating job details SSR:', error);
      res.status(500).json({ error: 'SSR generation failed' });
    }
  });

  // Early SSR middleware - intercept bot requests before Vite
  app.use(async (req, res, next) => {
    const userAgent = req.get('User-Agent') || '';
    const isSSRRequest = isBotUserAgent(userAgent) || req.query.ssr === "1";
    
    console.log('SSR middleware check:', req.path, 'UA:', userAgent.substring(0, 30), 'isSSR:', isSSRRequest);
    
    if (!isSSRRequest) {
      return next(); // Not a bot, continue to regular routing
    }

    try {
      // Handle homepage
      if (req.path === "/") {
        console.log('Bot detected, serving inline SSR for homepage');
        const allJobs = await storage.getAllJobsWithDetails();
        console.log('Fetched', allJobs.length, 'jobs for homepage SSR');
        const recentJobs = allJobs
          .filter(job => job.type !== 'tender' || !job.type)
          .sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime())
          .slice(0, 10);
          
        const jobStats = {
          totalJobs: allJobs.length,
          organizations: new Set(allJobs.map(job => job.organization)).size,
          newToday: allJobs.filter(job => {
            const today = new Date();
            const jobDate = new Date(job.datePosted);
            const createdDate = (job as any).createdAt ? new Date((job as any).createdAt) : null;
            return jobDate.toDateString() === today.toDateString() || 
                   (createdDate && createdDate.toDateString() === today.toDateString());
          }).length
        };

        const html = generateHomepageHTML(jobStats, recentJobs);
        console.log('Generated homepage HTML length:', html.length);
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      }
      
      // Handle jobs page
      if (req.path === "/jobs") {
        console.log('Bot detected, serving inline SSR for jobs page');
        const allJobs = await storage.getAllJobsWithDetails();
        const jobs = allJobs
          .filter(job => job.type !== 'tender' || !job.type)
          .sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime());

        const html = generateJobsPageHTML(jobs, jobs.length);
        console.log('Generated jobs page HTML length:', html.length);
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      }
      
      // Handle individual job pages
      if (req.path.startsWith("/jobs/")) {
        console.log('Bot detected, serving inline SSR for job details:', req.path);
        const slug = req.path.substring(6); // Remove "/jobs/"
        const jobId = ssrExtractJobIdFromSlug(slug);
        
        if (!jobId) {
          console.log('Invalid job slug:', slug);
          return res.status(404).send('<html><head><title>Job Not Found</title></head><body><h1>Job Not Found</h1></body></html>');
        }

        const job = await storage.getJobById(jobId);
        
        if (!job) {
          console.log('Job not found for ID:', jobId);
          return res.status(404).send('<html><head><title>Job Not Found</title></head><body><h1>Job Not Found</h1></body></html>');
        }

        if (!isGoogleIndexableJob(job)) {
          console.log('Job is no longer indexable for ID:', jobId);
          return res.status(410).send('<html><head><title>Job No Longer Available</title></head><body><h1>Job No Longer Available</h1></body></html>');
        }

        const html = generateJobDetailsHTML(job);
        console.log('Generated job details HTML length:', html.length);
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      }
      
    } catch (error) {
      console.error('Error in SSR middleware:', error);
      // Fall through to regular routing on error
    }
    
    next(); // Continue to regular routing
  });

  // HEAD handlers for link unfurlers
  app.head("/", async (req, res) => {
    try {
      const allJobs = await storage.getAllJobsWithDetails();
      const jobStats = {
        totalJobs: allJobs.length,
        organizations: new Set(allJobs.map(job => job.organization)).size,
        newToday: allJobs.filter(job => {
          const today = new Date();
          const jobDate = new Date(job.datePosted);
          const createdDate = (job as any).createdAt ? new Date((job as any).createdAt) : null;
          return jobDate.toDateString() === today.toDateString() || 
                 (createdDate && createdDate.toDateString() === today.toDateString());
        }).length
      };
      
      const recentJobs = allJobs
        .filter(job => job.type !== 'tender' || !job.type)
        .sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime())
        .slice(0, 10);
      
      const html = generateHomepageHTML(jobStats, recentJobs);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Length', Buffer.byteLength(html, 'utf8'));
      res.end();
    } catch (error) {
      console.error('Error in HEAD handler for homepage:', error);
      res.status(500).end();
    }
  });

  app.head("/jobs", async (req, res) => {
    try {
      const allJobs = await storage.getAllJobsWithDetails();
      const jobs = allJobs
        .filter(job => job.type !== 'tender' || !job.type)
        .sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime());
      
      const html = generateJobsPageHTML(jobs, jobs.length);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Length', Buffer.byteLength(html, 'utf8'));
      res.end();
    } catch (error) {
      console.error('Error in HEAD handler for jobs page:', error);
      res.status(500).end();
    }
  });

  app.head("/jobs/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const jobId = ssrExtractJobIdFromSlug(slug);
      
      if (!jobId) {
        return res.status(404).end();
      }

      const job = await storage.getJobById(jobId);
      
      if (!job) {
        return res.status(404).end();
      }

      if (!isGoogleIndexableJob(job)) {
        return res.status(410).end();
      }

      const html = generateJobDetailsHTML(job);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Length', Buffer.byteLength(html, 'utf8'));
      res.end();
    } catch (error) {
      console.error('Error in HEAD handler for job details:', error);
      res.status(500).end();
    }
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user (approval required)
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        phoneNumber: userData.phoneNumber || null,
      });

      res.status(201).json({ 
        message: "Registration successful! Your account is pending admin approval.",
        userId: user.id 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginUserSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.isApproved) {
        return res.status(403).json({ message: "Account pending approval" });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      
      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({ 
        token, 
        user: userWithoutPassword,
        message: "Login successful" 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({ message: "Login failed" });
    }
  });

  // Protected route to get current user
  app.get("/api/auth/user", authenticate, (req: AuthRequest, res) => {
    const { password: _, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  });

  // Update user profile
  app.put("/api/users/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = req.user!;
      
      // Only allow users to update their own profile or admins to update any profile
      if (currentUser.id !== userId && !currentUser.isAdmin) {
        return res.status(403).json({ message: "Unauthorized to update this profile" });
      }

      const profileUpdates = profileUpdateSchema.parse(req.body);
      const updatedUser = await storage.updateUser(userId, profileUpdates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile update", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Admin routes for user approval
  app.get("/api/admin/pending-users", authenticate, requireAdmin, async (req, res) => {
    try {
      const pendingUsers = await storage.getAllPendingUsers();
      // Remove passwords from response
      const sanitizedUsers = pendingUsers.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  app.post("/api/admin/approve-user/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const approvedUser = await storage.approveUser(userId, req.user!.email);
      
      if (!approvedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = approvedUser;
      res.json({ 
        message: "User approved successfully", 
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error("Error approving user:", error);
      res.status(500).json({ message: "Failed to approve user" });
    }
  });

  // Lightweight jobs list endpoint with ETag caching for sub-100ms performance
  app.get("/api/jobs/list", async (req, res) => {
    try {
      const filters = lightweightJobFiltersSchema.parse(req.query);
      const startTime = Date.now();
      
      // Generate ETag based on current jobs version and query
      const etag = jobsCache.generateETag(filters);
      
      // Check if client has cached version
      const clientETag = req.headers['if-none-match'];
      if (clientETag === etag) {
        // Client has up-to-date version, return 304 Not Modified
        res.status(304).end();
        console.log(`Jobs list cache hit - 304 response in ${Date.now() - startTime}ms`);
        return;
      }

      // Check cache first
      let cachedEntry = jobsCache.getCachedJobs(filters);
      
      if (cachedEntry) {
        // Cache hit - return cached data with ETag
        res.setHeader('ETag', cachedEntry.etag);
        res.setHeader('Cache-Control', 'public, max-age=30'); // Browser cache for 30s
        res.json(cachedEntry.data);
        console.log(`Jobs list cache hit - ${cachedEntry.data.jobs.length} jobs in ${Date.now() - startTime}ms`);
        return;
      }

      // Cache miss - fetch from database
      const jobs = await storage.getLightweightJobs(filters);
      
      // Get all jobs for stats and filter options (use simple getAllJobs for speed)
      const allJobs = await storage.getAllJobs();
      
      // Calculate stats
      const stats = {
        totalJobs: allJobs.length,
        organizations: new Set(allJobs.map(job => job.organization)).size,
        newToday: allJobs.filter(job => {
          const today = new Date();
          const jobDate = new Date(job.datePosted);
          const createdDate = (job as any).createdAt ? new Date((job as any).createdAt) : null;
          return jobDate.toDateString() === today.toDateString() || 
                 (createdDate && createdDate.toDateString() === today.toDateString());
        }).length
      };
      
      // Get unique filter values
      const filterOptions = {
        countries: Array.from(new Set(allJobs.map(job => job.country))),
        organizations: Array.from(new Set(allJobs.map(job => job.organization))),
        sectors: Array.from(new Set(allJobs.map(job => job.sector).filter(Boolean)))
      };
      
      const responseData = {
        jobs,
        stats,
        filters: filterOptions
      };
      
      // Cache the results
      jobsCache.setCachedJobs(filters, responseData);
      
      // Return response with ETag
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', 'public, max-age=30'); // Browser cache for 30s
      res.json(responseData);
      
      console.log(`Jobs list database query - ${jobs.length} jobs in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error("Error fetching lightweight jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // Get all jobs with optional filtering and searching
  app.get("/api/jobs", async (req, res) => {
    try {
      const filters = jobFiltersSchema.parse(req.query);
      
      let jobs;
      
      // Check if any filters are applied
      const hasFilters = filters.country?.length || filters.organization?.length || 
                        filters.sector?.length || filters.datePosted || filters.search;
      
      if (hasFilters) {
        if (filters.search) {
          // Search jobs and then apply additional filters if any
          jobs = await storage.searchJobs(filters.search);
          
          // Apply additional filters to search results if specified
          if (filters.country?.length || filters.organization?.length || 
              filters.sector?.length || filters.datePosted) {
            jobs = jobs.filter(job => {
              // Country filter
              if (filters.country?.length && !filters.country.includes(job.country)) {
                return false;
              }
              // Organization filter  
              if (filters.organization?.length && !filters.organization.includes(job.organization)) {
                return false;
              }
              // Sector filter
              if (filters.sector?.length && (!job.sector || !filters.sector.includes(job.sector))) {
                return false;
              }
              // Date filter
              if (filters.datePosted) {
                const jobDate = new Date(job.datePosted);
                const now = new Date();
                let cutoffDate: Date;
                
                switch (filters.datePosted) {
                  case "today":
                    cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                  case "week":
                    cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                  case "month":
                    cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                  default:
                    return true;
                }
                
                if (jobDate < cutoffDate) {
                  return false;
                }
              }
              
              return true;
            });
          }
        } else {
          // Apply only non-search filters
          jobs = await storage.filterJobs({
            country: filters.country,
            organization: filters.organization,
            sector: filters.sector,
            datePosted: filters.datePosted,
          });
        }
      } else {
        // No filters applied, return all jobs
        jobs = await storage.getAllJobs();
      }

      // Get job statistics
      const allJobs = await storage.getAllJobs();
      const stats = {
        totalJobs: allJobs.length,
        organizations: new Set(allJobs.map(job => job.organization)).size,
        newToday: allJobs.filter(job => {
          const today = new Date();
          const jobDate = new Date(job.datePosted);
          const createdDate = (job as any).createdAt ? new Date((job as any).createdAt) : null;
          return jobDate.toDateString() === today.toDateString() || 
                 (createdDate && createdDate.toDateString() === today.toDateString());
        }).length
      };

      // Get unique values for filters
      const countries = Array.from(new Set(allJobs.map(job => job.country)));
      const organizations = Array.from(new Set(allJobs.map(job => job.organization)));
      const sectors = Array.from(new Set(allJobs.map(job => job.sector).filter(Boolean)));

      res.json({
        jobs,
        stats,
        filters: {
          countries,
          organizations,
          sectors
        }
      });
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // Get single job by ID or slug
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const param = req.params.id;
      let jobId: number;
      
      if (/^\d+$/.test(param)) {
        jobId = parseInt(param);
      } else {
        const extractedId = extractJobIdFromSlug(param);
        if (!extractedId) {
          return res.status(404).json({ message: "Job not found" });
        }
        jobId = extractedId;
      }
      
      if (isNaN(jobId) || jobId > 2147483647 || jobId < 1) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const token = typeof req.query.token === 'string' ? req.query.token : undefined;
      const job = await storage.getJobById(jobId, token);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.json(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  // Get related jobs for a specific job
  app.get("/api/jobs/:id/related", async (req, res) => {
    try {
      const param = req.params.id;
      let jobId: number;
      
      if (/^\d+$/.test(param)) {
        jobId = parseInt(param);
      } else {
        const extractedId = extractJobIdFromSlug(param);
        if (!extractedId) {
          return res.status(404).json({ message: "Job not found" });
        }
        jobId = extractedId;
      }
      
      if (isNaN(jobId) || jobId > 2147483647 || jobId < 1) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const currentJob = await storage.getJobById(jobId);
      
      if (!currentJob) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Get all jobs to find related ones
      const allJobs = await storage.getAllJobs();
      
      // Find related jobs based on:
      // 1. Same sector (highest priority)
      // 2. Same organization 
      // 3. Same location/country
      // Exclude the current job from results
      const relatedJobs = allJobs
        .filter(job => job.id !== jobId)
        .map(job => {
          let score = 0;
          // Same sector gets highest score
          if (job.sector && currentJob.sector && job.sector.toLowerCase() === currentJob.sector.toLowerCase()) {
            score += 3;
          }
          // Same organization gets medium score
          if (job.organization && currentJob.organization && job.organization.toLowerCase() === currentJob.organization.toLowerCase()) {
            score += 2;
          }
          // Same location gets lower score
          if (job.location && currentJob.location && job.location.toLowerCase() === currentJob.location.toLowerCase()) {
            score += 1;
          }
          return { job, score };
        })
        .filter(item => item.score > 0) // Only jobs with some relation
        .sort((a, b) => b.score - a.score) // Sort by relevance score
        .slice(0, 2) // Take top 2 most related jobs
        .map(item => item.job);

      res.json(relatedJobs);
    } catch (error) {
      console.error("Error fetching related jobs:", error);
      res.status(500).json({ message: "Failed to fetch related jobs" });
    }
  });

  // Force refresh jobs (for testing)
  app.post("/api/jobs/refresh", requireAdminOrCronSecret, async (req, res) => {
    try {
      await jobFetcher.fetchAllJobs();
      res.json({
        message: "Job refresh completed",
        indexing: {
          configured: googleIndexing.isConfigured(),
          recentResults: googleIndexing.getRecentResults().slice(0, 20),
        },
      });
    } catch (error) {
      console.error("Error refreshing jobs:", error);
      res.status(500).json({ message: "Failed to refresh jobs" });
    }
  });

  // Vercel Cron / GitHub Actions trigger endpoint — fetches fresh jobs.
  // CRON_SECRET must be set; Vercel automatically sends Authorization: Bearer {CRON_SECRET}.
  app.get("/api/trigger-fetch", async (req, res) => {
    try {
      const cronSecret = process.env.CRON_SECRET;
      if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      console.log("Job fetch triggered via /api/trigger-fetch");
      await jobFetcher.fetchAllJobs();
      const archivedExpiredJobs = await storage.archiveExpiredJobs();
      res.json({
        message: "Job fetch completed",
        timestamp: new Date().toISOString(),
        archivedExpiredJobs,
        indexing: {
          configured: googleIndexing.isConfigured(),
          recentResults: googleIndexing.getRecentResults().slice(0, 20),
        },
      });
    } catch (error) {
      console.error("Error triggering job fetch:", error);
      res.status(500).json({ message: "Failed to trigger job fetch" });
    }
  });

  app.get("/api/google-indexing/status", requireAdminOrCronSecret, async (req, res) => {
    res.json({
      configured: googleIndexing.isConfigured(),
      recentResults: googleIndexing.getRecentResults(),
    });
  });

  app.post("/api/google-indexing/submit-latest", requireAdminOrCronSecret, async (req, res) => {
    try {
      const requestedLimit = Number(req.body?.limit || req.query.limit || 100);
      const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 100, 1), 100);
      const allJobs = await storage.getAllJobsWithDetails();
      const results = googleIndexing.isConfigured()
        ? await googleIndexing.submitLatestJobs(allJobs, limit)
        : [];

      res.json({
        configured: googleIndexing.isConfigured(),
        requestedLimit: limit,
        submitted: results.length,
        failed: results.filter((result) => !result.ok).length,
        results,
      });
    } catch (error) {
      console.error("Error submitting jobs to Google Indexing API:", error);
      res.status(500).json({ message: "Failed to submit jobs to Google Indexing API" });
    }
  });

  // Get organization names for autocomplete
  app.get("/api/organizations", async (req, res) => {
    try {
      const search = req.query.search as string;
      const organizations = await storage.getOrganizations(search);
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  // Location API routes
  app.get("/api/countries", authenticate, async (req: AuthRequest, res) => {
    try {
      const search = req.query.search as string || "";
      const countries = await storage.getCountries(search);
      res.json(countries);
    } catch (error) {
      console.error("Error fetching countries:", error);
      res.status(500).json({ message: "Failed to fetch countries" });
    }
  });

  app.get("/api/cities", authenticate, async (req: AuthRequest, res) => {
    try {
      const search = req.query.search as string || "";
      const country = req.query.country as string || "";
      const cities = await storage.getCities(search, country);
      res.json(cities);
    } catch (error) {
      console.error("Error fetching cities:", error);
      res.status(500).json({ message: "Failed to fetch cities" });
    }
  });

  app.post("/api/countries", authenticate, async (req: AuthRequest, res) => {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Country name is required" });
      }
      const country = await storage.addCountry(name);
      res.status(201).json(country);
    } catch (error) {
      console.error("Error adding country:", error);
      res.status(500).json({ message: "Failed to add country" });
    }
  });

  app.post("/api/cities", authenticate, async (req: AuthRequest, res) => {
    try {
      const { name, country } = req.body;
      if (!name || !country) {
        return res.status(400).json({ message: "City name and country are required" });
      }
      const city = await storage.addCity(name, country);
      res.status(201).json(city);
    } catch (error) {
      console.error("Error adding city:", error);
      res.status(500).json({ message: "Failed to add city" });
    }
  });

  // Sector API routes
  app.get("/api/sectors", authenticate, async (req: AuthRequest, res) => {
    try {
      const search = req.query.search as string || "";
      const sectors = await storage.getSectors(search);
      res.json(sectors);
    } catch (error) {
      console.error("Error fetching sectors:", error);
      res.status(500).json({ message: "Failed to fetch sectors" });
    }
  });

  app.post("/api/sectors", authenticate, async (req: AuthRequest, res) => {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Sector name is required" });
      }
      const sector = await storage.addSector(name);
      res.status(201).json(sector);
    } catch (error) {
      console.error("Error adding sector:", error);
      res.status(500).json({ message: "Failed to add sector" });
    }
  });

  // Get jobs created by the current user
  app.get("/api/user/jobs", authenticate, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const userJobs = await storage.getJobsByUserId(userId);
      res.json(userJobs);
    } catch (error) {
      console.error("Error fetching user jobs:", error);
      res.status(500).json({ message: "Failed to fetch user jobs" });
    }
  });

  // Get jobs that are available for billing (not already billed)
  app.get("/api/user/jobs/available-for-billing", authenticate, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const userJobs = await storage.getJobsByUserId(userId);
      const billedJobIds = await storage.getBilledJobIds(userId);
      
      // Filter out already billed jobs
      const availableJobs = userJobs.filter(job => !billedJobIds.includes(job.id));
      
      res.json(availableJobs);
    } catch (error) {
      console.error("Error fetching available jobs for billing:", error);
      res.status(500).json({ message: "Failed to fetch available jobs for billing" });
    }
  });

  // Update a job (user owns it OR user is super admin)
  app.put("/api/jobs/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const userId = req.user!.id;
      const isAdmin = req.user!.isAdmin;
      
      // Check if user owns this job OR user is super admin
      const existingJob = await storage.getJobById(jobId, undefined, true);
      console.log(`Job update attempt - JobId: ${jobId}, UserId: ${userId}, IsAdmin: ${isAdmin}, JobCreatedBy: ${existingJob?.createdBy}`);
      
      if (!existingJob || (existingJob.createdBy !== userId && !isAdmin)) {
        console.log(`Job update denied - User ${userId} (admin: ${isAdmin}) cannot edit job ${jobId} (created by: ${existingJob?.createdBy})`);
        return res.status(403).json({ message: "You can only edit your own jobs" });
      }

      // Clean Microsoft Office formatting artifacts from text fields
      // Skip aggressive cleaning on content that contains table HTML (editor already cleaned it)
      const cleanMicrosoftText = (text: string): string => {
        if (!text) return text;
        // If the content has table structure, only do safe whitespace cleanup
        if (text.includes('<table')) return text.replace(/\s{3,}/g, '  ').trim();
        return text
          // Only strip patterns that appear as dangling text artifacts (not mid-CSS)
          .replace(/^level\d+\s+lfo\d+"?>\s*/gm, '')
          .replace(/^color:#[0-9A-Fa-f]{6}"?>\s*/gm, '')
          .replace(/mso-list:l\d+\s+level\d+\s+lfo\d+[;"]*>/g, '')
          .replace(/mso-[a-z\-]+:\s*[^;}"<]{0,60};/g, '')
          // Clean up any remaining artifacts
          .replace(/\s+/g, ' ')
          .trim();
      };

      // Validate and transform job data
      const jobData = sanitizeJobContentFields(req.body);
      
      // Clean text fields of Microsoft Office formatting
      if (jobData.description) jobData.description = cleanMicrosoftText(jobData.description);
      if (jobData.qualifications) jobData.qualifications = cleanMicrosoftText(jobData.qualifications);
      if (jobData.howToApply) jobData.howToApply = cleanMicrosoftText(jobData.howToApply);

      // Serialize attachmentUrls array to JSON and store in attachmentUrl column
      if (Array.isArray(jobData.attachmentUrls)) {
        jobData.attachmentUrl = jobData.attachmentUrls.length > 0
          ? JSON.stringify(jobData.attachmentUrls)
          : null;
      }
      delete jobData.attachmentUrls;
      
      // Build transformed data — strip createdAt (must never change) and convert all date strings to Date objects
      const { createdAt: _omitCreatedAt, ...jobDataWithoutCreatedAt } = jobData;
      const isNowPrivate = jobData.visibility === 'private';
      const transformedData = {
        ...jobDataWithoutCreatedAt,
        updatedAt: new Date(),
        ...(jobData.deadline ? { deadline: new Date(jobData.deadline) } : {}),
        ...(jobData.datePosted ? { datePosted: new Date(jobData.datePosted) } : {}),
        visibility: isNowPrivate ? 'private' : 'public',
        privateToken: isNowPrivate ? (jobData.privateToken || existingJob.privateToken || generatePrivateToken()) : null,
      };
      
      const updatedJob = await storage.updateJob(jobId, transformedData);

      if (!updatedJob) {
        return res.status(404).json({ message: "Job not found" });
      }

      res.json({ message: "Job updated successfully", job: updatedJob });
    } catch (error) {
      console.error("Error updating job:", error);
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  // Delete a job (user owns it OR user is super admin)
  app.delete("/api/jobs/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const userId = req.user!.id;
      const isAdmin = req.user!.isAdmin;
      
      // Check if user owns this job OR user is super admin
      const existingJob = await storage.getJobById(jobId, undefined, true);
      if (!existingJob || (existingJob.createdBy !== userId && !isAdmin)) {
        return res.status(403).json({ message: "You can only delete your own jobs" });
      }

      const deleted = await storage.deleteJob(jobId);
      if (!deleted) {
        return res.status(404).json({ message: "Job not found" });
      }

      res.json({ message: "Job deleted successfully" });
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Create job (authenticated users only)
  app.post("/api/jobs", authenticate, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // Generate defaults for required fields that users don't need to provide
      const isPrivate = req.body.visibility === 'private';
      // Serialize attachmentUrls array to JSON string for storage in attachmentUrl column
      let attachmentUrlValue = req.body.attachmentUrl || null;
      if (Array.isArray(req.body.attachmentUrls) && req.body.attachmentUrls.length > 0) {
        attachmentUrlValue = JSON.stringify(req.body.attachmentUrls);
      }
      const jobDataWithDefaults = sanitizeJobContentFields({
        ...req.body,
        attachmentUrl: attachmentUrlValue,
        createdBy: userId,
        source: req.body.source || "user",
        externalId: req.body.externalId || `user-${userId}-${Date.now()}`,
        datePosted: req.body.datePosted || new Date(),
        url: req.body.url || "",
        visibility: isPrivate ? 'private' : 'public',
        privateToken: isPrivate ? (req.body.privateToken || generatePrivateToken()) : null,
      });
      delete jobDataWithDefaults.attachmentUrls;
      
      const jobData = insertJobSchema.parse(jobDataWithDefaults);
      const job = await storage.createJob(jobData);
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid job data", errors: error.errors });
      }
      console.error("Error creating job:", error);
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  // Bulk upload jobs (authenticated users only) - accepts JSON array or CSV file
  app.post("/api/jobs/bulk-upload", authenticate, upload.single("file"), async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      let jobsArray: any[] = [];

      if (req.file) {
        const fileContent = req.file.buffer.toString("utf-8");
        const ext = (req.file.originalname || "").toLowerCase();

        if (ext.endsWith(".csv")) {
          try {
            jobsArray = csvParse(fileContent, {
              columns: true,
              skip_empty_lines: true,
              trim: true,
              relaxColumnCount: true,
            });
          } catch (parseErr: any) {
            return res.status(400).json({ message: "Failed to parse CSV file", error: parseErr.message });
          }
        } else if (ext.endsWith(".json")) {
          try {
            const parsed = JSON.parse(fileContent);
            jobsArray = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            return res.status(400).json({ message: "Failed to parse JSON file" });
          }
        } else {
          return res.status(400).json({ message: "Unsupported file type. Please upload a .csv or .json file." });
        }
      } else if (req.body && Array.isArray(req.body.jobs)) {
        jobsArray = req.body.jobs;
      } else if (req.body && Array.isArray(req.body)) {
        jobsArray = req.body;
      } else {
        return res.status(400).json({ message: "Please provide a JSON array of jobs in the request body (as { \"jobs\": [...] } or [...]) or upload a CSV/JSON file." });
      }

      if (jobsArray.length === 0) {
        return res.status(400).json({ message: "No jobs found in the uploaded data." });
      }

      if (jobsArray.length > 500) {
        return res.status(400).json({ message: "Maximum 500 jobs per upload. Please split your data into smaller batches." });
      }

      const results = { successCount: 0, failureCount: 0, errors: [] as { index: number; title?: string; error: string }[] };

      const parseFuzzyDate = (dateStr: string | undefined | null): Date => {
        if (!dateStr) return new Date();
        const trimmed = dateStr.trim();
        const lower = trimmed.toLowerCase();
        if (lower === 'yesterday') {
          const d = new Date(); d.setDate(d.getDate() - 1); return d;
        }
        if (lower === 'today') return new Date();
        if (/^\d+ days? ago$/i.test(lower)) {
          const days = parseInt(lower);
          const d = new Date(); d.setDate(d.getDate() - days); return d;
        }
        const months: Record<string, number> = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
        const monthDayMatch = lower.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[,.\s]+(\d{1,2})$/i);
        if (monthDayMatch) {
          const m = months[monthDayMatch[1].toLowerCase().slice(0, 3)];
          const day = parseInt(monthDayMatch[2]);
          let year = new Date().getFullYear();
          let result = new Date(year, m, day);
          if (result.getTime() > Date.now() + 90 * 24 * 60 * 60 * 1000) {
            result = new Date(year - 1, m, day);
          }
          return result;
        }
        const monthDayYearMatch = lower.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[,.\s]+(\d{1,2})[,.\s]+(\d{4})$/i);
        if (monthDayYearMatch) {
          const m = months[monthDayYearMatch[1].toLowerCase().slice(0, 3)];
          const day = parseInt(monthDayYearMatch[2]);
          const year = parseInt(monthDayYearMatch[3]);
          return new Date(year, m, day);
        }
        const dayMonthMatch = lower.match(/^(\d{1,2})[\/\-\s]+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[,.\s]*(\d{4})?$/i);
        if (dayMonthMatch) {
          const day = parseInt(dayMonthMatch[1]);
          const m = months[dayMonthMatch[2].toLowerCase().slice(0, 3)];
          const year = dayMonthMatch[3] ? parseInt(dayMonthMatch[3]) : new Date().getFullYear();
          return new Date(year, m, day);
        }
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) return parsed;
        const cleaned = trimmed.replace(/[^\w\s\-\/,:]/g, '').trim();
        const retryParsed = new Date(cleaned);
        return isNaN(retryParsed.getTime()) ? new Date() : retryParsed;
      };

      for (let i = 0; i < jobsArray.length; i++) {
        const rawJob = jobsArray[i];
        try {
          const jobDataWithDefaults = sanitizeJobContentFields({
            title: rawJob.title,
            organization: rawJob.organization,
            location: rawJob.location,
            country: rawJob.country,
            description: rawJob.description || "",
            url: rawJob.url || "",
            datePosted: parseFuzzyDate(rawJob.datePosted),
            deadline: rawJob.deadline ? parseFuzzyDate(rawJob.deadline) : null,
            sector: rawJob.sector || null,
            source: rawJob.source || "user",
            externalId: rawJob.externalId || `user-${userId}-${Date.now()}-${i}`,
            howToApply: rawJob.howToApply || null,
            experience: rawJob.experience || null,
            qualifications: rawJob.qualifications || null,
            responsibilities: rawJob.responsibilities || null,
            bodyHtml: rawJob.bodyHtml || null,
            createdBy: userId,
            status: rawJob.status || "published",
            type: rawJob.type || "job",
            attachmentUrl: rawJob.attachmentUrl || null,
            jobNumber: rawJob.jobNumber || null,
          });

          const jobData = insertJobSchema.parse(jobDataWithDefaults);
          await storage.createJob(jobData);
          results.successCount++;
        } catch (error) {
          results.failureCount++;
          let errorMsg = "Unknown error";
          if (error instanceof z.ZodError) {
            errorMsg = error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ");
          } else if (error instanceof Error) {
            errorMsg = error.message;
          }
          results.errors.push({ index: i + 1, title: rawJob.title || undefined, error: errorMsg });
        }
      }

      res.status(200).json({
        message: `Bulk upload complete. ${results.successCount} succeeded, ${results.failureCount} failed.`,
        totalProcessed: jobsArray.length,
        successCount: results.successCount,
        failureCount: results.failureCount,
        errors: results.errors,
      });
    } catch (error) {
      console.error("Error in bulk job upload:", error);
      res.status(500).json({ message: "Failed to process bulk upload" });
    }
  });

  // Get all pending users (admin only)
  app.get("/api/admin/pending-users", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const pendingUsers = await storage.getAllPendingUsers();
      // Remove passwords from response for security
      const sanitizedUsers = pendingUsers.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  // Reject user registration (admin only)
  app.post("/api/admin/reject-user/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { reason } = req.body;
      
      // For now, we'll delete rejected users. In production, you might want to keep them with a 'rejected' status
      const deleted = await storage.deleteUser(userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }

      // In a real app, you'd send an email notification here
      console.log(`User ${userId} rejected by admin ${req.user!.email}. Reason: ${reason || 'No reason provided'}`);
      
      res.json({ 
        message: "User registration rejected successfully"
      });
    } catch (error) {
      console.error("Error rejecting user:", error);
      res.status(500).json({ message: "Failed to reject user" });
    }
  });

  // Get all users (admin only) - for user management
  app.get("/api/admin/users", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response for security
      const sanitizedUsers = users.map(({ password, ...user }: User) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get all jobs (admin only) - for job management
  app.get("/api/admin/jobs", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const jobs = await storage.getAllJobsWithDetails();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching all jobs for admin:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // Update any job (admin only) - admins can edit any job
  app.put("/api/admin/jobs/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const jobId = parseInt(req.params.id);
      
      // Validate and transform job data — strip createdAt and convert all date strings to Date objects
      const jobData = sanitizeJobContentFields(req.body);
      const { createdAt: _omitCreatedAt, ...jobDataWithoutCreatedAt } = jobData;
      const transformedData = {
        ...jobDataWithoutCreatedAt,
        updatedAt: new Date(),
        ...(jobData.deadline ? { deadline: new Date(jobData.deadline) } : {}),
        ...(jobData.datePosted ? { datePosted: new Date(jobData.datePosted) } : {}),
      };
      
      const updatedJob = await storage.updateJob(jobId, transformedData);

      if (!updatedJob) {
        return res.status(404).json({ message: "Job not found" });
      }

      res.json({ message: "Job updated successfully by admin", job: updatedJob });
    } catch (error) {
      console.error("Error updating job as admin:", error);
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  // Delete any job (admin only) - admins can delete any job
  app.delete("/api/admin/jobs/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const jobId = parseInt(req.params.id);
      
      const deleted = await storage.deleteJob(jobId);
      if (!deleted) {
        return res.status(404).json({ message: "Job not found" });
      }

      res.json({ message: "Job deleted successfully by admin" });
    } catch (error) {
      console.error("Error deleting job as admin:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Bulk job operations (admin only)
  app.post("/api/admin/jobs/bulk-action", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { action, jobIds } = req.body;
      
      if (!Array.isArray(jobIds) || jobIds.length === 0) {
        return res.status(400).json({ message: "Invalid job IDs provided" });
      }

      let results = [];
      
      switch (action) {
        case 'delete':
          for (const jobId of jobIds) {
            const deleted = await storage.deleteJob(parseInt(jobId));
            results.push({ jobId, success: deleted });
          }
          break;
        case 'publish':
          for (const jobId of jobIds) {
            const updated = await storage.updateJob(parseInt(jobId), { status: 'published' });
            results.push({ jobId, success: !!updated });
          }
          break;
        case 'draft':
          for (const jobId of jobIds) {
            const updated = await storage.updateJob(parseInt(jobId), { status: 'draft' });
            results.push({ jobId, success: !!updated });
          }
          break;
        default:
          return res.status(400).json({ message: "Invalid action specified" });
      }

      const successCount = results.filter(r => r.success).length;
      res.json({ 
        message: `Bulk ${action} completed successfully`,
        successful: successCount,
        total: jobIds.length,
        results 
      });
    } catch (error) {
      console.error("Error performing bulk job action:", error);
      res.status(500).json({ message: "Failed to perform bulk action" });
    }
  });

  // Invoice API Routes

  // Get user's invoices
  app.get("/api/invoices", authenticate, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const invoices = await storage.getInvoicesByUserId(userId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Get specific invoice
  app.get("/api/invoices/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      const invoice = await storage.getInvoiceById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Check if user owns this invoice
      if (invoice.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  // Create new invoice
  app.post("/api/invoices", authenticate, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // Get selected job IDs to extract organization names
      const selectedJobIds = JSON.parse(req.body.selectedJobIds || "[]");
      let clientOrganization = "Humanitarian Organization";
      
      if (selectedJobIds.length > 0) {
        // Get the first job to extract organization name
        const firstJob = await storage.getJobById(selectedJobIds[0]);
        if (firstJob && firstJob.organization) {
          clientOrganization = firstJob.organization;
        }
      }
      
      const invoiceData = {
        ...req.body,
        userId,
        status: req.body.status || "draft",
        clientOrganization
      };
      
      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  // Update invoice
  app.put("/api/invoices/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Check if user owns this invoice
      const existingInvoice = await storage.getInvoiceById(invoiceId);
      if (!existingInvoice || existingInvoice.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedInvoice = await storage.updateInvoice(invoiceId, req.body);
      
      if (!updatedInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.json(updatedInvoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  // Delete invoice
  app.delete("/api/invoices/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Check if user owns this invoice
      const existingInvoice = await storage.getInvoiceById(invoiceId);
      if (!existingInvoice || existingInvoice.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const deleted = await storage.deleteInvoice(invoiceId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // Helper function to generate dynamic social media text
  function generateSocialMediaText(job: any, deadline: string): string {
    const catchyPhrases = [
      "🚀 New Exciting Job Alert!",
      "💼 Latest Job Opportunity:",
      "🌟 Fresh Career Opening:",
      "🎯 Hot Job Alert:",
      "⚡ Just Posted:",
      "🔥 Breaking: New Position Available",
      "💫 Exciting Opportunity Alert:",
      "🌍 New Humanitarian Role:"
    ];
    
    // Pick a phrase based on job characteristics
    let phrase = catchyPhrases[0]; // default
    
    if (job.title.toLowerCase().includes('manager')) {
      phrase = "🚀 New Management Position Alert!";
    } else if (job.title.toLowerCase().includes('director')) {
      phrase = "💼 Director Role Now Available:";
    } else if (job.title.toLowerCase().includes('coordinator')) {
      phrase = "🌟 Coordinator Position Open:";
    } else if (job.title.toLowerCase().includes('officer')) {
      phrase = "⚡ Officer Role Just Posted:";
    } else if (job.title.toLowerCase().includes('specialist')) {
      phrase = "🎯 Specialist Position Alert:";
    } else if (job.title.toLowerCase().includes('consultant')) {
      phrase = "💫 Consultancy Opportunity:";
    } else if (job.title.toLowerCase().includes('intern')) {
      phrase = "🌱 Internship Opportunity:";
    } else {
      // Random selection for variety
      phrase = catchyPhrases[Math.floor(Math.random() * catchyPhrases.length)];
    }
    
    return `${phrase} ${job.title} position in ${job.location}, ${job.country} with ${job.organization}${deadline}`;
  }

  // Country landing pages for SEO - e.g., /jobs/country/kenya
  const SUPPORTED_COUNTRIES = ['kenya', 'somalia', 'ethiopia', 'uganda', 'tanzania'];
  const COUNTRY_DISPLAY_NAMES: Record<string, string> = {
    'kenya': 'Kenya',
    'somalia': 'Somalia', 
    'ethiopia': 'Ethiopia',
    'uganda': 'Uganda',
    'tanzania': 'Tanzania'
  };
  const COUNTRY_DESCRIPTIONS: Record<string, string> = {
    'kenya': 'Kenya serves as East Africa\'s humanitarian hub, with Nairobi hosting regional headquarters for numerous international organizations.',
    'somalia': 'Somalia offers unique opportunities for humanitarian professionals to contribute to post-conflict recovery and stabilization efforts.',
    'ethiopia': 'Ethiopia presents vast opportunities for development and humanitarian professionals working across diverse contexts including refugee response.',
    'uganda': 'Uganda offers meaningful opportunities in refugee response, health programming, and development initiatives.',
    'tanzania': 'Tanzania provides opportunities in development programming, refugee support, and health initiatives.'
  };

  app.get('/jobs/country/:country', async (req, res) => {
    try {
      const countryParam = req.params.country.toLowerCase();
      
      if (!SUPPORTED_COUNTRIES.includes(countryParam)) {
        return res.status(404).send('Country not found');
      }
      
      const countryName = COUNTRY_DISPLAY_NAMES[countryParam];
      const countryDescription = COUNTRY_DESCRIPTIONS[countryParam];
      
      // Get jobs for this country
      const allJobs = await storage.getAllJobs();
      const now = new Date();
      const countryJobs = allJobs.filter(job => 
        job.country.toLowerCase() === countryParam
        && (!job.type || job.type === "job")
        && job.status === "published"
        && job.visibility !== "private"
        && (!job.deadline || new Date(job.deadline) >= now)
      );
      
      const pageUrl = `https://somkenjobs.com/jobs/country/${countryParam}`;
      const pageTitle = `Humanitarian Jobs in ${countryName} | ${countryJobs.length}+ Current Openings | Somken Jobs`;
      const pageDescription = `Find ${countryJobs.length}+ humanitarian and development jobs in ${countryName}. ${countryDescription} Browse NGO, UN, and international organization positions.`;
      
      // Read HTML template
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const htmlPath = path.join(__dirname, '../dist/public/index.html');
      let html = '';
      
      try {
        html = fs.readFileSync(htmlPath, 'utf-8');
      } catch (err) {
        const devHtmlPath = path.join(__dirname, '../client/index.html');
        html = fs.readFileSync(devHtmlPath, 'utf-8');
      }
      
      // Replace meta tags
      html = html.replace(/<title>[^<]*<\/title>/, `<title>${pageTitle}</title>`);
      html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${pageDescription}">`);
      html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${pageTitle}">`);
      html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${pageDescription}">`);
      html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${pageUrl}">`);
      html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${pageUrl}">`);
      
      // Add collection structured data on list pages.
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": `Humanitarian Jobs in ${countryName}`,
        "description": pageDescription,
        "url": pageUrl,
        "isPartOf": { "@type": "WebSite", "name": "Somken Jobs", "url": "https://somkenjobs.com/" },
        "about": [`jobs in ${countryName}`, `NGO jobs in ${countryName}`, `humanitarian jobs in ${countryName}`],
        "mainEntity": {
          "@type": "ItemList",
          "numberOfItems": countryJobs.length,
          "itemListElement": countryJobs.slice(0, 10).map((job, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "url": `https://somkenjobs.com/jobs/${generateJobSlug(job.title, job.id)}`,
            "name": job.title
          }))
        }
      };
      
      // Add breadcrumb structured data
      const breadcrumbData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://somkenjobs.com/" },
          { "@type": "ListItem", "position": 2, "name": "Jobs", "item": "https://somkenjobs.com/jobs" },
          { "@type": "ListItem", "position": 3, "name": countryName, "item": pageUrl }
        ]
      };
      
      const additionalTags = `
    <script type="application/ld+json">${jsonLd(structuredData)}</script>
    <script type="application/ld+json">${jsonLd(breadcrumbData)}</script>`;
      
      html = html.replace(/<\/head>/, `${additionalTags}\n  </head>`);
      
      res.send(html);
    } catch (error) {
      console.error('Error serving country page:', error);
      res.status(500).send('Error loading page');
    }
  });

  // Sector landing pages for SEO - e.g., /jobs/sector/health
  const SUPPORTED_SECTORS = ['health', 'education', 'protection', 'wash', 'food-security', 'logistics', 'emergency-response'];
  const SECTOR_DISPLAY_NAMES: Record<string, string> = {
    'health': 'Health',
    'education': 'Education',
    'protection': 'Protection',
    'wash': 'WASH',
    'food-security': 'Food Security',
    'logistics': 'Logistics',
    'emergency-response': 'Emergency Response'
  };
  const SECTOR_DESCRIPTIONS: Record<string, string> = {
    'health': 'The health sector presents opportunities for medical professionals, public health specialists, and healthcare program managers.',
    'education': 'Education programming offers opportunities in learning access, teacher training, and curriculum development.',
    'protection': 'Protection work focuses on safeguarding vulnerable populations including refugees and displaced persons.',
    'wash': 'Water, Sanitation, and Hygiene programming addresses critical infrastructure and behavior change.',
    'food-security': 'Food security programming encompasses emergency food assistance and agriculture development.',
    'logistics': 'Logistics roles involve supply chain management, procurement, and operational support.',
    'emergency-response': 'Emergency response roles involve rapid assessment, program design, and crisis coordination.'
  };

  app.get('/jobs/sector/:sector', async (req, res) => {
    try {
      const sectorParam = req.params.sector.toLowerCase();
      
      if (!SUPPORTED_SECTORS.includes(sectorParam)) {
        return res.status(404).send('Sector not found');
      }
      
      const sectorName = SECTOR_DISPLAY_NAMES[sectorParam];
      const sectorDescription = SECTOR_DESCRIPTIONS[sectorParam];
      
      // Get jobs for this sector
      const allJobs = await storage.getAllJobs();
      const now = new Date();
      const sectorJobs = allJobs.filter(job => 
        job.sector && job.sector.toLowerCase().includes(sectorParam.replace('-', ' '))
        && (!job.type || job.type === "job")
        && job.status === "published"
        && job.visibility !== "private"
        && (!job.deadline || new Date(job.deadline) >= now)
      );
      
      const pageUrl = `https://somkenjobs.com/jobs/sector/${sectorParam}`;
      const pageTitle = `${sectorName} Jobs in East Africa | ${sectorJobs.length}+ Humanitarian Positions | Somken Jobs`;
      const pageDescription = `Find ${sectorJobs.length}+ ${sectorName.toLowerCase()} sector jobs across Kenya, Somalia, Ethiopia, Uganda, Tanzania. ${sectorDescription}`;
      
      // Read HTML template
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const htmlPath = path.join(__dirname, '../dist/public/index.html');
      let html = '';
      
      try {
        html = fs.readFileSync(htmlPath, 'utf-8');
      } catch (err) {
        const devHtmlPath = path.join(__dirname, '../client/index.html');
        html = fs.readFileSync(devHtmlPath, 'utf-8');
      }
      
      // Replace meta tags
      html = html.replace(/<title>[^<]*<\/title>/, `<title>${pageTitle}</title>`);
      html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${pageDescription}">`);
      html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${pageTitle}">`);
      html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${pageDescription}">`);
      html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${pageUrl}">`);
      html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${pageUrl}">`);
      
      // Add collection structured data on list pages.
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": `${sectorName} Jobs in East Africa`,
        "description": pageDescription,
        "url": pageUrl,
        "isPartOf": { "@type": "WebSite", "name": "Somken Jobs", "url": "https://somkenjobs.com/" },
        "about": [`${sectorName} jobs`, `NGO ${sectorName.toLowerCase()} jobs`, "humanitarian jobs in East Africa"],
        "mainEntity": {
          "@type": "ItemList",
          "numberOfItems": sectorJobs.length,
          "itemListElement": sectorJobs.slice(0, 10).map((job, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "url": `https://somkenjobs.com/jobs/${generateJobSlug(job.title, job.id)}`,
            "name": job.title
          }))
        }
      };
      
      const breadcrumbData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://somkenjobs.com/" },
          { "@type": "ListItem", "position": 2, "name": "Jobs", "item": "https://somkenjobs.com/jobs" },
          { "@type": "ListItem", "position": 3, "name": sectorName, "item": pageUrl }
        ]
      };
      
      const additionalTags = `
    <script type="application/ld+json">${jsonLd(structuredData)}</script>
    <script type="application/ld+json">${jsonLd(breadcrumbData)}</script>`;
      
      html = html.replace(/<\/head>/, `${additionalTags}\n  </head>`);
      
      res.send(html);
    } catch (error) {
      console.error('Error serving sector page:', error);
      res.status(500).send('Error loading page');
    }
  });

  app.get('/jobs-in-somalia', (_req, res) => res.redirect(301, '/jobs/country/somalia'));
  app.get('/jobs-in-kenya', (_req, res) => res.redirect(301, '/jobs/country/kenya'));
  app.get('/jobs/somalia', (_req, res) => res.redirect(301, '/jobs/country/somalia'));
  app.get('/jobs/kenya', (_req, res) => res.redirect(301, '/jobs/country/kenya'));
  app.get('/ngo-jobs-in-somalia', (_req, res) => res.redirect(301, '/ngo-jobs/somalia'));
  app.get('/help', (_req, res) => res.redirect(301, '/help-center'));
  app.get('/privacy', (_req, res) => res.redirect(301, '/privacy-policy'));
  app.get('/terms', (_req, res) => res.redirect(301, '/terms-of-service'));

  const ngoTerms = ["ngo", "non-government", "non government", "humanitarian", "relief", "development", "un ", "unhcr", "unicef", "wfp", "who"];
  const isPublicCurrentJob = (job: any) => {
    const deadline = job.deadline ? new Date(job.deadline) : null;
    return (!job.type || job.type === "job")
      && job.status === "published"
      && job.visibility !== "private"
      && (!deadline || deadline >= new Date());
  };
  const matchesNgoJob = (job: any) => {
    const haystack = `${job.title || ""} ${job.organization || ""} ${job.description || ""} ${job.source || ""}`.toLowerCase();
    return ngoTerms.some((term) => haystack.includes(term));
  };
  const readIndexTemplate = () => {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const htmlPath = path.join(__dirname, '../dist/public/index.html');
    try {
      return fs.readFileSync(htmlPath, 'utf-8');
    } catch {
      const devHtmlPath = path.join(__dirname, '../client/index.html');
      return fs.readFileSync(devHtmlPath, 'utf-8');
    }
  };

  const keywordLandingPages: Record<string, {
    title: string;
    description: string;
    canonicalPath: string;
    name: string;
    about: string[];
    breadcrumbName: string;
    filter: (job: any) => boolean;
  }> = {
    '/ngo-jobs': {
      title: 'NGO Jobs in Somalia & Kenya | Humanitarian Careers | Somken Jobs',
      description: 'Find NGO jobs, humanitarian vacancies, UN roles, and development careers across Somalia, Kenya, and East Africa. Updated with current openings from trusted sources.',
      canonicalPath: '/ngo-jobs',
      name: 'NGO Jobs in Somalia, Kenya, and East Africa',
      about: ['NGO jobs', 'humanitarian jobs', 'UN jobs', 'development jobs'],
      breadcrumbName: 'NGO Jobs',
      filter: (job) => matchesNgoJob(job),
    },
    '/ngo-jobs/somalia': {
      title: 'NGO Jobs in Somalia | UN & Humanitarian Vacancies | Somken Jobs',
      description: 'Find current NGO jobs in Somalia, including humanitarian, UN, development, health, protection, WASH, logistics, and program vacancies.',
      canonicalPath: '/ngo-jobs/somalia',
      name: 'NGO Jobs in Somalia',
      about: ['NGO jobs in Somalia', 'UN jobs Somalia', 'humanitarian jobs Somalia'],
      breadcrumbName: 'NGO Jobs in Somalia',
      filter: (job) => job.country === 'Somalia' && matchesNgoJob(job),
    },
  };

  app.get(['/ngo-jobs', '/ngo-jobs/somalia'], async (req, res, next) => {
    try {
      const acceptHeader = req.get('Accept') || '';
      if (!acceptHeader.includes('text/html')) {
        return next();
      }

      const config = keywordLandingPages[req.path];
      if (!config) {
        return next();
      }

      const allJobs = await storage.getAllJobs();
      const matchingJobs = allJobs.filter((job) => isPublicCurrentJob(job) && config.filter(job));
      const pageUrl = `https://somkenjobs.com${config.canonicalPath}`;
      let html = readIndexTemplate();

      html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(config.title)}</title>`);
      html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(config.description)}">`);
      html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHtml(config.title)}">`);
      html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHtml(config.description)}">`);
      html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${pageUrl}">`);
      html = html.replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${escapeHtml(config.title)}">`);
      html = html.replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${escapeHtml(config.description)}">`);
      html = html.replace(/<meta name="twitter:url" content="[^"]*">/, `<meta name="twitter:url" content="${pageUrl}">`);
      html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${pageUrl}">`);

      const structuredData = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": config.name,
        "description": config.description,
        "url": pageUrl,
        "isPartOf": { "@type": "WebSite", "name": "Somken Jobs", "url": "https://somkenjobs.com/" },
        "about": config.about,
        "mainEntity": {
          "@type": "ItemList",
          "numberOfItems": matchingJobs.length,
          "itemListElement": matchingJobs.slice(0, 10).map((job, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "url": `https://somkenjobs.com/jobs/${generateJobSlug(job.title, job.id)}`,
            "name": job.title,
          })),
        },
      };

      const breadcrumbData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://somkenjobs.com/" },
          { "@type": "ListItem", "position": 2, "name": "Jobs", "item": "https://somkenjobs.com/jobs" },
          { "@type": "ListItem", "position": 3, "name": config.breadcrumbName, "item": pageUrl },
        ],
      };

      const additionalTags = `
    <script type="application/ld+json">${jsonLd(structuredData)}</script>
    <script type="application/ld+json">${jsonLd(breadcrumbData)}</script>`;

      html = html.replace(/<\/head>/, `${additionalTags}\n  </head>`);
      res.send(html);
    } catch (error) {
      console.error('Error serving keyword landing page:', error);
      res.status(500).send('Error loading page');
    }
  });

  // SSR route for tenders listing page
  app.get('/tenders', async (req, res, next) => {
    try {
      // Only apply SSR for page loads, not API calls
      const acceptHeader = req.get('Accept') || '';
      if (!acceptHeader.includes('text/html')) {
        return next();
      }

      const allJobs = await storage.getAllJobs();
      const tenders = allJobs.filter(job => job.type === 'tender');
      
      const pageUrl = 'https://somkenjobs.com/tenders';
      const pageTitle = `Humanitarian Tenders in East Africa | ${tenders.length}+ Active Opportunities | Somken Jobs`;
      const pageDescription = `Browse ${tenders.length}+ humanitarian tenders across Kenya, Somalia, Ethiopia, Uganda, and Tanzania. Find procurement opportunities from UN agencies, NGOs, and international organizations.`;
      
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const htmlPath = path.join(__dirname, '../dist/public/index.html');
      let html = '';
      
      try {
        html = fs.readFileSync(htmlPath, 'utf-8');
      } catch (err) {
        const devHtmlPath = path.join(__dirname, '../client/index.html');
        html = fs.readFileSync(devHtmlPath, 'utf-8');
      }
      
      html = html.replace(/<title>[^<]*<\/title>/, `<title>${pageTitle}</title>`);
      html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${pageDescription}">`);
      html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${pageTitle}">`);
      html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${pageDescription}">`);
      html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${pageUrl}">`);
      html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${pageUrl}">`);
      
      const breadcrumbData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://somkenjobs.com/" },
          { "@type": "ListItem", "position": 2, "name": "Tenders", "item": pageUrl }
        ]
      };
      
      const additionalTags = `
    <script type="application/ld+json">${JSON.stringify(breadcrumbData)}</script>`;
      
      html = html.replace(/<\/head>/, `${additionalTags}\n  </head>`);
      
      res.send(html);
    } catch (error) {
      console.error('Error serving tenders page:', error);
      next();
    }
  });

  // Server-side rendering route for job pages to inject meta tags
  app.get('/jobs/:id', async (req, res) => {
    try {
      const param = req.params.id;
      let jobId: number;
      
      if (/^\d+$/.test(param)) {
        jobId = parseInt(param);
      } else {
        const extractedId = extractJobIdFromSlug(param);
        if (!extractedId) {
          return res.status(404).send('Job not found');
        }
        jobId = extractedId;
      }

      if (isNaN(jobId) || jobId > 2147483647 || jobId < 1) {
        return res.status(404).send('Job not found');
      }

      const ssrToken = typeof req.query.token === 'string' ? req.query.token : undefined;
      const job = await storage.getJobById(jobId, ssrToken);
      if (!job) {
        return res.status(404).send('Job not found');
      }

      if (!ssrToken && !isGoogleIndexableJob(job)) {
        return res.status(410).send('Job no longer available');
      }

      // Generate job-specific meta tags
      const jobTitle = `${job.title} - ${job.organization}`;
      const deadline = job.deadline ? 
        ` • Deadline: ${Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left` : 
        '';
      // Create compelling social media description that appears as post content
      const socialMediaText = generateSocialMediaText(job, deadline);
      const jobDescription = socialMediaText;
      const jobUrl = getJobCanonicalUrl(job);

      // Create dynamic SVG image data URL
      const svgContent = `
        <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#0077B5;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#005885;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="1200" height="630" fill="url(#bgGradient)"/>
          <g transform="translate(60, 20)">
            <rect x="0" y="0" width="40" height="40" rx="8" fill="#ffffff"/>
            <rect x="8" y="8" width="24" height="24" rx="4" fill="#0077B5"/>
            <text x="55" y="18" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="bold">Somken Jobs</text>
            <text x="55" y="35" fill="#ffffff" font-family="Arial, sans-serif" font-size="12" opacity="0.8">East Africa</text>
          </g>
          <g transform="translate(60, 140)">
            <circle cx="30" cy="30" r="25" fill="#ffffff" fill-opacity="0.15"/>
            <rect x="20" y="20" width="20" height="14" rx="2" fill="#ffffff"/>
            <text x="80" y="25" fill="#ffffff" font-family="Arial, sans-serif" font-size="32" font-weight="bold">
              ${job.title.length > 35 ? job.title.substring(0, 35) + '...' : job.title}
            </text>
            <text x="80" y="55" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" opacity="0.9">
              ${job.organization.length > 45 ? job.organization.substring(0, 45) + '...' : job.organization}
            </text>
            <g transform="translate(0, 100)">
              <circle cx="15" cy="15" r="6" fill="#ffffff"/>
              <text x="40" y="16" fill="#ffffff" font-family="Arial, sans-serif" font-size="16" font-weight="500">
                ${job.location}, ${job.country}
              </text>
            </g>
            <g transform="translate(0, 220)">
              <rect x="0" y="0" width="180" height="50" rx="25" fill="#ffffff" fill-opacity="0.9"/>
              <text x="90" y="32" fill="#0077B5" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle">Apply Now</text>
            </g>
          </g>
        </svg>
      `;
      
      const encodedSvg = encodeURIComponent(svgContent);
      const ogImageUrl = `data:image/svg+xml,${encodedSvg}`;

      // Read the HTML template
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const htmlPath = path.join(__dirname, '../dist/public/index.html');
      let html = '';
      
      try {
        html = fs.readFileSync(htmlPath, 'utf-8');
      } catch (err) {
        // In development, try the client directory
        const devHtmlPath = path.join(__dirname, '../client/index.html');
        html = fs.readFileSync(devHtmlPath, 'utf-8');
      }

      // Replace meta tags with job-specific ones
      html = html.replace(
        /<meta name="description" content="[^"]*">/,
        `<meta name="description" content="${jobDescription.replace(/"/g, '&quot;')}">`
      );
      
      html = html.replace(
        /<meta property="og:title" content="[^"]*">/,
        `<meta property="og:title" content="${jobTitle.replace(/"/g, '&quot;')}">`
      );
      
      html = html.replace(
        /<meta property="og:description" content="[^"]*">/,
        `<meta property="og:description" content="${jobDescription.replace(/"/g, '&quot;')}">`
      );
      
      html = html.replace(
        /<meta property="og:url" content="[^"]*">/,
        `<meta property="og:url" content="${jobUrl}">`
      );
      
      // Update canonical URL to job-specific URL instead of homepage
      html = html.replace(
        /<link rel="canonical" href="[^"]*">/,
        `<link rel="canonical" href="${jobUrl}">`
      );
      
      // Update meta name="title" with job-specific title
      html = html.replace(
        /<meta name="title" content="[^"]*">/,
        `<meta name="title" content="${jobTitle.replace(/"/g, '&quot;')}">`
      );
      
      // Remove og:image meta tag
      html = html.replace(
        /<meta property="og:image" content="[^"]*">/,
        ``
      );

      // Also update Twitter meta tags (using 'name' attribute, not 'property')
      html = html.replace(
        /<meta name="twitter:title" content="[^"]*">/,
        `<meta name="twitter:title" content="${jobTitle.replace(/"/g, '&quot;')}">`
      );
      
      html = html.replace(
        /<meta name="twitter:description" content="[^"]*">/,
        `<meta name="twitter:description" content="${jobDescription.replace(/"/g, '&quot;')}">`
      );
      
      // Remove twitter:image meta tag
      html = html.replace(
        /<meta name="twitter:image" content="[^"]*">/,
        ``
      );

      // Update Twitter URL to job-specific URL
      html = html.replace(
        /<meta name="twitter:url" content="[^"]*">/,
        `<meta name="twitter:url" content="${jobUrl}">`
      );
      
      // Add Twitter-specific job labels for enhanced preview cards
      const twitterLabels = `
    <!-- Enhanced Twitter Cards for Job Previews -->
    <meta name="twitter:label1" content="Employer">
    <meta name="twitter:data1" content="${escapeHtml(job.organization)}">
    <meta name="twitter:label2" content="Location">
    <meta name="twitter:data2" content="${escapeHtml(job.location)}, ${escapeHtml(job.country)}">
    ${job.deadline ? `<meta name="twitter:label3" content="Deadline">
    <meta name="twitter:data3" content="${Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left">` : ''}`;
    
      // Insert Twitter labels before closing head tag
      html = html.replace(
        /<\/head>/,
        `${twitterLabels}\n  </head>`
      );

      // Remove existing og:type="website" and replace with og:type="article" for job pages
      html = html.replace(
        /<meta property="og:type" content="website">/,
        `<meta property="og:type" content="article">`
      );

      // Update the title tag
      html = html.replace(
        /<title>[^<]*<\/title>/,
        `<title>${jobTitle.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>`
      );

      // Function to clean HTML content from Microsoft Office and other sources
      // Strips all HTML to plain text — used only for meta descriptions
      const cleanHtmlContent = (html: string): string => {
        if (!html) return '';
        return html
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#\d+;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      };

      // Safely renders HTML for body content — strips only dangerous tags/attributes
      const safeHtml = (html: string): string => {
        if (!html) return '';
        return sanitizeRichHtml(html);
      };
      const applyUrl = safeUrl(job.url);

      // Generate server-side rendered job content
      const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      };

      const getDaysLeft = (deadline: Date | string) => {
        const deadlineDate = new Date(deadline);
        const today = new Date();
        const diffTime = deadlineDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
      };

      const serverRenderedContent = `
        <div class="min-h-screen bg-gray-50 py-8">
          <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-6">
              <a href="/" class="inline-flex items-center text-blue-600 hover:text-blue-700">
                ← Back to Jobs
              </a>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm p-8">
              <div class="flex items-start justify-between mb-6">
                <div class="flex-1">
                  <h1 class="text-3xl font-bold text-gray-900 mb-4">${escapeHtml(job.title)}</h1>
                  <div class="flex flex-wrap items-center gap-4 text-gray-600">
                    <div class="flex items-center">
                      <span class="font-medium">${escapeHtml(job.organization)}</span>
                    </div>
                    <div class="flex items-center">
                      <span>${escapeHtml(job.location)}, ${escapeHtml(job.country)}</span>
                    </div>
                    ${job.sector ? `<span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">${escapeHtml(job.sector)}</span>` : ''}
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2">
                  <div class="prose max-w-none">
                    <h2 class="text-xl font-semibold mb-4">Job Description</h2>
                    <div class="rich-text-content">${safeHtml(job.bodyHtml || job.description || 'Job description not available.')}</div>
                    
                    ${job.qualifications ? `
                      <h2 class="text-xl font-semibold mb-4 mt-8">Qualifications & Requirements</h2>
                      <div class="rich-text-content">${safeHtml(job.qualifications)}</div>
                    ` : ''}
                    
                    ${job.howToApply ? `
                      <h2 class="text-xl font-semibold mb-4 mt-8">How to Apply</h2>
                      <div class="rich-text-content">${safeHtml(job.howToApply).replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1" class="text-blue-600 hover:text-blue-700">$1</a>')}</div>
                    ` : ''}
                    ${job.attachmentUrl ? (() => {
                      try {
                        const urls: string[] = job.attachmentUrl.startsWith('[') ? JSON.parse(job.attachmentUrl) : [job.attachmentUrl];
                        return `<h2 class="text-xl font-semibold mb-4 mt-8">Attachments</h2>
                        <div class="space-y-2">${urls.map(url => {
                          const safeAttachmentUrl = safeUrl(url) || (url.startsWith('/uploads/') ? url : '');
                          if (!safeAttachmentUrl) return '';
                          const name = escapeHtml(url.split('/').pop()?.replace(/^\d+-/, '') || 'Download');
                          return `<div><a href="${safeAttachmentUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${name}</a></div>`;
                        }).join('')}</div>`;
                      } catch { return ''; }
                    })() : ''}
                  </div>
                </div>

                <div class="lg:col-span-1">
                  <div class="bg-gray-50 rounded-lg p-6">
                    <h3 class="text-lg font-semibold mb-4">Job Details</h3>
                    <div class="space-y-3">
                      <div>
                        <span class="font-medium">Posted:</span>
                        <span class="ml-2">${formatDate(job.datePosted)}</span>
                      </div>
                      ${job.deadline ? `
                        <div>
                          <span class="font-medium">Deadline:</span>
                          <span class="ml-2">${formatDate(job.deadline)} (${getDaysLeft(job.deadline)} days left)</span>
                        </div>
                      ` : ''}
                      <div>
                        <span class="font-medium">Organization:</span>
                        <span class="ml-2">${escapeHtml(job.organization)}</span>
                      </div>
                      <div>
                        <span class="font-medium">Location:</span>
                        <span class="ml-2">${escapeHtml(job.location)}, ${escapeHtml(job.country)}</span>
                      </div>
                      ${job.sector ? `
                        <div>
                          <span class="font-medium">Sector:</span>
                          <span class="ml-2">${escapeHtml(job.sector)}</span>
                        </div>
                      ` : ''}
                    </div>
                    
                    ${applyUrl ? `
                      <div class="mt-6">
                        <a href="${applyUrl}" target="_blank" rel="noopener noreferrer" 
                           class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors inline-block text-center">
                          Apply Now
                        </a>
                      </div>
                    ` : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Replace the empty root div with server-rendered content
      html = html.replace(
        /<div id="root"><\/div>/,
        `<div id="root">${serverRenderedContent}</div>`
      );

      const jobStructuredDataJson = generateJobPostingJsonLd(job);

      // Breadcrumb structured data for enhanced search appearance
      const breadcrumbData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://somkenjobs.com/" },
          { "@type": "ListItem", "position": 2, "name": "Jobs", "item": "https://somkenjobs.com/jobs" },
          { "@type": "ListItem", "position": 3, "name": job.country, "item": `https://somkenjobs.com/jobs/country/${job.country.toLowerCase()}` },
          { "@type": "ListItem", "position": 4, "name": job.title.substring(0, 50), "item": jobUrl }
        ]
      };

      // Add job-specific Open Graph properties for richer Facebook previews (no duplicate og:type)
      const shouldNoindex = job.visibility === 'private' || !!ssrToken;
      const additionalMetaTags = `
    <!-- Job-specific meta tags for enhanced social media previews -->
    ${shouldNoindex ? '<meta name="robots" content="noindex, nofollow">' : ''}
    <meta property="article:published_time" content="${new Date(job.datePosted).toISOString()}">
    <meta property="article:section" content="${escapeHtml(job.sector || 'Humanitarian')}">
    <meta property="article:tag" content="${escapeHtml(job.sector || 'Humanitarian')}">
    <meta property="article:author" content="${escapeHtml(job.organization)}">
    <meta property="job:location" content="${escapeHtml(job.location)}, ${escapeHtml(job.country)}">
    <meta property="job:company" content="${escapeHtml(job.organization)}">
    ${job.deadline ? `<meta property="job:expires" content="${Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left">` : ''}
    <meta property="job:category" content="${escapeHtml(job.sector || 'Humanitarian')}">
    <meta property="og:site_name" content="Somken Jobs">
    <meta property="og:locale" content="en_US">
    
    <!-- Hreflang tags for international SEO -->
    <link rel="alternate" hreflang="en" href="${jobUrl}">
    <link rel="alternate" hreflang="en-US" href="${jobUrl}">
    <link rel="alternate" hreflang="en-KE" href="${jobUrl}">
    <link rel="alternate" hreflang="en-SO" href="${jobUrl}">
    <link rel="alternate" hreflang="x-default" href="${jobUrl}">
    
    <!-- Google Jobs JobPosting Structured Data -->
    <script type="application/ld+json">
${jobStructuredDataJson}
    </script>
    
    <!-- Breadcrumb Structured Data for enhanced search appearance -->
    <script type="application/ld+json">
${jsonLd(breadcrumbData)}
    </script>`;

      // Insert additional meta tags before the closing head tag
      html = html.replace(
        /<\/head>/,
        `${additionalMetaTags}\n  </head>`
      );

      res.send(html);
    } catch (error) {
      console.error('Error serving job page:', error);
      res.status(500).send('Error loading job page');
    }
  });

  // Sitemap caches are short-lived so fresh jobs move into sitemap-jobs.xml quickly.
  const SITEMAP_CACHE_TTL = 10 * 60 * 1000;
  const sitemapIndexCache: { xml: string | null; generatedAt: Date | null } = { xml: null, generatedAt: null };
  const staticSitemapCache: { xml: string | null; generatedAt: Date | null } = { xml: null, generatedAt: null };
  const jobSitemapCache: { xml: string | null; generatedAt: Date | null } = { xml: null, generatedAt: null };

  const isFreshSitemapCache = (cache: { generatedAt: Date | null }) =>
    !!cache.generatedAt && Date.now() - cache.generatedAt.getTime() < SITEMAP_CACHE_TTL;

  const escapeXml = (text: string) =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const getPublicActiveJobPages = async () => {
    const allJobs = await storage.getAllJobsWithDetails();
    return allJobs
      .filter(isGoogleIndexableJob)
      .sort((a, b) => new Date(getJobLastModified(b)).getTime() - new Date(getJobLastModified(a)).getTime());
  };

  const latestJobLastmod = (jobs: Awaited<ReturnType<typeof getPublicActiveJobPages>>) =>
    jobs.length ? getJobLastModified(jobs[0]) : new Date().toISOString();

  // Sitemap index for Search Console. Job detail URLs live only in sitemap-jobs.xml.
  app.get('/sitemap.xml', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/xml');

      if (sitemapIndexCache.xml && isFreshSitemapCache(sitemapIndexCache)) {
        return res.send(sitemapIndexCache.xml);
      }

      const jobs = await getPublicActiveJobPages();
      const jobsLastmod = latestJobLastmod(jobs);
      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://somkenjobs.com/sitemap-static.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://somkenjobs.com/sitemap-jobs.xml</loc>
    <lastmod>${jobsLastmod}</lastmod>
  </sitemap>
</sitemapindex>`;

      sitemapIndexCache.xml = sitemapXml;
      sitemapIndexCache.generatedAt = new Date();

      res.send(sitemapXml);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  app.get('/sitemap-static.xml', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/xml');

      if (staticSitemapCache.xml && isFreshSitemapCache(staticSitemapCache)) {
        return res.send(staticSitemapCache.xml);
      }

      const jobs = await getPublicActiveJobPages();
      const newestJobDate = latestJobLastmod(jobs);
      const latestDateFor = (subset: typeof jobs) => subset.length ? getJobLastModified(subset[0]) : newestJobDate;
      const countries = ['Kenya', 'Somalia', 'Ethiopia', 'Uganda', 'Tanzania'];
      const sectors = ['Health', 'Education', 'Protection', 'WASH', 'Food Security', 'Logistics', 'Emergency Response'];

      const urls = [
        { loc: 'https://somkenjobs.com/', lastmod: newestJobDate, changefreq: 'daily', priority: '1.0' },
        { loc: 'https://somkenjobs.com/jobs', lastmod: newestJobDate, changefreq: 'daily', priority: '0.9' },
        { loc: 'https://somkenjobs.com/ngo-jobs', lastmod: latestDateFor(jobs.filter(matchesNgoJob)), changefreq: 'daily', priority: '0.88' },
        { loc: 'https://somkenjobs.com/ngo-jobs/somalia', lastmod: latestDateFor(jobs.filter((job) => job.country === 'Somalia' && matchesNgoJob(job))), changefreq: 'daily', priority: '0.88' },
        { loc: 'https://somkenjobs.com/tenders', lastmod: newestJobDate, changefreq: 'daily', priority: '0.9' },
        { loc: 'https://somkenjobs.com/about', lastmod: '2025-01-01T00:00:00.000Z', changefreq: 'monthly', priority: '0.7' },
        { loc: 'https://somkenjobs.com/contact', lastmod: '2025-01-01T00:00:00.000Z', changefreq: 'monthly', priority: '0.7' },
        { loc: 'https://somkenjobs.com/career-resources', lastmod: '2025-01-01T00:00:00.000Z', changefreq: 'monthly', priority: '0.8' },
        { loc: 'https://somkenjobs.com/help-center', lastmod: '2025-01-01T00:00:00.000Z', changefreq: 'monthly', priority: '0.6' },
        { loc: 'https://somkenjobs.com/privacy-policy', lastmod: '2025-01-01T00:00:00.000Z', changefreq: 'yearly', priority: '0.4' },
        { loc: 'https://somkenjobs.com/terms-of-service', lastmod: '2025-01-01T00:00:00.000Z', changefreq: 'yearly', priority: '0.4' },
        ...countries.map((country) => ({
          loc: `https://somkenjobs.com/jobs/country/${country.toLowerCase()}`,
          lastmod: latestDateFor(jobs.filter((job) => job.country === country)),
          changefreq: 'daily',
          priority: '0.85',
        })),
        ...sectors.map((sector) => ({
          loc: `https://somkenjobs.com/jobs/sector/${sector.toLowerCase().replace(/\s+/g, '-')}`,
          lastmod: latestDateFor(jobs.filter((job) => job.sector === sector)),
          changefreq: 'daily',
          priority: '0.8',
        })),
      ];

      const urlXml = urls.map((url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n');

      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlXml}
</urlset>`;

      staticSitemapCache.xml = sitemapXml;
      staticSitemapCache.generatedAt = new Date();
      res.send(sitemapXml);
    } catch (error) {
      console.error('Error generating static sitemap:', error);
      res.status(500).send('Error generating static sitemap');
    }
  });

  app.get('/sitemap-jobs.xml', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/xml');

      if (jobSitemapCache.xml && isFreshSitemapCache(jobSitemapCache)) {
        return res.send(jobSitemapCache.xml);
      }

      const jobs = await getPublicActiveJobPages();
      console.log(`Generating job sitemap with ${jobs.length} active public jobs`);

      const jobUrls = jobs.map((job) => `  <url>
    <loc>${escapeXml(getJobCanonicalUrl(job))}</loc>
    <lastmod>${getJobLastModified(job)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`).join('\n');

      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${jobUrls}
</urlset>`;

      jobSitemapCache.xml = sitemapXml;
      jobSitemapCache.generatedAt = new Date();
      res.send(sitemapXml);
    } catch (error) {
      console.error('Error generating job sitemap:', error);
      res.status(500).send('Error generating job sitemap');
    }
  });

  // RSS Feed endpoint for job listings
  app.get('/feed', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
      
      // Get latest 50 jobs
      const jobs = await storage.getAllJobs();
      const latestJobs = jobs.slice(0, 50);
      
      const formatDate = (date: Date | string) => {
        return new Date(date).toUTCString();
      };

      const escapeXml = (text: string) => {
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      };

      const jobItems = latestJobs.map(job => {
        const jobSlug = generateJobSlug(job.title, job.id);
        const jobUrl = `https://somkenjobs.com/jobs/${jobSlug}`;
        const description = job.description 
          ? escapeXml(job.description.substring(0, 500)) + (job.description.length > 500 ? '...' : '')
          : 'No description available';
        
        const deadlineInfo = job.deadline 
          ? `Application Deadline: ${new Date(job.deadline).toLocaleDateString()}` 
          : '';

        return `    <item>
      <title>${escapeXml(job.title)}</title>
      <link>${jobUrl}</link>
      <guid isPermaLink="true">${jobUrl}</guid>
      <pubDate>${formatDate(job.datePosted)}</pubDate>
      <description><![CDATA[
        <strong>Organization:</strong> ${escapeXml(job.organization)}<br/>
        <strong>Location:</strong> ${escapeXml(job.location)}, ${escapeXml(job.country)}<br/>
        ${job.sector ? `<strong>Sector:</strong> ${escapeXml(job.sector)}<br/>` : ''}
        ${deadlineInfo ? `<strong>${deadlineInfo}</strong><br/><br/>` : ''}
        ${description}
      ]]></description>
      <category>${escapeXml(job.country)}</category>
      ${job.sector ? `<category>${escapeXml(job.sector)}</category>` : ''}
      <source url="https://somkenjobs.com">Somken Jobs</source>
    </item>`;
      }).join('\n');

      const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Somken Jobs - East Africa Humanitarian Jobs</title>
    <link>https://somkenjobs.com</link>
    <description>Latest humanitarian job opportunities across Kenya, Somalia, Ethiopia, Uganda, and Tanzania from leading UN agencies, NGOs, and international organizations.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <pubDate>${latestJobs.length > 0 ? formatDate(latestJobs[0].datePosted) : new Date().toUTCString()}</pubDate>
    <ttl>60</ttl>
    <atom:link href="https://somkenjobs.com/feed" rel="self" type="application/rss+xml"/>
    <image>
      <url>https://somkenjobs.com/favicon.ico</url>
      <title>Somken Jobs</title>
      <link>https://somkenjobs.com</link>
    </image>
${jobItems}
  </channel>
</rss>`;

      res.send(rssFeed);
    } catch (error) {
      console.error('Error generating RSS feed:', error);
      res.status(500).send('Error generating RSS feed');
    }
  });

  // Alternative RSS feed URL (some readers expect /rss)
  app.get('/rss', async (req, res) => {
    res.redirect(301, '/feed');
  });

  // Download route for job attachments
  app.get('/download/:filename', async (req, res) => {
    try {
      const filename = req.params.filename;
      
      // In a real implementation, you would:
      // 1. Validate the filename and check user permissions
      // 2. Serve the actual file from secure storage (AWS S3, Google Cloud, etc.)
      // 3. Log download activity for security
      
      // For development, we'll simulate file download since we only store filenames
      // Set appropriate headers for file download
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Placeholder content for development
      const placeholderContent = `This is a placeholder for file: ${filename}\n\nIn production, this would download the actual file from secure storage.`;
      
      res.send(placeholderContent);
    } catch (error) {
      console.error('Error downloading file:', error);
      res.status(404).json({ message: 'File not found' });
    }
  });

  // Serve robots.txt file
  app.get('/robots.txt', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    
    const robotsTxt = `User-agent: *

# Allow all search engines to crawl public pages
Allow: /
Allow: /jobs
Allow: /tenders
Allow: /about
Allow: /contact
Allow: /career-resources
Allow: /help
Allow: /privacy
Allow: /terms

# Block sensitive and backend routes
Disallow: /admin
Disallow: /api
Disallow: /internal
Disallow: /dashboard
Disallow: /preview

# Reference to sitemap and RSS feed
Sitemap: https://somkenjobs.com/sitemap.xml
Sitemap: https://somkenjobs.com/sitemap-jobs.xml
RSS Feed: https://somkenjobs.com/feed`;

    res.send(robotsTxt);
  });

  const httpServer = createServer(app);
  return httpServer;
}
