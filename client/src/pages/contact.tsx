import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageCircle, HelpCircle, Users, Clock, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

export default function Contact() {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Contact Somken Jobs - Get Help & Support"
        description="Contact Somken Jobs for support, partnerships, or general inquiries. Our team is here to help humanitarian professionals navigate career opportunities in Kenya and Somalia."
        keywords="contact Somken Jobs, humanitarian job support, partnership inquiries, NGO platform contact, East Africa job platform support"
        canonicalUrl="https://somkenjobs.replit.app/contact"
      />
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-6">
            Contact Us
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get in touch with the Somken Jobs team. We're here to help you 
            navigate humanitarian career opportunities in Kenya and Somalia.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Desktop Layout with Sidebar */}
        <div className="flex gap-8">
          
          {/* Left Sidebar - Desktop */}
          <div className="hidden lg:block lg:w-80 space-y-6">
            
            {/* Quick Contact */}
            <Card className="border-l-4 border-l-[#0077B5]">
              <CardHeader>
                <CardTitle className="text-lg">Quick Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">General Support</p>
                  <a href="mailto:info@somkenjobs.com" className="text-sm text-[#0077B5] hover:text-[#005885]">
                    info@somkenjobs.com
                  </a>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Partnerships</p>
                  <a href="mailto:partnerships@somkenjobs.com" className="text-sm text-[#0077B5] hover:text-[#005885]">
                    partnerships@somkenjobs.com
                  </a>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Technical Help</p>
                  <a href="mailto:support@somkenjobs.com" className="text-sm text-[#0077B5] hover:text-[#005885]">
                    support@somkenjobs.com
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Response Times */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Response Times</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-[#0077B5]">12-24h</div>
                  <div className="text-xs text-muted-foreground">Technical Support</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">24-48h</div>
                  <div className="text-xs text-muted-foreground">General Inquiries</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">2-5 days</div>
                  <div className="text-xs text-muted-foreground">Partnerships</div>
                </div>
              </CardContent>
            </Card>

            {/* Office Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Support Hours</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Mon - Fri:</span>
                  <span className="font-medium">8AM - 6PM EAT</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday:</span>
                  <span className="font-medium">9AM - 2PM EAT</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday:</span>
                  <span className="text-red-600">Closed</span>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Main Content */}
          <div className="flex-1 lg:max-w-4xl space-y-12">
            
            {/* Contact Methods Grid */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
              <div className="grid md:grid-cols-3 gap-6">
                
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="h-8 w-8 text-[#0077B5]" />
                    </div>
                    <CardTitle className="text-lg">General Inquiries</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground mb-4 text-sm">
                      Questions about our platform and services
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full border-[#0077B5] text-[#0077B5] hover:bg-[#0077B5] hover:text-white"
                      onClick={() => window.location.href = 'mailto:info@somkenjobs.com'}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-lg">Partnerships</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground mb-4 text-sm">
                      Organizations interested in collaboration
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                      onClick={() => window.location.href = 'mailto:partnerships@somkenjobs.com'}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Partner With Us
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <HelpCircle className="h-8 w-8 text-orange-600" />
                    </div>
                    <CardTitle className="text-lg">Technical Support</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground mb-4 text-sm">
                      Platform issues and technical help
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white"
                      onClick={() => window.location.href = 'mailto:support@somkenjobs.com'}
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Get Help
                    </Button>
                  </CardContent>
                </Card>

              </div>
            </div>

            {/* FAQ Section */}
            <Card id="faq">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <MessageCircle className="h-6 w-6 mr-3 text-primary" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  
                  <div className="border-l-4 border-l-blue-200 pl-4">
                    <h3 className="font-semibold text-lg mb-2">How often are jobs updated?</h3>
                    <p className="text-muted-foreground">
                      Fresh job postings are fetched daily from ReliefWeb and other sources, ensuring you see the latest opportunities.
                    </p>
                  </div>

                  <div className="border-l-4 border-l-green-200 pl-4">
                    <h3 className="font-semibold text-lg mb-2">Are there any fees?</h3>
                    <p className="text-muted-foreground">
                      Somken Jobs is completely free for job seekers. We believe humanitarian professionals deserve open access to opportunities.
                    </p>
                  </div>

                  <div className="border-l-4 border-l-purple-200 pl-4">
                    <h3 className="font-semibold text-lg mb-2">Can organizations post jobs?</h3>
                    <p className="text-muted-foreground">
                      We currently aggregate from major sources. Organizations interested in direct posting can contact our partnerships team.
                    </p>
                  </div>

                  <div className="border-l-4 border-l-orange-200 pl-4">
                    <h3 className="font-semibold text-lg mb-2">How do I apply for jobs?</h3>
                    <p className="text-muted-foreground">
                      Each listing includes detailed application instructions and direct links to apply with the hiring organization.
                    </p>
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* Regional Focus */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <MapPin className="h-6 w-6 mr-3 text-primary" />
                  Our Regional Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Kenya & Somalia Expertise</h3>
                    <p className="text-muted-foreground mb-4">
                      Deep understanding of humanitarian landscapes in Kenya and Somalia, combining local knowledge with international expertise.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-[#0077B5] text-[#0077B5]">Nairobi Hub</Badge>
                      <Badge variant="outline" className="border-green-600 text-green-600">Somalia Network</Badge>
                      <Badge variant="outline" className="border-purple-600 text-purple-600">Regional Partners</Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Coverage Areas</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-[#0077B5] rounded-full"></div>
                        <span className="text-muted-foreground">Major Cities: Nairobi, Mombasa, Mogadishu</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                        <span className="text-muted-foreground">Rural & Remote Areas</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                        <span className="text-muted-foreground">Cross-Border Operations</span>
                      </div>
                    </div>
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