import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Target, Globe, Heart, TrendingUp, Shield } from "lucide-react";
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
            Connecting humanitarian professionals with meaningful career opportunities 
            across Kenya and Somalia through comprehensive job aggregation and intelligent matching.
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
                <a href="#focus" className="block text-sm text-muted-foreground hover:text-[#0077B5] transition-colors">
                  Focus Areas
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
                  Somken Jobs is dedicated to bridging the gap between humanitarian organizations 
                  and qualified professionals in Kenya and Somalia. We aggregate job opportunities from 
                  leading humanitarian sources, providing a centralized platform that makes it easier for 
                  professionals to find meaningful work that creates positive impact in East African communities.
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
                      We aggregate opportunities from ReliefWeb and other major humanitarian job sources, 
                      ensuring you never miss relevant positions in Kenya and Somalia.
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
                      Our platform automatically fetches new job postings daily, keeping you informed 
                      of the latest opportunities as they become available.
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
                      We focus exclusively on legitimate humanitarian positions with complete job details, 
                      application instructions, and verified organization information.
                    </p>
                  </CardContent>
                </Card>

              </div>
            </div>

            {/* Focus Areas */}
            <Card id="focus">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <Heart className="h-6 w-6 mr-3 text-primary" />
                  Focus Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Geographic Focus</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="secondary">Kenya</Badge>
                      <Badge variant="secondary">Somalia</Badge>
                      <Badge variant="secondary">East Africa Region</Badge>
                    </div>
                    <p className="text-muted-foreground">
                      We specialize in opportunities within Kenya and Somalia, understanding the unique 
                      context and requirements of humanitarian work in these regions.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Sector Coverage</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline">Health</Badge>
                      <Badge variant="outline">Education</Badge>
                      <Badge variant="outline">Protection</Badge>
                      <Badge variant="outline">WASH</Badge>
                      <Badge variant="outline">Food Security</Badge>
                      <Badge variant="outline">Emergency Response</Badge>
                    </div>
                    <p className="text-muted-foreground">
                      From emergency response to long-term development, we cover all major humanitarian 
                      sectors and specializations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                      <li>• Access to comprehensive job listings from multiple sources</li>
                      <li>• Advanced filtering by location, organization, and sector</li>
                      <li>• Complete job details with clear application instructions</li>
                      <li>• Mobile-optimized platform for job searching on the go</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">For Organizations</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Increased visibility for your job postings</li>
                      <li>• Access to qualified East Africa-focused talent pool</li>
                      <li>• Streamlined application process</li>
                      <li>• Support for humanitarian sector recruitment needs</li>
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