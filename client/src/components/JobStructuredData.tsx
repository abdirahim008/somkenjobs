import React, { useEffect } from "react";
import { type Job } from "@shared/schema";
import { generateJobSlug } from "@shared/utils";

interface JobStructuredDataProps {
  jobs: Job[];
}

export default function JobStructuredData({ jobs }: JobStructuredDataProps) {
  useEffect(() => {
    // Remove existing job structured data
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"][data-job-posting]');
    existingScripts.forEach(script => script.remove());

    // Add structured data for each job - Google Jobs 2025 compliant
    jobs.forEach(job => {
      // Create clean description (required by Google)
      const cleanDescription = job.description 
        ? job.description.replace(/<[^>]*>/g, '').substring(0, 5000)
        : `Join ${job.organization || 'our humanitarian organization'} in their mission to provide humanitarian aid in ${job.location || 'the field'}, ${job.country || 'East Africa'}. This position offers the opportunity to make a meaningful impact in humanitarian work.`;

      // Build Google Jobs compliant schema
      const jobData: any = {
        "@context": "https://schema.org/",
        "@type": "JobPosting",
        
        // Required fields with proper formatting
        "title": job.title.substring(0, 100), // Google limit
        "description": cleanDescription,
        "datePosted": new Date(job.datePosted).toISOString().split('T')[0], // YYYY-MM-DD format
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

      // Optional fields - only add if data exists
      if (job.deadline) {
        const deadlineDate = new Date(job.deadline);
        if (deadlineDate > new Date()) {
          jobData.validThrough = deadlineDate.toISOString().split('T')[0];
        }
      }

      // Employment type mapping
      const title = job.title.toLowerCase();
      if (title.includes('consultant') || title.includes('contract')) {
        jobData.employmentType = "CONTRACTOR";
      } else if (title.includes('part-time')) {
        jobData.employmentType = "PART_TIME";
      } else if (title.includes('intern')) {
        jobData.employmentType = "INTERN";
      } else {
        jobData.employmentType = "FULL_TIME";
      }

      // Job location type
      if (job.location && job.location.toLowerCase().includes('remote')) {
        jobData.jobLocationType = "TELECOMMUTE";
      } else {
        jobData.jobLocationType = "ON_SITE";
      }

      // Industry classification
      if (job.sector) {
        jobData.industry = job.sector;
        jobData.occupationalCategory = job.sector;
      }

      // Qualifications and experience
      if (job.qualifications && job.qualifications.trim()) {
        jobData.qualifications = job.qualifications.substring(0, 1000);
      }

      if (job.experience && job.experience.trim()) {
        jobData.experienceRequirements = {
          "@type": "OccupationalExperienceRequirements",
          "monthsOfExperience": job.experience.includes('0-2') ? "0" : 
                               job.experience.includes('3-5') ? "36" :
                               job.experience.includes('5+') ? "60" : "12"
        };
      }

      // Canonical URL
      jobData.url = `https://somkenjobs.com/jobs/${generateJobSlug(job.title, job.id)}`;

      // Application instructions
      if (job.url) {
        jobData.applicationContact = {
          "@type": "ContactPoint",
          "contactType": "HR",
          "url": job.url
        };
      }

      // External identifier
      if (job.externalId && job.source) {
        jobData.identifier = {
          "@type": "PropertyValue",
          "name": job.source,
          "value": job.externalId.toString()
        };
      }

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-job-posting', job.id.toString());
      script.textContent = JSON.stringify(jobData, null, 0);
      document.head.appendChild(script);
    });

    // Cleanup function
    return () => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"][data-job-posting]');
      scripts.forEach(script => script.remove());
    };
  }, [jobs]);

  return null;
}