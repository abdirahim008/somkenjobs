var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/vercel-entry.ts
import express2 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  cities: () => cities,
  countries: () => countries,
  insertCitySchema: () => insertCitySchema,
  insertCountrySchema: () => insertCountrySchema,
  insertInvoiceSchema: () => insertInvoiceSchema,
  insertJobSchema: () => insertJobSchema,
  insertSectorSchema: () => insertSectorSchema,
  insertUserSchema: () => insertUserSchema,
  invoices: () => invoices,
  jobs: () => jobs,
  loginUserSchema: () => loginUserSchema,
  sectors: () => sectors,
  users: () => users
});
import { pgTable, text, serial, timestamp, boolean, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  jobNumber: text("job_number"),
  // Optional job/tender number for user identification
  organization: text("organization").notNull(),
  location: text("location").notNull(),
  country: text("country").notNull(),
  description: text("description").notNull(),
  url: text("url").notNull(),
  datePosted: timestamp("date_posted").notNull(),
  deadline: timestamp("deadline"),
  sector: text("sector"),
  source: text("source").notNull(),
  // 'reliefweb' or 'unjobs'
  externalId: text("external_id").notNull().unique(),
  // Additional detailed fields
  howToApply: text("how_to_apply"),
  experience: text("experience"),
  qualifications: text("qualifications"),
  responsibilities: text("responsibilities"),
  bodyHtml: text("body_html"),
  createdBy: integer("created_by"),
  // User ID who created the job (null for scraped jobs)
  status: text("status").notNull().default("published"),
  // 'draft' or 'published'
  type: text("type").notNull().default("job"),
  // 'job' or 'tender'
  attachmentUrl: text("attachment_url"),
  // URL to uploaded attachment file for tenders
  createdAt: timestamp("created_at").defaultNow(),
  visibility: text("visibility").notNull().default("public"),
  // 'public' or 'private'
  privateToken: text("private_token")
  // Token for accessing private jobs via link
});
var insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true
}).extend({
  url: z.string().optional(),
  source: z.string().optional(),
  externalId: z.string().optional(),
  datePosted: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional(),
  deadline: z.union([z.date(), z.string().transform((str) => new Date(str)), z.null()]).optional(),
  bodyHtml: z.string().nullable().optional(),
  type: z.enum(["job", "tender"]).default("job"),
  attachmentUrl: z.string().nullable().optional(),
  jobNumber: z.string().nullable().optional(),
  howToApply: z.string().nullable().optional(),
  experience: z.string().nullable().optional(),
  qualifications: z.string().nullable().optional(),
  responsibilities: z.string().nullable().optional(),
  sector: z.string().nullable().optional(),
  createdBy: z.number().nullable().optional(),
  visibility: z.enum(["public", "private"]).default("public"),
  privateToken: z.string().nullable().optional()
});
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  companyName: text("company_name").notNull(),
  jobTitle: text("job_title").notNull(),
  phoneNumber: text("phone_number"),
  position: text("position"),
  bio: text("bio"),
  isApproved: boolean("is_approved").default(false).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  approvedAt: timestamp("approved_at"),
  approvedBy: text("approved_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isApproved: true,
  isAdmin: true,
  approvedAt: true,
  approvedBy: true,
  createdAt: true,
  updatedAt: true
});
var loginUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});
var invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  title: text("title").default("Job Posting Services"),
  description: text("description"),
  pricePerJob: text("price_per_job").notNull(),
  // Store as text to avoid decimal issues
  totalJobs: integer("total_jobs").notNull().default(0),
  totalAmount: text("total_amount").notNull(),
  // Store as text to avoid decimal issues
  selectedJobIds: text("selected_job_ids").notNull().default("[]"),
  // Store as JSON string
  status: text("status").notNull().default("draft"),
  clientOrganization: text("client_organization").default("Client Organization"),
  clientEmail: text("client_email"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  invoiceNumber: true,
  title: true,
  totalJobs: true,
  totalAmount: true,
  createdAt: true,
  updatedAt: true
});
var countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertCountrySchema = createInsertSchema(countries).omit({
  id: true,
  createdAt: true
});
var cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  // Unique constraint on city name + country combination
  uniqueCityCountry: unique("unique_city_country").on(table.name, table.country)
}));
var insertCitySchema = createInsertSchema(cities).omit({
  id: true,
  createdAt: true
});
var sectors = pgTable("sectors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertSectorSchema = createInsertSchema(sectors).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import "dotenv/config";
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var databaseUrl = process.env.DATABASE_URL;
var isNeon = databaseUrl.includes("neon.tech") || databaseUrl.includes(".neon.");
var pool;
var db;
if (isNeon) {
  const { Pool, neonConfig } = await import("@neondatabase/serverless");
  const ws = (await import("ws")).default;
  const { drizzle } = await import("drizzle-orm/neon-serverless");
  neonConfig.webSocketConstructor = ws;
  pool = new Pool({ connectionString: databaseUrl });
  db = drizzle({ client: pool, schema: schema_exports });
} else {
  const pg = (await import("pg")).default;
  const { drizzle } = await import("drizzle-orm/node-postgres");
  pool = new pg.Pool({ connectionString: databaseUrl });
  db = drizzle({ client: pool, schema: schema_exports });
}

// server/storage.ts
import { eq, desc, and, or, gte, lt, ilike, isNull } from "drizzle-orm";

// shared/utils.ts
function generateJobSlug(title, id) {
  const slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").substring(0, 100);
  return `${slug}-${id}`;
}
function extractJobIdFromSlug(slug) {
  const match = slug.match(/-(\d+)$/);
  if (!match) return null;
  const id = parseInt(match[1], 10);
  if (isNaN(id) || id > 2147483647 || id < 1) return null;
  return id;
}

// server/services/jobsCache.ts
import crypto from "crypto";
var JobsCache = class {
  cache = /* @__PURE__ */ new Map();
  statsCache = null;
  jobsVersion = Date.now();
  // Global version tracking
  TTL = 45e3;
  // 45 seconds TTL
  /**
   * Get current jobs version for ETag generation
   */
  getJobsVersion() {
    return this.jobsVersion;
  }
  /**
   * Invalidate cache when jobs data changes
   * Called on job insert/update/delete operations
   */
  invalidateCache() {
    this.jobsVersion = Date.now();
    this.cache.clear();
    this.statsCache = null;
    console.log("Jobs cache invalidated, new version:", this.jobsVersion);
  }
  /**
   * Generate normalized cache key from query parameters
   */
  generateCacheKey(filters) {
    const normalizedFilters = {
      country: filters.country?.sort() || [],
      sector: filters.sector?.sort() || [],
      search: filters.search || "",
      limit: filters.limit || 0
    };
    return JSON.stringify(normalizedFilters);
  }
  /**
   * Generate ETag from jobs version and query parameters
   */
  generateETag(filters) {
    const cacheKey = this.generateCacheKey(filters);
    const content = `${this.jobsVersion}:${cacheKey}`;
    return `"${crypto.createHash("md5").update(content).digest("hex")}"`;
  }
  /**
   * Get cached jobs data or return null if not found/expired
   */
  getCachedJobs(filters) {
    const cacheKey = this.generateCacheKey(filters);
    const entry = this.cache.get(cacheKey);
    if (!entry) {
      return null;
    }
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(cacheKey);
      return null;
    }
    return entry;
  }
  /**
   * Cache jobs data with generated ETag
   */
  setCachedJobs(filters, data) {
    const cacheKey = this.generateCacheKey(filters);
    const etag = this.generateETag(filters);
    const entry = {
      data,
      timestamp: Date.now(),
      etag
    };
    this.cache.set(cacheKey, entry);
    if (this.cache.size > 100) {
      const oldestKeys = Array.from(this.cache.keys()).slice(0, 20);
      oldestKeys.forEach((key) => this.cache.delete(key));
    }
    return entry;
  }
  /**
   * Get cached stats or return null if not found/expired
   */
  getCachedStats() {
    if (!this.statsCache) {
      return null;
    }
    if (Date.now() - this.statsCache.timestamp > this.TTL) {
      this.statsCache = null;
      return null;
    }
    return {
      data: this.statsCache.data,
      etag: this.statsCache.etag
    };
  }
  /**
   * Cache stats data
   */
  setCachedStats(stats) {
    const etag = `"stats-${crypto.createHash("md5").update(`${this.jobsVersion}:stats`).digest("hex")}"`;
    this.statsCache = {
      data: stats,
      timestamp: Date.now(),
      etag
    };
    return {
      data: stats,
      etag
    };
  }
  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      jobsVersion: this.jobsVersion,
      hasStatsCache: !!this.statsCache
    };
  }
};
var jobsCache = new JobsCache();

// server/storage.ts
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUser(id, updates) {
    const [user] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return user || void 0;
  }
  async getAllPendingUsers() {
    return await db.select().from(users).where(eq(users.isApproved, false)).orderBy(desc(users.createdAt));
  }
  async approveUser(id, approvedBy) {
    const [user] = await db.update(users).set({
      isApproved: true,
      approvedAt: /* @__PURE__ */ new Date(),
      approvedBy,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, id)).returning();
    return user || void 0;
  }
  async deleteUser(id) {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  async getAllUsers() {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }
  async getAllJobs() {
    const now = /* @__PURE__ */ new Date();
    return await db.select().from(jobs).where(
      and(
        // Exclude private jobs from public listing
        or(eq(jobs.visibility, "public"), isNull(jobs.visibility)),
        or(
          isNull(jobs.deadline),
          gte(jobs.deadline, now)
        )
      )
    ).orderBy(desc(jobs.datePosted));
  }
  async getAllJobsWithDetails() {
    return await db.select().from(jobs).orderBy(desc(jobs.datePosted));
  }
  async getJobById(id, token, skipPrivateCheck) {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    if (!job) return void 0;
    if (!skipPrivateCheck && job.visibility === "private" && job.privateToken !== token) return void 0;
    return job;
  }
  async getJobByExternalId(externalId) {
    const [job] = await db.select().from(jobs).where(eq(jobs.externalId, externalId));
    return job || void 0;
  }
  async getJobsByUserId(userId) {
    return await db.select().from(jobs).where(eq(jobs.createdBy, userId)).orderBy(desc(jobs.datePosted));
  }
  async createJob(insertJob) {
    const jobData = {
      ...insertJob,
      url: insertJob.url || "",
      source: insertJob.source || "user",
      externalId: insertJob.externalId || `user-${insertJob.createdBy}-${Date.now()}`,
      datePosted: insertJob.datePosted || /* @__PURE__ */ new Date()
    };
    const [job] = await db.insert(jobs).values(jobData).returning();
    jobsCache.invalidateCache();
    return job;
  }
  async updateJob(id, updateData) {
    const [job] = await db.update(jobs).set(updateData).where(eq(jobs.id, id)).returning();
    if (job) {
      jobsCache.invalidateCache();
    }
    return job || void 0;
  }
  async deleteJob(id) {
    const result = await db.delete(jobs).where(eq(jobs.id, id));
    const deleted = (result.rowCount ?? 0) > 0;
    if (deleted) {
      jobsCache.invalidateCache();
    }
    return deleted;
  }
  async archiveExpiredJobs() {
    const now = /* @__PURE__ */ new Date();
    const result = await db.update(jobs).set({ status: "archived" }).where(
      and(
        eq(jobs.status, "published"),
        lt(jobs.deadline, now)
      )
    );
    const count = result.rowCount ?? 0;
    if (count > 0) {
      console.log(`Archived ${count} expired jobs`);
      jobsCache.invalidateCache();
    }
    return count;
  }
  async searchJobs(query) {
    const searchTerm = `%${query.toLowerCase()}%`;
    const now = /* @__PURE__ */ new Date();
    return await db.select().from(jobs).where(
      and(
        // Exclude private jobs from public search
        or(eq(jobs.visibility, "public"), isNull(jobs.visibility)),
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
    ).orderBy(desc(jobs.datePosted));
  }
  async filterJobs(filters) {
    const now = /* @__PURE__ */ new Date();
    let whereConditions = [];
    whereConditions.push(or(eq(jobs.visibility, "public"), isNull(jobs.visibility)));
    whereConditions.push(
      or(
        isNull(jobs.deadline),
        gte(jobs.deadline, now)
      )
    );
    if (filters.country && filters.country.length > 0) {
      whereConditions.push(
        or(...filters.country.map((country) => eq(jobs.country, country)))
      );
    }
    if (filters.organization && filters.organization.length > 0) {
      whereConditions.push(
        or(...filters.organization.map((org) => ilike(jobs.organization, `%${org}%`)))
      );
    }
    if (filters.sector && filters.sector.length > 0) {
      whereConditions.push(
        or(...filters.sector.map((sector) => eq(jobs.sector, sector)))
      );
    }
    if (filters.datePosted) {
      let cutoffDate;
      switch (filters.datePosted) {
        case "last24hours":
          cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
          break;
        case "last7days":
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
          break;
        case "last30days":
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
          break;
        default:
          cutoffDate = /* @__PURE__ */ new Date(0);
      }
      whereConditions.push(gte(jobs.datePosted, cutoffDate));
    }
    return await db.select().from(jobs).where(whereConditions.length > 0 ? and(...whereConditions) : void 0).orderBy(desc(jobs.datePosted));
  }
  // Invoice methods
  async getAllInvoices() {
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }
  async getInvoiceById(id) {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || void 0;
  }
  async getInvoicesByUserId(userId) {
    return await db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));
  }
  async createInvoice(insertInvoice) {
    const now = /* @__PURE__ */ new Date();
    const year = now.getFullYear().toString().slice(-2);
    const randomNum = Math.floor(Math.random() * 9e4) + 1e4;
    const invoiceNumber = `INV-${year}${randomNum}`;
    const selectedJobIds = JSON.parse(insertInvoice.selectedJobIds || "[]");
    const totalJobs = selectedJobIds.length;
    const pricePerJob = parseFloat(insertInvoice.pricePerJob);
    const totalAmount = (totalJobs * pricePerJob).toFixed(2);
    const [invoice] = await db.insert(invoices).values({
      ...insertInvoice,
      invoiceNumber,
      totalJobs,
      totalAmount,
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return invoice;
  }
  async updateInvoice(id, updateData) {
    let updatePayload = { ...updateData, updatedAt: /* @__PURE__ */ new Date() };
    if (updateData.selectedJobIds || updateData.pricePerJob) {
      const selectedJobIds = JSON.parse(updateData.selectedJobIds || "[]");
      const totalJobs = selectedJobIds.length;
      const pricePerJob = parseFloat(updateData.pricePerJob || "0");
      const totalAmount = (totalJobs * pricePerJob).toFixed(2);
      updatePayload = {
        ...updatePayload,
        totalJobs,
        totalAmount
      };
    }
    const [invoice] = await db.update(invoices).set(updatePayload).where(eq(invoices.id, id)).returning();
    return invoice || void 0;
  }
  async deleteInvoice(id) {
    const result = await db.delete(invoices).where(eq(invoices.id, id));
    return (result.rowCount || 0) > 0;
  }
  async getBilledJobIds(userId) {
    const userInvoices = await db.select().from(invoices).where(eq(invoices.userId, userId));
    const billedJobIds = [];
    for (const invoice of userInvoices) {
      try {
        const jobIds = JSON.parse(invoice.selectedJobIds || "[]");
        if (Array.isArray(jobIds)) {
          billedJobIds.push(...jobIds);
        }
      } catch (error) {
        console.error("Error parsing selectedJobIds from invoice:", invoice.id, error);
      }
    }
    const uniqueJobIds = [];
    const seenIds = /* @__PURE__ */ new Set();
    for (const jobId of billedJobIds) {
      if (!seenIds.has(jobId)) {
        uniqueJobIds.push(jobId);
        seenIds.add(jobId);
      }
    }
    return uniqueJobIds;
  }
  async getOrganizations(search) {
    const baseQuery = db.selectDistinct({ organization: jobs.organization }).from(jobs);
    const result = search ? await baseQuery.where(ilike(jobs.organization, `%${search}%`)).orderBy(jobs.organization) : await baseQuery.orderBy(jobs.organization);
    return result.map((row) => row.organization);
  }
  async getCountries(search) {
    const baseQuery = db.selectDistinct({ name: countries.name }).from(countries);
    const result = search ? await baseQuery.where(ilike(countries.name, `%${search}%`)).orderBy(countries.name) : await baseQuery.orderBy(countries.name);
    return result.map((row) => row.name);
  }
  async getCities(search, country) {
    const conditions = [];
    if (search) conditions.push(ilike(cities.name, `%${search}%`));
    if (country) conditions.push(eq(cities.country, country));
    const baseQuery = db.selectDistinct({ name: cities.name }).from(cities);
    const result = conditions.length > 0 ? await baseQuery.where(and(...conditions)).orderBy(cities.name) : await baseQuery.orderBy(cities.name);
    return result.map((row) => row.name);
  }
  async addCountry(name) {
    try {
      const [country] = await db.insert(countries).values({ name }).returning();
      return country;
    } catch (error) {
      const [existingCountry] = await db.select().from(countries).where(eq(countries.name, name));
      if (existingCountry) {
        return existingCountry;
      }
      throw error;
    }
  }
  async addCity(name, country) {
    try {
      const [city] = await db.insert(cities).values({ name, country }).returning();
      return city;
    } catch (error) {
      const [existingCity] = await db.select().from(cities).where(and(eq(cities.name, name), eq(cities.country, country)));
      if (existingCity) {
        return existingCity;
      }
      throw error;
    }
  }
  async getSectors(search) {
    const baseQuery = db.selectDistinct({ name: sectors.name }).from(sectors);
    const result = search ? await baseQuery.where(ilike(sectors.name, `%${search}%`)).orderBy(sectors.name) : await baseQuery.orderBy(sectors.name);
    return result.map((row) => row.name);
  }
  async addSector(name) {
    try {
      const [sector] = await db.insert(sectors).values({ name }).returning();
      return sector;
    } catch (error) {
      const [existingSector] = await db.select().from(sectors).where(eq(sectors.name, name));
      if (existingSector) {
        return existingSector;
      }
      throw error;
    }
  }
  // Lightweight job methods for performance optimization
  async getLightweightJobs(filters) {
    const now = /* @__PURE__ */ new Date();
    const conditions = [
      eq(jobs.status, "published"),
      eq(jobs.type, "job"),
      eq(jobs.visibility, "public"),
      // Exclude expired jobs: show only jobs with no deadline or deadline in the future
      or(
        isNull(jobs.deadline),
        gte(jobs.deadline, now)
      )
    ];
    if (filters?.country && filters.country.length > 0) {
      const validCountries = filters.country.filter((country) => country && typeof country === "string");
      if (validCountries.length === 1) {
        conditions.push(eq(jobs.country, validCountries[0]));
      } else if (validCountries.length > 1) {
        const countryConditions = validCountries.map((country) => eq(jobs.country, country));
        const orCondition = or(...countryConditions);
        if (orCondition) {
          conditions.push(orCondition);
        }
      }
    }
    if (filters?.sector && filters.sector.length > 0) {
      const validSectors = filters.sector.filter((sector) => sector && typeof sector === "string");
      if (validSectors.length === 1) {
        conditions.push(eq(jobs.sector, validSectors[0]));
      } else if (validSectors.length > 1) {
        const sectorConditions = validSectors.map((sector) => eq(jobs.sector, sector));
        const orCondition = or(...sectorConditions);
        if (orCondition) {
          conditions.push(orCondition);
        }
      }
    }
    if (filters?.search && typeof filters.search === "string") {
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
    const baseQuery = db.select({
      id: jobs.id,
      title: jobs.title,
      organization: jobs.organization,
      country: jobs.country,
      location: jobs.location,
      datePosted: jobs.datePosted,
      sector: jobs.sector,
      type: jobs.type
    }).from(jobs).where(and(...conditions)).orderBy(desc(jobs.datePosted));
    const results = filters?.limit ? await baseQuery.limit(filters.limit) : await baseQuery;
    return results.map((job) => ({
      ...job,
      slug: generateJobSlug(job.title, job.id)
    }));
  }
  async getLightweightJobStats() {
    const totalJobsResult = await db.select({ count: jobs.id }).from(jobs).where(and(
      eq(jobs.status, "published"),
      eq(jobs.type, "job"),
      eq(jobs.visibility, "public")
    ));
    const organizationsResult = await db.selectDistinct({ organization: jobs.organization }).from(jobs).where(and(
      eq(jobs.status, "published"),
      eq(jobs.type, "job"),
      eq(jobs.visibility, "public")
    ));
    const today = /* @__PURE__ */ new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const newTodayResult = await db.select({ count: jobs.id }).from(jobs).where(and(
      eq(jobs.status, "published"),
      eq(jobs.type, "job"),
      eq(jobs.visibility, "public"),
      gte(jobs.datePosted, startOfDay)
    ));
    return {
      totalJobs: totalJobsResult.length,
      organizations: organizationsResult.length,
      newToday: newTodayResult.length
    };
  }
};
var storage = new DatabaseStorage();

// server/services/jobFetcher.ts
import * as cron from "node-cron";
var RELIEFWEB_API_URL = "https://api.reliefweb.int/v1/jobs";
var UNTALENT_API_URL = "https://untalent.org/api/v1/jobs";
var UNJOBS_RSS_URL = "https://jobs.un.org/rss";
var JobFetcher = class {
  isRunning = false;
  async fetchReliefWebJobs() {
    try {
      console.log("Fetching jobs from ReliefWeb...");
      const countries2 = ["Kenya", "Somalia", "Ethiopia", "Uganda", "Tanzania"];
      for (const country of countries2) {
        const params = new URLSearchParams();
        params.append("appname", "jobconnect-eastafrica-w2ZduVJ8jH9");
        params.append("limit", "15");
        params.append("query[value]", country);
        params.append("query[fields][]", "country.name");
        params.append("sort[]", "date.created:desc");
        const fields = [
          "id",
          "title",
          "body",
          "body-html",
          "date.created",
          "date.closing",
          "date.changed",
          "source.name",
          "source.shortname",
          "source.longname",
          "source.homepage",
          "source.type",
          "country.name",
          "country.iso3",
          "country.shortname",
          "url",
          "url_alias",
          "theme.name",
          "career_categories.name",
          "how_to_apply",
          "how_to_apply-html",
          "experience.name",
          "type.name"
        ];
        fields.forEach((field) => {
          params.append("fields[include][]", field);
        });
        const url = `${RELIEFWEB_API_URL}?${params}`;
        console.log(`Fetching ${country} jobs from ReliefWeb...`);
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent": "JobConnect-EastAfrica/1.0",
            "Accept": "application/json"
          }
        });
        if (!response.ok) {
          console.error(`ReliefWeb API error for ${country}: ${response.status} ${response.statusText}`);
          continue;
        }
        const data = await response.json();
        console.log(`ReliefWeb returned ${data.data.length} jobs for ${country}`);
        if (data.data.length > 0) {
          console.log(`Date range for ${country}: ${data.data[data.data.length - 1].fields.date.created} to ${data.data[0].fields.date.created}`);
        }
        let newJobsCount = 0;
        let skippedJobsCount = 0;
        for (const rwJob of data.data) {
          const existingJob = await storage.getJobByExternalId(`reliefweb-${rwJob.id}`);
          if (existingJob) {
            skippedJobsCount++;
            console.log(`Skipping existing job: ${rwJob.id} - ${rwJob.fields.title} (${rwJob.fields.date.created})`);
            continue;
          }
          const countryName = rwJob.fields.country?.[0]?.name || country;
          let location = countryName;
          const titleAndDesc = `${rwJob.fields.title} ${rwJob.fields.body || ""}`.toLowerCase();
          const kenyanCities = ["nairobi", "mombasa", "kisumu", "nakuru", "eldoret", "thika", "malindi", "kitale", "garissa", "isiolo"];
          const somaliCities = ["mogadishu", "hargeisa", "bosaso", "kismayo", "galkayo", "baidoa", "berbera", "burao"];
          const allCities = [...kenyanCities, ...somaliCities];
          for (const city of allCities) {
            if (titleAndDesc.includes(city)) {
              const properCityName = city.charAt(0).toUpperCase() + city.slice(1);
              location = `${properCityName}, ${countryName}`;
              console.log(`Enhanced location detected: ${location} from job content`);
              break;
            }
          }
          const sector = rwJob.fields.theme?.[0]?.name || rwJob.fields.career_categories?.[0]?.name || "General";
          const rawDescription = rwJob.fields.body || "";
          const fullHtmlDescription = rwJob.fields["body-html"] || rawDescription;
          const description = rawDescription.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().substring(0, 800) || "";
          const howToApply = rwJob.fields.how_to_apply || rwJob.fields["how_to_apply-html"] || null;
          const experience = rwJob.fields.experience?.map((exp) => exp.name).join(", ") || null;
          const bodyHtml = rwJob.fields["body-html"] || null;
          const organization = rwJob.fields.source?.[0]?.longname || rwJob.fields.source?.[0]?.name || "ReliefWeb Organization";
          const job = {
            title: rwJob.fields.title,
            organization,
            location,
            country,
            description,
            url: rwJob.fields.url || (rwJob.fields.url_alias ? `https://reliefweb.int${rwJob.fields.url_alias}` : `https://reliefweb.int/job/${rwJob.id}`),
            datePosted: new Date(rwJob.fields.date.created),
            deadline: rwJob.fields.date.closing ? new Date(rwJob.fields.date.closing) : null,
            sector: rwJob.fields.theme?.[0]?.name || sector,
            source: "reliefweb",
            externalId: `reliefweb-${rwJob.id}`,
            howToApply,
            experience,
            qualifications: null,
            // Will be extracted from description
            responsibilities: null,
            // Will be extracted from description
            bodyHtml: fullHtmlDescription,
            visibility: "public",
            type: "job"
            // ReliefWeb jobs are always job opportunities, not tenders
          };
          await storage.createJob(job);
          newJobsCount++;
          console.log(`Created new job: ${rwJob.id} - ${rwJob.fields.title} (${rwJob.fields.date.created})`);
        }
        console.log(`Fetched ${data.data.length} jobs from ReliefWeb for ${country} - ${newJobsCount} new, ${skippedJobsCount} existing`);
      }
    } catch (error) {
      console.error("Error fetching ReliefWeb jobs:", error);
    }
  }
  async fetchUNTalentJobs() {
    try {
      console.log("Fetching jobs from UN Talent...");
      const locationMap = {
        "Kenya": "kenya",
        "Somalia": "somalia",
        "Ethiopia": "ethiopia",
        "Uganda": "uganda",
        "Tanzania": "tanzania"
      };
      let totalNewJobs = 0;
      let totalSkippedJobs = 0;
      for (const [countryName, locationSlug] of Object.entries(locationMap)) {
        try {
          const url = `${UNTALENT_API_URL}?locationSlugs=${locationSlug}`;
          console.log(`Fetching ${countryName} jobs from UN Talent...`);
          const response = await fetch(url, {
            method: "GET",
            headers: {
              "Accept": "application/json",
              "User-Agent": "JobConnect-EastAfrica/1.0"
            }
          });
          if (!response.ok) {
            console.error(`UN Talent API error for ${countryName}: ${response.status} ${response.statusText}`);
            continue;
          }
          const data = await response.json();
          if (!data.data || data.data.length === 0) {
            console.log(`No jobs found for ${countryName} from UN Talent`);
            continue;
          }
          console.log(`UN Talent returned ${data.data.length} jobs for ${countryName}`);
          let newJobsCount = 0;
          let skippedJobsCount = 0;
          for (const unJob of data.data) {
            const externalId = `untalent-${unJob.slug}`;
            const existingJob = await storage.getJobByExternalId(externalId);
            if (existingJob) {
              skippedJobsCount++;
              console.log(`Skipping existing job: ${unJob.slug} - ${unJob.title}`);
              continue;
            }
            let location = unJob.location || countryName;
            if (location.toLowerCase().includes(countryName.toLowerCase())) {
              location = location;
            } else {
              location = `${location}, ${countryName}`;
            }
            const rawDescription = unJob.description || unJob.shortDescription || "";
            const description = rawDescription.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().substring(0, 800) || "No description available";
            const experienceMapping = {
              "Entry": "Entry level",
              "Mid": "Mid-level / 3-5 years",
              "Senior": "Senior level / 5-10 years",
              "Leadership": "Leadership / 10+ years",
              "Executive": "Executive level"
            };
            const experience = unJob.jobLevel ? experienceMapping[unJob.jobLevel] || unJob.jobLevel : null;
            const sectorMapping = {
              "human-resources": "Human Resources",
              "finance": "Finance",
              "logistics": "Logistics",
              "health": "Health",
              "education": "Education",
              "protection": "Protection",
              "wash": "WASH",
              "food-security": "Food Security",
              "it-telecom": "Information Technology"
            };
            const sector = unJob.areaSlugs && unJob.areaSlugs.length > 0 ? sectorMapping[unJob.areaSlugs[0]] || "General" : "General";
            const jobUrl = unJob.url || `https://untalent.org/jobs/${unJob.slug}`;
            const job = {
              title: unJob.title,
              organization: unJob.company || "UN Organization",
              location,
              country: countryName,
              description,
              url: jobUrl,
              datePosted: /* @__PURE__ */ new Date(),
              // UN Talent doesn't provide posted date in API
              deadline: unJob.expiresAt ? new Date(unJob.expiresAt) : null,
              sector,
              source: "untalent",
              externalId,
              howToApply: `Apply directly through UN Talent: ${jobUrl}`,
              experience,
              qualifications: null,
              responsibilities: null,
              bodyHtml: rawDescription || void 0,
              visibility: "public",
              type: "job"
            };
            await storage.createJob(job);
            newJobsCount++;
            console.log(`Created new job: ${unJob.slug} - ${unJob.title}`);
          }
          totalNewJobs += newJobsCount;
          totalSkippedJobs += skippedJobsCount;
          console.log(`Fetched ${data.data.length} jobs from UN Talent for ${countryName} - ${newJobsCount} new, ${skippedJobsCount} existing`);
        } catch (countryError) {
          console.error(`Error fetching UN Talent jobs for ${countryName}:`, countryError);
          continue;
        }
      }
      console.log(`UN Talent fetch completed - Total: ${totalNewJobs} new jobs, ${totalSkippedJobs} existing`);
    } catch (error) {
      console.error("Error fetching UN Talent jobs:", error);
    }
  }
  async fetchUNJobs() {
    try {
      console.log("Fetching jobs from UN Jobs RSS...");
      const response = await fetch(UNJOBS_RSS_URL);
      if (!response.ok) {
        throw new Error(`UN Jobs RSS error: ${response.status} ${response.statusText}`);
      }
      const xmlText = await response.text();
      const itemMatches = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
      for (const item of itemMatches) {
        const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
        const linkMatch = item.match(/<link>(.*?)<\/link>/);
        const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/);
        const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
        if (!titleMatch || !linkMatch) continue;
        const title = titleMatch[1];
        const url = linkMatch[1];
        const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, "").substring(0, 500) : "";
        const pubDate = pubDateMatch ? new Date(pubDateMatch[1]) : /* @__PURE__ */ new Date();
        const titleLower = title.toLowerCase();
        const descLower = description.toLowerCase();
        if (!titleLower.includes("kenya") && !titleLower.includes("somalia") && !descLower.includes("kenya") && !descLower.includes("somalia")) {
          continue;
        }
        let country = "Kenya";
        if (titleLower.includes("somalia") || descLower.includes("somalia")) {
          country = "Somalia";
        }
        const externalId = `unjobs-${Buffer.from(url).toString("base64").substring(0, 20)}`;
        const existingJob = await storage.getJobByExternalId(externalId);
        if (existingJob) continue;
        const job = {
          title,
          organization: "United Nations",
          location: country,
          country,
          description,
          url,
          datePosted: pubDate,
          deadline: null,
          sector: "General",
          source: "unjobs",
          externalId,
          visibility: "public",
          type: "job"
          // UN Jobs are always job opportunities, not tenders
        };
        await storage.createJob(job);
      }
      console.log("Finished fetching UN Jobs");
    } catch (error) {
      console.error("Error fetching UN Jobs:", error);
    }
  }
  async fetchUNGMTenders() {
    try {
      console.log("Fetching tenders from UNGM...");
      const countries2 = [
        { name: "Kenya", code: "KE" },
        { name: "Somalia", code: "SO" },
        { name: "Ethiopia", code: "ET" },
        { name: "Uganda", code: "UG" },
        { name: "Tanzania", code: "TZ" }
      ];
      let totalNewTenders = 0;
      let totalSkippedTenders = 0;
      for (const country of countries2) {
        try {
          const url = `https://www.ungm.org/Public/Notice`;
          console.log(`Fetching tenders for ${country.name} from UNGM...`);
          const response = await fetch(url, {
            method: "GET",
            headers: {
              "Accept": "text/html,application/xhtml+xml",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
          });
          if (!response.ok) {
            console.error(`UNGM error for ${country.name}: ${response.status} ${response.statusText}`);
            continue;
          }
          const html = await response.text();
          const tenderPattern = /<div[^>]*class="[^"]*notice[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
          const titlePattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/i;
          const datePattern = /(\d{1,2}[-\/]\w{3}[-\/]\d{4}|\d{4}[-\/]\d{2}[-\/]\d{2})/g;
          const orgPattern = /(UNDP|UNICEF|WHO|WFP|FAO|UNHCR|IOM|UNOPS|UNESCO|UNFPA|UN Women|UNEP)/gi;
          const noticeLinks = html.match(/\/Public\/Notice\/(\d+)/g) || [];
          const uniqueNoticeIds = [...new Set(noticeLinks.map((link) => link.match(/(\d+)$/)?.[1]).filter(Boolean))];
          console.log(`Found ${uniqueNoticeIds.length} potential tenders on UNGM`);
          for (const noticeId of uniqueNoticeIds.slice(0, 20)) {
            try {
              const noticeUrl = `https://www.ungm.org/Public/Notice/${noticeId}`;
              const noticeResponse = await fetch(noticeUrl, {
                headers: {
                  "Accept": "text/html",
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
              });
              if (!noticeResponse.ok) continue;
              const noticeHtml = await noticeResponse.text();
              const countryMentioned = countries2.some(
                (c) => noticeHtml.toLowerCase().includes(c.name.toLowerCase())
              );
              if (!countryMentioned) continue;
              const titleMatch = noticeHtml.match(/<h1[^>]*>([^<]+)<\/h1>/i) || noticeHtml.match(/<title>([^<]+)<\/title>/i);
              const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : `UNGM Tender ${noticeId}`;
              const orgMatch = noticeHtml.match(orgPattern);
              const organization = orgMatch ? orgMatch[0] : "United Nations";
              const deadlineMatch = noticeHtml.match(/deadline[:\s]*([^<\n]+)/i) || noticeHtml.match(/closing[:\s]*([^<\n]+)/i);
              let deadline = null;
              if (deadlineMatch) {
                const dateStr = deadlineMatch[1].match(datePattern);
                if (dateStr) {
                  deadline = new Date(dateStr[0]);
                  if (isNaN(deadline.getTime())) deadline = null;
                }
              }
              let tenderCountry = "Kenya";
              for (const c of countries2) {
                if (noticeHtml.toLowerCase().includes(c.name.toLowerCase())) {
                  tenderCountry = c.name;
                  break;
                }
              }
              const descMatch = noticeHtml.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
              const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().substring(0, 800) : `UN procurement opportunity for ${tenderCountry}`;
              const externalId = `ungm-${noticeId}`;
              const existingJob = await storage.getJobByExternalId(externalId);
              if (existingJob) {
                totalSkippedTenders++;
                continue;
              }
              const tender = {
                title: title.substring(0, 500),
                organization,
                location: tenderCountry,
                country: tenderCountry,
                description,
                url: noticeUrl,
                datePosted: /* @__PURE__ */ new Date(),
                deadline,
                sector: "Procurement",
                source: "ungm",
                externalId,
                howToApply: `Submit through UNGM: ${noticeUrl}`,
                experience: null,
                qualifications: null,
                responsibilities: null,
                bodyHtml: void 0,
                visibility: "public",
                type: "tender"
              };
              await storage.createJob(tender);
              totalNewTenders++;
              console.log(`Created new tender: ${noticeId} - ${title.substring(0, 60)}...`);
            } catch (noticeError) {
              console.error(`Error fetching UNGM notice ${noticeId}:`, noticeError);
              continue;
            }
          }
        } catch (countryError) {
          console.error(`Error fetching UNGM tenders for ${country.name}:`, countryError);
          continue;
        }
      }
      console.log(`UNGM fetch completed - Total: ${totalNewTenders} new tenders, ${totalSkippedTenders} existing`);
    } catch (error) {
      console.error("Error fetching UNGM tenders:", error);
    }
  }
  async fetchAllJobs() {
    if (this.isRunning) {
      console.log("Job fetch already in progress, skipping...");
      return;
    }
    this.isRunning = true;
    console.log("Fetching comprehensive jobs and tenders from all sources...");
    try {
      await this.fetchReliefWebJobs();
      await this.fetchUNTalentJobs();
      await this.fetchUNGMTenders();
      console.log("Job and tender fetch completed successfully");
    } catch (error) {
      console.error("Error in job fetch:", error);
    } finally {
      this.isRunning = false;
    }
  }
  startScheduler() {
    cron.schedule("0 8 * * *", () => {
      console.log("Starting morning scheduled job fetch (8 AM)...");
      this.fetchAllJobs();
      storage.archiveExpiredJobs();
    });
    cron.schedule("0 13 * * *", () => {
      console.log("Starting afternoon scheduled job fetch (1 PM)...");
      this.fetchAllJobs();
      storage.archiveExpiredJobs();
    });
    setTimeout(() => {
      this.fetchAllJobs();
      storage.archiveExpiredJobs();
    }, 5e3);
  }
};
var jobFetcher = new JobFetcher();

// server/seed.ts
import bcrypt from "bcryptjs";
async function seedDatabase() {
  console.log("Seeding database with sample jobs...");
  try {
    const adminEmail = "admin@somkenjobs.com";
    const initialAdminPassword = process.env.ADMIN_INITIAL_PASSWORD;
    if (!initialAdminPassword) {
      console.log("Initial admin setup skipped; ADMIN_INITIAL_PASSWORD is not set.");
    } else {
      const existingAdmin = await storage.getUserByEmail(adminEmail);
      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(initialAdminPassword, 10);
        const adminUser = {
          email: adminEmail,
          password: hashedPassword,
          firstName: "Admin",
          lastName: "User",
          companyName: "Somken Jobs East Africa",
          jobTitle: "Platform Administrator",
          phoneNumber: "+254700000000"
        };
        const createdAdmin = await storage.createUser(adminUser);
        await storage.updateUser(createdAdmin.id, {
          isApproved: true,
          isAdmin: true,
          approvedAt: /* @__PURE__ */ new Date(),
          approvedBy: "System"
        });
        console.log("Initial admin user created: admin@somkenjobs.com");
      }
    }
  } catch (error) {
    console.log("Admin user setup skipped (may already exist)");
  }
  const sampleJobs = [
    {
      type: "job",
      visibility: "public",
      title: "Humanitarian Program Officer",
      organization: "World Food Programme",
      location: "Nairobi",
      country: "Kenya",
      description: "Support humanitarian operations in Kenya, coordinating food assistance programs and working with local partners to ensure effective delivery of aid to vulnerable populations.",
      url: "https://careers.wfp.org/",
      datePosted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3),
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3),
      sector: "Food Security",
      source: "reliefweb",
      externalId: "sample-wfp-1"
    },
    {
      type: "job",
      visibility: "public",
      title: "Health Coordinator",
      organization: "Medecins Sans Frontieres",
      location: "Mogadishu",
      country: "Somalia",
      description: "Lead health interventions in Somalia, managing medical programs and ensuring quality healthcare delivery in challenging environments. Experience in emergency medicine required.",
      url: "https://www.msf.org/careers",
      datePosted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1e3),
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1e3),
      sector: "Health",
      source: "reliefweb",
      externalId: "sample-msf-1"
    },
    {
      type: "job",
      visibility: "public",
      title: "Education Specialist",
      organization: "UNICEF",
      location: "Kisumu",
      country: "Kenya",
      description: "Develop and implement education programs for children in crisis-affected areas. Focus on ensuring access to quality education and child protection services.",
      url: "https://www.unicef.org/careers/",
      datePosted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1e3),
      deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1e3),
      sector: "Education",
      source: "unjobs",
      externalId: "sample-unicef-1"
    },
    {
      type: "job",
      visibility: "public",
      title: "WASH Program Manager",
      organization: "Oxfam International",
      location: "Hargeisa",
      country: "Somalia",
      description: "Oversee water, sanitation and hygiene programs across Somalia. Manage implementation of WASH projects and coordinate with government and NGO partners.",
      url: "https://www.oxfam.org/en/jobs",
      datePosted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1e3),
      deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1e3),
      sector: "WASH",
      source: "reliefweb",
      externalId: "sample-oxfam-1"
    },
    {
      type: "job",
      visibility: "public",
      title: "Protection Officer",
      organization: "UNHCR",
      location: "Dadaab",
      country: "Kenya",
      description: "Provide protection services to refugees and asylum seekers. Conduct protection assessments, case management, and community-based protection activities.",
      url: "https://www.unhcr.org/jobs",
      datePosted: new Date(Date.now() - 4 * 24 * 60 * 60 * 1e3),
      deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1e3),
      sector: "Protection",
      source: "unjobs",
      externalId: "sample-unhcr-1"
    }
  ];
  for (const jobData of sampleJobs) {
    try {
      const existing = await storage.getJobByExternalId(jobData.externalId);
      if (!existing) {
        await storage.createJob(jobData);
        console.log(`Created job: ${jobData.title}`);
      }
    } catch (error) {
      console.error(`Error creating job ${jobData.title}:`, error);
    }
  }
  console.log("Database seeding completed");
}

// server/routes.ts
import { z as z2 } from "zod";
import bcrypt2 from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { fileURLToPath } from "url";
import multer from "multer";
import { parse as csvParse } from "csv-parse/sync";

// server/utils/sanitizeHtml.ts
import sanitizeHtml from "sanitize-html";
var allowedTags = [
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h2",
  "h3",
  "h4",
  "li",
  "ol",
  "p",
  "pre",
  "span",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul"
];
var allowedAttributes = {
  a: ["href", "name", "target", "rel"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan"]
};
var allowedSchemes = ["http", "https", "mailto", "tel"];
function sanitizeRichHtml(html) {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes,
    allowedSchemes,
    allowedSchemesByTag: {
      a: allowedSchemes
    },
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: {
          ...attribs,
          rel: "noopener noreferrer",
          target: attribs.target === "_self" ? "_self" : "_blank"
        }
      })
    },
    disallowedTagsMode: "discard",
    enforceHtmlBoundary: true
  }).trim();
}
function sanitizeJobContentFields(jobData) {
  const sanitized = { ...jobData };
  const richTextFields = ["description", "bodyHtml", "howToApply", "qualifications", "responsibilities"];
  for (const field of richTextFields) {
    if (typeof sanitized[field] === "string") {
      sanitized[field] = sanitizeRichHtml(sanitized[field]);
    }
  }
  return sanitized;
}

// shared/seoUtils.ts
function stripMarkdown(text2) {
  if (!text2) return "";
  return text2.replace(/<[^>]*>/g, "").replace(/#{1,6}\s*/g, "").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/__([^_]+)__/g, "$1").replace(/_([^_]+)_/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/```[\s\S]*?```/g, "").replace(/`([^`]+)`/g, "$1").replace(/^\s*[-*+]\s+/gm, "").replace(/^\s*\d+\.\s+/gm, "").replace(/^\s*>/gm, "").replace(/&[^;]+;/g, "").replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
}
function smartTruncate(text2, maxLength, suffix = "") {
  if (!text2) return "";
  const cleanText = text2.trim().replace(/\s+/g, " ");
  if (cleanText.length <= maxLength) {
    return cleanText;
  }
  const cutoff = maxLength - suffix.length;
  const prevSpace = cleanText.lastIndexOf(" ", cutoff);
  const nextSpace = cleanText.indexOf(" ", cutoff);
  let bestCutPoint = cutoff;
  if (prevSpace !== -1 && cutoff - prevSpace <= 10) {
    bestCutPoint = prevSpace;
  } else if (nextSpace !== -1 && nextSpace - cutoff <= 10) {
    if (nextSpace < maxLength - suffix.length) {
      bestCutPoint = nextSpace;
    } else {
      bestCutPoint = prevSpace !== -1 ? prevSpace : cutoff;
    }
  } else if (prevSpace !== -1) {
    bestCutPoint = prevSpace;
  }
  const truncated = cleanText.substring(0, bestCutPoint).trim();
  if (truncated.length < maxLength * 0.5 && prevSpace === -1 && nextSpace !== -1) {
    const nextSpaceTruncated = cleanText.substring(0, Math.min(nextSpace, maxLength - suffix.length)).trim();
    if (nextSpaceTruncated.length > truncated.length) {
      const finalTruncated = nextSpaceTruncated;
      if (suffix && finalTruncated.match(/[.,;:!?-]$/)) {
        return finalTruncated.replace(/[.,;:!?-]+$/, "") + suffix;
      }
      return finalTruncated + suffix;
    }
  }
  if (suffix && truncated.match(/[.,;:!?-]$/)) {
    return truncated.replace(/[.,;:!?-]+$/, "") + suffix;
  }
  return truncated + suffix;
}
function generateOptimizedTitle(primaryTitle, context = {}, options = {}) {
  const {
    maxTitleLength = 60,
    includeBrand = true
  } = options;
  const brand = "Somken Jobs";
  const { location, country, organization, sector, jobCount, pageType } = context;
  let title = "";
  switch (pageType) {
    case "homepage":
      if (jobCount) {
        title = `East Africa Jobs - ${jobCount}+ Humanitarian Opportunities | ${brand}`;
      } else {
        title = `East Africa Jobs - Humanitarian Careers | ${brand}`;
      }
      break;
    case "jobs":
      if (location && country) {
        title = `Jobs in ${location}, ${country}`;
        if (jobCount) title += ` - ${jobCount}+ Positions`;
        title += ` | ${brand}`;
      } else if (country) {
        title = `Jobs in ${country}`;
        if (jobCount) title += ` - ${jobCount}+ Positions`;
        title += ` | ${brand}`;
      } else {
        title = jobCount ? `${jobCount}+ Jobs` : "Jobs";
        title += ` | ${brand}`;
      }
      break;
    case "job-detail":
      if (organization) {
        title = `${primaryTitle} - ${organization} | ${brand}`;
      } else {
        title = `${primaryTitle} | ${brand}`;
      }
      break;
    case "search":
      title = `${primaryTitle} | ${brand}`;
      break;
    default:
      title = includeBrand ? `${primaryTitle} | ${brand}` : primaryTitle;
  }
  return smartTruncate(title, maxTitleLength);
}
function generateOptimizedDescription(primaryContent, context = {}, options = {}) {
  const {
    maxDescriptionLength = 160
  } = options;
  const { location, country, organization, sector, jobCount, deadline, pageType, jobStats } = context;
  let description = "";
  switch (pageType) {
    case "homepage":
      if (jobStats) {
        description = `Find ${jobStats.totalJobs}+ humanitarian jobs in East Africa. Leading NGO and UN positions in Kenya, Somalia, Ethiopia. Updated daily from ReliefWeb with ${jobStats.organizations}+ employers.`;
      } else {
        description = `Discover humanitarian jobs across East Africa. Find NGO careers, UN positions, and development opportunities in Kenya, Somalia, Ethiopia, Uganda & Tanzania.`;
      }
      break;
    case "jobs":
      if (location && country) {
        description = `Browse ${jobCount || "current"} job opportunities in ${location}, ${country}. Find humanitarian careers with leading NGOs and UN agencies. Apply today.`;
      } else if (country) {
        description = `Find ${jobCount || "humanitarian"} jobs in ${country}. Current openings with NGOs, UN agencies, and development organizations. Updated daily.`;
      } else {
        description = `Browse ${jobCount || "thousands of"} humanitarian jobs across East Africa. NGO careers, UN positions, aid work opportunities. Apply now.`;
      }
      break;
    case "job-detail":
      if (organization && location && country) {
        let desc2 = `${stripMarkdown(primaryContent).substring(0, 80)}... Join ${organization} in ${location}, ${country}.`;
        if (sector) desc2 += ` ${sector} sector position.`;
        if (deadline) {
          const deadlineDate = new Date(deadline);
          if (!isNaN(deadlineDate.getTime())) {
            const daysLeft = Math.ceil((deadlineDate.getTime() - Date.now()) / (1e3 * 60 * 60 * 24));
            if (daysLeft > 0) desc2 += ` ${daysLeft} days to apply.`;
          }
        }
        desc2 += " Apply now on Somken Jobs.";
        description = desc2;
      } else {
        description = smartTruncate(stripMarkdown(primaryContent), maxDescriptionLength - 20) + " Apply now.";
      }
      break;
    default:
      description = primaryContent.replace(/<[^>]*>/g, "");
  }
  return smartTruncate(description, maxDescriptionLength);
}
function generateJobSEOMetadata(job) {
  const title = generateOptimizedTitle(
    job.title,
    {
      organization: job.organization,
      location: job.location,
      country: job.country,
      sector: job.sector || void 0,
      pageType: "job-detail"
    }
  );
  const description = generateOptimizedDescription(
    job.description || "Join this humanitarian organization in their mission to make a difference.",
    {
      organization: job.organization,
      location: job.location,
      country: job.country,
      sector: job.sector || void 0,
      deadline: job.deadline || void 0,
      pageType: "job-detail"
    }
  );
  const keywords = [
    job.title,
    job.organization,
    `jobs in ${job.country}`,
    `${job.location} jobs`,
    "humanitarian jobs",
    job.sector ? `${job.sector} careers` : "NGO careers"
  ].filter(Boolean).join(", ");
  return { title, description, keywords };
}
function generateHomepageSEOMetadata(jobStats) {
  const title = generateOptimizedTitle(
    "East Africa Humanitarian Jobs",
    {
      jobCount: jobStats?.totalJobs,
      pageType: "homepage"
    }
  );
  const description = generateOptimizedDescription(
    "Leading platform for humanitarian careers",
    {
      jobStats,
      pageType: "homepage"
    }
  );
  const keywords = "East Africa jobs, humanitarian careers, NGO jobs, UN positions, Kenya jobs, Somalia jobs, Ethiopia jobs, development careers, ReliefWeb jobs";
  return { title, description, keywords };
}
function generateJobsListingSEOMetadata(totalCount, filters = {}) {
  let titleContext = "";
  if (filters.location && filters.country) {
    titleContext = `${filters.location}, ${filters.country}`;
  } else if (filters.country) {
    titleContext = filters.country;
  } else if (filters.sector) {
    titleContext = `${filters.sector} Sector`;
  }
  const titlePrefix = titleContext ? `${titleContext} Jobs` : "Humanitarian Jobs";
  const title = generateOptimizedTitle(
    titlePrefix,
    {
      location: filters.location,
      country: filters.country,
      sector: filters.sector,
      jobCount: totalCount,
      pageType: "jobs"
    }
  );
  const description = generateOptimizedDescription(
    "Browse current job opportunities",
    {
      location: filters.location,
      country: filters.country,
      sector: filters.sector,
      jobCount: totalCount,
      pageType: "jobs"
    }
  );
  const keywordParts = ["humanitarian jobs", "NGO careers"];
  if (filters.country) keywordParts.push(`jobs in ${filters.country}`);
  if (filters.location) keywordParts.push(`${filters.location} jobs`);
  if (filters.sector) keywordParts.push(`${filters.sector} careers`);
  keywordParts.push("East Africa jobs", "development careers");
  const keywords = keywordParts.join(", ");
  return { title, description, keywords };
}

// server/utils/ssrUtils.ts
validateContextMaps();
function isBotUserAgent(userAgent) {
  if (!userAgent) return false;
  const botPatterns = [
    "googlebot",
    "bingbot",
    "slurp",
    "duckduckbot",
    "baiduspider",
    "yandexbot",
    "facebookexternalhit",
    "twitterbot",
    "rogerbot",
    "linkedinbot",
    "embedly",
    "quora link preview",
    "showyoubot",
    "outbrain",
    "pinterest/0.",
    "developers.google.com/+/web/snippet",
    "slackbot",
    "vkshare",
    "w3c_validator",
    "redditbot",
    "applebot",
    "whatsapp",
    "flipboard",
    "tumblr",
    "bitlybot",
    "skypeuripreview",
    "nuzzel",
    "discordbot",
    "google page speed",
    "qwantify",
    "telegrambot",
    "lighthouse"
  ];
  const lowerUserAgent = userAgent.toLowerCase();
  return botPatterns.some((pattern) => lowerUserAgent.includes(pattern));
}
function stripMarkdownAndHtml(text2, maxLength = 160) {
  if (!text2) return "";
  let cleaned = text2.replace(/<[^>]*>/g, "").replace(/#{1,6}\s*/g, "").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/__([^_]+)__/g, "$1").replace(/_([^_]+)_/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/```[\s\S]*?```/g, "").replace(/`([^`]+)`/g, "$1").replace(/^\s*[-*+]\s+/gm, "").replace(/^\s*\d+\.\s+/gm, "").replace(/^\s*>/gm, "").replace(/\n+/g, " ").replace(/\s+/g, " ").replace(/&[^;]+;/g, "").trim();
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
    const lastSpace = cleaned.lastIndexOf(" ");
    if (lastSpace > maxLength - 30) {
      cleaned = cleaned.substring(0, lastSpace);
    }
    cleaned = cleaned.trim() + "...";
  }
  return cleaned;
}
function escapeHtml(text2) {
  return String(text2 || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function safeUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return ["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol) ? parsed.toString() : "";
  } catch {
    return "";
  }
}
function generateJobStructuredData(job) {
  const cleanDescription = job.description ? stripMarkdownAndHtml(job.description, 5e3) : `Join ${job.organization || "our humanitarian organization"} in their mission to provide humanitarian aid in ${job.location || "the field"}, ${job.country || "East Africa"}. This position offers the opportunity to make a meaningful impact in humanitarian work.`;
  const jobStructuredData = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": job.title.substring(0, 100),
    "description": cleanDescription,
    "datePosted": new Date(job.datePosted).toISOString().split("T")[0],
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.organization || "Humanitarian Organization"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.location || "Field Location",
        "addressCountry": job.country === "Kenya" ? "KE" : job.country === "Somalia" ? "SO" : job.country
      }
    },
    "url": `https://somkenjobs.com/jobs/${generateJobSlug(job.title, job.id)}`
  };
  if (job.deadline) {
    const deadlineDate = new Date(job.deadline);
    if (deadlineDate > /* @__PURE__ */ new Date()) {
      jobStructuredData.validThrough = deadlineDate.toISOString().split("T")[0];
    }
  }
  const title = job.title.toLowerCase();
  if (title.includes("consultant") || title.includes("contract")) {
    jobStructuredData.employmentType = "CONTRACTOR";
  } else if (title.includes("part-time")) {
    jobStructuredData.employmentType = "PART_TIME";
  } else if (title.includes("intern")) {
    jobStructuredData.employmentType = "INTERN";
  } else {
    jobStructuredData.employmentType = "FULL_TIME";
  }
  if (job.sector) {
    jobStructuredData.industry = job.sector;
    jobStructuredData.occupationalCategory = job.sector;
  }
  return JSON.stringify(jobStructuredData, null, 2);
}
function validateContextMaps() {
  const checkForInjection = (mapName, map) => {
    for (const [key, value] of Object.entries(map)) {
      if (typeof value !== "string") {
        throw new Error(`Context validation failed: ${mapName}[${key}] is not a string`);
      }
      if (value.includes("${") || value.includes("<h") || value.includes("</")) {
        throw new Error(`Context validation failed: ${mapName}[${key}] contains HTML or template injection: ${value.substring(0, 100)}...`);
      }
    }
  };
  const countryContexts = {
    "Somalia": "Somalia offers unique opportunities for humanitarian professionals to contribute to post-conflict recovery and stabilization efforts. Based in dynamic locations like Mogadishu, Hargeisa, Kismayo, and Baidoa, professionals work on critical programs addressing food security, protection, health, and infrastructure development. The operational environment provides exceptional experience in conflict-sensitive programming, community resilience building, and emergency response coordination. Working in Somalia enables professionals to engage directly with complex humanitarian challenges while contributing to sustainable peace-building and development initiatives that support vulnerable populations and strengthen local capacities.",
    "Kenya": "Kenya serves as East Africa's humanitarian hub, with Nairobi hosting regional headquarters for numerous international organizations. The country offers diverse operational contexts from urban programming in Nairobi and Mombasa to field-based work in northern counties like Turkana, Garissa, and Mandera. Professionals benefit from excellent career development opportunities, extensive networking possibilities, and access to regional coordination mechanisms. Kenya's strategic position makes it an ideal location for humanitarian professionals seeking comprehensive experience in both emergency response and long-term development programming, with opportunities to work across diverse ecological and cultural contexts.",
    "Ethiopia": "Ethiopia presents vast opportunities for development and humanitarian professionals working across diverse contexts including refugee response, drought resilience, health systems strengthening, and food security programming. Based in locations like Addis Ababa, Gambella, Assosa, and Shire, professionals engage with complex emergency responses while contributing to long-term development initiatives. The country hosts one of Africa's largest refugee populations and offers extensive experience in camp management, protection services, and durable solutions programming. Working in Ethiopia provides exposure to innovative programming approaches and the opportunity to contribute to transformative development initiatives across diverse geographic and cultural contexts.",
    "Uganda": "Uganda offers meaningful opportunities in refugee response, health programming, and development initiatives. With major operations in Kampala, Gulu, Arua, and refugee settlement areas, professionals work on innovative approaches to protection, education, livelihood support, and community-based programming that serves both refugee and host community populations. Uganda's progressive refugee policies create a unique operational environment where humanitarian professionals can engage in cutting-edge approaches to refugee integration, self-reliance programming, and community-based protection initiatives that serve as models for the region.",
    "Tanzania": "Tanzania provides opportunities in development programming, refugee support, and health initiatives. Professionals work in diverse contexts from Dar es Salaam's urban programs to rural development initiatives and refugee camp operations in western regions, contributing to sustainable development and humanitarian response efforts. The country's stable political environment and commitment to regional cooperation create excellent conditions for long-term development programming and innovative approaches to humanitarian assistance that emphasize sustainability and local ownership.",
    "default": "This country offers diverse opportunities for humanitarian and development professionals working across various sectors and operational contexts throughout the region. The unique geographic and political position within East Africa provides humanitarian professionals with meaningful opportunities to contribute to both emergency response and long-term development programming that addresses critical needs and builds sustainable solutions for vulnerable populations."
  };
  const sectorContexts = {
    "Health": "The health sector across East Africa presents critical opportunities for medical professionals, public health specialists, epidemiologists, and healthcare program managers to address ongoing challenges including infectious disease control, maternal and child health, nutrition programming, and health system strengthening initiatives. Health professionals in the region work on comprehensive approaches to disease prevention, health service delivery, and health system capacity building that addresses both immediate health needs and long-term sustainability goals.",
    "Education": "Education programming offers opportunities to contribute to learning access, quality improvement, teacher training, curriculum development, and emergency education response across diverse contexts including refugee settings, conflict-affected areas, and development programming. Education professionals work on innovative approaches to accelerated learning, teacher professional development, and education system strengthening that addresses the complex challenges of providing quality education in humanitarian and development contexts.",
    "Protection": "Protection work focuses on safeguarding vulnerable populations including refugees, internally displaced persons, children, women, and at-risk communities through direct services, capacity building, advocacy, and systems strengthening approaches. Protection professionals engage in comprehensive programming that addresses both immediate protection risks and long-term prevention strategies, working to strengthen community-based protection mechanisms and government capacity to protect vulnerable populations.",
    "WASH": "Water, Sanitation, and Hygiene programming addresses critical infrastructure needs, behavior change promotion, emergency response, and sustainable development approaches to ensure access to safe water and sanitation facilities. WASH professionals work on comprehensive approaches that combine infrastructure development with community engagement, behavior change promotion, and institutional capacity building to ensure sustainable access to water and sanitation services.",
    "Food Security": "Food security and livelihoods programming encompasses emergency food assistance, agriculture development, market systems approaches, nutrition programming, and resilience building initiatives designed to address both immediate needs and long-term sustainability. Food security professionals work on comprehensive programming that addresses the complex causes of food insecurity while building community resilience and supporting sustainable livelihood development.",
    "Emergency Response": "Emergency response roles involve rapid assessment, program design and implementation, coordination with government and humanitarian partners, resource mobilization, and ensuring effective humanitarian assistance reaches affected populations. Emergency response professionals engage in comprehensive approaches to crisis response that address immediate life-saving needs while laying the foundation for early recovery and resilience building initiatives. These positions require strong analytical skills, cultural sensitivity, and the ability to make critical decisions under pressure while maintaining adherence to humanitarian principles and standards.",
    "default": "This sector offers diverse opportunities to contribute to humanitarian and development programming across East Africa, working with vulnerable populations and communities to address critical needs and build sustainable solutions. Professionals in this field engage in comprehensive programming approaches that address both immediate humanitarian needs and long-term development goals, contributing to meaningful change in communities across the region."
  };
  checkForInjection("countryContexts", countryContexts);
  checkForInjection("sectorContexts", sectorContexts);
}
var COUNTRY_CONTEXTS = Object.freeze({
  "Somalia": "Somalia offers unique opportunities for humanitarian professionals to contribute to post-conflict recovery and stabilization efforts. Based in dynamic locations like Mogadishu, Hargeisa, Kismayo, and Baidoa, professionals work on critical programs addressing food security, protection, health, and infrastructure development. The operational environment provides exceptional experience in conflict-sensitive programming, community resilience building, and emergency response coordination. Working in Somalia enables professionals to engage directly with complex humanitarian challenges while contributing to sustainable peace-building and development initiatives that support vulnerable populations and strengthen local capacities.",
  "Kenya": "Kenya serves as East Africa's humanitarian hub, with Nairobi hosting regional headquarters for numerous international organizations. The country offers diverse operational contexts from urban programming in Nairobi and Mombasa to field-based work in northern counties like Turkana, Garissa, and Mandera. Professionals benefit from excellent career development opportunities, extensive networking possibilities, and access to regional coordination mechanisms. Kenya's strategic position makes it an ideal location for humanitarian professionals seeking comprehensive experience in both emergency response and long-term development programming, with opportunities to work across diverse ecological and cultural contexts.",
  "Ethiopia": "Ethiopia presents vast opportunities for development and humanitarian professionals working across diverse contexts including refugee response, drought resilience, health systems strengthening, and food security programming. Based in locations like Addis Ababa, Gambella, Assosa, and Shire, professionals engage with complex emergency responses while contributing to long-term development initiatives. The country hosts one of Africa's largest refugee populations and offers extensive experience in camp management, protection services, and durable solutions programming. Working in Ethiopia provides exposure to innovative programming approaches and the opportunity to contribute to transformative development initiatives across diverse geographic and cultural contexts.",
  "Uganda": "Uganda offers meaningful opportunities in refugee response, health programming, and development initiatives. With major operations in Kampala, Gulu, Arua, and refugee settlement areas, professionals work on innovative approaches to protection, education, livelihood support, and community-based programming that serves both refugee and host community populations. Uganda's progressive refugee policies create a unique operational environment where humanitarian professionals can engage in cutting-edge approaches to refugee integration, self-reliance programming, and community-based protection initiatives that serve as models for the region.",
  "Tanzania": "Tanzania provides opportunities in development programming, refugee support, and health initiatives. Professionals work in diverse contexts from Dar es Salaam's urban programs to rural development initiatives and refugee camp operations in western regions, contributing to sustainable development and humanitarian response efforts. The country's stable political environment and commitment to regional cooperation create excellent conditions for long-term development programming and innovative approaches to humanitarian assistance that emphasize sustainability and local ownership.",
  "default": "This country offers diverse opportunities for humanitarian and development professionals working across various sectors and operational contexts throughout the region. The unique geographic and political position within East Africa provides humanitarian professionals with meaningful opportunities to contribute to both emergency response and long-term development programming that addresses critical needs and builds sustainable solutions for vulnerable populations."
});
var SECTOR_CONTEXTS = Object.freeze({
  "Health": "The health sector across East Africa presents critical opportunities for medical professionals, public health specialists, epidemiologists, and healthcare program managers to address ongoing challenges including infectious disease control, maternal and child health, nutrition programming, and health system strengthening initiatives. Health professionals in the region work on comprehensive approaches to disease prevention, health service delivery, and health system capacity building that addresses both immediate health needs and long-term sustainability goals.",
  "Education": "Education programming offers opportunities to contribute to learning access, quality improvement, teacher training, curriculum development, and emergency education response across diverse contexts including refugee settings, conflict-affected areas, and development programming. Education professionals work on innovative approaches to accelerated learning, teacher professional development, and education system strengthening that addresses the complex challenges of providing quality education in humanitarian and development contexts.",
  "Protection": "Protection work focuses on safeguarding vulnerable populations including refugees, internally displaced persons, children, women, and at-risk communities through direct services, capacity building, advocacy, and systems strengthening approaches. Protection professionals engage in comprehensive programming that addresses both immediate protection risks and long-term prevention strategies, working to strengthen community-based protection mechanisms and government capacity to protect vulnerable populations.",
  "WASH": "Water, Sanitation, and Hygiene programming addresses critical infrastructure needs, behavior change promotion, emergency response, and sustainable development approaches to ensure access to safe water and sanitation facilities. WASH professionals work on comprehensive approaches that combine infrastructure development with community engagement, behavior change promotion, and institutional capacity building to ensure sustainable access to water and sanitation services.",
  "Food Security": "Food security and livelihoods programming encompasses emergency food assistance, agriculture development, market systems approaches, nutrition programming, and resilience building initiatives designed to address both immediate needs and long-term sustainability. Food security professionals work on comprehensive programming that addresses the complex causes of food insecurity while building community resilience and supporting sustainable livelihood development.",
  "Emergency Response": "Emergency response roles involve rapid assessment, program design and implementation, coordination with government and humanitarian partners, resource mobilization, and ensuring effective humanitarian assistance reaches affected populations. Emergency response professionals engage in comprehensive approaches to crisis response that address immediate life-saving needs while laying the foundation for early recovery and resilience building initiatives. These positions require strong analytical skills, cultural sensitivity, and the ability to make critical decisions under pressure while maintaining adherence to humanitarian principles and standards.",
  "default": "This sector offers diverse opportunities to contribute to humanitarian and development programming across East Africa, working with vulnerable populations and communities to address critical needs and build sustainable solutions. Professionals in this field engage in comprehensive programming approaches that address both immediate humanitarian needs and long-term development goals, contributing to meaningful change in communities across the region."
});
function getCountryContext(country) {
  return COUNTRY_CONTEXTS[country] || COUNTRY_CONTEXTS.default;
}
function getSectorContext(sector) {
  return SECTOR_CONTEXTS[sector] || SECTOR_CONTEXTS.default;
}
function checkForOrphanedFragments(htmlContent) {
  const lines = htmlContent.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.endsWith("</p>") && !line.includes("<p>")) {
      if (line.length > 20 && !line.startsWith("</p>") && !line.includes("${")) {
        console.error(`\u26A0\uFE0F Potential orphaned fragment detected at line ${i + 1}: ${line}`);
        throw new Error(`SSR HTML validation failed: Orphaned fragment detected: "${line.substring(0, 50)}..."`);
      }
    }
    if (line.includes("manitarian landscape.</p>") && !line.includes("<p>")) {
      console.error(`\u26A0\uFE0F Specific orphaned fragment found at line ${i + 1}: ${line}`);
      throw new Error('SSR HTML validation failed: Found orphaned "manitarian landscape.</p>" fragment');
    }
  }
}
function validateHTMLStructure(htmlContent) {
  const h1Match = htmlContent.match(/<h1[^>]*>/g);
  const h2Match = htmlContent.match(/<h2[^>]*>/g);
  const h3Match = htmlContent.match(/<h3[^>]*>/g);
  if (!h1Match || h1Match.length === 0) {
    throw new Error("SSR HTML validation failed: No H1 heading found");
  }
  if (!h2Match || h2Match.length === 0) {
    throw new Error("SSR HTML validation failed: No H2 headings found");
  }
  if (!h3Match || h3Match.length === 0) {
    throw new Error("SSR HTML validation failed: No H3 headings found");
  }
  console.log(`\u2705 HTML structure validated: ${h1Match.length} H1, ${h2Match.length} H2, ${h3Match.length} H3 headings`);
}
function assertMinWordCount(htmlContent, minWords) {
  const textContent = htmlContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = textContent.split(" ").filter((word) => word.length > 0).length;
  if (wordCount < minWords) {
    throw new Error(`SSR HTML validation failed: Word count ${wordCount} below minimum ${minWords}`);
  }
  console.log(`\u2705 Word count validation passed: ${wordCount} words (minimum: ${minWords})`);
}
function applySanitychecks(htmlContent, pageName) {
  console.log(`\u{1F50D} Applying sanity checks for ${pageName} SSR HTML`);
  try {
    checkForOrphanedFragments(htmlContent);
    validateHTMLStructure(htmlContent);
    assertMinWordCount(htmlContent, 250);
    console.log(`\u2705 ${pageName} SSR HTML passed all sanity checks`);
  } catch (error) {
    console.error(`\u274C ${pageName} SSR HTML failed sanity checks:`, error instanceof Error ? error.message : error);
    throw error;
  }
  return htmlContent;
}
var HOMEPAGE_SECTIONS = Object.freeze({
  hero: {
    title: (stats) => `East Africa Jobs - ${stats.totalJobs}+ Humanitarian Career Opportunities`,
    description: (stats) => `Find jobs across Kenya, Somalia, Ethiopia, Uganda, and Tanzania with leading NGOs, UN agencies, and humanitarian organizations. Browse ${stats.totalJobs} current opportunities updated daily from ReliefWeb.`
  },
  latestJobs: {
    title: "Latest Job Opportunities",
    paragraphs: [
      "Discover the newest humanitarian and development career opportunities across East Africa. Our platform aggregates positions from top international organizations, NGOs, and UN agencies, providing you with comprehensive access to meaningful career opportunities that make a difference. These carefully curated positions represent the most current openings in the humanitarian sector, updated twice daily to ensure you have access to the latest opportunities."
    ]
  },
  leadingSector: {
    title: "Leading Job Board for East Africa's Humanitarian Sector",
    paragraphs: [
      "Somken Jobs has established itself as the premier destination for humanitarian and development professionals seeking meaningful career opportunities across East Africa. Our platform specializes in connecting talented individuals with organizations that are making a tangible difference in communities throughout Kenya, Somalia, Ethiopia, Uganda, and Tanzania. We understand the unique challenges and rewards of humanitarian work, and our platform is designed specifically to serve the needs of this dedicated professional community."
    ],
    subsections: {
      coverage: {
        title: "Comprehensive Job Coverage Across Multiple Sectors",
        paragraphs: (stats) => [`With over ${stats.totalJobs} active job listings from ${stats.organizations} leading humanitarian organizations, we offer the most comprehensive collection of opportunities in East Africa. Our listings span all major humanitarian sectors including Health, Education, Protection, WASH (Water, Sanitation & Hygiene), Food Security, Emergency Response, Logistics, and Program Coordination. Whether you're a medical professional looking to work with M\xE9decins Sans Fronti\xE8res, an education specialist seeking opportunities with UNICEF, or a protection officer interested in positions with UNHCR, you'll find relevant opportunities on our platform.`]
      },
      locations: {
        title: "Strategic Locations and Career Advancement",
        paragraphs: [
          "Our platform features opportunities in major humanitarian hubs including Nairobi, Mogadishu, Hargeisa, Kismayo, Mombasa, Kisumu, Eldoret, Addis Ababa, Kampala, and Dar es Salaam. These locations serve as critical centers for humanitarian operations, offering professionals the chance to work at the heart of international development efforts. From field-based positions that provide direct community impact to coordination roles that shape regional humanitarian strategy, our listings cover the full spectrum of career levels and specializations."
        ]
      },
      trusted: {
        title: "Trusted by Humanitarian Professionals Worldwide",
        paragraphs: [
          "Whether you're an experienced humanitarian worker looking for your next challenge or a professional seeking to enter the humanitarian sector, Somken Jobs provides the resources and opportunities you need to advance your career. Our platform not only lists current opportunities but also provides valuable insights into application processes, salary expectations, and career development pathways within the humanitarian sector. Join thousands of professionals who trust Somken Jobs for their career advancement in East Africa's dynamic humanitarian landscape."
        ]
      },
      updates: {
        title: "Real-Time Updates from Trusted Sources",
        paragraphs: [
          "Our listings are updated twice daily from trusted sources like ReliefWeb, ensuring you never miss new opportunities in the humanitarian sector. We maintain direct relationships with major employers including WHO, UNHCR, Save the Children, World Food Programme, International Rescue Committee, and dozens of other leading international organizations. This commitment to real-time accuracy means you can rely on our platform to provide the most current and legitimate opportunities in the humanitarian field.",
          "Somken Jobs updates listings multiple times daily from ReliefWeb and verified sources, with deduplication and normalization for fast, reliable discovery across countries and sectors. Our automated verification processes ensure that expired positions are removed promptly while new opportunities are added as soon as they become available, maintaining the highest standard of data quality for humanitarian professionals.",
          "Join thousands of professionals who rely on our platform for their career advancement in East Africa's dynamic humanitarian landscape. Whether you're seeking field-based positions, coordination roles, or specialized technical positions, our comprehensive job board connects you with meaningful opportunities that align with your skills and career aspirations in the humanitarian sector."
        ]
      }
    }
  }
});
function renderParagraph(text2) {
  return `<p>${text2}</p>`;
}
function renderSection(title, paragraphs, level = "h2") {
  const titleTag = level === "h2" ? "h2" : "h3";
  const paragraphsHtml = paragraphs.map((p) => renderParagraph(p)).join("\n      ");
  return `<${titleTag}>${title}</${titleTag}>
      ${paragraphsHtml}`;
}
function renderSubsection(title, paragraphs) {
  return renderSection(title, paragraphs, "h3");
}
function generateHomepageHTML(jobStats, recentJobs) {
  const seoMetadata = generateHomepageSEOMetadata(jobStats);
  const jobListings = recentJobs.slice(0, 8).map((job) => `
    <div class="job-listing" style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
        <a href="/jobs/${generateJobSlug(job.title, job.id)}" style="color: #0077B5; text-decoration: none;">
          ${job.title}
        </a>
      </h3>
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
        ${job.organization} \u2022 ${job.location}, ${job.country}${job.sector ? ` \u2022 ${job.sector}` : ""}
      </p>
      <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.5;">
        ${job.description.replace(/<[^>]*>/g, "").substring(0, 150)}...
      </p>
    </div>
  `).join("");
  const heroTitle = HOMEPAGE_SECTIONS.hero.title(jobStats);
  const heroDescription = HOMEPAGE_SECTIONS.hero.description(jobStats);
  const latestJobsSection = `
    <section>
      ${renderSection(HOMEPAGE_SECTIONS.latestJobs.title, HOMEPAGE_SECTIONS.latestJobs.paragraphs)}
      
      ${jobListings}
      
      ${renderParagraph('<a href="/jobs" style="color: #0077B5; text-decoration: none; font-weight: 600;">View All Jobs \u2192</a>')}
    </section>`;
  const leadingSectorSection = `
    <section style="margin-top: 40px;">
      ${renderSection(HOMEPAGE_SECTIONS.leadingSector.title, HOMEPAGE_SECTIONS.leadingSector.paragraphs)}
      
      ${renderSubsection(HOMEPAGE_SECTIONS.leadingSector.subsections.coverage.title, HOMEPAGE_SECTIONS.leadingSector.subsections.coverage.paragraphs(jobStats))}

      ${renderSubsection(HOMEPAGE_SECTIONS.leadingSector.subsections.locations.title, HOMEPAGE_SECTIONS.leadingSector.subsections.locations.paragraphs)}

      ${renderSubsection(HOMEPAGE_SECTIONS.leadingSector.subsections.trusted.title, HOMEPAGE_SECTIONS.leadingSector.subsections.trusted.paragraphs)}

      ${renderSubsection(HOMEPAGE_SECTIONS.leadingSector.subsections.updates.title, HOMEPAGE_SECTIONS.leadingSector.subsections.updates.paragraphs)}
    </section>`;
  const generatedHTML = `
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${seoMetadata.title}</title>
  <meta name="description" content="${seoMetadata.description}">
  <meta name="keywords" content="${seoMetadata.keywords}">
  <link rel="canonical" href="https://somkenjobs.com/">
  
  <!-- Open Graph Tags -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://somkenjobs.com/">
  <meta property="og:title" content="${seoMetadata.title}">
  <meta property="og:description" content="${seoMetadata.description}">
  <meta property="og:site_name" content="Somken Jobs">
  
  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@SomkenJobs">
  <meta name="twitter:title" content="${seoMetadata.title}">
  <meta name="twitter:description" content="${seoMetadata.description}">
  
  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Somken Jobs",
    "url": "https://somkenjobs.com/",
    "description": "Leading job board for humanitarian careers across East Africa. Find NGO jobs, UN positions, and development opportunities in Kenya, Somalia, Ethiopia, Uganda, and Tanzania.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://somkenjobs.com/?search={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Somken Jobs",
      "description": "Connecting humanitarian professionals with career opportunities across Kenya, Somalia, Ethiopia, Uganda, and Tanzania"
    },
    "areaServed": [
      {"@type": "Country", "name": "Kenya"},
      {"@type": "Country", "name": "Somalia"},
      {"@type": "Country", "name": "Ethiopia"},
      {"@type": "Country", "name": "Uganda"},
      {"@type": "Country", "name": "Tanzania"}
    ],
    "keywords": ["jobs in Somalia", "jobs in Kenya", "humanitarian jobs", "NGO careers", "UN jobs", "development careers"]
  }
  </script>

  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; line-height: 1.6; color: #333; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .hero { background: #0077B5; color: white; padding: 40px 20px; text-align: center; }
    .stats { display: flex; justify-content: center; gap: 40px; margin-top: 20px; }
    .stat { text-align: center; }
    .stat-number { font-size: 24px; font-weight: bold; }
    .stat-label { font-size: 14px; opacity: 0.9; }
  </style>
</head>
<body>
  <header class="hero">
    <div class="container">
      <h1>${heroTitle}</h1>
      ${renderParagraph(heroDescription)}
      <div class="stats">
        <div class="stat">
          <div class="stat-number">${jobStats.totalJobs}</div>
          <div class="stat-label">Active Jobs</div>
        </div>
        <div class="stat">
          <div class="stat-number">${jobStats.organizations}</div>
          <div class="stat-label">Organizations</div>
        </div>
        <div class="stat">
          <div class="stat-number">${jobStats.newToday}</div>
          <div class="stat-label">New Today</div>
        </div>
      </div>
    </div>
  </header>

  <main class="container">
    ${latestJobsSection}
    ${leadingSectorSection}
  </main>
  
  <script>
    // Redirect to SPA after initial load for interactive features
    setTimeout(() => {
      if (typeof window !== 'undefined' && !navigator.userAgent.match(/bot|crawler|spider|crawling/i)) {
        window.location.reload();
      }
    }, 100);
  </script>
</body>
</html>`;
  return applySanitychecks(generatedHTML, "Homepage");
}
function generateJobsPageHTML(jobs2, totalCount, filters = {}) {
  const seoMetadata = generateJobsListingSEOMetadata(totalCount, filters);
  const jobListings = jobs2.slice(0, 20).map((job) => `
    <div class="job-listing" style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">
        <a href="/jobs/${generateJobSlug(job.title, job.id)}" style="color: #0077B5; text-decoration: none;">
          ${job.title}
        </a>
      </h3>
      <div style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">
        <strong>${job.organization}</strong> \u2022 ${job.location}, ${job.country}${job.sector ? ` \u2022 ${job.sector}` : ""}
        ${job.deadline ? ` \u2022 Deadline: ${new Date(job.deadline).toLocaleDateString()}` : ""}
      </div>
      <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6;">
        ${job.description.replace(/<[^>]*>/g, "").substring(0, 200)}...
      </p>
    </div>
  `).join("");
  const contentPreview = `H1: East Africa Humanitarian Jobs, H2: Comprehensive Job Listings, H3: Major Humanitarian Sectors`;
  console.log(`\u{1F4CA} Jobs Page SSR Generated - Total: ${totalCount} jobs, Showing: ${Math.min(jobs2.length, 20)} listings`);
  console.log(`\u{1F4DD} Content structure: ${contentPreview}`);
  console.log(`\u{1F3AF} Jobs shown from: ${jobs2.slice(0, 3).map((j) => j.organization).join(", ")}...`);
  const finalHtml = `
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${seoMetadata.title}</title>
  <meta name="description" content="${seoMetadata.description}">
  <meta name="keywords" content="${seoMetadata.keywords}">
  <link rel="canonical" href="https://somkenjobs.com/jobs">
  
  <!-- Open Graph Tags -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://somkenjobs.com/jobs">
  <meta property="og:title" content="${seoMetadata.title}">
  <meta property="og:description" content="${seoMetadata.description}">
  <meta property="og:site_name" content="Somken Jobs">
  
  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@SomkenJobs">
  <meta name="twitter:title" content="${seoMetadata.title}">
  <meta name="twitter:description" content="${seoMetadata.description}">

  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; line-height: 1.6; color: #333; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .hero { background: #0077B5; color: white; padding: 30px 20px; text-align: center; }
  </style>
</head>
<body>
  <header class="hero">
    <div class="container">
      <h1>East Africa Humanitarian Jobs - ${totalCount}+ Career Opportunities</h1>
      <p>Discover comprehensive career opportunities across Somalia, Kenya, Ethiopia, Uganda, and Tanzania with leading humanitarian organizations. Browse ${totalCount} current positions from international NGOs, UN agencies, and development organizations operating throughout East Africa's dynamic humanitarian landscape.</p>
    </div>
  </header>

  <main class="container">
    <section>
      <h2>Comprehensive Job Listings Across East Africa</h2>
      <p>Explore ${totalCount} current humanitarian and development career opportunities across Somalia, Kenya, Ethiopia, Uganda, and Tanzania. Our comprehensive job listings feature positions from leading international organizations, NGOs, and UN agencies operating throughout the region. Each listing is carefully curated and verified to ensure you have access to legitimate, high-quality career opportunities in the humanitarian sector. Our database includes positions ranging from entry-level field roles to senior management positions, covering all major humanitarian specializations and geographic locations across East Africa.</p>
      
      ${jobListings}
      
      ${totalCount > 20 ? `<p><em>Showing first 20 of ${totalCount} jobs. Visit our full site to see all opportunities and use advanced filters to find positions matching your specific skills and location preferences.</em></p>` : ""}
    </section>

    <section style="margin-top: 40px;">
      <h2>Comprehensive Career Opportunities in Humanitarian Sector</h2>
      <p>East Africa's humanitarian landscape offers unparalleled opportunities for professionals seeking meaningful careers that make a direct impact on communities and vulnerable populations. Whether you're interested in working in Somalia's dynamic post-conflict recovery environment, Kenya's established humanitarian hub in Nairobi, or the emerging opportunities in Ethiopia, Uganda, and Tanzania, our platform connects you with positions that match your skills and career aspirations. From emergency response roles that require rapid deployment to long-term development positions focused on sustainable change, we feature the complete spectrum of humanitarian careers available in the region.</p>

      <h3>Major Humanitarian Sectors and Specializations</h3>
      <p><strong>Health and Medical Services:</strong> The region offers extensive opportunities for medical professionals, public health specialists, epidemiologists, and healthcare coordinators. Organizations like WHO, M\xE9decins Sans Fronti\xE8res (MSF), Partners in Health, and numerous local health NGOs are actively recruiting professionals to address ongoing health challenges including infectious disease control, maternal health, nutrition, and health system strengthening initiatives across East Africa.</p>
      
      <p><strong>Protection and Human Rights:</strong> Protection officers, child protection specialists, gender-based violence coordinators, and human rights advocates will find numerous opportunities with organizations like UNHCR, UNICEF, Save the Children, and specialized protection agencies. These roles focus on safeguarding vulnerable populations including refugees, internally displaced persons, children, and women in emergency and development contexts throughout the region.</p>
      
      <p><strong>Emergency Response and Coordination:</strong> The region's complex emergency landscape creates constant demand for emergency coordinators, logistics specialists, humanitarian access negotiators, and rapid response team members. Organizations like WFP, OCHA, International Rescue Committee, and CARE are at the forefront of humanitarian response efforts, offering positions that require both technical expertise and the ability to work effectively in challenging operational environments.</p>

      <h3>Strategic Locations and Career Development</h3>
      <p>East Africa hosts some of the world's most important humanitarian operations centers, providing professionals with exceptional opportunities for career advancement and skill development. Nairobi serves as the regional headquarters for numerous international organizations and offers a vibrant expatriate community alongside excellent professional development opportunities. Mogadishu and other Somali cities provide challenging but rewarding field experience for professionals seeking to make direct impact in post-conflict recovery and stabilization efforts.</p>

      <h3>Application Success and Career Advancement</h3>
      <p>Success in East Africa's humanitarian job market requires understanding regional contexts, demonstrating cultural sensitivity, and showing commitment to humanitarian principles. Our platform not only provides access to current job openings but also offers insights into application strategies, salary expectations, and career progression pathways within different humanitarian sectors. With over ${totalCount} active positions from ${Math.floor(totalCount / 5)} organizations currently available, professionals have unprecedented access to diverse career opportunities that can shape both personal growth and positive community impact across the region.</p>
    </section>
  </main>
  
  <script>
    // Redirect to SPA after initial load for interactive features
    setTimeout(() => {
      if (typeof window !== 'undefined' && !navigator.userAgent.match(/bot|crawler|spider|crawling/i)) {
        window.location.reload();
      }
    }, 100);
  </script>
</body>
</html>`;
  return applySanitychecks(finalHtml, "Jobs Page");
}
function generateJobDetailsHTML(job) {
  try {
    validateContextMaps();
  } catch (error) {
    console.error("Context validation failed:", error);
  }
  const structuredData = generateJobStructuredData(job);
  const jobUrl = `https://somkenjobs.com/jobs/${generateJobSlug(job.title, job.id)}`;
  const seoMetadata = generateJobSEOMetadata(job);
  const applyUrl = safeUrl(job.url);
  const stripTags = (str) => sanitizeRichHtml(str).replace(/<[^>]*>/g, "").trim();
  const p = (content) => `<p>${content}</p>`;
  const h2 = (title) => `<h2>${title}</h2>`;
  const h3 = (title) => `<h3>${title}</h3>`;
  const section = (content) => `<section class="section">${content}</section>`;
  const countryContext = getCountryContext(job.country);
  const sectorContext = getSectorContext(job.sector || "Humanitarian");
  const htmlParts = [];
  htmlParts.push(`
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(seoMetadata.title)}</title>
  <meta name="description" content="${escapeHtml(seoMetadata.description)}">
  <meta name="keywords" content="${escapeHtml(seoMetadata.keywords)}">
  <link rel="canonical" href="${jobUrl}">
  
  <!-- Open Graph Tags -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${jobUrl}">
  <meta property="og:title" content="${escapeHtml(seoMetadata.title)}">
  <meta property="og:description" content="${escapeHtml(seoMetadata.description)}">
  <meta property="og:site_name" content="Somken Jobs">
  
  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@SomkenJobs">
  <meta name="twitter:title" content="${escapeHtml(seoMetadata.title)}">
  <meta name="twitter:description" content="${escapeHtml(seoMetadata.description)}">

  <!-- Job Structured Data -->
  <script type="application/ld+json">
  ${structuredData}
  </script>

  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .job-header { border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
    .job-meta { color: #6b7280; font-size: 14px; margin: 10px 0; }
    .apply-button { background: #0077B5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
    .section { margin: 30px 0; }
    h2 { color: #1f2937; font-size: 24px; margin-bottom: 16px; font-weight: 600; }
    h3 { color: #374151; font-size: 20px; margin-bottom: 12px; font-weight: 500; }
    p { margin-bottom: 16px; line-height: 1.7; }
  </style>
</head>
<body>
  <main class="container">`);
  htmlParts.push(`
    <div class="job-header">
      <h1>${escapeHtml(job.title)}</h1>
      <div class="job-meta">
        <strong>${escapeHtml(job.organization)}</strong> - ${escapeHtml(job.location)}, ${escapeHtml(job.country)}
        ${job.sector ? ` - ${escapeHtml(job.sector)}` : ""}
        ${job.deadline ? ` \u2022 Deadline: ${new Date(job.deadline).toLocaleDateString()}` : ""}
      </div>
      ${applyUrl ? `<a href="${applyUrl}" target="_blank" rel="noopener noreferrer" class="apply-button">Apply Now</a>` : ""}
    </div>`);
  const cleanDescription = stripTags(job.description);
  htmlParts.push(section(`
    ${h2("Job Description")}
    <div style="white-space: pre-line; line-height: 1.7;">
      ${cleanDescription}
    </div>
  `));
  htmlParts.push(section(`
    ${h2("Job Requirements")}
    ${job.qualifications ? `
    <div style="white-space: pre-line; line-height: 1.7; margin-bottom: 20px;">
      ${stripTags(job.qualifications)}
    </div>
    ` : ""}
    
    ${h3("Professional Environment")}
    ${p(`This ${escapeHtml(job.title)} position requires working in East Africa's dynamic humanitarian landscape, where professionals engage with complex operational challenges while contributing to meaningful community impact. The role demands cultural sensitivity, adaptability, and strong interpersonal skills to work effectively with diverse teams including local staff, international colleagues, government partners, and community representatives. Successful candidates will thrive in fast-paced environments that require both independent decision-making and collaborative problem-solving approaches.`)}
    
    ${h3("Career Development")}
    ${p(`Professionals in this role will gain invaluable experience in ${escapeHtml(job.sector || "humanitarian programming")}, developing specialized technical skills alongside leadership and management capabilities. The position offers exposure to international best practices, opportunities for professional networking within the East African humanitarian community, and potential for career advancement within ${escapeHtml(job.organization)} or the broader humanitarian sector. This experience provides excellent preparation for senior management roles, technical advisory positions, or specialized program leadership opportunities.`)}
  `));
  if (job.responsibilities) {
    htmlParts.push(section(`
      ${h2("Key Responsibilities")}
      <div style="white-space: pre-line; line-height: 1.7;">
        ${stripTags(job.responsibilities)}
      </div>
    `));
  }
  htmlParts.push(section(`
    ${h2("Location Details")}
    ${p(countryContext)}
    
    ${h3("Sector Context")}
    ${p(sectorContext)}
    
    ${h3("Application Process")}
    ${p(`Interested candidates should submit comprehensive application materials demonstrating relevant experience, technical qualifications, and commitment to humanitarian principles. The selection process typically includes document review, competency-based interviews, and reference checks. ${job.deadline ? `Applications must be submitted by ${new Date(job.deadline).toLocaleDateString()}.` : "Early application is encouraged as positions may close when suitable candidates are identified."} Strong applications will clearly articulate relevant experience, demonstrate understanding of the operational context, and show alignment with organizational values and mission.`)}
  `));
  htmlParts.push(section(`
    ${h2("Organization Background")}
    ${p(`${escapeHtml(job.organization)} maintains a strong operational presence throughout East Africa, implementing critical humanitarian and development programming that addresses the needs of vulnerable populations across the region. The organization's comprehensive approach encompasses emergency response capabilities, long-term development initiatives, and capacity building programs designed to create sustainable positive change in communities. Their commitment to local partnership, evidence-based programming, and innovative approaches makes them a respected leader in the humanitarian sector.`)}
    
    ${p(`Working with ${escapeHtml(job.organization)} provides opportunities to contribute to high-impact programming while developing professional skills in a supportive, mission-driven environment. The organization values staff development, maintains strong safety and security protocols, and offers competitive compensation packages designed to attract and retain talented humanitarian professionals. Team members benefit from comprehensive training programs, mentorship opportunities, and exposure to cutting-edge approaches in ${escapeHtml(job.sector || "humanitarian")} programming.`)}
    
    ${applyUrl ? `
    ${h3("Next Steps")}
    ${p(`To apply for this ${escapeHtml(job.title)} position, visit the official application portal where you can submit your comprehensive application materials directly to ${escapeHtml(job.organization)}'s recruitment team. The organization maintains transparent, merit-based selection processes designed to identify candidates who demonstrate both technical excellence and commitment to humanitarian values.`)}
    ${p(`<a href="${applyUrl}" target="_blank" rel="noopener noreferrer" style="color: #0077B5; font-weight: 600;">Submit Application for ${escapeHtml(job.title)} Position</a>`)}
    ` : ""}
  `));
  if (job.howToApply) {
    htmlParts.push(section(`
      ${h2("Application Instructions")}
      <div style="white-space: pre-line; line-height: 1.7;">
        ${stripTags(job.howToApply)}
      </div>
    `));
  }
  const mainContent = htmlParts.join("");
  const wordCount = stripTags(mainContent).split(/\s+/).filter((word) => word.length > 0).length;
  if (wordCount < 250) {
    htmlParts.push(section(`
      ${h3("Regional Impact and Career Significance")}
      ${p("East Africa represents one of the world's most dynamic humanitarian and development landscapes, where ongoing conflicts, climate challenges, and development opportunities create complex operational environments that require skilled humanitarian professionals. The region's strategic importance in global humanitarian response, combined with its diverse cultural and geographic contexts, provides exceptional opportunities for career development and meaningful impact. Professionals working in East Africa gain invaluable experience in emergency response coordination, long-term development programming, and innovative approaches to addressing complex humanitarian challenges.")}
      
      ${p("The humanitarian sector in East Africa continues to evolve, with increasing emphasis on localization, innovation, and sustainable development approaches that build long-term resilience while addressing immediate needs. This evolution creates excellent opportunities for professionals to contribute to cutting-edge programming while developing specialized expertise in conflict-sensitive programming, climate adaptation, and community-based approaches to humanitarian assistance that serve as models for global humanitarian practice.")}
    `));
  }
  htmlParts.push(`
  </main>
  
  <script>
    // Redirect to SPA after initial load for interactive features
    setTimeout(() => {
      if (typeof window !== 'undefined' && !navigator.userAgent.match(/bot|crawler|spider|crawling/i)) {
        window.location.reload();
      }
    }, 100);
  </script>
</body>
</html>`);
  const finalHtml = htmlParts.join("");
  if (finalHtml.includes("${") || finalHtml.includes("<h") === false) {
    console.error("SSR validation warning: Potential template injection or missing header tags detected");
  }
  return applySanitychecks(finalHtml, "Job Details");
}
function extractJobIdFromSlug2(slug) {
  const match = slug.match(/-(\d+)$/);
  if (!match) return null;
  const id = parseInt(match[1], 10);
  if (isNaN(id) || id > 2147483647 || id < 1) return null;
  return id;
}
try {
  validateContextMaps();
  console.log("\u2705 SSR context validation passed at module load");
} catch (error) {
  console.error("\u274C SSR context validation failed at module load:", error);
}

// server/routes.ts
var JWT_SECRET = (() => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production");
  }
  console.warn("JWT_SECRET is not set; using a development-only fallback secret.");
  return "development-only-jwt-secret-change-me";
})();
var upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
var generatePrivateToken = () => randomBytes(32).toString("hex");
var escapeHtml2 = (text2) => String(text2 || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
var safeUrl2 = (url) => {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return ["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol) ? parsed.toString() : "";
  } catch {
    return "";
  }
};
var jsonLd = (data) => JSON.stringify(data).replace(/</g, "\\u003c");
var authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
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
var requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};
var requireAdminOrCronSecret = async (req, res, next) => {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization === `Bearer ${cronSecret}`) {
    return next();
  }
  return authenticate(req, res, () => requireAdmin(req, res, next));
};
var profileUpdateSchema = z2.object({
  firstName: z2.string().min(1).optional(),
  lastName: z2.string().min(1).optional(),
  companyName: z2.string().min(1).optional(),
  jobTitle: z2.string().min(1).optional(),
  phoneNumber: z2.string().nullable().optional(),
  position: z2.string().nullable().optional(),
  bio: z2.string().nullable().optional()
}).strict();
var arrayTransform = z2.union([z2.string(), z2.array(z2.string())]).transform(
  (val) => Array.isArray(val) ? val : [val]
);
var jobFiltersSchema = z2.object({
  country: arrayTransform.optional(),
  organization: arrayTransform.optional(),
  sector: arrayTransform.optional(),
  datePosted: z2.string().optional(),
  search: z2.string().optional()
});
var lightweightJobFiltersSchema = z2.object({
  country: arrayTransform.optional(),
  sector: arrayTransform.optional(),
  search: z2.string().optional(),
  limit: z2.string().optional().transform((val) => val ? parseInt(val) : void 0)
});
async function registerRoutes(app2) {
  await seedDatabase();
  if (!process.env.VERCEL) {
    jobFetcher.startScheduler();
  }
  const uploadsDir = process.env.VERCEL ? path.join("/tmp", "uploads") : path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app2.use("/uploads", express.static(uploadsDir, {
    setHeaders: (res, filePath) => {
      const filename = path.basename(filePath).replace(/"/g, "");
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("X-Content-Type-Options", "nosniff");
    }
  }));
  app2.post("/api/upload", authenticate, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file provided" });
      const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filename = `${Date.now()}-${safeName}`;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, req.file.buffer);
      res.json({ url: `/uploads/${filename}`, originalName: req.file.originalname });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });
  app2.get("/help-center", (req, res) => {
    res.redirect(301, "/help");
  });
  app2.get("/privacy-policy", (req, res) => {
    res.redirect(301, "/privacy");
  });
  app2.get("/terms-of-service", (req, res) => {
    res.redirect(301, "/terms");
  });
  app2.get("/career-guide", (req, res) => {
    res.redirect(301, "/career-resources");
  });
  app2.get("/job-board", (req, res) => {
    res.redirect(301, "/jobs");
  });
  app2.get("/humanitarian-jobs", (req, res) => {
    res.redirect(301, "/jobs");
  });
  app2.get("/ngo-jobs", (req, res) => {
    res.redirect(301, "/jobs");
  });
  app2.get("/api/ssr/test", (req, res) => {
    console.log("Test endpoint hit");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send("<html><head><title>SSR Test</title></head><body><h1>SSR is working!</h1></body></html>");
  });
  app2.get("/api/ssr/homepage", async (req, res) => {
    console.log("SSR Homepage endpoint hit");
    try {
      const allJobs = await storage.getAllJobsWithDetails();
      console.log("Fetched", allJobs.length, "jobs for SSR");
      const recentJobs = allJobs.filter((job) => job.type !== "tender" || !job.type).sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime()).slice(0, 10);
      const jobStats = {
        totalJobs: allJobs.length,
        organizations: new Set(allJobs.map((job) => job.organization)).size,
        newToday: allJobs.filter((job) => {
          const today = /* @__PURE__ */ new Date();
          const jobDate = new Date(job.datePosted);
          const createdDate = job.createdAt ? new Date(job.createdAt) : null;
          return jobDate.toDateString() === today.toDateString() || createdDate && createdDate.toDateString() === today.toDateString();
        }).length
      };
      const html = generateHomepageHTML(jobStats, recentJobs);
      console.log("Generated HTML length:", html.length);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (error) {
      console.error("Error generating homepage SSR:", error);
      res.status(500).json({
        error: "SSR generation failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/ssr/jobs", async (req, res) => {
    try {
      const allJobs = await storage.getAllJobsWithDetails();
      const jobs2 = allJobs.filter((job) => job.type !== "tender" || !job.type).sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime());
      const html = generateJobsPageHTML(jobs2, jobs2.length);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (error) {
      console.error("Error generating jobs page SSR:", error);
      res.status(500).json({ error: "SSR generation failed" });
    }
  });
  app2.get("/api/ssr/job/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const jobId = extractJobIdFromSlug2(slug);
      if (!jobId) {
        return res.status(404).json({ error: "Invalid job slug" });
      }
      const job = await storage.getJobById(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      const html = generateJobDetailsHTML(job);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (error) {
      console.error("Error generating job details SSR:", error);
      res.status(500).json({ error: "SSR generation failed" });
    }
  });
  app2.use(async (req, res, next) => {
    const userAgent = req.get("User-Agent") || "";
    const isSSRRequest = isBotUserAgent(userAgent) || req.query.ssr === "1";
    console.log("SSR middleware check:", req.path, "UA:", userAgent.substring(0, 30), "isSSR:", isSSRRequest);
    if (!isSSRRequest) {
      return next();
    }
    try {
      if (req.path === "/") {
        console.log("Bot detected, serving inline SSR for homepage");
        const allJobs = await storage.getAllJobsWithDetails();
        console.log("Fetched", allJobs.length, "jobs for homepage SSR");
        const recentJobs = allJobs.filter((job) => job.type !== "tender" || !job.type).sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime()).slice(0, 10);
        const jobStats = {
          totalJobs: allJobs.length,
          organizations: new Set(allJobs.map((job) => job.organization)).size,
          newToday: allJobs.filter((job) => {
            const today = /* @__PURE__ */ new Date();
            const jobDate = new Date(job.datePosted);
            const createdDate = job.createdAt ? new Date(job.createdAt) : null;
            return jobDate.toDateString() === today.toDateString() || createdDate && createdDate.toDateString() === today.toDateString();
          }).length
        };
        const html = generateHomepageHTML(jobStats, recentJobs);
        console.log("Generated homepage HTML length:", html.length);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.send(html);
      }
      if (req.path === "/jobs") {
        console.log("Bot detected, serving inline SSR for jobs page");
        const allJobs = await storage.getAllJobsWithDetails();
        const jobs2 = allJobs.filter((job) => job.type !== "tender" || !job.type).sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime());
        const html = generateJobsPageHTML(jobs2, jobs2.length);
        console.log("Generated jobs page HTML length:", html.length);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.send(html);
      }
      if (req.path.startsWith("/jobs/")) {
        console.log("Bot detected, serving inline SSR for job details:", req.path);
        const slug = req.path.substring(6);
        const jobId = extractJobIdFromSlug2(slug);
        if (!jobId) {
          console.log("Invalid job slug:", slug);
          return res.status(404).send("<html><head><title>Job Not Found</title></head><body><h1>Job Not Found</h1></body></html>");
        }
        const job = await storage.getJobById(jobId);
        if (!job) {
          console.log("Job not found for ID:", jobId);
          return res.status(404).send("<html><head><title>Job Not Found</title></head><body><h1>Job Not Found</h1></body></html>");
        }
        const html = generateJobDetailsHTML(job);
        console.log("Generated job details HTML length:", html.length);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.send(html);
      }
    } catch (error) {
      console.error("Error in SSR middleware:", error);
    }
    next();
  });
  app2.head("/", async (req, res) => {
    try {
      const allJobs = await storage.getAllJobsWithDetails();
      const jobStats = {
        totalJobs: allJobs.length,
        organizations: new Set(allJobs.map((job) => job.organization)).size,
        newToday: allJobs.filter((job) => {
          const today = /* @__PURE__ */ new Date();
          const jobDate = new Date(job.datePosted);
          const createdDate = job.createdAt ? new Date(job.createdAt) : null;
          return jobDate.toDateString() === today.toDateString() || createdDate && createdDate.toDateString() === today.toDateString();
        }).length
      };
      const recentJobs = allJobs.filter((job) => job.type !== "tender" || !job.type).sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime()).slice(0, 10);
      const html = generateHomepageHTML(jobStats, recentJobs);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Content-Length", Buffer.byteLength(html, "utf8"));
      res.end();
    } catch (error) {
      console.error("Error in HEAD handler for homepage:", error);
      res.status(500).end();
    }
  });
  app2.head("/jobs", async (req, res) => {
    try {
      const allJobs = await storage.getAllJobsWithDetails();
      const jobs2 = allJobs.filter((job) => job.type !== "tender" || !job.type).sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime());
      const html = generateJobsPageHTML(jobs2, jobs2.length);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Content-Length", Buffer.byteLength(html, "utf8"));
      res.end();
    } catch (error) {
      console.error("Error in HEAD handler for jobs page:", error);
      res.status(500).end();
    }
  });
  app2.head("/jobs/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const jobId = extractJobIdFromSlug2(slug);
      if (!jobId) {
        return res.status(404).end();
      }
      const job = await storage.getJobById(jobId);
      if (!job) {
        return res.status(404).end();
      }
      const html = generateJobDetailsHTML(job);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Content-Length", Buffer.byteLength(html, "utf8"));
      res.end();
    } catch (error) {
      console.error("Error in HEAD handler for job details:", error);
      res.status(500).end();
    }
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      const hashedPassword = await bcrypt2.hash(userData.password, 10);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        phoneNumber: userData.phoneNumber || null
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
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginUserSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isValidPassword = await bcrypt2.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      if (!user.isApproved) {
        return res.status(403).json({ message: "Account pending approval" });
      }
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
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
  app2.get("/api/auth/user", authenticate, (req, res) => {
    const { password: _, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
  app2.put("/api/users/:id", authenticate, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = req.user;
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
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid profile update", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  app2.get("/api/admin/pending-users", authenticate, requireAdmin, async (req, res) => {
    try {
      const pendingUsers = await storage.getAllPendingUsers();
      const sanitizedUsers = pendingUsers.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });
  app2.post("/api/admin/approve-user/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const approvedUser = await storage.approveUser(userId, req.user.email);
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
  app2.get("/api/jobs/list", async (req, res) => {
    try {
      const filters = lightweightJobFiltersSchema.parse(req.query);
      const startTime = Date.now();
      const etag = jobsCache.generateETag(filters);
      const clientETag = req.headers["if-none-match"];
      if (clientETag === etag) {
        res.status(304).end();
        console.log(`Jobs list cache hit - 304 response in ${Date.now() - startTime}ms`);
        return;
      }
      let cachedEntry = jobsCache.getCachedJobs(filters);
      if (cachedEntry) {
        res.setHeader("ETag", cachedEntry.etag);
        res.setHeader("Cache-Control", "public, max-age=30");
        res.json(cachedEntry.data);
        console.log(`Jobs list cache hit - ${cachedEntry.data.jobs.length} jobs in ${Date.now() - startTime}ms`);
        return;
      }
      const jobs2 = await storage.getLightweightJobs(filters);
      const allJobs = await storage.getAllJobs();
      const stats = {
        totalJobs: allJobs.length,
        organizations: new Set(allJobs.map((job) => job.organization)).size,
        newToday: allJobs.filter((job) => {
          const today = /* @__PURE__ */ new Date();
          const jobDate = new Date(job.datePosted);
          const createdDate = job.createdAt ? new Date(job.createdAt) : null;
          return jobDate.toDateString() === today.toDateString() || createdDate && createdDate.toDateString() === today.toDateString();
        }).length
      };
      const filterOptions = {
        countries: Array.from(new Set(allJobs.map((job) => job.country))),
        organizations: Array.from(new Set(allJobs.map((job) => job.organization))),
        sectors: Array.from(new Set(allJobs.map((job) => job.sector).filter(Boolean)))
      };
      const responseData = {
        jobs: jobs2,
        stats,
        filters: filterOptions
      };
      jobsCache.setCachedJobs(filters, responseData);
      res.setHeader("ETag", etag);
      res.setHeader("Cache-Control", "public, max-age=30");
      res.json(responseData);
      console.log(`Jobs list database query - ${jobs2.length} jobs in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error("Error fetching lightweight jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });
  app2.get("/api/jobs", async (req, res) => {
    try {
      const filters = jobFiltersSchema.parse(req.query);
      let jobs2;
      const hasFilters = filters.country?.length || filters.organization?.length || filters.sector?.length || filters.datePosted || filters.search;
      if (hasFilters) {
        if (filters.search) {
          jobs2 = await storage.searchJobs(filters.search);
          if (filters.country?.length || filters.organization?.length || filters.sector?.length || filters.datePosted) {
            jobs2 = jobs2.filter((job) => {
              if (filters.country?.length && !filters.country.includes(job.country)) {
                return false;
              }
              if (filters.organization?.length && !filters.organization.includes(job.organization)) {
                return false;
              }
              if (filters.sector?.length && (!job.sector || !filters.sector.includes(job.sector))) {
                return false;
              }
              if (filters.datePosted) {
                const jobDate = new Date(job.datePosted);
                const now = /* @__PURE__ */ new Date();
                let cutoffDate;
                switch (filters.datePosted) {
                  case "today":
                    cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                  case "week":
                    cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
                    break;
                  case "month":
                    cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
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
          jobs2 = await storage.filterJobs({
            country: filters.country,
            organization: filters.organization,
            sector: filters.sector,
            datePosted: filters.datePosted
          });
        }
      } else {
        jobs2 = await storage.getAllJobs();
      }
      const allJobs = await storage.getAllJobs();
      const stats = {
        totalJobs: allJobs.length,
        organizations: new Set(allJobs.map((job) => job.organization)).size,
        newToday: allJobs.filter((job) => {
          const today = /* @__PURE__ */ new Date();
          const jobDate = new Date(job.datePosted);
          const createdDate = job.createdAt ? new Date(job.createdAt) : null;
          return jobDate.toDateString() === today.toDateString() || createdDate && createdDate.toDateString() === today.toDateString();
        }).length
      };
      const countries2 = Array.from(new Set(allJobs.map((job) => job.country)));
      const organizations = Array.from(new Set(allJobs.map((job) => job.organization)));
      const sectors2 = Array.from(new Set(allJobs.map((job) => job.sector).filter(Boolean)));
      res.json({
        jobs: jobs2,
        stats,
        filters: {
          countries: countries2,
          organizations,
          sectors: sectors2
        }
      });
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });
  app2.get("/api/jobs/:id", async (req, res) => {
    try {
      const param = req.params.id;
      let jobId;
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
      const token = typeof req.query.token === "string" ? req.query.token : void 0;
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
  app2.get("/api/jobs/:id/related", async (req, res) => {
    try {
      const param = req.params.id;
      let jobId;
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
      const allJobs = await storage.getAllJobs();
      const relatedJobs = allJobs.filter((job) => job.id !== jobId).map((job) => {
        let score = 0;
        if (job.sector && currentJob.sector && job.sector.toLowerCase() === currentJob.sector.toLowerCase()) {
          score += 3;
        }
        if (job.organization && currentJob.organization && job.organization.toLowerCase() === currentJob.organization.toLowerCase()) {
          score += 2;
        }
        if (job.location && currentJob.location && job.location.toLowerCase() === currentJob.location.toLowerCase()) {
          score += 1;
        }
        return { job, score };
      }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 2).map((item) => item.job);
      res.json(relatedJobs);
    } catch (error) {
      console.error("Error fetching related jobs:", error);
      res.status(500).json({ message: "Failed to fetch related jobs" });
    }
  });
  app2.post("/api/jobs/refresh", requireAdminOrCronSecret, async (req, res) => {
    try {
      await jobFetcher.fetchAllJobs();
      res.json({ message: "Job refresh initiated" });
    } catch (error) {
      console.error("Error refreshing jobs:", error);
      res.status(500).json({ message: "Failed to refresh jobs" });
    }
  });
  app2.get("/api/trigger-fetch", async (req, res) => {
    try {
      const cronSecret = process.env.CRON_SECRET;
      if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      console.log("Job fetch triggered via /api/trigger-fetch");
      await jobFetcher.fetchAllJobs();
      await storage.archiveExpiredJobs();
      res.json({ message: "Job fetch completed", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    } catch (error) {
      console.error("Error triggering job fetch:", error);
      res.status(500).json({ message: "Failed to trigger job fetch" });
    }
  });
  app2.get("/api/organizations", async (req, res) => {
    try {
      const search = req.query.search;
      const organizations = await storage.getOrganizations(search);
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });
  app2.get("/api/countries", authenticate, async (req, res) => {
    try {
      const search = req.query.search || "";
      const countries2 = await storage.getCountries(search);
      res.json(countries2);
    } catch (error) {
      console.error("Error fetching countries:", error);
      res.status(500).json({ message: "Failed to fetch countries" });
    }
  });
  app2.get("/api/cities", authenticate, async (req, res) => {
    try {
      const search = req.query.search || "";
      const country = req.query.country || "";
      const cities2 = await storage.getCities(search, country);
      res.json(cities2);
    } catch (error) {
      console.error("Error fetching cities:", error);
      res.status(500).json({ message: "Failed to fetch cities" });
    }
  });
  app2.post("/api/countries", authenticate, async (req, res) => {
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
  app2.post("/api/cities", authenticate, async (req, res) => {
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
  app2.get("/api/sectors", authenticate, async (req, res) => {
    try {
      const search = req.query.search || "";
      const sectors2 = await storage.getSectors(search);
      res.json(sectors2);
    } catch (error) {
      console.error("Error fetching sectors:", error);
      res.status(500).json({ message: "Failed to fetch sectors" });
    }
  });
  app2.post("/api/sectors", authenticate, async (req, res) => {
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
  app2.get("/api/user/jobs", authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      const userJobs = await storage.getJobsByUserId(userId);
      res.json(userJobs);
    } catch (error) {
      console.error("Error fetching user jobs:", error);
      res.status(500).json({ message: "Failed to fetch user jobs" });
    }
  });
  app2.get("/api/user/jobs/available-for-billing", authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      const userJobs = await storage.getJobsByUserId(userId);
      const billedJobIds = await storage.getBilledJobIds(userId);
      const availableJobs = userJobs.filter((job) => !billedJobIds.includes(job.id));
      res.json(availableJobs);
    } catch (error) {
      console.error("Error fetching available jobs for billing:", error);
      res.status(500).json({ message: "Failed to fetch available jobs for billing" });
    }
  });
  app2.put("/api/jobs/:id", authenticate, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const userId = req.user.id;
      const isAdmin = req.user.isAdmin;
      const existingJob = await storage.getJobById(jobId, void 0, true);
      console.log(`Job update attempt - JobId: ${jobId}, UserId: ${userId}, IsAdmin: ${isAdmin}, JobCreatedBy: ${existingJob?.createdBy}`);
      if (!existingJob || existingJob.createdBy !== userId && !isAdmin) {
        console.log(`Job update denied - User ${userId} (admin: ${isAdmin}) cannot edit job ${jobId} (created by: ${existingJob?.createdBy})`);
        return res.status(403).json({ message: "You can only edit your own jobs" });
      }
      const cleanMicrosoftText = (text2) => {
        if (!text2) return text2;
        if (text2.includes("<table")) return text2.replace(/\s{3,}/g, "  ").trim();
        return text2.replace(/^level\d+\s+lfo\d+"?>\s*/gm, "").replace(/^color:#[0-9A-Fa-f]{6}"?>\s*/gm, "").replace(/mso-list:l\d+\s+level\d+\s+lfo\d+[;"]*>/g, "").replace(/mso-[a-z\-]+:\s*[^;}"<]{0,60};/g, "").replace(/\s+/g, " ").trim();
      };
      const jobData = sanitizeJobContentFields(req.body);
      if (jobData.description) jobData.description = cleanMicrosoftText(jobData.description);
      if (jobData.qualifications) jobData.qualifications = cleanMicrosoftText(jobData.qualifications);
      if (jobData.howToApply) jobData.howToApply = cleanMicrosoftText(jobData.howToApply);
      if (Array.isArray(jobData.attachmentUrls)) {
        jobData.attachmentUrl = jobData.attachmentUrls.length > 0 ? JSON.stringify(jobData.attachmentUrls) : null;
      }
      delete jobData.attachmentUrls;
      const { createdAt: _omitCreatedAt, ...jobDataWithoutCreatedAt } = jobData;
      const isNowPrivate = jobData.visibility === "private";
      const transformedData = {
        ...jobDataWithoutCreatedAt,
        updatedAt: /* @__PURE__ */ new Date(),
        ...jobData.deadline ? { deadline: new Date(jobData.deadline) } : {},
        ...jobData.datePosted ? { datePosted: new Date(jobData.datePosted) } : {},
        visibility: isNowPrivate ? "private" : "public",
        privateToken: isNowPrivate ? jobData.privateToken || existingJob.privateToken || generatePrivateToken() : null
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
  app2.delete("/api/jobs/:id", authenticate, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const userId = req.user.id;
      const isAdmin = req.user.isAdmin;
      const existingJob = await storage.getJobById(jobId, void 0, true);
      if (!existingJob || existingJob.createdBy !== userId && !isAdmin) {
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
  app2.post("/api/jobs", authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      const isPrivate = req.body.visibility === "private";
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
        datePosted: req.body.datePosted || /* @__PURE__ */ new Date(),
        url: req.body.url || "",
        visibility: isPrivate ? "private" : "public",
        privateToken: isPrivate ? req.body.privateToken || generatePrivateToken() : null
      });
      delete jobDataWithDefaults.attachmentUrls;
      const jobData = insertJobSchema.parse(jobDataWithDefaults);
      const job = await storage.createJob(jobData);
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        console.error("Zod validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid job data", errors: error.errors });
      }
      console.error("Error creating job:", error);
      res.status(500).json({ message: "Failed to create job" });
    }
  });
  app2.post("/api/jobs/bulk-upload", authenticate, upload.single("file"), async (req, res) => {
    try {
      const userId = req.user.id;
      let jobsArray = [];
      if (req.file) {
        const fileContent = req.file.buffer.toString("utf-8");
        const ext = (req.file.originalname || "").toLowerCase();
        if (ext.endsWith(".csv")) {
          try {
            jobsArray = csvParse(fileContent, {
              columns: true,
              skip_empty_lines: true,
              trim: true,
              relaxColumnCount: true
            });
          } catch (parseErr) {
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
        return res.status(400).json({ message: 'Please provide a JSON array of jobs in the request body (as { "jobs": [...] } or [...]) or upload a CSV/JSON file.' });
      }
      if (jobsArray.length === 0) {
        return res.status(400).json({ message: "No jobs found in the uploaded data." });
      }
      if (jobsArray.length > 500) {
        return res.status(400).json({ message: "Maximum 500 jobs per upload. Please split your data into smaller batches." });
      }
      const results = { successCount: 0, failureCount: 0, errors: [] };
      const parseFuzzyDate = (dateStr) => {
        if (!dateStr) return /* @__PURE__ */ new Date();
        const trimmed = dateStr.trim();
        const lower = trimmed.toLowerCase();
        if (lower === "yesterday") {
          const d = /* @__PURE__ */ new Date();
          d.setDate(d.getDate() - 1);
          return d;
        }
        if (lower === "today") return /* @__PURE__ */ new Date();
        if (/^\d+ days? ago$/i.test(lower)) {
          const days = parseInt(lower);
          const d = /* @__PURE__ */ new Date();
          d.setDate(d.getDate() - days);
          return d;
        }
        const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
        const monthDayMatch = lower.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[,.\s]+(\d{1,2})$/i);
        if (monthDayMatch) {
          const m = months[monthDayMatch[1].toLowerCase().slice(0, 3)];
          const day = parseInt(monthDayMatch[2]);
          let year = (/* @__PURE__ */ new Date()).getFullYear();
          let result = new Date(year, m, day);
          if (result.getTime() > Date.now() + 90 * 24 * 60 * 60 * 1e3) {
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
          const year = dayMonthMatch[3] ? parseInt(dayMonthMatch[3]) : (/* @__PURE__ */ new Date()).getFullYear();
          return new Date(year, m, day);
        }
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) return parsed;
        const cleaned = trimmed.replace(/[^\w\s\-\/,:]/g, "").trim();
        const retryParsed = new Date(cleaned);
        return isNaN(retryParsed.getTime()) ? /* @__PURE__ */ new Date() : retryParsed;
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
            jobNumber: rawJob.jobNumber || null
          });
          const jobData = insertJobSchema.parse(jobDataWithDefaults);
          await storage.createJob(jobData);
          results.successCount++;
        } catch (error) {
          results.failureCount++;
          let errorMsg = "Unknown error";
          if (error instanceof z2.ZodError) {
            errorMsg = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
          } else if (error instanceof Error) {
            errorMsg = error.message;
          }
          results.errors.push({ index: i + 1, title: rawJob.title || void 0, error: errorMsg });
        }
      }
      res.status(200).json({
        message: `Bulk upload complete. ${results.successCount} succeeded, ${results.failureCount} failed.`,
        totalProcessed: jobsArray.length,
        successCount: results.successCount,
        failureCount: results.failureCount,
        errors: results.errors
      });
    } catch (error) {
      console.error("Error in bulk job upload:", error);
      res.status(500).json({ message: "Failed to process bulk upload" });
    }
  });
  app2.get("/api/admin/pending-users", authenticate, requireAdmin, async (req, res) => {
    try {
      const pendingUsers = await storage.getAllPendingUsers();
      const sanitizedUsers = pendingUsers.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });
  app2.post("/api/admin/reject-user/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { reason } = req.body;
      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      console.log(`User ${userId} rejected by admin ${req.user.email}. Reason: ${reason || "No reason provided"}`);
      res.json({
        message: "User registration rejected successfully"
      });
    } catch (error) {
      console.error("Error rejecting user:", error);
      res.status(500).json({ message: "Failed to reject user" });
    }
  });
  app2.get("/api/admin/users", authenticate, requireAdmin, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      const sanitizedUsers = users2.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.get("/api/admin/jobs", authenticate, requireAdmin, async (req, res) => {
    try {
      const jobs2 = await storage.getAllJobsWithDetails();
      res.json(jobs2);
    } catch (error) {
      console.error("Error fetching all jobs for admin:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });
  app2.put("/api/admin/jobs/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const jobData = sanitizeJobContentFields(req.body);
      const { createdAt: _omitCreatedAt, ...jobDataWithoutCreatedAt } = jobData;
      const transformedData = {
        ...jobDataWithoutCreatedAt,
        updatedAt: /* @__PURE__ */ new Date(),
        ...jobData.deadline ? { deadline: new Date(jobData.deadline) } : {},
        ...jobData.datePosted ? { datePosted: new Date(jobData.datePosted) } : {}
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
  app2.delete("/api/admin/jobs/:id", authenticate, requireAdmin, async (req, res) => {
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
  app2.post("/api/admin/jobs/bulk-action", authenticate, requireAdmin, async (req, res) => {
    try {
      const { action, jobIds } = req.body;
      if (!Array.isArray(jobIds) || jobIds.length === 0) {
        return res.status(400).json({ message: "Invalid job IDs provided" });
      }
      let results = [];
      switch (action) {
        case "delete":
          for (const jobId of jobIds) {
            const deleted = await storage.deleteJob(parseInt(jobId));
            results.push({ jobId, success: deleted });
          }
          break;
        case "publish":
          for (const jobId of jobIds) {
            const updated = await storage.updateJob(parseInt(jobId), { status: "published" });
            results.push({ jobId, success: !!updated });
          }
          break;
        case "draft":
          for (const jobId of jobIds) {
            const updated = await storage.updateJob(parseInt(jobId), { status: "draft" });
            results.push({ jobId, success: !!updated });
          }
          break;
        default:
          return res.status(400).json({ message: "Invalid action specified" });
      }
      const successCount = results.filter((r) => r.success).length;
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
  app2.get("/api/invoices", authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      const invoices2 = await storage.getInvoicesByUserId(userId);
      res.json(invoices2);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });
  app2.get("/api/invoices/:id", authenticate, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const userId = req.user.id;
      const invoice = await storage.getInvoiceById(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      if (invoice.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });
  app2.post("/api/invoices", authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      const selectedJobIds = JSON.parse(req.body.selectedJobIds || "[]");
      let clientOrganization = "Humanitarian Organization";
      if (selectedJobIds.length > 0) {
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
  app2.put("/api/invoices/:id", authenticate, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const userId = req.user.id;
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
  app2.delete("/api/invoices/:id", authenticate, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const userId = req.user.id;
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
  function generateSocialMediaText(job, deadline) {
    const catchyPhrases = [
      "\u{1F680} New Exciting Job Alert!",
      "\u{1F4BC} Latest Job Opportunity:",
      "\u{1F31F} Fresh Career Opening:",
      "\u{1F3AF} Hot Job Alert:",
      "\u26A1 Just Posted:",
      "\u{1F525} Breaking: New Position Available",
      "\u{1F4AB} Exciting Opportunity Alert:",
      "\u{1F30D} New Humanitarian Role:"
    ];
    let phrase = catchyPhrases[0];
    if (job.title.toLowerCase().includes("manager")) {
      phrase = "\u{1F680} New Management Position Alert!";
    } else if (job.title.toLowerCase().includes("director")) {
      phrase = "\u{1F4BC} Director Role Now Available:";
    } else if (job.title.toLowerCase().includes("coordinator")) {
      phrase = "\u{1F31F} Coordinator Position Open:";
    } else if (job.title.toLowerCase().includes("officer")) {
      phrase = "\u26A1 Officer Role Just Posted:";
    } else if (job.title.toLowerCase().includes("specialist")) {
      phrase = "\u{1F3AF} Specialist Position Alert:";
    } else if (job.title.toLowerCase().includes("consultant")) {
      phrase = "\u{1F4AB} Consultancy Opportunity:";
    } else if (job.title.toLowerCase().includes("intern")) {
      phrase = "\u{1F331} Internship Opportunity:";
    } else {
      phrase = catchyPhrases[Math.floor(Math.random() * catchyPhrases.length)];
    }
    return `${phrase} ${job.title} position in ${job.location}, ${job.country} with ${job.organization}${deadline}`;
  }
  const SUPPORTED_COUNTRIES = ["kenya", "somalia", "ethiopia", "uganda", "tanzania"];
  const COUNTRY_DISPLAY_NAMES = {
    "kenya": "Kenya",
    "somalia": "Somalia",
    "ethiopia": "Ethiopia",
    "uganda": "Uganda",
    "tanzania": "Tanzania"
  };
  const COUNTRY_DESCRIPTIONS = {
    "kenya": "Kenya serves as East Africa's humanitarian hub, with Nairobi hosting regional headquarters for numerous international organizations.",
    "somalia": "Somalia offers unique opportunities for humanitarian professionals to contribute to post-conflict recovery and stabilization efforts.",
    "ethiopia": "Ethiopia presents vast opportunities for development and humanitarian professionals working across diverse contexts including refugee response.",
    "uganda": "Uganda offers meaningful opportunities in refugee response, health programming, and development initiatives.",
    "tanzania": "Tanzania provides opportunities in development programming, refugee support, and health initiatives."
  };
  app2.get("/jobs/country/:country", async (req, res) => {
    try {
      const countryParam = req.params.country.toLowerCase();
      if (!SUPPORTED_COUNTRIES.includes(countryParam)) {
        return res.status(404).send("Country not found");
      }
      const countryName = COUNTRY_DISPLAY_NAMES[countryParam];
      const countryDescription = COUNTRY_DESCRIPTIONS[countryParam];
      const allJobs = await storage.getAllJobs();
      const now = /* @__PURE__ */ new Date();
      const countryJobs = allJobs.filter(
        (job) => job.country.toLowerCase() === countryParam && (!job.type || job.type === "job") && job.status === "published" && job.visibility !== "private" && (!job.deadline || new Date(job.deadline) >= now)
      );
      const pageUrl = `https://somkenjobs.com/jobs/country/${countryParam}`;
      const pageTitle = `Humanitarian Jobs in ${countryName} | ${countryJobs.length}+ Current Openings | Somken Jobs`;
      const pageDescription = `Find ${countryJobs.length}+ humanitarian and development jobs in ${countryName}. ${countryDescription} Browse NGO, UN, and international organization positions.`;
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const htmlPath = path.join(__dirname, "../dist/public/index.html");
      let html = "";
      try {
        html = fs.readFileSync(htmlPath, "utf-8");
      } catch (err) {
        const devHtmlPath = path.join(__dirname, "../client/index.html");
        html = fs.readFileSync(devHtmlPath, "utf-8");
      }
      html = html.replace(/<title>[^<]*<\/title>/, `<title>${pageTitle}</title>`);
      html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${pageDescription}">`);
      html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${pageTitle}">`);
      html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${pageDescription}">`);
      html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${pageUrl}">`);
      html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${pageUrl}">`);
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
      html = html.replace(/<\/head>/, `${additionalTags}
  </head>`);
      res.send(html);
    } catch (error) {
      console.error("Error serving country page:", error);
      res.status(500).send("Error loading page");
    }
  });
  const SUPPORTED_SECTORS = ["health", "education", "protection", "wash", "food-security", "logistics", "emergency-response"];
  const SECTOR_DISPLAY_NAMES = {
    "health": "Health",
    "education": "Education",
    "protection": "Protection",
    "wash": "WASH",
    "food-security": "Food Security",
    "logistics": "Logistics",
    "emergency-response": "Emergency Response"
  };
  const SECTOR_DESCRIPTIONS = {
    "health": "The health sector presents opportunities for medical professionals, public health specialists, and healthcare program managers.",
    "education": "Education programming offers opportunities in learning access, teacher training, and curriculum development.",
    "protection": "Protection work focuses on safeguarding vulnerable populations including refugees and displaced persons.",
    "wash": "Water, Sanitation, and Hygiene programming addresses critical infrastructure and behavior change.",
    "food-security": "Food security programming encompasses emergency food assistance and agriculture development.",
    "logistics": "Logistics roles involve supply chain management, procurement, and operational support.",
    "emergency-response": "Emergency response roles involve rapid assessment, program design, and crisis coordination."
  };
  app2.get("/jobs/sector/:sector", async (req, res) => {
    try {
      const sectorParam = req.params.sector.toLowerCase();
      if (!SUPPORTED_SECTORS.includes(sectorParam)) {
        return res.status(404).send("Sector not found");
      }
      const sectorName = SECTOR_DISPLAY_NAMES[sectorParam];
      const sectorDescription = SECTOR_DESCRIPTIONS[sectorParam];
      const allJobs = await storage.getAllJobs();
      const now = /* @__PURE__ */ new Date();
      const sectorJobs = allJobs.filter(
        (job) => job.sector && job.sector.toLowerCase().includes(sectorParam.replace("-", " ")) && (!job.type || job.type === "job") && job.status === "published" && job.visibility !== "private" && (!job.deadline || new Date(job.deadline) >= now)
      );
      const pageUrl = `https://somkenjobs.com/jobs/sector/${sectorParam}`;
      const pageTitle = `${sectorName} Jobs in East Africa | ${sectorJobs.length}+ Humanitarian Positions | Somken Jobs`;
      const pageDescription = `Find ${sectorJobs.length}+ ${sectorName.toLowerCase()} sector jobs across Kenya, Somalia, Ethiopia, Uganda, Tanzania. ${sectorDescription}`;
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const htmlPath = path.join(__dirname, "../dist/public/index.html");
      let html = "";
      try {
        html = fs.readFileSync(htmlPath, "utf-8");
      } catch (err) {
        const devHtmlPath = path.join(__dirname, "../client/index.html");
        html = fs.readFileSync(devHtmlPath, "utf-8");
      }
      html = html.replace(/<title>[^<]*<\/title>/, `<title>${pageTitle}</title>`);
      html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${pageDescription}">`);
      html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${pageTitle}">`);
      html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${pageDescription}">`);
      html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${pageUrl}">`);
      html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${pageUrl}">`);
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
      html = html.replace(/<\/head>/, `${additionalTags}
  </head>`);
      res.send(html);
    } catch (error) {
      console.error("Error serving sector page:", error);
      res.status(500).send("Error loading page");
    }
  });
  app2.get("/jobs-in-somalia", (_req, res) => res.redirect(301, "/jobs/country/somalia"));
  app2.get("/jobs-in-kenya", (_req, res) => res.redirect(301, "/jobs/country/kenya"));
  app2.get("/jobs/somalia", (_req, res) => res.redirect(301, "/jobs/country/somalia"));
  app2.get("/jobs/kenya", (_req, res) => res.redirect(301, "/jobs/country/kenya"));
  app2.get("/ngo-jobs-in-somalia", (_req, res) => res.redirect(301, "/ngo-jobs/somalia"));
  app2.get("/help", (_req, res) => res.redirect(301, "/help-center"));
  app2.get("/privacy", (_req, res) => res.redirect(301, "/privacy-policy"));
  app2.get("/terms", (_req, res) => res.redirect(301, "/terms-of-service"));
  const ngoTerms = ["ngo", "non-government", "non government", "humanitarian", "relief", "development", "un ", "unhcr", "unicef", "wfp", "who"];
  const isPublicCurrentJob = (job) => {
    const deadline = job.deadline ? new Date(job.deadline) : null;
    return (!job.type || job.type === "job") && job.status === "published" && job.visibility !== "private" && (!deadline || deadline >= /* @__PURE__ */ new Date());
  };
  const matchesNgoJob = (job) => {
    const haystack = `${job.title || ""} ${job.organization || ""} ${job.description || ""} ${job.source || ""}`.toLowerCase();
    return ngoTerms.some((term) => haystack.includes(term));
  };
  const readIndexTemplate = () => {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const htmlPath = path.join(__dirname, "../dist/public/index.html");
    try {
      return fs.readFileSync(htmlPath, "utf-8");
    } catch {
      const devHtmlPath = path.join(__dirname, "../client/index.html");
      return fs.readFileSync(devHtmlPath, "utf-8");
    }
  };
  const keywordLandingPages = {
    "/ngo-jobs": {
      title: "NGO Jobs in Somalia & Kenya | Humanitarian Careers | Somken Jobs",
      description: "Find NGO jobs, humanitarian vacancies, UN roles, and development careers across Somalia, Kenya, and East Africa. Updated with current openings from trusted sources.",
      canonicalPath: "/ngo-jobs",
      name: "NGO Jobs in Somalia, Kenya, and East Africa",
      about: ["NGO jobs", "humanitarian jobs", "UN jobs", "development jobs"],
      breadcrumbName: "NGO Jobs",
      filter: (job) => matchesNgoJob(job)
    },
    "/ngo-jobs/somalia": {
      title: "NGO Jobs in Somalia | UN & Humanitarian Vacancies | Somken Jobs",
      description: "Find current NGO jobs in Somalia, including humanitarian, UN, development, health, protection, WASH, logistics, and program vacancies.",
      canonicalPath: "/ngo-jobs/somalia",
      name: "NGO Jobs in Somalia",
      about: ["NGO jobs in Somalia", "UN jobs Somalia", "humanitarian jobs Somalia"],
      breadcrumbName: "NGO Jobs in Somalia",
      filter: (job) => job.country === "Somalia" && matchesNgoJob(job)
    }
  };
  app2.get(["/ngo-jobs", "/ngo-jobs/somalia"], async (req, res, next) => {
    try {
      const acceptHeader = req.get("Accept") || "";
      if (!acceptHeader.includes("text/html")) {
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
      html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml2(config.title)}</title>`);
      html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml2(config.description)}">`);
      html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHtml2(config.title)}">`);
      html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHtml2(config.description)}">`);
      html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${pageUrl}">`);
      html = html.replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${escapeHtml2(config.title)}">`);
      html = html.replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${escapeHtml2(config.description)}">`);
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
          { "@type": "ListItem", "position": 3, "name": config.breadcrumbName, "item": pageUrl }
        ]
      };
      const additionalTags = `
    <script type="application/ld+json">${jsonLd(structuredData)}</script>
    <script type="application/ld+json">${jsonLd(breadcrumbData)}</script>`;
      html = html.replace(/<\/head>/, `${additionalTags}
  </head>`);
      res.send(html);
    } catch (error) {
      console.error("Error serving keyword landing page:", error);
      res.status(500).send("Error loading page");
    }
  });
  app2.get("/tenders", async (req, res, next) => {
    try {
      const acceptHeader = req.get("Accept") || "";
      if (!acceptHeader.includes("text/html")) {
        return next();
      }
      const allJobs = await storage.getAllJobs();
      const tenders = allJobs.filter((job) => job.type === "tender");
      const pageUrl = "https://somkenjobs.com/tenders";
      const pageTitle = `Humanitarian Tenders in East Africa | ${tenders.length}+ Active Opportunities | Somken Jobs`;
      const pageDescription = `Browse ${tenders.length}+ humanitarian tenders across Kenya, Somalia, Ethiopia, Uganda, and Tanzania. Find procurement opportunities from UN agencies, NGOs, and international organizations.`;
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const htmlPath = path.join(__dirname, "../dist/public/index.html");
      let html = "";
      try {
        html = fs.readFileSync(htmlPath, "utf-8");
      } catch (err) {
        const devHtmlPath = path.join(__dirname, "../client/index.html");
        html = fs.readFileSync(devHtmlPath, "utf-8");
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
      html = html.replace(/<\/head>/, `${additionalTags}
  </head>`);
      res.send(html);
    } catch (error) {
      console.error("Error serving tenders page:", error);
      next();
    }
  });
  app2.get("/jobs/:id", async (req, res) => {
    try {
      const param = req.params.id;
      let jobId;
      if (/^\d+$/.test(param)) {
        jobId = parseInt(param);
      } else {
        const extractedId = extractJobIdFromSlug(param);
        if (!extractedId) {
          return res.status(404).send("Job not found");
        }
        jobId = extractedId;
      }
      if (isNaN(jobId) || jobId > 2147483647 || jobId < 1) {
        return res.status(404).send("Job not found");
      }
      const ssrToken = typeof req.query.token === "string" ? req.query.token : void 0;
      const job = await storage.getJobById(jobId, ssrToken);
      if (!job) {
        return res.status(404).send("Job not found");
      }
      const jobTitle = `${job.title} - ${job.organization}`;
      const deadline = job.deadline ? ` \u2022 Deadline: ${Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1e3 * 60 * 60 * 24))} days left` : "";
      const socialMediaText = generateSocialMediaText(job, deadline);
      const jobDescription = socialMediaText;
      const jobUrl = `https://somkenjobs.com/jobs/${job.id}`;
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
              ${job.title.length > 35 ? job.title.substring(0, 35) + "..." : job.title}
            </text>
            <text x="80" y="55" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" opacity="0.9">
              ${job.organization.length > 45 ? job.organization.substring(0, 45) + "..." : job.organization}
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
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const htmlPath = path.join(__dirname, "../dist/public/index.html");
      let html = "";
      try {
        html = fs.readFileSync(htmlPath, "utf-8");
      } catch (err) {
        const devHtmlPath = path.join(__dirname, "../client/index.html");
        html = fs.readFileSync(devHtmlPath, "utf-8");
      }
      html = html.replace(
        /<meta name="description" content="[^"]*">/,
        `<meta name="description" content="${jobDescription.replace(/"/g, "&quot;")}">`
      );
      html = html.replace(
        /<meta property="og:title" content="[^"]*">/,
        `<meta property="og:title" content="${jobTitle.replace(/"/g, "&quot;")}">`
      );
      html = html.replace(
        /<meta property="og:description" content="[^"]*">/,
        `<meta property="og:description" content="${jobDescription.replace(/"/g, "&quot;")}">`
      );
      html = html.replace(
        /<meta property="og:url" content="[^"]*">/,
        `<meta property="og:url" content="${jobUrl}">`
      );
      html = html.replace(
        /<link rel="canonical" href="[^"]*">/,
        `<link rel="canonical" href="${jobUrl}">`
      );
      html = html.replace(
        /<meta name="title" content="[^"]*">/,
        `<meta name="title" content="${jobTitle.replace(/"/g, "&quot;")}">`
      );
      html = html.replace(
        /<meta property="og:image" content="[^"]*">/,
        ``
      );
      html = html.replace(
        /<meta name="twitter:title" content="[^"]*">/,
        `<meta name="twitter:title" content="${jobTitle.replace(/"/g, "&quot;")}">`
      );
      html = html.replace(
        /<meta name="twitter:description" content="[^"]*">/,
        `<meta name="twitter:description" content="${jobDescription.replace(/"/g, "&quot;")}">`
      );
      html = html.replace(
        /<meta name="twitter:image" content="[^"]*">/,
        ``
      );
      html = html.replace(
        /<meta name="twitter:url" content="[^"]*">/,
        `<meta name="twitter:url" content="${jobUrl}">`
      );
      const twitterLabels = `
    <!-- Enhanced Twitter Cards for Job Previews -->
    <meta name="twitter:label1" content="Employer">
    <meta name="twitter:data1" content="${escapeHtml2(job.organization)}">
    <meta name="twitter:label2" content="Location">
    <meta name="twitter:data2" content="${escapeHtml2(job.location)}, ${escapeHtml2(job.country)}">
    ${job.deadline ? `<meta name="twitter:label3" content="Deadline">
    <meta name="twitter:data3" content="${Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1e3 * 60 * 60 * 24))} days left">` : ""}`;
      html = html.replace(
        /<\/head>/,
        `${twitterLabels}
  </head>`
      );
      html = html.replace(
        /<meta property="og:type" content="website">/,
        `<meta property="og:type" content="article">`
      );
      html = html.replace(
        /<title>[^<]*<\/title>/,
        `<title>${jobTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</title>`
      );
      const cleanHtmlContent = (html2) => {
        if (!html2) return "";
        return html2.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#\d+;/g, " ").replace(/\s+/g, " ").trim();
      };
      const safeHtml = (html2) => {
        if (!html2) return "";
        return sanitizeRichHtml(html2);
      };
      const applyUrl = safeUrl2(job.url);
      const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        });
      };
      const getDaysLeft = (deadline2) => {
        const deadlineDate = new Date(deadline2);
        const today = /* @__PURE__ */ new Date();
        const diffTime = deadlineDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
      };
      const serverRenderedContent = `
        <div class="min-h-screen bg-gray-50 py-8">
          <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-6">
              <a href="/" class="inline-flex items-center text-blue-600 hover:text-blue-700">
                \u2190 Back to Jobs
              </a>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm p-8">
              <div class="flex items-start justify-between mb-6">
                <div class="flex-1">
                  <h1 class="text-3xl font-bold text-gray-900 mb-4">${escapeHtml2(job.title)}</h1>
                  <div class="flex flex-wrap items-center gap-4 text-gray-600">
                    <div class="flex items-center">
                      <span class="font-medium">${escapeHtml2(job.organization)}</span>
                    </div>
                    <div class="flex items-center">
                      <span>${escapeHtml2(job.location)}, ${escapeHtml2(job.country)}</span>
                    </div>
                    ${job.sector ? `<span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">${escapeHtml2(job.sector)}</span>` : ""}
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2">
                  <div class="prose max-w-none">
                    <h2 class="text-xl font-semibold mb-4">Job Description</h2>
                    <div class="rich-text-content">${safeHtml(job.bodyHtml || job.description || "Job description not available.")}</div>
                    
                    ${job.qualifications ? `
                      <h2 class="text-xl font-semibold mb-4 mt-8">Qualifications & Requirements</h2>
                      <div class="rich-text-content">${safeHtml(job.qualifications)}</div>
                    ` : ""}
                    
                    ${job.howToApply ? `
                      <h2 class="text-xl font-semibold mb-4 mt-8">How to Apply</h2>
                      <div class="rich-text-content">${safeHtml(job.howToApply).replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1" class="text-blue-600 hover:text-blue-700">$1</a>')}</div>
                    ` : ""}
                    ${job.attachmentUrl ? (() => {
        try {
          const urls = job.attachmentUrl.startsWith("[") ? JSON.parse(job.attachmentUrl) : [job.attachmentUrl];
          return `<h2 class="text-xl font-semibold mb-4 mt-8">Attachments</h2>
                        <div class="space-y-2">${urls.map((url) => {
            const safeAttachmentUrl = safeUrl2(url) || (url.startsWith("/uploads/") ? url : "");
            if (!safeAttachmentUrl) return "";
            const name = escapeHtml2(url.split("/").pop()?.replace(/^\d+-/, "") || "Download");
            return `<div><a href="${safeAttachmentUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${name}</a></div>`;
          }).join("")}</div>`;
        } catch {
          return "";
        }
      })() : ""}
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
                      ` : ""}
                      <div>
                        <span class="font-medium">Organization:</span>
                        <span class="ml-2">${escapeHtml2(job.organization)}</span>
                      </div>
                      <div>
                        <span class="font-medium">Location:</span>
                        <span class="ml-2">${escapeHtml2(job.location)}, ${escapeHtml2(job.country)}</span>
                      </div>
                      ${job.sector ? `
                        <div>
                          <span class="font-medium">Sector:</span>
                          <span class="ml-2">${escapeHtml2(job.sector)}</span>
                        </div>
                      ` : ""}
                    </div>
                    
                    ${applyUrl ? `
                      <div class="mt-6">
                        <a href="${applyUrl}" target="_blank" rel="noopener noreferrer" 
                           class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors inline-block text-center">
                          Apply Now
                        </a>
                      </div>
                    ` : ""}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      html = html.replace(
        /<div id="root"><\/div>/,
        `<div id="root">${serverRenderedContent}</div>`
      );
      const cleanDescription = (() => {
        if (!job.description) {
          return `Join ${job.organization || "our humanitarian organization"} in their mission to provide humanitarian aid in ${job.location || "the field"}, ${job.country || "East Africa"}. This position offers the opportunity to make a meaningful impact in humanitarian work.`;
        }
        let cleaned = job.description.replace(/<[^>]*>/g, "").replace(/\*\*/g, "").replace(/\*/g, "").replace(/\n+/g, " ").replace(/\s+/g, " ").replace(/&[^;]+;/g, "").trim();
        if (cleaned.length > 800) {
          cleaned = cleaned.substring(0, 800);
          const lastPeriod = cleaned.lastIndexOf(".");
          const lastSpace = cleaned.lastIndexOf(" ");
          if (lastPeriod > 600) {
            cleaned = cleaned.substring(0, lastPeriod + 1);
          } else if (lastSpace > 600) {
            cleaned = cleaned.substring(0, lastSpace) + "...";
          } else {
            cleaned = cleaned + "...";
          }
        }
        return cleaned;
      })();
      const jobStructuredData = {
        "@context": "https://schema.org/",
        "@type": "JobPosting",
        "title": job.title.substring(0, 100),
        "description": cleanDescription,
        "datePosted": new Date(job.datePosted).toISOString().split("T")[0],
        "hiringOrganization": {
          "@type": "Organization",
          "name": job.organization || "Humanitarian Organization"
        },
        "jobLocation": {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": job.location || "Field Location",
            "addressCountry": job.country === "Kenya" ? "KE" : job.country === "Somalia" ? "SO" : job.country
          }
        }
      };
      if (job.deadline) {
        const deadlineDate = new Date(job.deadline);
        if (deadlineDate > /* @__PURE__ */ new Date()) {
          jobStructuredData.validThrough = deadlineDate.toISOString().split("T")[0];
        }
      }
      const title = job.title.toLowerCase();
      if (title.includes("consultant") || title.includes("contract")) {
        jobStructuredData.employmentType = "CONTRACTOR";
      } else if (title.includes("part-time")) {
        jobStructuredData.employmentType = "PART_TIME";
      } else if (title.includes("intern")) {
        jobStructuredData.employmentType = "INTERN";
      } else {
        jobStructuredData.employmentType = "FULL_TIME";
      }
      if (job.location && job.location.toLowerCase().includes("remote")) {
        jobStructuredData.jobLocationType = "TELECOMMUTE";
      } else {
        jobStructuredData.jobLocationType = "ON_SITE";
      }
      if (job.sector) {
        jobStructuredData.industry = job.sector;
        jobStructuredData.occupationalCategory = job.sector;
      }
      jobStructuredData.url = jobUrl;
      const structuredApplyUrl = safeUrl2(job.url);
      if (structuredApplyUrl) {
        jobStructuredData.applicationContact = {
          "@type": "ContactPoint",
          "contactType": "HR",
          "url": structuredApplyUrl
        };
      }
      if (job.externalId && job.source) {
        jobStructuredData.identifier = {
          "@type": "PropertyValue",
          "name": job.source,
          "value": job.externalId.toString()
        };
      }
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
      const shouldNoindex = job.visibility === "private" || !!ssrToken;
      const additionalMetaTags = `
    <!-- Job-specific meta tags for enhanced social media previews -->
    ${shouldNoindex ? '<meta name="robots" content="noindex, nofollow">' : ""}
    <meta property="article:published_time" content="${new Date(job.datePosted).toISOString()}">
    <meta property="article:section" content="${escapeHtml2(job.sector || "Humanitarian")}">
    <meta property="article:tag" content="${escapeHtml2(job.sector || "Humanitarian")}">
    <meta property="article:author" content="${escapeHtml2(job.organization)}">
    <meta property="job:location" content="${escapeHtml2(job.location)}, ${escapeHtml2(job.country)}">
    <meta property="job:company" content="${escapeHtml2(job.organization)}">
    ${job.deadline ? `<meta property="job:expires" content="${Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1e3 * 60 * 60 * 24))} days left">` : ""}
    <meta property="job:category" content="${escapeHtml2(job.sector || "Humanitarian")}">
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
${jsonLd(jobStructuredData)}
    </script>
    
    <!-- Breadcrumb Structured Data for enhanced search appearance -->
    <script type="application/ld+json">
${jsonLd(breadcrumbData)}
    </script>`;
      html = html.replace(
        /<\/head>/,
        `${additionalMetaTags}
  </head>`
      );
      res.send(html);
    } catch (error) {
      console.error("Error serving job page:", error);
      res.status(500).send("Error loading job page");
    }
  });
  const sitemapCache = { xml: null, generatedAt: null };
  app2.get("/sitemap.xml", async (req, res) => {
    try {
      res.setHeader("Content-Type", "application/xml");
      const ONE_HOUR = 60 * 60 * 1e3;
      if (sitemapCache.xml && sitemapCache.generatedAt && Date.now() - sitemapCache.generatedAt.getTime() < ONE_HOUR) {
        return res.send(sitemapCache.xml);
      }
      const allJobs = await storage.getAllJobsWithDetails();
      const sixMonthsAgo = /* @__PURE__ */ new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const nowDate = /* @__PURE__ */ new Date();
      const jobs2 = allJobs.filter((job) => {
        const datePosted = new Date(job.datePosted);
        const deadline = job.deadline ? new Date(job.deadline) : null;
        return datePosted >= sixMonthsAgo && (!job.type || job.type === "job") && job.status === "published" && job.visibility !== "private" && (!deadline || deadline >= nowDate);
      });
      console.log(`Generating sitemap with ${jobs2.length} jobs (from ${allJobs.length} total)`);
      const now = Date.now();
      const DAY = 24 * 60 * 60 * 1e3;
      const latestDate = (subset) => {
        if (!subset.length) return sixMonthsAgo.toISOString().split("T")[0];
        const max = subset.reduce((a, b) => new Date(a.datePosted) > new Date(b.datePosted) ? a : b);
        return new Date(max.datePosted).toISOString().split("T")[0];
      };
      const newestJobDate = latestDate(jobs2);
      const countries2 = ["Kenya", "Somalia", "Ethiopia", "Uganda", "Tanzania"];
      const sectors2 = ["Health", "Education", "Protection", "WASH", "Food Security", "Logistics", "Emergency Response"];
      const countryLatest = {};
      const sectorLatest = {};
      countries2.forEach((c) => {
        countryLatest[c] = latestDate(jobs2.filter((j) => j.country === c));
      });
      sectors2.forEach((s) => {
        sectorLatest[s] = latestDate(jobs2.filter((j) => j.sector === s));
      });
      const ngoLatest = latestDate(jobs2.filter(matchesNgoJob));
      const ngoSomaliaLatest = latestDate(jobs2.filter((j) => j.country === "Somalia" && matchesNgoJob(j)));
      const jobUrls = jobs2.map((job) => {
        const jobSlug = generateJobSlug(job.title, job.id);
        const lastmod = new Date(job.datePosted).toISOString().split("T")[0];
        const ageInDays = (now - new Date(job.datePosted).getTime()) / DAY;
        const changefreq = ageInDays <= 7 ? "daily" : ageInDays <= 30 ? "weekly" : "monthly";
        const priority = ageInDays <= 7 ? "0.9" : ageInDays <= 30 ? "0.8" : "0.6";
        return `  <url>
    <loc>https://somkenjobs.com/jobs/${jobSlug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
      }).join("\n");
      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://somkenjobs.com/</loc>
    <lastmod>${newestJobDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/jobs</loc>
    <lastmod>${newestJobDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/ngo-jobs</loc>
    <lastmod>${ngoLatest}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.88</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/ngo-jobs/somalia</loc>
    <lastmod>${ngoSomaliaLatest}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.88</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/tenders</loc>
    <lastmod>${newestJobDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/about</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/contact</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/career-resources</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/help-center</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/privacy-policy</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/terms-of-service</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/jobs/country/kenya</loc>
    <lastmod>${countryLatest["Kenya"]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/jobs/country/somalia</loc>
    <lastmod>${countryLatest["Somalia"]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/jobs/country/ethiopia</loc>
    <lastmod>${countryLatest["Ethiopia"]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/jobs/country/uganda</loc>
    <lastmod>${countryLatest["Uganda"]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/jobs/country/tanzania</loc>
    <lastmod>${countryLatest["Tanzania"]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/jobs/sector/health</loc>
    <lastmod>${sectorLatest["Health"]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/jobs/sector/education</loc>
    <lastmod>${sectorLatest["Education"]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/jobs/sector/protection</loc>
    <lastmod>${sectorLatest["Protection"]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/jobs/sector/wash</loc>
    <lastmod>${sectorLatest["WASH"]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/jobs/sector/food-security</loc>
    <lastmod>${sectorLatest["Food Security"]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/jobs/sector/logistics</loc>
    <lastmod>${sectorLatest["Logistics"]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://somkenjobs.com/jobs/sector/emergency-response</loc>
    <lastmod>${sectorLatest["Emergency Response"]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
${jobUrls}
</urlset>`;
      sitemapCache.xml = sitemapXml;
      sitemapCache.generatedAt = /* @__PURE__ */ new Date();
      res.send(sitemapXml);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });
  app2.get("/feed", async (req, res) => {
    try {
      res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
      const jobs2 = await storage.getAllJobs();
      const latestJobs = jobs2.slice(0, 50);
      const formatDate = (date) => {
        return new Date(date).toUTCString();
      };
      const escapeXml = (text2) => {
        return text2.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
      };
      const jobItems = latestJobs.map((job) => {
        const jobSlug = generateJobSlug(job.title, job.id);
        const jobUrl = `https://somkenjobs.com/jobs/${jobSlug}`;
        const description = job.description ? escapeXml(job.description.substring(0, 500)) + (job.description.length > 500 ? "..." : "") : "No description available";
        const deadlineInfo = job.deadline ? `Application Deadline: ${new Date(job.deadline).toLocaleDateString()}` : "";
        return `    <item>
      <title>${escapeXml(job.title)}</title>
      <link>${jobUrl}</link>
      <guid isPermaLink="true">${jobUrl}</guid>
      <pubDate>${formatDate(job.datePosted)}</pubDate>
      <description><![CDATA[
        <strong>Organization:</strong> ${escapeXml(job.organization)}<br/>
        <strong>Location:</strong> ${escapeXml(job.location)}, ${escapeXml(job.country)}<br/>
        ${job.sector ? `<strong>Sector:</strong> ${escapeXml(job.sector)}<br/>` : ""}
        ${deadlineInfo ? `<strong>${deadlineInfo}</strong><br/><br/>` : ""}
        ${description}
      ]]></description>
      <category>${escapeXml(job.country)}</category>
      ${job.sector ? `<category>${escapeXml(job.sector)}</category>` : ""}
      <source url="https://somkenjobs.com">Somken Jobs</source>
    </item>`;
      }).join("\n");
      const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Somken Jobs - East Africa Humanitarian Jobs</title>
    <link>https://somkenjobs.com</link>
    <description>Latest humanitarian job opportunities across Kenya, Somalia, Ethiopia, Uganda, and Tanzania from leading UN agencies, NGOs, and international organizations.</description>
    <language>en-us</language>
    <lastBuildDate>${(/* @__PURE__ */ new Date()).toUTCString()}</lastBuildDate>
    <pubDate>${latestJobs.length > 0 ? formatDate(latestJobs[0].datePosted) : (/* @__PURE__ */ new Date()).toUTCString()}</pubDate>
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
      console.error("Error generating RSS feed:", error);
      res.status(500).send("Error generating RSS feed");
    }
  });
  app2.get("/rss", async (req, res) => {
    res.redirect(301, "/feed");
  });
  app2.get("/download/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      const placeholderContent = `This is a placeholder for file: ${filename}

In production, this would download the actual file from secure storage.`;
      res.send(placeholderContent);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(404).json({ message: "File not found" });
    }
  });
  app2.get("/robots.txt", (req, res) => {
    res.setHeader("Content-Type", "text/plain");
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
RSS Feed: https://somkenjobs.com/feed`;
    res.send(robotsTxt);
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vercel-entry.ts
import fs2 from "fs";
import path2 from "path";
var app = express2();
app.disable("x-powered-by");
app.use((req, res, next) => {
  const host = req.headers.host;
  if (host && host.startsWith("www.")) {
    const nonWwwHost = host.substring(4);
    const protocol = req.headers["x-forwarded-proto"] || "https";
    return res.redirect(301, `${protocol}://${nonWwwHost}${req.originalUrl}`);
  }
  next();
});
app.use(express2.json({ limit: "10mb" }));
app.use(express2.urlencoded({ extended: false, limit: "10mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      const logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      console.log(logLine.length > 80 ? logLine.slice(0, 79) + "\u2026" : logLine);
    }
  });
  next();
});
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("Express error:", message);
  res.status(status).json({ message });
});
var initialized = false;
var initError = null;
var initPromise = null;
function doInitialize() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      await registerRoutes(app);
      const publicPathCandidates = [
        path2.join(process.cwd(), "dist", "public"),
        path2.join(process.cwd(), "api", "public")
      ];
      const publicPath = publicPathCandidates.find((candidate) => fs2.existsSync(candidate));
      if (publicPath) {
        app.use(express2.static(publicPath));
        app.use("*", (_req, res) => {
          res.sendFile(path2.join(publicPath, "index.html"));
        });
      } else {
        console.warn("Static files not found at", publicPathCandidates.join(" or "));
      }
      initialized = true;
      console.log("Server initialized successfully");
    } catch (err) {
      initError = err instanceof Error ? err : new Error(String(err));
      console.error("Server initialization failed:", initError.message, initError.stack);
      throw initError;
    }
  })();
  return initPromise;
}
async function handler(req, res) {
  if (!initialized) {
    try {
      await doInitialize();
    } catch (err) {
      return res.status(500).json({ message: "Server failed to start: " + (err.message || String(err)) });
    }
  }
  return app(req, res);
}
export {
  handler as default
};
