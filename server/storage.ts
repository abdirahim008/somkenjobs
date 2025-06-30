import { jobs, type Job, type InsertJob, users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, gte, ilike } from "drizzle-orm";

export interface IStorage {
  // User methods (keep for future use)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Job methods
  getAllJobs(): Promise<Job[]>;
  getJobById(id: number): Promise<Job | undefined>;
  getJobByExternalId(externalId: string): Promise<Job | undefined>;
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
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
      bodyHtml: insertJob.bodyHtml || null
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
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
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
}

export const storage = new DatabaseStorage();
