import { jobs, type Job, type InsertJob, users, type User, type InsertUser } from "@shared/schema";

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
    const job: Job = { ...insertJob, id };
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

export const storage = new MemStorage();
