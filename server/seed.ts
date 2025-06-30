import { storage } from "./storage";
import { type InsertJob } from "@shared/schema";

export async function seedDatabase(): Promise<void> {
  console.log("Seeding database with sample jobs...");
  
  const sampleJobs: InsertJob[] = [
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
      title: "Education Specialist",
      organization: "UNICEF",
      location: "Kisumu",
      country: "Kenya",
      description: "Develop and implement education programs for children in crisis-affected areas. Focus on ensuring access to quality education and child protection services.",
      url: "https://unicef.org/careers/education-specialist-kenya",
      datePosted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
      sector: "Education",
      source: "unjobs",
      externalId: "sample-unicef-1"
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
    {
      title: "Protection Officer",
      organization: "UNHCR",
      location: "Dadaab",
      country: "Kenya",
      description: "Provide protection services to refugees and asylum seekers. Conduct protection assessments, case management, and community-based protection activities.",
      url: "https://unhcr.org/jobs/protection-officer-dadaab",
      datePosted: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
      sector: "Protection",
      source: "unjobs",
      externalId: "sample-unhcr-1"
    }
  ];

  for (const jobData of sampleJobs) {
    try {
      // Check if job already exists
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