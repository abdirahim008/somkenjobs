import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { jobFetcher } from "./services/jobFetcher";
import { seedDatabase } from "./seed";
import { z } from "zod";
import { insertUserSchema, loginUserSchema, type User } from "@shared/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "jobconnect-secret-key-change-in-production";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed database with sample data on startup
  await seedDatabase();
  
  // Start the job scheduler
  jobFetcher.startScheduler();

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
          return jobDate.toDateString() === today.toDateString();
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

  // Get single job by ID
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJobById(jobId);
      
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
      const jobId = parseInt(req.params.id);
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
  app.post("/api/jobs/refresh", async (req, res) => {
    try {
      await jobFetcher.fetchAllJobs();
      res.json({ message: "Job refresh initiated" });
    } catch (error) {
      console.error("Error refreshing jobs:", error);
      res.status(500).json({ message: "Failed to refresh jobs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
