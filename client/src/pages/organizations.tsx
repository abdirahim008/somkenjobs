import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Users, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { type Job } from "@shared/schema";

interface OrganizationStats {
  name: string;
  jobCount: number;
  locations: string[];
  sectors: string[];
  latestJob?: string;
}

export default function Organizations() {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const { data: jobsResponse, isLoading } = useQuery<{jobs: Job[]}>({
    queryKey: ['/api/jobs'],
  });

  const jobs = jobsResponse?.jobs;

  // Process jobs data to extract organization statistics
  const organizationStats: OrganizationStats[] = (jobs && Array.isArray(jobs)) ? 
    Object.values(
      jobs.reduce((acc: Record<string, OrganizationStats>, job) => {
        const orgName = job.organization || 'Unknown Organization';
        
        if (!acc[orgName]) {
          acc[orgName] = {
            name: orgName,
            jobCount: 0,
            locations: [],
            sectors: [],
          };
        }
        
        acc[orgName].jobCount++;
        
        if (job.location && !acc[orgName].locations.includes(job.location)) {
          acc[orgName].locations.push(job.location);
        }
        
        if (job.sector && !acc[orgName].sectors.includes(job.sector)) {
          acc[orgName].sectors.push(job.sector);
        }
        
        // Keep track of the latest job title
        if (!acc[orgName].latestJob || new Date(job.datePosted) > new Date(acc[orgName].latestJob || '')) {
          acc[orgName].latestJob = job.title;
        }
        
        return acc;
      }, {})
    ).sort((a, b) => b.jobCount - a.jobCount) // Sort by job count descending
    : [];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Hiring Organizations - Humanitarian Employers in Kenya & Somalia"
        description={`Browse ${organizationStats.length || '50+'} humanitarian organizations currently hiring in Kenya and Somalia. Find opportunities with leading NGOs, UN agencies, and development partners.`}
        keywords="humanitarian organizations hiring, NGOs hiring Kenya, UN agencies Somalia, humanitarian employers East Africa, international development organizations"
        canonicalUrl="https://jobconnect-eastafrica.replit.app/organizations"
      />
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-6">
            Hiring Organizations
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover humanitarian organizations currently hiring in Kenya and Somalia. 
            Find opportunities with leading international NGOs, UN agencies, and local partners.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Stats Overview */}
        {!isLoading && organizationStats.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {organizationStats.length}
                </div>
                <p className="text-muted-foreground">Active Organizations</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {jobs?.length || 0}
                </div>
                <p className="text-muted-foreground">Total Job Openings</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {Math.round((jobs?.length || 0) / Math.max(organizationStats.length, 1))}
                </div>
                <p className="text-muted-foreground">Avg Jobs per Org</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Organizations List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-6">Organizations Currently Hiring</h2>
          
          {isLoading ? (
            // Loading skeletons
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : organizationStats.length > 0 ? (
            <div className="grid gap-6">
              {organizationStats.map((org) => (
                <Card key={org.name} className="transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <div className="flex items-center">
                        <Building2 className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                        <span className="font-semibold">{org.name}</span>
                      </div>
                      <Badge variant="secondary">
                        {org.jobCount} {org.jobCount === 1 ? 'position' : 'positions'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      
                      {/* Latest Job */}
                      {org.latestJob && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Latest Position:</p>
                          <p className="text-sm">{org.latestJob}</p>
                        </div>
                      )}
                      
                      {/* Locations */}
                      {org.locations.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            Locations:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {org.locations.slice(0, 3).map((location) => (
                              <Badge key={location} variant="outline" className="text-xs">
                                {location}
                              </Badge>
                            ))}
                            {org.locations.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{org.locations.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Sectors */}
                      {org.sectors.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            Sectors:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {org.sectors.slice(0, 4).map((sector) => (
                              <Badge key={sector} variant="outline" className="text-xs">
                                {sector}
                              </Badge>
                            ))}
                            {org.sectors.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{org.sectors.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Organizations Found</h3>
                <p className="text-muted-foreground">
                  We're currently updating our organization database. Please check back soon.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Call to Action */}
        {!isLoading && organizationStats.length > 0 && (
          <Card className="mt-12">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-4">Ready to Apply?</h3>
              <p className="text-muted-foreground mb-6">
                Browse all available positions from these organizations and find your next career opportunity.
              </p>
              <button 
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Browse All Jobs
                <ExternalLink className="h-4 w-4 ml-2" />
              </button>
            </CardContent>
          </Card>
        )}

      </main>

      <Footer />
    </div>
  );
}