import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Target, Globe, TrendingUp, Shield } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

export default function About() {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="About Somken Jobs - Our Mission & Impact"
        description="Learn about Somken Jobs' mission to connect humanitarian professionals with meaningful career opportunities in Kenya and Somalia. Discover our comprehensive job aggregation platform and commitment to the humanitarian sector."
        keywords="about Somken Jobs, humanitarian job platform, NGO career platform, East Africa humanitarian jobs, our mission humanitarian sector"
        canonicalUrl="https://somkenjobs.replit.app/about"
      />
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-6">
            About Somken Jobs
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Your gateway to humanitarian careers in Kenya and Somalia.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Desktop Layout with Sidebar */}
        <div className="flex gap-8">
          
          {/* Left Sidebar - Desktop */}
          <div className="hidden lg:block lg:w-80 space-y-6">
            
            {/* Quick Navigation */}
            <Card className="border-l-4 border-l-[#0077B5]">
              <CardHeader>
                <CardTitle className="text-lg">Page Contents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a href="#mission" className="block text-sm text-muted-foreground hover:text-[#0077B5] transition-colors">
                  Our Mission
                </a>
                <a href="#features" className="block text-sm text-muted-foreground hover:text-[#0077B5] transition-colors">
                  Key Features
                </a>
                
                <a href="#choose" className="block text-sm text-muted-foreground hover:text-[#0077B5] transition-colors">
                  Why Choose Us
                </a>
              </CardContent>
            </Card>

            {/* Platform Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Platform Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-[#0077B5]">500+</div>
                  <div className="text-sm text-muted-foreground">Active Job Listings</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">50+</div>
                  <div className="text-sm text-muted-foreground">Partner Organizations</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">2</div>
                  <div className="text-sm text-muted-foreground">Countries Covered</div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Get in Touch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Have questions or want to partner with us?
                </p>
                <a 
                  href="/contact" 
                  className="inline-flex items-center text-sm text-[#0077B5] hover:text-[#005885] transition-colors"
                >
                  Contact our team →
                </a>
              </CardContent>
            </Card>

          </div>

          {/* Main Content */}
          <div className="flex-1 lg:max-w-4xl space-y-12">
            
            {/* Mission Section */}
            <Card id="mission">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <Target className="h-6 w-6 mr-3 text-primary" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We connect humanitarian professionals with opportunities in Kenya and Somalia. 
                  Our platform aggregates jobs from leading sources like ReliefWeb, making it easier 
                  to find meaningful work in East Africa's humanitarian sector.
                </p>
              </CardContent>
            </Card>

            {/* Key Features Grid */}
            <div id="features">
              <h2 className="text-2xl font-bold mb-6">Key Features</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Globe className="h-5 w-5 mr-2 text-primary" />
                      Comprehensive Coverage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Jobs from ReliefWeb and major humanitarian sources in one place.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                      Real-Time Updates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Fresh job postings updated daily from trusted humanitarian sources.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-primary" />
                      Quality Focused
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Verified humanitarian positions with complete details and clear application instructions.
                    </p>
                  </CardContent>
                </Card>

              </div>
            </div>

            

            {/* Why Choose Us */}
            <Card id="choose">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <Users className="h-6 w-6 mr-3 text-primary" />
                  Why Choose Somken Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold mb-2">For Job Seekers</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Comprehensive job listings from multiple sources</li>
                      <li>• Advanced filtering and search capabilities</li>
                      <li>• Mobile-optimized for searching on the go</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">For Organizations</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Increased visibility for job postings</li>
                      <li>• Access to qualified East Africa talent</li>
                      <li>• Streamlined recruitment process</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}