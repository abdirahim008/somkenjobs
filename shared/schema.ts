import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
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
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
});

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

// Keep user schema for potential future use
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
