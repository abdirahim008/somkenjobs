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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Mission Section */}
        <Card className="mb-12">
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          
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

        {/* Focus Areas */}
        <Card className="mb-12">
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
        <Card>
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

      </main>

      <Footer />
    </div>
  );
}