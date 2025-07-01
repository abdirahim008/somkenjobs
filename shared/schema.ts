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
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
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
