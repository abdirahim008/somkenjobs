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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Contact Methods Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-primary" />
                General Inquiries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                For general questions about our platform and services.
              </p>
              <Button variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                info@jobconnect-ea.org
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" />
                Partnership Inquiries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                For organizations interested in partnering with us.
              </p>
              <Button variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                partnerships@jobconnect-ea.org
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                Technical Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Having trouble with the platform? We're here to help.
              </p>
              <Button variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                support@jobconnect-ea.org
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* FAQ Section */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <MessageCircle className="h-6 w-6 mr-3 text-primary" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              
              <div>
                <h3 className="font-semibold text-lg mb-2">How often are job listings updated?</h3>
                <p className="text-muted-foreground">
                  Our platform automatically fetches new job postings daily from ReliefWeb and other sources. 
                  You'll always see the most current opportunities available for Kenya and Somalia.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Do you charge fees for job applications?</h3>
                <p className="text-muted-foreground">
                  No, JobConnect East Africa is completely free for job seekers. We believe humanitarian 
                  professionals should have open access to career opportunities.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Can organizations post jobs directly?</h3>
                <p className="text-muted-foreground">
                  Currently, we aggregate jobs from established humanitarian job boards like ReliefWeb. 
                  Organizations interested in direct posting can contact our partnerships team.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">How do I apply for jobs listed on your platform?</h3>
                <p className="text-muted-foreground">
                  Each job listing includes detailed application instructions and links to apply directly 
                  with the hiring organization. We provide the information you need to submit your application.
                </p>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Response Times */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Clock className="h-6 w-6 mr-3 text-primary" />
              Response Times
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              
              <div className="text-center">
                <Badge variant="secondary" className="mb-2">General Inquiries</Badge>
                <p className="text-2xl font-bold text-primary">24-48 hours</p>
                <p className="text-sm text-muted-foreground">Business days</p>
              </div>

              <div className="text-center">
                <Badge variant="secondary" className="mb-2">Technical Support</Badge>
                <p className="text-2xl font-bold text-primary">12-24 hours</p>
                <p className="text-sm text-muted-foreground">Priority response</p>
              </div>

              <div className="text-center">
                <Badge variant="secondary" className="mb-2">Partnership Inquiries</Badge>
                <p className="text-2xl font-bold text-primary">2-5 days</p>
                <p className="text-sm text-muted-foreground">Detailed review</p>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Office Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <MapPin className="h-6 w-6 mr-3 text-primary" />
              Our Presence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              
              <div>
                <h3 className="font-semibold text-lg mb-3">Regional Focus</h3>
                <p className="text-muted-foreground mb-4">
                  JobConnect East Africa operates with deep understanding of the humanitarian landscape 
                  in Kenya and Somalia. Our team combines local knowledge with international humanitarian 
                  sector expertise.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Nairobi Hub</Badge>
                  <Badge variant="outline">Mogadishu Network</Badge>
                  <Badge variant="outline">Regional Partners</Badge>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Operating Hours</h3>
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Monday - Friday:</span>
                    <span>8:00 AM - 6:00 PM EAT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday:</span>
                    <span>9:00 AM - 2:00 PM EAT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday:</span>
                    <span>Closed</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Email responses may be delayed during weekends and holidays.
                </p>
              </div>

            </div>
          </CardContent>
        </Card>

      </main>

      <Footer />
    </div>
  );
}