import type { Express } from "express";
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
import { fileURLToPath } from 'url';

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

  // Update user profile
  app.put("/api/users/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = req.user!;
      
      // Only allow users to update their own profile or admins to update any profile
      if (currentUser.id !== userId && !currentUser.isAdmin) {
        return res.status(403).json({ message: "Unauthorized to update this profile" });
      }

      const updatedUser = await storage.updateUser(userId, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user profile:", error);
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

  // Get single job by ID or slug
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const param = req.params.id;
      let jobId: number;
      
      // Check if it's a numeric ID or a slug
      if (/^\d+$/.test(param)) {
        // It's a numeric ID
        jobId = parseInt(param);
      } else {
        // It's a slug, extract the ID
        const extractedId = extractJobIdFromSlug(param);
        if (!extractedId) {
          return res.status(404).json({ message: "Job not found" });
        }
        jobId = extractedId;
      }
      
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
      const param = req.params.id;
      let jobId: number;
      
      // Check if it's a numeric ID or a slug
      if (/^\d+$/.test(param)) {
        // It's a numeric ID
        jobId = parseInt(param);
      } else {
        // It's a slug, extract the ID
        const extractedId = extractJobIdFromSlug(param);
        if (!extractedId) {
          return res.status(404).json({ message: "Job not found" });
        }
        jobId = extractedId;
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
  app.post("/api/jobs/refresh", async (req, res) => {
    try {
      await jobFetcher.fetchAllJobs();
      res.json({ message: "Job refresh initiated" });
    } catch (error) {
      console.error("Error refreshing jobs:", error);
      res.status(500).json({ message: "Failed to refresh jobs" });
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

  // Update a job (only if user owns it)
  app.put("/api/jobs/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Check if user owns this job
      const existingJob = await storage.getJobById(jobId);
      if (!existingJob || existingJob.createdBy !== userId) {
        return res.status(403).json({ message: "You can only edit your own jobs" });
      }

      // Validate and transform job data
      const jobData = req.body;
      
      // Convert date strings to Date objects if they exist
      const transformedData = {
        ...jobData,
        updatedAt: new Date()
      };
      
      // Convert deadline to Date if it's a string
      if (transformedData.deadline && typeof transformedData.deadline === 'string') {
        transformedData.deadline = new Date(transformedData.deadline);
      }
      
      // Convert datePosted to Date if it's a string
      if (transformedData.datePosted && typeof transformedData.datePosted === 'string') {
        transformedData.datePosted = new Date(transformedData.datePosted);
      }
      
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

  // Delete a job (only if user owns it)
  app.delete("/api/jobs/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Check if user owns this job
      const existingJob = await storage.getJobById(jobId);
      if (!existingJob || existingJob.createdBy !== userId) {
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
      const jobDataWithDefaults = {
        ...req.body,
        createdBy: userId,
        source: req.body.source || "user",
        externalId: req.body.externalId || `user-${userId}-${Date.now()}`,
        datePosted: req.body.datePosted || new Date(),
        url: req.body.url || "",
      };
      
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
      
      // Validate and transform job data
      const jobData = req.body;
      
      // Convert date strings to Date objects if they exist
      const transformedData = {
        ...jobData,
        updatedAt: new Date()
      };
      
      // Convert deadline to Date if it's a string
      if (transformedData.deadline && typeof transformedData.deadline === 'string') {
        transformedData.deadline = new Date(transformedData.deadline);
      }
      
      // Convert datePosted to Date if it's a string
      if (transformedData.datePosted && typeof transformedData.datePosted === 'string') {
        transformedData.datePosted = new Date(transformedData.datePosted);
      }
      
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

  // Server-side rendering route for job pages to inject meta tags
  app.get('/jobs/:id', async (req, res) => {
    try {
      const param = req.params.id;
      let jobId: number;
      
      // Check if it's a numeric ID or a slug
      if (/^\d+$/.test(param)) {
        // It's a numeric ID
        jobId = parseInt(param);
      } else {
        // It's a slug, extract the ID
        const extractedId = extractJobIdFromSlug(param);
        if (!extractedId) {
          return res.status(404).send('Job not found');
        }
        jobId = extractedId;
      }

      const job = await storage.getJobById(jobId);
      if (!job) {
        return res.status(404).send('Job not found');
      }

      // Generate job-specific meta tags
      const jobTitle = `${job.title} - ${job.organization}`;
      const deadline = job.deadline ? 
        ` • Deadline: ${Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left` : 
        '';
      const jobDescription = `${job.title} • ${job.organization} • ${job.location}, ${job.country}${deadline} • Apply now on Somken Jobs`;
      const jobUrl = `https://somkenjobs.com/jobs/${job.id}`;

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
      
      // Remove og:image meta tag
      html = html.replace(
        /<meta property="og:image" content="[^"]*">/,
        ``
      );

      // Also update Twitter meta tags
      html = html.replace(
        /<meta property="twitter:title" content="[^"]*">/,
        `<meta property="twitter:title" content="${jobTitle.replace(/"/g, '&quot;')}">`
      );
      
      html = html.replace(
        /<meta property="twitter:description" content="[^"]*">/,
        `<meta property="twitter:description" content="${jobDescription.replace(/"/g, '&quot;')}">`
      );
      
      // Remove twitter:image meta tag
      html = html.replace(
        /<meta property="twitter:image" content="[^"]*">/,
        ``
      );

      // Update the title tag
      html = html.replace(
        /<title>[^<]*<\/title>/,
        `<title>${jobTitle.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>`
      );

      res.send(html);
    } catch (error) {
      console.error('Error serving job page:', error);
      res.status(500).send('Error loading job page');
    }
  });

  // Dynamic sitemap.xml endpoint
  app.get('/sitemap.xml', async (req, res) => {
    try {
      // Set proper XML content type
      res.setHeader('Content-Type', 'application/xml');
      
      // Get all published jobs from the database
      const jobs = await storage.getAllJobs();
      
      console.log(`Generating sitemap with ${jobs.length} jobs`);
      
      // Generate job URLs
      const jobUrls = jobs.map(job => {
        const jobSlug = generateJobSlug(job.title, job.id);
        const lastModified = job.updatedAt ? new Date(job.updatedAt).toISOString() : new Date(job.datePosted).toISOString();
        
        return `  <url>
    <loc>https://somkenjobs.com/jobs/${jobSlug}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
      }).join('\n');
      
      // Generate sitemap XML
      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://somkenjobs.com/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/jobs</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/tenders</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/about</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/contact</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/career-resources</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/help</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/privacy</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/terms</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
${jobUrls}
</urlset>`;

      res.send(sitemapXml);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
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

# Reference to sitemap
Sitemap: https://somkenjobs.com/sitemap.xml`;

    res.send(robotsTxt);
  });

  const httpServer = createServer(app);
  return httpServer;
}
