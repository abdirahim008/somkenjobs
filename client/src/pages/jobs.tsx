import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Calendar, Clock, ArrowRight, Briefcase, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import Sidebar from "@/components/Sidebar";
import SEOHead from "@/components/SEOHead";
import { type Job } from "@shared/schema";

export default function Jobs() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    country: ["Kenya", "Somalia"],
    organization: [],
    sector: [],
    datePosted: "",
  });
  const [sortBy, setSortBy] = useState("newest");

  const { data: jobsData, isLoading } = useQuery({
    queryKey: ["/api/jobs", { ...filters, search: searchTerm }],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Add filters
      if (filters.country.length > 0) {
        filters.country.forEach(c => params.append("country", c));
      }
      if (filters.organization.length > 0) {
        filters.organization.forEach(o => params.append("organization", o));
      }
      if (filters.sector.length > 0) {
        filters.sector.forEach(s => params.append("sector", s));
      }
      if (filters.datePosted) {
        params.append("datePosted", filters.datePosted);
      }
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }
      return response.json();
    },
  });

  // Filter jobs to show only job type (not tenders)
  const jobs = jobsData?.jobs?.filter((job: Job) => !(job as any).type || (job as any).type === 'job') || [];

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const formatDeadline = (dateString: string) => {
    const deadline = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 0) return "Expired";
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1 day left";
    return `${diffInDays} days left`;
  };

  const getSectorBadgeColor = (sector: string) => {
    const colors = {
      "Health": "bg-red-100 text-red-800",
      "Education": "bg-blue-100 text-blue-800",
      "Protection": "bg-purple-100 text-purple-800",
      "WASH": "bg-cyan-100 text-cyan-800",
      "Food Security": "bg-green-100 text-green-800",
      "Emergency Response": "bg-orange-100 text-orange-800",
      "Logistics": "bg-yellow-100 text-yellow-800",
      "Coordination": "bg-indigo-100 text-indigo-800",
      "Other": "bg-gray-100 text-gray-800",
    };
    return colors[sector as keyof typeof colors] || colors.Other;
  };

  const getSourceBadgeColor = (source: string) => {
    return source === "reliefweb" 
      ? "bg-blue-100 text-blue-800" 
      : "bg-green-100 text-green-800";
  };

  const handleJobClick = (jobId: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLocation(`/jobs/${jobId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Jobs in Somalia & Kenya | Somken Jobs - Humanitarian Careers"
        description="Find job opportunities in Somalia and Kenya with leading humanitarian organizations. Browse NGO positions, UN jobs, and development careers. Updated daily from ReliefWeb."
        keywords="jobs in Somalia, jobs in Kenya, humanitarian jobs, NGO careers, UN jobs, ReliefWeb jobs, development careers, aid worker jobs"
        canonicalUrl="https://somkenjobs.com/jobs"
      />
      
      <Header />
      
      <main className="main-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Find Your Next Job Opportunity
            </h1>
            <p className="hero-subtitle">
              Discover meaningful career opportunities with leading humanitarian organizations across Somalia and Kenya
            </p>
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </div>
        </section>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 mt-6 lg:mt-8">
          {/* Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24">
              <Sidebar 
                filters={filters} 
                onFilterChange={handleFilterChange}
                availableFilters={jobsData?.filters}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Job Listings */}
          <div className="flex-1 lg:max-w-4xl">
            <div className="card-content-responsive">
              {/* Jobs Header */}
              <div className="mb-6">
                <div className="flex flex-col space-y-4">
                  <h2 className="text-2xl font-bold text-foreground">
                    Latest Job Opportunities
                  </h2>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <p className="text-muted-foreground">
                        {isLoading ? "Loading..." : `${jobs.length} job${jobs.length !== 1 ? 's' : ''} found`}
                      </p>
                    </div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    >
                      <option value="newest">Newest First</option>
                      <option value="deadline">Deadline</option>
                      <option value="organization">Organization</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Mobile Filters */}
              <div className="lg:hidden mb-6">
                <Sidebar 
                  filters={filters} 
                  onFilterChange={handleFilterChange}
                  availableFilters={jobsData?.filters}
                  isLoading={isLoading}
                />
              </div>

              {/* Job Cards */}
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-4">Loading jobs...</p>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No jobs found matching your criteria.</p>
                  </div>
                ) : (
                  jobs.map((job: Job) => (
                    <Card 
                      key={job.id} 
                      className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-primary mobile-job-card"
                      onClick={() => handleJobClick(job.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Briefcase className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <Badge variant="secondary" className="text-xs">Job</Badge>
                            </div>
                            <CardTitle className="text-base sm:text-lg md:text-xl font-bold mb-3 line-clamp-2 break-words">
                              {job.title}
                            </CardTitle>
                            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center break-all">
                                <Building2 className="mr-2 h-4 w-4 flex-shrink-0" />
                                <span className="truncate-org">{job.organization}</span>
                              </span>
                              <span className="flex items-center">
                                <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                                <span className="break-words">{job.location}, {job.country}</span>
                              </span>
                              <span className="flex items-center">
                                <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                                <span className="whitespace-nowrap">{formatDate(job.datePosted)}</span>
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="sm:ml-4 flex-shrink-0 w-full sm:w-auto"
                          >
                            <span className="sm:hidden">View Details</span>
                            <span className="hidden sm:inline">View Details</span>
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-2">
                            {job.sector && (
                              <Badge className={`badge ${getSectorBadgeColor(job.sector)}`}>
                                {job.sector}
                              </Badge>
                            )}
                            <Badge className={`badge ${getSourceBadgeColor(job.source)}`}>
                              {job.source === "reliefweb" ? "ReliefWeb" : "Internal"}
                            </Badge>
                          </div>
                          {job.deadline && (
                            <div className="flex items-center text-sm">
                              <Clock className="mr-1 h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="font-medium text-red-600 whitespace-nowrap">
                                {formatDeadline(job.deadline)}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}