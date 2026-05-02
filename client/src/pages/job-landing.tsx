import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { Briefcase, Building2, MapPin, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JobCard from "@/components/JobCard";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Job } from "@shared/schema";

interface JobsResponse {
  jobs: Job[];
  stats: {
    totalJobs: number;
    organizations: number;
    newToday: number;
  };
}

type LandingKind = "country" | "ngo" | "ngo-country" | "sector";

type LandingConfig = {
  kind: LandingKind;
  title: string;
  h1: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  query: Record<string, string | string[]>;
  contentTitle: string;
  contentBody: string;
  relatedLinks: Array<{ label: string; href: string }>;
};

const countryNames: Record<string, string> = {
  kenya: "Kenya",
  somalia: "Somalia",
  ethiopia: "Ethiopia",
  uganda: "Uganda",
  tanzania: "Tanzania",
};

const sectorNames: Record<string, string> = {
  health: "Health",
  education: "Education",
  protection: "Protection",
  wash: "WASH",
  "food-security": "Food Security",
  logistics: "Logistics",
  "emergency-response": "Emergency Response",
};

function useLandingConfig(): LandingConfig {
  const [, countryRoute] = useRoute("/jobs/country/:country");
  const [, sectorRoute] = useRoute("/jobs/sector/:sector");
  const [ngoSomaliaMatch] = useRoute("/ngo-jobs/somalia");
  const [ngoMatch] = useRoute("/ngo-jobs");

  if (countryRoute?.country && countryNames[countryRoute.country.toLowerCase()]) {
    return countryConfig(countryRoute.country.toLowerCase());
  }

  if (sectorRoute?.sector && sectorNames[sectorRoute.sector.toLowerCase()]) {
    return sectorConfig(sectorRoute.sector.toLowerCase());
  }

  if (ngoSomaliaMatch) {
    return ngoSomaliaConfig();
  }

  if (ngoMatch) {
    return ngoConfig();
  }

  return ngoConfig();
}

function countryConfig(countryKey: string, canonicalPath = `/jobs/country/${countryKey}`): LandingConfig {
  const country = countryNames[countryKey];
  const focus =
    countryKey === "somalia"
      ? "NGO jobs in Somalia, UN jobs in Somalia, humanitarian vacancies in Mogadishu, Hargeisa, Kismayo, and Baidoa"
      : countryKey === "kenya"
        ? "jobs in Kenya, NGO jobs in Kenya, UN jobs in Nairobi, humanitarian vacancies in Nairobi, Mombasa, Kisumu, and Dadaab"
        : `humanitarian jobs in ${country}, NGO jobs in ${country}, UN jobs in ${country}`;

  return {
    kind: "country",
    title: `Jobs in ${country} | NGO & Humanitarian Jobs | Somken Jobs`,
    h1: `Jobs in ${country}`,
    description: `Find current NGO, UN, humanitarian, and development jobs in ${country}. Browse verified vacancies from relief agencies, international organizations, and development employers.`,
    keywords: `${focus}, development jobs, aid worker jobs, Somken Jobs`,
    canonicalUrl: `https://somkenjobs.com${canonicalPath}`,
    query: { country },
    contentTitle: `Find NGO and humanitarian jobs in ${country}`,
    contentBody: `${country} job seekers use Somken Jobs to find current humanitarian, NGO, UN, development, health, protection, education, logistics, and WASH roles. Listings are refreshed from trusted job sources and employer posts, with each opening linking to a detailed job page and official application instructions where available.`,
    relatedLinks: [
      { label: "NGO Jobs", href: "/ngo-jobs" },
      { label: "NGO Jobs in Somalia", href: "/ngo-jobs/somalia" },
      { label: "Jobs in Kenya", href: "/jobs/country/kenya" },
      { label: "Jobs in Somalia", href: "/jobs/country/somalia" },
      { label: "Health Jobs", href: "/jobs/sector/health" },
      { label: "Protection Jobs", href: "/jobs/sector/protection" },
    ],
  };
}

function sectorConfig(sectorKey: string): LandingConfig {
  const sector = sectorNames[sectorKey];
  return {
    kind: "sector",
    title: `${sector} Jobs in East Africa | NGO Jobs | Somken Jobs`,
    h1: `${sector} Jobs in East Africa`,
    description: `Browse current ${sector.toLowerCase()} jobs with NGOs, UN agencies, and development organizations across Somalia, Kenya, and East Africa.`,
    keywords: `${sector} jobs, NGO ${sector.toLowerCase()} jobs, humanitarian jobs, jobs in Somalia, jobs in Kenya`,
    canonicalUrl: `https://somkenjobs.com/jobs/sector/${sectorKey}`,
    query: { sector },
    contentTitle: `${sector} roles with humanitarian and development organizations`,
    contentBody: `This page collects active ${sector.toLowerCase()} opportunities across Somalia, Kenya, and neighboring East African countries. Use it to compare employers, locations, deadlines, and sectors before opening the full job page for application details.`,
    relatedLinks: [
      { label: "Jobs in Somalia", href: "/jobs/country/somalia" },
      { label: "Jobs in Kenya", href: "/jobs/country/kenya" },
      { label: "NGO Jobs", href: "/ngo-jobs" },
      { label: "Education Jobs", href: "/jobs/sector/education" },
      { label: "WASH Jobs", href: "/jobs/sector/wash" },
      { label: "Logistics Jobs", href: "/jobs/sector/logistics" },
    ],
  };
}

function ngoConfig(): LandingConfig {
  return {
    kind: "ngo",
    title: "NGO Jobs in Somalia & Kenya | Humanitarian Careers",
    h1: "NGO Jobs in Somalia, Kenya, and East Africa",
    description: "Find NGO jobs, humanitarian vacancies, UN roles, and development careers across Somalia, Kenya, and East Africa. Updated with current openings from trusted sources.",
    keywords: "NGO jobs, NGO jobs in Somalia, jobs in Somalia, jobs in Kenya, humanitarian jobs, UN jobs, development jobs",
    canonicalUrl: "https://somkenjobs.com/ngo-jobs",
    query: { search: "NGO" },
    contentTitle: "Current NGO jobs and humanitarian careers",
    contentBody: "Somken Jobs helps candidates discover NGO jobs across Somalia, Kenya, and the wider East Africa region. The listings include humanitarian program roles, field operations, protection, health, WASH, education, logistics, grants, monitoring and evaluation, and coordination positions from international and local organizations.",
    relatedLinks: [
      { label: "NGO Jobs in Somalia", href: "/ngo-jobs/somalia" },
      { label: "Jobs in Somalia", href: "/jobs/country/somalia" },
      { label: "Jobs in Kenya", href: "/jobs/country/kenya" },
      { label: "Health Jobs", href: "/jobs/sector/health" },
      { label: "Protection Jobs", href: "/jobs/sector/protection" },
      { label: "All Jobs", href: "/jobs" },
    ],
  };
}

function ngoSomaliaConfig(): LandingConfig {
  return {
    kind: "ngo-country",
    title: "NGO Jobs in Somalia | UN & Humanitarian Vacancies",
    h1: "NGO Jobs in Somalia",
    description: "Find current NGO jobs in Somalia, including humanitarian, UN, development, health, protection, WASH, logistics, and program vacancies.",
    keywords: "NGO jobs in Somalia, jobs in Somalia, Somalia NGO vacancies, UN jobs Somalia, humanitarian jobs Somalia, Mogadishu jobs",
    canonicalUrl: "https://somkenjobs.com/ngo-jobs/somalia",
    query: { country: "Somalia", search: "NGO" },
    contentTitle: "Somalia NGO vacancies and humanitarian roles",
    contentBody: "This page focuses on NGO and humanitarian jobs in Somalia, including Mogadishu, Hargeisa, Kismayo, Baidoa, and field locations. Job seekers can browse current program, operations, grants, health, education, protection, and logistics openings from international NGOs, UN agencies, and development organizations.",
    relatedLinks: [
      { label: "Jobs in Somalia", href: "/jobs/country/somalia" },
      { label: "NGO Jobs", href: "/ngo-jobs" },
      { label: "Jobs in Kenya", href: "/jobs/country/kenya" },
      { label: "Health Jobs in East Africa", href: "/jobs/sector/health" },
      { label: "Protection Jobs", href: "/jobs/sector/protection" },
      { label: "All Jobs", href: "/jobs" },
    ],
  };
}

function filterFallbackJobs(jobs: Job[], config: LandingConfig): Job[] {
  if (config.kind === "ngo") {
    const terms = ["ngo", "non-government", "non government", "humanitarian", "relief", "development", "un ", "unhcr", "unicef", "wfp", "who"];
    return jobs.filter((job) => {
      const haystack = `${job.title} ${job.organization} ${job.description} ${job.source}`.toLowerCase();
      return terms.some((term) => haystack.includes(term));
    });
  }

  if (config.kind === "ngo-country") {
    const terms = ["ngo", "non-government", "non government", "humanitarian", "relief", "development", "un ", "unhcr", "unicef", "wfp", "who"];
    return jobs.filter((job) => {
      const haystack = `${job.title} ${job.organization} ${job.description} ${job.source}`.toLowerCase();
      return job.country === "Somalia" && terms.some((term) => haystack.includes(term));
    });
  }

  return jobs;
}

export default function JobLanding() {
  const config = useLandingConfig();

  const { data, isLoading } = useQuery<JobsResponse>({
    queryKey: ["/api/jobs", config.query],
    staleTime: 10 * 60 * 1000,
  });

  const jobs = useMemo(() => {
    const allJobs = data?.jobs?.filter((job) => !job.type || job.type === "job") || [];
    return filterFallbackJobs(allJobs, config);
  }, [data?.jobs, config]);

  const visibleJobs = jobs.slice(0, 20);
  const organizations = new Set(jobs.map((job) => job.organization)).size;
  const countries = Array.from(new Set(jobs.map((job) => job.country))).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={config.title}
        description={config.description}
        keywords={config.keywords}
        canonicalUrl={config.canonicalUrl}
        pageType="search"
        optimizeTitleAndDescription={false}
      />
      <Header />

      <section className="bg-[#0077B5] text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <Badge className="bg-white/15 text-white border-white/30 mb-4">Somken Jobs</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{config.h1}</h1>
            <p className="text-white/90 text-lg leading-relaxed">{config.description}</p>
            <div className="flex flex-wrap gap-4 mt-6 text-sm">
              <span className="inline-flex items-center gap-2"><Briefcase className="h-4 w-4" /> {jobs.length || 0} current listings</span>
              <span className="inline-flex items-center gap-2"><Building2 className="h-4 w-4" /> {organizations || 0} employers</span>
              {countries.length > 0 && <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {countries.join(", ")}</span>}
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Latest Openings</h2>
              <p className="text-muted-foreground">
                {isLoading ? "Loading current opportunities..." : `Showing ${visibleJobs.length} of ${jobs.length} matching jobs.`}
              </p>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="job-card animate-pulse">
                    <div className="h-6 bg-muted rounded mb-3" />
                    <div className="h-4 bg-muted rounded w-2/3 mb-4" />
                    <div className="h-16 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : visibleJobs.length > 0 ? (
              <div className="space-y-4">
                {visibleJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-10 text-center">
                  <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium">No matching jobs found right now.</p>
                  <p className="text-muted-foreground text-sm mt-2">Browse all jobs or check back after the next update.</p>
                  <Button asChild className="mt-4">
                    <Link href="/jobs">Browse All Jobs</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{config.contentTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{config.contentBody}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Related Searches</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {config.relatedLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="block text-sm text-primary hover:underline">
                    {link.label}
                  </Link>
                ))}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
