import { jobs, type Job, type InsertJob, users, type User, type InsertUser, invoices, type Invoice, type InsertInvoice } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, gte, ilike } from "drizzle-orm";

export interface IStorage {
  // User authentication methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getAllPendingUsers(): Promise<User[]>;
  approveUser(id: number, approvedBy: string): Promise<User | undefined>;
  
  // Job methods
  getAllJobs(): Promise<Job[]>;
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

  // Invoice methods
  getAllInvoices(): Promise<Invoice[]>;
  getInvoiceById(id: number): Promise<Invoice | undefined>;
  getInvoicesByUserId(userId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
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
        externalId: "sample-wfp-1"
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
        externalId: "sample-msf-1"
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
        externalId: "sample-oxfam-1"
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
      ...insertUser, 
      id,
      phoneNumber: insertUser.phoneNumber || null,
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

  // Job methods
  async getAllJobs(): Promise<Job[]> {
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
      sector: insertJob.sector || null,
      deadline: insertJob.deadline || null,
      howToApply: insertJob.howToApply || null,
      experience: insertJob.experience || null,
      qualifications: insertJob.qualifications || null,
      responsibilities: insertJob.responsibilities || null,
      bodyHtml: insertJob.bodyHtml || null,
      createdBy: insertJob.createdBy ?? null
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
    return Array.from(this.jobs.values())
      .filter(job => 
        job.title.toLowerCase().includes(lowerQuery) ||
        job.organization.toLowerCase().includes(lowerQuery) ||
        job.description.toLowerCase().includes(lowerQuery) ||
        (job.sector && job.sector.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime());
  }

  async filterJobs(filters: {
    country?: string[];
    organization?: string[];
    sector?: string[];
    datePosted?: string;
  }): Promise<Job[]> {
    let filteredJobs = Array.from(this.jobs.values());

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
      const now = new Date();
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

  async getAllJobs(): Promise<Job[]> {
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
    const [job] = await db
      .insert(jobs)
      .values(insertJob)
      .returning();
    return job;
  }

  async updateJob(id: number, updateData: Partial<InsertJob>): Promise<Job | undefined> {
    const [job] = await db
      .update(jobs)
      .set(updateData)
      .where(eq(jobs.id, id))
      .returning();
    return job || undefined;
  }

  async deleteJob(id: number): Promise<boolean> {
    const result = await db.delete(jobs).where(eq(jobs.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async searchJobs(query: string): Promise<Job[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db
      .select()
      .from(jobs)
      .where(
        or(
          ilike(jobs.title, searchTerm),
          ilike(jobs.organization, searchTerm),
          ilike(jobs.description, searchTerm),
          ilike(jobs.sector, searchTerm)
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
    let whereConditions = [];

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
      const now = new Date();
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
    // Generate unique invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
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
}

export const storage = new DatabaseStorage();
