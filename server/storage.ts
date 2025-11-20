import { jobs, type Job, type InsertJob, type LightweightJob, users, type User, type InsertUser, invoices, type Invoice, type InsertInvoice, countries, type Country, type InsertCountry, cities, type City, type InsertCity, sectors, type Sector, type InsertSector } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, gte, ilike, isNull } from "drizzle-orm";
import { generateJobSlug } from "@shared/utils";
import { jobsCache } from "./services/jobsCache";

export interface IStorage {
  // User authentication methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getAllPendingUsers(): Promise<User[]>;
  approveUser(id: number, approvedBy: string): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  // Job methods
  getAllJobs(): Promise<Job[]>;
  getAllJobsWithDetails(): Promise<Job[]>;
  getJobById(id: number): Promise<Job | undefined>;
  getJobByExternalId(externalId: string): Promise<Job | undefined>;
  getJobsByUserId(userId: number): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;
  searchJobs(query: string): Promise<Job[]>;
  filterJobs(filters: {
    country?: string[];
    organization?: string[];
    sector?: string[];
    datePosted?: string;
  }): Promise<Job[]>;

  // Lightweight job methods for performance
  getLightweightJobs(filters?: {
    country?: string[];
    sector?: string[];
    search?: string;
    limit?: number;
  }): Promise<LightweightJob[]>;
  getLightweightJobStats(): Promise<{
    totalJobs: number;
    organizations: number;
    newToday: number;
  }>;

  // Invoice methods
  getAllInvoices(): Promise<Invoice[]>;
  getInvoiceById(id: number): Promise<Invoice | undefined>;
  getInvoicesByUserId(userId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  getBilledJobIds(userId: number): Promise<number[]>;
  
  // Organization methods
  getOrganizations(search?: string): Promise<string[]>;
  
  // Location methods
  getCountries(search?: string): Promise<string[]>;
  getCities(search?: string, country?: string): Promise<string[]>;
  addCountry(name: string): Promise<Country>;
  addCity(name: string, country: string): Promise<City>;
  
  // Sector methods
  getSectors(search?: string): Promise<string[]>;
  addSector(name: string): Promise<Sector>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private jobs: Map<number, Job>;
  private currentUserId: number;
  private currentJobId: number;

  constructor() {
    this.users = new Map();
    this.jobs = new Map();
    this.currentUserId = 1;
    this.currentJobId = 1;
    
    // Add some sample jobs for demonstration
    this.addSampleJobs();
  }

  private async addSampleJobs(): Promise<void> {
    const sampleJobs = [
      {
        title: "Humanitarian Program Officer",
        organization: "World Food Programme",
        location: "Nairobi",
        country: "Kenya",
        description: "Support humanitarian operations in Kenya, coordinating food assistance programs and working with local partners to ensure effective delivery of aid to vulnerable populations.",
        url: "https://careers.wfp.org/job/12345",
        datePosted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        sector: "Food Security",
        source: "reliefweb",
        externalId: "sample-wfp-1",
        type: "job" as const
      },
      {
        title: "Health Coordinator",
        organization: "Medecins Sans Frontieres",
        location: "Mogadishu",
        country: "Somalia",
        description: "Lead health interventions in Somalia, managing medical programs and ensuring quality healthcare delivery in challenging environments. Experience in emergency medicine required.",
        url: "https://msf.org/jobs/health-coordinator-somalia",
        datePosted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        sector: "Health",
        source: "reliefweb",
        externalId: "sample-msf-1",
        type: "job" as const
      },

      {
        title: "WASH Program Manager",
        organization: "Oxfam International",
        location: "Hargeisa",
        country: "Somalia",
        description: "Oversee water, sanitation and hygiene programs across Somalia. Manage implementation of WASH projects and coordinate with government and NGO partners.",
        url: "https://oxfam.org/jobs/wash-manager-somalia",
        datePosted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days from now
        sector: "WASH",
        source: "reliefweb",
        externalId: "sample-oxfam-1",
        type: "job" as const
      },
      {
        title: "Construction Services for Emergency Shelters",
        organization: "UN-Habitat",
        location: "Mombasa",
        country: "Kenya",
        description: "Tender for construction services to build emergency shelters for displaced populations. Seeking qualified construction companies with experience in humanitarian projects and rapid deployment capabilities.",
        url: "https://unhabitat.org/tenders/emergency-shelters-kenya",
        datePosted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        sector: "Shelter",
        source: "internal",
        externalId: "sample-tender-1",
        type: "tender" as const
      },

    ];

    for (const jobData of sampleJobs) {
      await this.createJob(jobData);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      id,
      email: insertUser.email,
      password: insertUser.password,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      companyName: insertUser.companyName,
      jobTitle: insertUser.jobTitle,
      phoneNumber: insertUser.phoneNumber || null,
      position: insertUser.position || null,
      bio: insertUser.bio || null,
      isApproved: false,
      isAdmin: false,
      approvedAt: null,
      approvedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser: User = { 
      ...existingUser, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllPendingUsers(): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => !user.isApproved)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async approveUser(id: number, approvedBy: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const approvedUser: User = {
      ...user,
      isApproved: true,
      approvedAt: new Date(),
      approvedBy,
      updatedAt: new Date(),
    };
    this.users.set(id, approvedUser);
    return approvedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Job methods
  async getAllJobs(): Promise<Job[]> {
    const now = new Date();
    return Array.from(this.jobs.values())
      .filter(job => !job.deadline || new Date(job.deadline) >= now)
      .sort(
        (a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime()
      );
  }

  async getAllJobsWithDetails(): Promise<Job[]> {
    // This includes expired jobs for admin use
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime()
    );
  }

  async getJobById(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getJobByExternalId(externalId: string): Promise<Job | undefined> {
    return Array.from(this.jobs.values()).find(
      (job) => job.externalId === externalId
    );
  }

  async getJobsByUserId(userId: number): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.createdBy === userId);
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = this.currentJobId++;
    const job: Job = { 
      ...insertJob, 
      id,
      url: insertJob.url || "",
      source: insertJob.source || "user",
      externalId: insertJob.externalId || `user-${insertJob.createdBy}-${Date.now()}`,
      datePosted: insertJob.datePosted || new Date(),
      sector: insertJob.sector || null,
      deadline: insertJob.deadline || null,
      howToApply: insertJob.howToApply || null,
      experience: insertJob.experience || null,
      qualifications: insertJob.qualifications || null,
      responsibilities: insertJob.responsibilities || null,
      bodyHtml: insertJob.bodyHtml || null,
      status: insertJob.status || "published",
      type: insertJob.type || "job",
      attachmentUrl: insertJob.attachmentUrl || null,
      createdBy: insertJob.createdBy ?? null,
      jobNumber: insertJob.jobNumber ?? null
    };
    this.jobs.set(id, job);
    return job;
  }

  async updateJob(id: number, updateData: Partial<InsertJob>): Promise<Job | undefined> {
    const existingJob = this.jobs.get(id);
    if (!existingJob) return undefined;
    
    const updatedJob: Job = { ...existingJob, ...updateData };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  async deleteJob(id: number): Promise<boolean> {
    return this.jobs.delete(id);
  }

  async searchJobs(query: string): Promise<Job[]> {
    const lowerQuery = query.toLowerCase();
    const now = new Date();
    return Array.from(this.jobs.values())
      .filter(job => {
        // Exclude expired jobs
        if (job.deadline && new Date(job.deadline) < now) {
          return false;
        }
        return (
          job.title.toLowerCase().includes(lowerQuery) ||
          job.organization.toLowerCase().includes(lowerQuery) ||
          job.description.toLowerCase().includes(lowerQuery) ||
          (job.sector && job.sector.toLowerCase().includes(lowerQuery))
        );
      })
      .sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime());
  }

  async filterJobs(filters: {
    country?: string[];
    organization?: string[];
    sector?: string[];
    datePosted?: string;
  }): Promise<Job[]> {
    const now = new Date();
    let filteredJobs = Array.from(this.jobs.values());

    // Always exclude expired jobs
    filteredJobs = filteredJobs.filter(job => 
      !job.deadline || new Date(job.deadline) >= now
    );

    if (filters.country && filters.country.length > 0) {
      filteredJobs = filteredJobs.filter(job => 
        filters.country!.includes(job.country)
      );
    }

    if (filters.organization && filters.organization.length > 0) {
      filteredJobs = filteredJobs.filter(job => 
        filters.organization!.some(org => 
          job.organization.toLowerCase().includes(org.toLowerCase())
        )
      );
    }

    if (filters.sector && filters.sector.length > 0) {
      filteredJobs = filteredJobs.filter(job => 
        job.sector && filters.sector!.includes(job.sector)
      );
    }

    if (filters.datePosted) {
      let cutoffDate: Date;
      
      switch (filters.datePosted) {
        case 'last24hours':
          cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'last7days':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'last30days':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0);
      }
      
      filteredJobs = filteredJobs.filter(job => 
        new Date(job.datePosted) >= cutoffDate
      );
    }

    return filteredJobs.sort(
      (a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime()
    );
  }

  // Invoice methods (not implemented for MemStorage)
  async getAllInvoices(): Promise<Invoice[]> {
    return [];
  }

  async getInvoiceById(id: number): Promise<Invoice | undefined> {
    return undefined;
  }

  async getInvoicesByUserId(userId: number): Promise<Invoice[]> {
    return [];
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    throw new Error("Invoice operations not supported in MemStorage");
  }

  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    return undefined;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    return false;
  }

  async getBilledJobIds(userId: number): Promise<number[]> {
    return [];
  }

  async getOrganizations(search?: string): Promise<string[]> {
    const allJobs = Array.from(this.jobs.values());
    const organizations = Array.from(new Set(allJobs.map(job => job.organization)));
    
    if (search) {
      const lowerSearch = search.toLowerCase();
      return organizations.filter(org => 
        org.toLowerCase().includes(lowerSearch)
      ).sort();
    }
    
    return organizations.sort();
  }

  async getLightweightJobs(filters?: {
    country?: string[];
    sector?: string[];
    search?: string;
    limit?: number;
  }): Promise<LightweightJob[]> {
    throw new Error("Lightweight job operations not supported in MemStorage");
  }

  async getLightweightJobStats(): Promise<{
    totalJobs: number;
    organizations: number;
    newToday: number;
  }> {
    throw new Error("Lightweight job stats not supported in MemStorage");
  }

  async getCountries(search?: string): Promise<string[]> {
    throw new Error("Country operations not supported in MemStorage");
  }

  async getCities(search?: string, country?: string): Promise<string[]> {
    throw new Error("City operations not supported in MemStorage");
  }

  async addCountry(name: string): Promise<Country> {
    throw new Error("Country operations not supported in MemStorage");
  }

  async addCity(name: string, country: string): Promise<City> {
    throw new Error("City operations not supported in MemStorage");
  }

  async getSectors(search?: string): Promise<string[]> {
    throw new Error("Sector operations not supported in MemStorage");
  }

  async addSector(name: string): Promise<Sector> {
    throw new Error("Sector operations not supported in MemStorage");
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllPendingUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isApproved, false))
      .orderBy(desc(users.createdAt));
  }

  async approveUser(id: number, approvedBy: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        isApproved: true,
        approvedAt: new Date(),
        approvedBy,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async getAllJobs(): Promise<Job[]> {
    const now = new Date();
    return await db
      .select()
      .from(jobs)
      .where(
        or(
          isNull(jobs.deadline),
          gte(jobs.deadline, now)
        )
      )
      .orderBy(desc(jobs.datePosted));
  }

  async getAllJobsWithDetails(): Promise<Job[]> {
    // This includes expired jobs for admin use
    return await db.select().from(jobs).orderBy(desc(jobs.datePosted));
  }

  async getJobById(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async getJobByExternalId(externalId: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.externalId, externalId));
    return job || undefined;
  }

  async getJobsByUserId(userId: number): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.createdBy, userId)).orderBy(desc(jobs.datePosted));
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    // Ensure required fields have values for database insertion
    const jobData = {
      ...insertJob,
      url: insertJob.url || "",
      source: insertJob.source || "user",
      externalId: insertJob.externalId || `user-${insertJob.createdBy}-${Date.now()}`,
      datePosted: insertJob.datePosted || new Date(),
    };
    
    const [job] = await db
      .insert(jobs)
      .values(jobData)
      .returning();
    
    // Invalidate cache after job creation
    jobsCache.invalidateCache();
    
    return job;
  }

  async updateJob(id: number, updateData: Partial<InsertJob>): Promise<Job | undefined> {
    const [job] = await db
      .update(jobs)
      .set(updateData)
      .where(eq(jobs.id, id))
      .returning();
    
    // Invalidate cache after job update
    if (job) {
      jobsCache.invalidateCache();
    }
    
    return job || undefined;
  }

  async deleteJob(id: number): Promise<boolean> {
    const result = await db.delete(jobs).where(eq(jobs.id, id));
    const deleted = (result.rowCount ?? 0) > 0;
    
    // Invalidate cache after job deletion
    if (deleted) {
      jobsCache.invalidateCache();
    }
    
    return deleted;
  }

  async searchJobs(query: string): Promise<Job[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    const now = new Date();
    return await db
      .select()
      .from(jobs)
      .where(
        and(
          or(
            ilike(jobs.title, searchTerm),
            ilike(jobs.organization, searchTerm),
            ilike(jobs.description, searchTerm),
            ilike(jobs.sector, searchTerm)
          ),
          // Exclude expired jobs
          or(
            isNull(jobs.deadline),
            gte(jobs.deadline, now)
          )
        )
      )
      .orderBy(desc(jobs.datePosted));
  }

  async filterJobs(filters: {
    country?: string[];
    organization?: string[];
    sector?: string[];
    datePosted?: string;
  }): Promise<Job[]> {
    const now = new Date();
    let whereConditions = [];

    // Always exclude expired jobs
    whereConditions.push(
      or(
        isNull(jobs.deadline),
        gte(jobs.deadline, now)
      )
    );

    if (filters.country && filters.country.length > 0) {
      whereConditions.push(
        or(...filters.country.map(country => eq(jobs.country, country)))
      );
    }

    if (filters.organization && filters.organization.length > 0) {
      whereConditions.push(
        or(...filters.organization.map(org => ilike(jobs.organization, `%${org}%`)))
      );
    }

    if (filters.sector && filters.sector.length > 0) {
      whereConditions.push(
        or(...filters.sector.map(sector => eq(jobs.sector, sector)))
      );
    }

    if (filters.datePosted) {
      let cutoffDate: Date;
      
      switch (filters.datePosted) {
        case 'last24hours':
          cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'last7days':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'last30days':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0);
      }
      
      whereConditions.push(gte(jobs.datePosted, cutoffDate));
    }

    return await db
      .select()
      .from(jobs)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(jobs.datePosted));
  }

  // Invoice methods
  async getAllInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async getInvoiceById(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async getInvoicesByUserId(userId: number): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt));
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    // Generate simple invoice number
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
    const randomNum = Math.floor(Math.random() * 90000) + 10000; // 5-digit random number
    const invoiceNumber = `INV-${year}${randomNum}`;
    
    // Parse selected job IDs and calculate totals
    const selectedJobIds = JSON.parse(insertInvoice.selectedJobIds || '[]');
    const totalJobs = selectedJobIds.length;
    const pricePerJob = parseFloat(insertInvoice.pricePerJob);
    const totalAmount = (totalJobs * pricePerJob).toFixed(2);

    const [invoice] = await db
      .insert(invoices)
      .values({
        ...insertInvoice,
        invoiceNumber,
        totalJobs,
        totalAmount,
        updatedAt: new Date(),
      })
      .returning();
    return invoice;
  }

  async updateInvoice(id: number, updateData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    // Recalculate totals if selectedJobIds or pricePerJob changed
    let updatePayload: any = { ...updateData, updatedAt: new Date() };
    
    if (updateData.selectedJobIds || updateData.pricePerJob) {
      const selectedJobIds = JSON.parse(updateData.selectedJobIds || '[]');
      const totalJobs = selectedJobIds.length;
      const pricePerJob = parseFloat(updateData.pricePerJob || '0');
      const totalAmount = (totalJobs * pricePerJob).toFixed(2);
      
      updatePayload = {
        ...updatePayload,
        totalJobs,
        totalAmount,
      };
    }

    const [invoice] = await db
      .update(invoices)
      .set(updatePayload)
      .where(eq(invoices.id, id))
      .returning();
    return invoice || undefined;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    const result = await db.delete(invoices).where(eq(invoices.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getBilledJobIds(userId: number): Promise<number[]> {
    // Get all invoices for this user
    const userInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, userId));
    
    // Extract all job IDs from all invoices
    const billedJobIds: number[] = [];
    for (const invoice of userInvoices) {
      try {
        const jobIds = JSON.parse(invoice.selectedJobIds || '[]');
        if (Array.isArray(jobIds)) {
          billedJobIds.push(...jobIds);
        }
      } catch (error) {
        console.error('Error parsing selectedJobIds from invoice:', invoice.id, error);
      }
    }
    
    // Return unique job IDs using manual deduplication
    const uniqueJobIds: number[] = [];
    const seenIds = new Set<number>();
    
    for (const jobId of billedJobIds) {
      if (!seenIds.has(jobId)) {
        uniqueJobIds.push(jobId);
        seenIds.add(jobId);
      }
    }
    
    return uniqueJobIds;
  }

  async getOrganizations(search?: string): Promise<string[]> {
    const query = db.selectDistinct({ organization: jobs.organization }).from(jobs);
    
    if (search) {
      const searchCondition = ilike(jobs.organization, `%${search}%`);
      query.where(searchCondition);
    }
    
    const result = await query.orderBy(jobs.organization);
    return result.map(row => row.organization);
  }

  async getCountries(search?: string): Promise<string[]> {
    const query = db.selectDistinct({ name: countries.name }).from(countries);
    
    if (search) {
      const searchCondition = ilike(countries.name, `%${search}%`);
      query.where(searchCondition);
    }
    
    const result = await query.orderBy(countries.name);
    return result.map(row => row.name);
  }

  async getCities(search?: string, country?: string): Promise<string[]> {
    const query = db.selectDistinct({ name: cities.name }).from(cities);
    
    const conditions = [];
    if (search) {
      conditions.push(ilike(cities.name, `%${search}%`));
    }
    if (country) {
      conditions.push(eq(cities.country, country));
    }
    
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    const result = await query.orderBy(cities.name);
    return result.map(row => row.name);
  }

  async addCountry(name: string): Promise<Country> {
    try {
      const [country] = await db
        .insert(countries)
        .values({ name })
        .returning();
      return country;
    } catch (error) {
      // If country already exists, return it
      const [existingCountry] = await db
        .select()
        .from(countries)
        .where(eq(countries.name, name));
      if (existingCountry) {
        return existingCountry;
      }
      throw error;
    }
  }

  async addCity(name: string, country: string): Promise<City> {
    try {
      const [city] = await db
        .insert(cities)
        .values({ name, country })
        .returning();
      return city;
    } catch (error) {
      // If city already exists, return it
      const [existingCity] = await db
        .select()
        .from(cities)
        .where(and(eq(cities.name, name), eq(cities.country, country)));
      if (existingCity) {
        return existingCity;
      }
      throw error;
    }
  }

  async getSectors(search?: string): Promise<string[]> {
    const baseQuery = db.selectDistinct({ name: sectors.name }).from(sectors);
    
    let result;
    if (search) {
      result = await baseQuery
        .where(ilike(sectors.name, `%${search}%`))
        .orderBy(sectors.name);
    } else {
      result = await baseQuery.orderBy(sectors.name);
    }
    
    return result.map(row => row.name);
  }

  async addSector(name: string): Promise<Sector> {
    try {
      const [sector] = await db
        .insert(sectors)
        .values({ name })
        .returning();
      return sector;
    } catch (error) {
      // If sector already exists, return it
      const [existingSector] = await db
        .select()
        .from(sectors)
        .where(eq(sectors.name, name));
      if (existingSector) {
        return existingSector;
      }
      throw error;
    }
  }

  // Lightweight job methods for performance optimization
  async getLightweightJobs(filters?: {
    country?: string[];
    sector?: string[];
    search?: string;
    limit?: number;
  }): Promise<LightweightJob[]> {
    // Build conditions array
    const now = new Date();
    const conditions = [
      eq(jobs.status, 'published'),
      eq(jobs.type, 'job'),
      // Exclude expired jobs: show only jobs with no deadline or deadline in the future
      or(
        isNull(jobs.deadline),
        gte(jobs.deadline, now)
      )
    ];

    // Add country filter
    if (filters?.country && filters.country.length > 0) {
      const validCountries = filters.country.filter(country => country && typeof country === 'string');
      if (validCountries.length === 1) {
        conditions.push(eq(jobs.country, validCountries[0]));
      } else if (validCountries.length > 1) {
        const countryConditions = validCountries.map(country => eq(jobs.country, country));
        const orCondition = or(...countryConditions);
        if (orCondition) {
          conditions.push(orCondition);
        }
      }
    }

    // Add sector filter
    if (filters?.sector && filters.sector.length > 0) {
      const validSectors = filters.sector.filter(sector => sector && typeof sector === 'string');
      if (validSectors.length === 1) {
        conditions.push(eq(jobs.sector, validSectors[0]));
      } else if (validSectors.length > 1) {
        const sectorConditions = validSectors.map(sector => eq(jobs.sector, sector));
        const orCondition = or(...sectorConditions);
        if (orCondition) {
          conditions.push(orCondition);
        }
      }
    }

    // Add search filter
    if (filters?.search && typeof filters.search === 'string') {
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      const searchCondition = or(
        ilike(jobs.title, searchTerm),
        ilike(jobs.organization, searchTerm),
        ilike(jobs.sector, searchTerm)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Build and execute query
    const baseQuery = db
      .select({
        id: jobs.id,
        title: jobs.title,
        organization: jobs.organization,
        country: jobs.country,
        location: jobs.location,
        datePosted: jobs.datePosted,
        sector: jobs.sector,
        type: jobs.type
      })
      .from(jobs)
      .where(and(...conditions))
      .orderBy(desc(jobs.datePosted));

    const results = filters?.limit 
      ? await baseQuery.limit(filters.limit)
      : await baseQuery;
    
    // Transform to LightweightJob with slug generation
    return results.map(job => ({
      ...job,
      slug: generateJobSlug(job.title, job.id)
    }));
  }

  async getLightweightJobStats(): Promise<{
    totalJobs: number;
    organizations: number;
    newToday: number;
  }> {
    // Get total count of published jobs
    const totalJobsResult = await db
      .select({ count: jobs.id })
      .from(jobs)
      .where(and(
        eq(jobs.status, 'published'),
        eq(jobs.type, 'job')
      ));

    // Get unique organization count
    const organizationsResult = await db
      .selectDistinct({ organization: jobs.organization })
      .from(jobs)
      .where(and(
        eq(jobs.status, 'published'),
        eq(jobs.type, 'job')
      ));

    // Get jobs posted today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const newTodayResult = await db
      .select({ count: jobs.id })
      .from(jobs)
      .where(and(
        eq(jobs.status, 'published'),
        eq(jobs.type, 'job'),
        gte(jobs.datePosted, startOfDay)
      ));

    return {
      totalJobs: totalJobsResult.length,
      organizations: organizationsResult.length,
      newToday: newTodayResult.length
    };
  }
}

export const storage = new DatabaseStorage();
