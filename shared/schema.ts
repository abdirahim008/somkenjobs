import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  organization: text("organization").notNull(),
  location: text("location").notNull(),
  country: text("country").notNull(),
  description: text("description").notNull(),
  url: text("url").notNull(),
  datePosted: timestamp("date_posted").notNull(),
  deadline: timestamp("deadline"),
  sector: text("sector"),
  source: text("source").notNull(), // 'reliefweb' or 'unjobs'
  externalId: text("external_id").notNull().unique(),
  // Additional detailed fields
  howToApply: text("how_to_apply"),
  experience: text("experience"),
  qualifications: text("qualifications"),
  responsibilities: text("responsibilities"),
  bodyHtml: text("body_html"),
  createdBy: integer("created_by"), // User ID who created the job (null for scraped jobs)
  status: text("status").notNull().default("published"), // 'draft' or 'published'
  type: text("type").notNull().default("job"), // 'job' or 'tender'
  attachmentUrl: text("attachment_url"), // URL to uploaded attachment file for tenders
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
}).extend({
  // Make these fields optional for user-created jobs
  url: z.string().optional(),
  source: z.string().optional(), 
  externalId: z.string().optional(),
  datePosted: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional(),
  deadline: z.union([z.date(), z.string().transform((str) => new Date(str)), z.null()]).optional(),
  // Allow bodyHtml to be optional since it's for scraped jobs
  bodyHtml: z.string().optional(),
  // Add validation for type field
  type: z.enum(["job", "tender"]).default("job"),
  // Attachment URL is optional
  attachmentUrl: z.string().optional(),
});

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

// User schema for employers/recruiters with admin approval
export const users = pgTable("users", {
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isApproved: true,
  isAdmin: true,
  approvedAt: true,
  approvedBy: true,
  createdAt: true,
  updatedAt: true,
});

export const loginUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;

// Invoice schema for employers to generate invoices for published jobs
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  title: text("title").default("Job Posting Services"),
  description: text("description"),
  pricePerJob: text("price_per_job").notNull(), // Store as text to avoid decimal issues
  totalJobs: integer("total_jobs").notNull().default(0),
  totalAmount: text("total_amount").notNull(), // Store as text to avoid decimal issues
  selectedJobIds: text("selected_job_ids").notNull().default("[]"), // Store as JSON string
  status: text("status").notNull().default("draft"),
  clientOrganization: text("client_organization").default("Client Organization"),
  clientEmail: text("client_email"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  invoiceNumber: true,
  title: true,
  totalJobs: true,
  totalAmount: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
