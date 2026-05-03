import { type Job } from "@shared/schema";
import { generateJobSlug } from "@shared/utils";
import { sanitizeRichHtml } from "./sanitizeHtml";

const SITE_URL = "https://somkenjobs.com";

const COUNTRY_CODES: Record<string, string> = {
  Ethiopia: "ET",
  Kenya: "KE",
  Somalia: "SO",
  Somaliland: "SO",
  Tanzania: "TZ",
  Uganda: "UG",
};

const escapeHtml = (text: string | null | undefined): string =>
  String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const stripHtml = (text: string | null | undefined): string =>
  String(text || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeHtmlBlock = (label: string, value: string | null | undefined): string => {
  const cleaned = sanitizeRichHtml(String(value || "")).trim();
  if (!cleaned) return "";

  if (/<(p|ul|ol|li|br)\b/i.test(cleaned)) {
    return `<p><strong>${escapeHtml(label)}</strong></p>${cleaned}`;
  }

  const paragraphs = cleaned
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p>${escapeHtml(part).replace(/\n/g, "<br>")}</p>`)
    .join("");

  return `<p><strong>${escapeHtml(label)}</strong></p>${paragraphs}`;
};

export const getJobCanonicalUrl = (job: Pick<Job, "id" | "title">): string =>
  `${SITE_URL}/jobs/${generateJobSlug(job.title, job.id)}`;

export const isExpiredJob = (job: Pick<Job, "deadline">, now = new Date()): boolean =>
  !!job.deadline && new Date(job.deadline) < now;

export const isGoogleIndexableJob = (job: Pick<Job, "status" | "type" | "visibility" | "deadline">): boolean =>
  job.status === "published" &&
  job.type === "job" &&
  job.visibility !== "private" &&
  !isExpiredJob(job);

export const getJobLastModified = (job: Pick<Job, "datePosted" | "createdAt">): string => {
  const candidates = [job.createdAt, job.datePosted]
    .filter(Boolean)
    .map((value) => new Date(value as Date | string))
    .filter((date) => !Number.isNaN(date.getTime()));

  const latest = candidates.reduce((max, date) => (date > max ? date : max), new Date(0));
  return (latest.getTime() > 0 ? latest : new Date()).toISOString();
};

export const getJobPostingDescriptionHtml = (job: Job): string => {
  const parts = [
    normalizeHtmlBlock("Job description", job.bodyHtml || job.description),
    normalizeHtmlBlock("Responsibilities", job.responsibilities),
    normalizeHtmlBlock("Qualifications", job.qualifications),
    normalizeHtmlBlock("Experience", job.experience),
    normalizeHtmlBlock("How to apply", job.howToApply),
  ].filter(Boolean);

  if (parts.length) return parts.join("");

  return `<p>Join ${escapeHtml(job.organization)} in ${escapeHtml(job.location)}, ${escapeHtml(job.country)}. This role is listed on Somken Jobs for applicants seeking verified humanitarian and development opportunities.</p>`;
};

export const getEmploymentType = (job: Pick<Job, "title" | "description">): string => {
  const text = `${job.title} ${stripHtml(job.description)}`.toLowerCase();
  if (text.includes("intern")) return "INTERN";
  if (text.includes("part-time") || text.includes("part time")) return "PART_TIME";
  if (text.includes("temporary") || text.includes("consultant") || text.includes("consultancy") || text.includes("contract")) return "CONTRACTOR";
  return "FULL_TIME";
};

export const getCountryCode = (country: string): string =>
  COUNTRY_CODES[country] || country;

export const generateJobPostingData = (job: Job): Record<string, unknown> => {
  const jobUrl = getJobCanonicalUrl(job);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description: getJobPostingDescriptionHtml(job),
    datePosted: new Date(job.datePosted).toISOString(),
    employmentType: getEmploymentType(job),
    hiringOrganization: {
      "@type": "Organization",
      name: job.organization || "confidential",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location || job.country || "Field Location",
        addressCountry: getCountryCode(job.country),
      },
    },
    url: jobUrl,
    identifier: {
      "@type": "PropertyValue",
      name: job.source || "somkenjobs",
      value: job.externalId || String(job.id),
    },
  };

  if (job.deadline) {
    data.validThrough = new Date(job.deadline).toISOString();
  }

  if (job.sector) {
    data.industry = job.sector;
    data.occupationalCategory = job.sector;
  }

  if (job.location?.toLowerCase().includes("remote")) {
    data.jobLocationType = "TELECOMMUTE";
    data.applicantLocationRequirements = {
      "@type": "Country",
      name: job.country || "East Africa",
    };
  }

  return data;
};

export const generateJobPostingJsonLd = (job: Job): string =>
  JSON.stringify(generateJobPostingData(job)).replace(/</g, "\\u003c");
