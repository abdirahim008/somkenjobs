import { useState } from "react";
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
  const [filters, setFilters] = useState<Filters>({
    country: ["Kenya", "Somalia"],
    organization: [],
    sector: [],
  });
  const [sortBy, setSortBy] = useState("mostRecent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [displayCount, setDisplayCount] = useState(10);

  const { data, isLoading, refetch } = useQuery<JobsResponse>({
    queryKey: ['/api/jobs', filters],
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
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
        title="Jobs in Somalia & Kenya | Somken Jobs - Humanitarian Careers"
        description={`Find ${data?.stats.totalJobs || '100+'} jobs in Somalia and Kenya with leading humanitarian organizations. Browse NGO positions, UN jobs, and development careers from ${data?.stats.organizations || '50+'} employers. Updated daily from ReliefWeb.`}
        keywords="jobs in Somalia, jobs in Kenya, humanitarian jobs Somalia, NGO jobs Kenya, UN careers Somalia, development jobs Kenya, aid worker positions, international jobs East Africa, ReliefWeb jobs"
        canonicalUrl="https://somkenjobs.com/"
      />
      {/* Add structured data for job postings */}
      <JobStructuredData jobs={displayedJobs} />
      <Header />
      


      {/* Hero Section */}
      <section className="bg-[#0077B5] text-white py-12">
        <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Jobs in Somalia & Kenya - Humanitarian Careers
            </h1>
            <p className="text-white/90 text-lg max-w-4xl mx-auto">
              Find jobs in Somalia and Kenya with leading NGOs, UN agencies, and humanitarian organizations. Browse {data?.stats.totalJobs || '100+'} current opportunities updated daily from ReliefWeb.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <SearchBar onSearch={handleSearch} />
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

      {/* SEO Content Section */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Leading Job Board for Somalia & Kenya
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Somken Jobs is the premier platform for finding humanitarian and development opportunities in Somalia and Kenya. We aggregate positions from top NGOs, UN agencies, and international organizations.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Jobs in Somalia</h3>
              <p className="text-gray-600 text-sm">
                Find the latest humanitarian jobs in Somalia including positions in Mogadishu, Hargeisa, and other major cities. We feature opportunities from UNHCR, WHO, Save the Children, and more.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Jobs in Kenya</h3>
              <p className="text-gray-600 text-sm">
                Discover career opportunities in Kenya with international NGOs and development organizations. Browse jobs in Nairobi, Mombasa, Kisumu, and across the country.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Updated Daily</h3>
              <p className="text-gray-600 text-sm">
                Our job listings are updated twice daily from ReliefWeb and other trusted sources, ensuring you never miss new opportunities in the humanitarian sector.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
