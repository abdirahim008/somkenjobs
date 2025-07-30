import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import Sidebar from "@/components/Sidebar";
import JobCard from "@/components/JobCard";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import JobStructuredData from "@/components/JobStructuredData";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Grid, List, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { type Job } from "@shared/schema";

interface JobsResponse {
  jobs: Job[];
  stats: {
    totalJobs: number;
    organizations: number;
    newToday: number;
  };
  filters: {
    countries: string[];
    organizations: string[];
    sectors: string[];
  };
}

interface Filters {
  country: string[];
  organization: string[];
  sector: string[];
  datePosted?: string;
  search?: string;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState<Filters>({
    country: [],
    organization: [],
    sector: [],
  });
  const [sortBy, setSortBy] = useState("mostRecent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [displayCount, setDisplayCount] = useState(8); // Show fewer jobs initially for faster loading

  const { data, isLoading, refetch } = useQuery<JobsResponse>({
    queryKey: ['/api/jobs', filters],
    refetchInterval: false, // Disable automatic refetch for low bandwidth
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
  });

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleSearch = (searchTerm: string) => {
    console.log("handleSearch called with:", searchTerm);
    setFilters(prev => ({ ...prev, search: searchTerm }));
  };

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 10);
  };

  const displayedJobs = data?.jobs.slice(0, displayCount) || [];
  const hasMoreJobs = (data?.jobs.length || 0) > displayCount;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="East Africa Jobs - 500+ Humanitarian Opportunities in Kenya, Somalia, Ethiopia, Uganda & Tanzania | Somken Jobs"
        description={`Discover ${data?.stats.totalJobs || '500+'} humanitarian jobs across East Africa in Kenya, Somalia, Ethiopia, Uganda, and Tanzania. Find careers with leading NGOs, UN agencies, and development organizations in Nairobi, Mogadishu, Addis Ababa, Kampala, Dar es Salaam. Updated daily from ReliefWeb with comprehensive job listings from WHO, UNHCR, Save the Children, and ${data?.stats.organizations || '200+'} employers.`}
        keywords="East Africa jobs, jobs in Somalia, jobs in Kenya, jobs in Ethiopia, jobs in Uganda, jobs in Tanzania, humanitarian jobs East Africa, NGO jobs, UN careers, aid worker positions, international development jobs, ReliefWeb jobs, Nairobi jobs, Mogadishu jobs, Addis Ababa jobs, Kampala jobs, Dar es Salaam jobs"
        canonicalUrl="https://somkenjobs.com/"
      />
      {/* Add structured data for job postings */}
      <JobStructuredData jobs={displayedJobs} />
      <Header />
      


      {/* Hero Section */}
      <section className="bg-[#0077B5] text-white py-12">
        <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              East Africa Jobs - 500+ Humanitarian Career Opportunities
            </h1>
            <p className="text-white/90 text-lg max-w-4xl mx-auto">
              Find jobs across Kenya, Somalia, Ethiopia, Uganda, and Tanzania with leading NGOs, UN agencies, and humanitarian organizations. Browse {data?.stats.totalJobs || '500+'} current opportunities updated daily from ReliefWeb.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Quick Navigation Links */}
          <div className="flex justify-center space-x-2 sm:space-x-6 mt-6 text-sm px-6 sm:px-0">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 flex-1 sm:flex-none max-w-28 sm:max-w-none px-2 py-1.5 text-xs sm:text-sm sm:px-3 sm:py-2"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setLocation('/jobs');
              }}
            >
              Browse All Jobs
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 flex-1 sm:flex-none max-w-28 sm:max-w-none px-2 py-1.5 text-xs sm:text-sm sm:px-3 sm:py-2"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setLocation('/tenders');
              }}
            >
              View Tenders
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 flex-1 sm:flex-none max-w-28 sm:max-w-none px-2 py-1.5 text-xs sm:text-sm sm:px-3 sm:py-2"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setLocation('/career-resources');
              }}
            >
              Career Guide
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="flex justify-center space-x-8 mt-8 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold">{data?.stats.totalJobs || 0}</div>
              <div className="text-white/80">Active Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{data?.stats.organizations || 0}</div>
              <div className="text-white/80">Organizations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{data?.stats.newToday || 0}</div>
              <div className="text-white/80">New Today</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="main-container max-w-full mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
        {/* Left sidebar layout for desktop - Updated July 1, 2025 */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          
          {/* Left Sidebar - Desktop, Top on Mobile */}
          <div className="lg:w-80 xl:w-96 flex-shrink-0 order-1">
            <div className="desktop-left-sidebar">
              <Sidebar 
                filters={filters}
                onFilterChange={handleFilterChange}
                availableFilters={data?.filters}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Job Listings */}
          <div className="flex-1 min-w-0 order-2 max-w-4xl">
            {/* Results Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Latest Job Opportunities</h2>
              
              {/* Quick Links Section */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Popular Searches</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-6 p-1 text-blue-700 hover:text-blue-900"
                    onClick={() => setFilters(prev => ({ ...prev, country: ['Kenya'] }))}
                  >
                    Jobs in Kenya
                  </Button>
                  <span className="text-gray-400">•</span>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-6 p-1 text-blue-700 hover:text-blue-900"
                    onClick={() => setFilters(prev => ({ ...prev, country: ['Somalia'] }))}
                  >
                    Jobs in Somalia  
                  </Button>
                  <span className="text-gray-400">•</span>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-6 p-1 text-blue-700 hover:text-blue-900"
                    onClick={() => setFilters(prev => ({ ...prev, sector: ['Health'] }))}
                  >
                    Health Jobs
                  </Button>
                  <span className="text-gray-400">•</span>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-6 p-1 text-blue-700 hover:text-blue-900"
                    onClick={() => setFilters(prev => ({ ...prev, sector: ['Protection'] }))}
                  >
                    Protection Jobs
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-muted-foreground text-sm">
                  Showing {displayedJobs.length} of {data?.jobs.length || 0} jobs
                  {isLoading && " • Loading..."}
                </p>
                
                <div className="flex items-center space-x-4">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mostRecent">Sort by: Most Recent</SelectItem>
                      <SelectItem value="organization">Sort by: Organization</SelectItem>
                      <SelectItem value="location">Sort by: Location</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex border border-border rounded-lg">
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="rounded-r-none"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-l-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Job Cards */}
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="job-card animate-pulse">
                    <div className="h-6 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded mb-4 w-2/3"></div>
                    <div className="h-20 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : displayedJobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No jobs found matching your criteria.</p>
                <p className="text-muted-foreground text-sm mt-2">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
                {/* Google Jobs Schema for displayed jobs */}
                <JobStructuredData jobs={displayedJobs} />
              </div>
            )}

            {/* Load More */}
            {hasMoreJobs && (
              <div className="text-center mt-12">
                <Button 
                  variant="outline"
                  onClick={handleLoadMore}
                  className="px-8 py-3"
                >
                  Load More Jobs
                </Button>
                <p className="text-muted-foreground text-sm mt-2">
                  Showing {displayedJobs.length} of {data?.jobs.length || 0} jobs
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* SEO Content Section - Enhanced for Better SEO */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Leading Job Board for Somalia & Kenya
            </h2>
            <p className="text-gray-600 max-w-4xl mx-auto text-lg leading-relaxed">
              Somken Jobs is the premier platform for finding humanitarian and development opportunities in Somalia and Kenya. We aggregate positions from top NGOs, UN agencies, and international organizations, providing comprehensive access to career opportunities across East Africa.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Jobs in Somalia</h3>
              <p className="text-gray-600 mb-4">
                Find the latest humanitarian jobs in Somalia including positions in Mogadishu, Hargeisa, Kismayo, and other major cities. We feature opportunities from UNHCR, WHO, Save the Children, World Food Programme, and leading international organizations.
              </p>
              <a href="/jobs?country=Somalia" className="text-blue-600 hover:text-blue-800 font-medium">
                Browse Somalia Jobs →
              </a>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Jobs in Kenya</h3>
              <p className="text-gray-600 mb-4">
                Discover career opportunities in Kenya with international NGOs and development organizations. Browse jobs in Nairobi, Mombasa, Kisumu, Eldoret, and across the country with top humanitarian employers.
              </p>
              <a href="/jobs?country=Kenya" className="text-blue-600 hover:text-blue-800 font-medium">
                Browse Kenya Jobs →
              </a>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Updated Daily</h3>
              <p className="text-gray-600 mb-4">
                Our job listings are updated twice daily from ReliefWeb and other trusted sources, ensuring you never miss new opportunities in the humanitarian sector. Get alerts for new positions matching your skills.
              </p>
              <a href="/career-resources" className="text-blue-600 hover:text-blue-800 font-medium">
                Career Resources →
              </a>
            </div>
          </div>

          {/* Popular Categories */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Job Categories</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <a href="/jobs?sector=Health" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center">
                <h4 className="font-semibold text-gray-900 text-sm">Health</h4>
              </a>
              <a href="/jobs?sector=Education" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center">
                <h4 className="font-semibold text-gray-900 text-sm">Education</h4>
              </a>
              <a href="/jobs?sector=Protection" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center">
                <h4 className="font-semibold text-gray-900 text-sm">Protection</h4>
              </a>
              <a href="/jobs?sector=Food%20Security" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center">
                <h4 className="font-semibold text-gray-900 text-sm">Food Security</h4>
              </a>
              <a href="/jobs?sector=WASH" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center">
                <h4 className="font-semibold text-gray-900 text-sm">WASH</h4>
              </a>
              <a href="/jobs?sector=Emergency" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center">
                <h4 className="font-semibold text-gray-900 text-sm">Emergency</h4>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Explore More</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/tenders" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                View Tenders
              </a>
              <a href="/about" className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium">
                About Us
              </a>
              <a href="/contact" className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium">
                Contact
              </a>
              <a href="/career-resources" className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium">
                Career Tips
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
