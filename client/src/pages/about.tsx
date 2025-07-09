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
                  How We Work
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

            {/* Key Features Infographic */}
            <div id="features" className="relative">
              <h2 className="text-2xl font-bold mb-8 text-center">How Somken Jobs Works</h2>
              
              {/* Visual Flow Diagram */}
              <div className="relative bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-4 md:p-8 mb-6">
                
                {/* Desktop Flow */}
                <div className="hidden md:flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-[#0077B5] rounded-full flex items-center justify-center">
                      <Globe className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Comprehensive Sources</h3>
                      <p className="text-sm text-gray-600">ReliefWeb + Major NGO Platforms</p>
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <div>
                    <svg className="w-8 h-6 text-[#0077B5]" fill="currentColor" viewBox="0 0 20 12">
                      <path d="M14 0l6 6-6 6V8H0V4h14V0z"/>
                    </svg>
                  </div>
                  
                  {/* Step 2 */}
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Daily Updates</h3>
                      <p className="text-sm text-gray-600">Fresh Jobs Every Day</p>
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <div>
                    <svg className="w-8 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 12">
                      <path d="M14 0l6 6-6 6V8H0V4h14V0z"/>
                    </svg>
                  </div>
                  
                  {/* Step 3 */}
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Quality Verified</h3>
                      <p className="text-sm text-gray-600">Complete Job Details</p>
                    </div>
                  </div>
                </div>

                {/* Mobile Flow - Vertical Stack */}
                <div className="md:hidden space-y-6 mb-8">
                  
                  {/* Step 1 */}
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-[#0077B5] rounded-full flex items-center justify-center flex-shrink-0">
                      <Globe className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-800">Comprehensive Sources</h3>
                      <p className="text-xs text-gray-600">ReliefWeb + Major NGO Platforms</p>
                    </div>
                  </div>

                  {/* Mobile Arrow Down */}
                  <div className="flex justify-center">
                    <svg className="w-6 h-8 text-[#0077B5]" fill="currentColor" viewBox="0 0 12 20">
                      <path d="M0 14l6 6 6-6H8V0H4v14H0z"/>
                    </svg>
                  </div>
                  
                  {/* Step 2 */}
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-800">Daily Updates</h3>
                      <p className="text-xs text-gray-600">Fresh Jobs Every Day</p>
                    </div>
                  </div>

                  {/* Mobile Arrow Down */}
                  <div className="flex justify-center">
                    <svg className="w-6 h-8 text-green-600" fill="currentColor" viewBox="0 0 12 20">
                      <path d="M0 14l6 6 6-6H8V0H4v14H0z"/>
                    </svg>
                  </div>
                  
                  {/* Step 3 */}
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-800">Quality Verified</h3>
                      <p className="text-xs text-gray-600">Complete Job Details</p>
                    </div>
                  </div>

                </div>
                
                {/* Statistics Bar */}
                <div className="grid grid-cols-3 gap-2 md:gap-4 mt-8 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-[#0077B5]">500+</div>
                    <div className="text-xs md:text-sm text-gray-600">Active Jobs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-green-600">50+</div>
                    <div className="text-xs md:text-sm text-gray-600">Organizations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-purple-600">2</div>
                    <div className="text-xs md:text-sm text-gray-600">Countries</div>
                  </div>
                </div>
                
              </div>
              
              {/* Quick Features Icons */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="text-center p-3 md:p-4 bg-white rounded-lg shadow-sm border">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-[#0077B5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </div>
                  <div className="text-xs md:text-sm font-medium">Advanced Search</div>
                </div>
                
                <div className="text-center p-3 md:p-4 bg-white rounded-lg shadow-sm border">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div className="text-xs md:text-sm font-medium">Mobile Ready</div>
                </div>
                
                <div className="text-center p-3 md:p-4 bg-white rounded-lg shadow-sm border">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div className="text-xs md:text-sm font-medium">Verified Jobs</div>
                </div>
                
                <div className="text-center p-3 md:p-4 bg-white rounded-lg shadow-sm border">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                  <div className="text-xs md:text-sm font-medium">Fast Apply</div>
                </div>
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
                    <h4 className="font-semibold mb-3 text-lg">For Job Seekers</h4>
                    <ul className="space-y-3 text-muted-foreground">
                      <li>• Access to job listings from multiple reputable sources</li>
                      <li>• Advanced filtering, search tools, and personalized job alerts</li>
                      <li>• Mobile-friendly platform for easy browsing anywhere, anytime</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-lg">For Employers & Organizations</h4>
                    <ul className="space-y-3 text-muted-foreground">
                      <li>• 30% of every job posting fee reinvested into targeted social media ads (Facebook, Instagram, etc.) for maximum reach</li>
                      <li>• Direct exposure to qualified professionals across East Africa</li>
                      <li>• Transparent, results-driven recruitment with detailed promotion reports</li>
                      <li>• Priority homepage and email listings to attract the best talent</li>
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