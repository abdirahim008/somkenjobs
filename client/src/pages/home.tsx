import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import Sidebar from "@/components/Sidebar";
import JobCard from "@/components/JobCard";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
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
        title="Humanitarian Jobs in Kenya & Somalia | JobConnect East Africa"
        description={`Find ${data?.stats.totalJobs || '80+'} humanitarian job opportunities in Kenya and Somalia. Browse positions from ${data?.stats.organizations || '50+'} leading NGOs, UN agencies, and development organizations. Updated daily.`}
        keywords="humanitarian jobs Kenya, humanitarian jobs Somalia, NGO careers East Africa, UN jobs Kenya, development jobs Somalia, aid worker positions, international development careers"
        canonicalUrl="https://jobconnect-eastafrica.replit.app/"
      />
      <Header />
      


      {/* Hero Section */}
      <section className="bg-[#0077B5] text-white py-12">
        <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Find Rewarding Career Opportunities in East Africa
            </h2>
            <p className="text-white/90 text-lg max-w-4xl mx-auto">
              Discover meaningful jobs with leading organizations across Kenya, Somalia, and the region—make your next career move count.
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

      <Footer />
    </div>
  );
}
