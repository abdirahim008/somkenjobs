import { useEffect } from "react";
import { type Job } from "@shared/schema";

interface JobStructuredDataProps {
  jobs: Job[];
}

export default function JobStructuredData({ jobs }: JobStructuredDataProps) {
  useEffect(() => {
    // Remove existing job structured data
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"][data-job-posting]');
    existingScripts.forEach(script => script.remove());

    // Add structured data for each job
    jobs.forEach(job => {
      const jobData = {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        "title": job.title,
        "description": job.description || "Join our humanitarian mission to make a difference in East Africa.",
        "identifier": {
          "@type": "PropertyValue",
          "name": job.source,
          "value": job.externalId
        },
        "datePosted": new Date(job.datePosted).toISOString(),
        "validThrough": job.deadline ? new Date(job.deadline).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        "employmentType": job.experience?.includes("Full-time") ? "FULL_TIME" : "CONTRACTOR",
        "hiringOrganization": {
          "@type": "Organization",
          "name": job.organization,
          "sameAs": job.url?.includes("reliefweb.int") ? job.url : `https://somkenjobs.com/organizations/${encodeURIComponent(job.organization)}`
        },
        "jobLocation": {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": job.location,
            "addressCountry": job.country
          }
        },
        "url": `https://somkenjobs.com/jobs/${job.id}`,
        "industry": job.sector || "Humanitarian Aid",
        "occupationalCategory": job.sector || "Humanitarian Work",
        "workHours": job.experience?.includes("Full-time") ? "40 hours per week" : "Contract basis",
        "qualifications": job.qualifications || "Relevant experience in humanitarian work",
        "responsibilities": job.responsibilities || "Support humanitarian operations in East Africa",
        "skills": job.sector ? [job.sector, "Humanitarian Aid", "Development Work"] : ["Humanitarian Aid", "Development Work"],
        "applicationContact": {
          "@type": "ContactPoint",
          "contactType": "HR",
          "url": job.url || `https://somkenjobs.com/jobs/${job.id}`
        }
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-job-posting', job.id.toString());
      script.textContent = JSON.stringify(jobData);
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