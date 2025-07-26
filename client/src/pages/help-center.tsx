import React, { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, MessageCircle, BookOpen, Users, Mail, Phone, Clock, CheckCircle } from "lucide-react";

export default function HelpCenter() {
  useEffect(() => {
    document.title = "Help Center - Support & FAQs | Somken Jobs";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Find answers to common questions about Somken Jobs. Get help with job applications, account management, and using our platform to find humanitarian opportunities in Kenya and Somalia.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Find answers to common questions about Somken Jobs. Get help with job applications, account management, and using our platform to find humanitarian opportunities in Kenya and Somalia.';
      document.head.appendChild(meta);
    }
  }, []);

  const faqData = [
    {
      question: "How do I search for jobs on Somken Jobs?",
      answer: "You can search for jobs using our search bar on the homepage. Use keywords, location, or organization names to find relevant opportunities. You can also use our filters to narrow down results by country, sector, or date posted."
    },
    {
      question: "Are all jobs on your platform legitimate?",
      answer: "Yes, all jobs are sourced from verified humanitarian organizations through ReliefWeb and other trusted sources. We regularly update our listings to ensure accuracy and remove expired positions."
    },
    {
      question: "How do I apply for a job?",
      answer: "Each job listing includes application instructions in the 'How to Apply' section. Most applications are submitted directly to the hiring organization through their specified channels, such as email or online portals."
    },
    {
      question: "Can I create a profile to save jobs?",
      answer: "Currently, we focus on providing comprehensive job listings. For personalized features like saved jobs, we recommend bookmarking positions of interest in your browser."
    },
    {
      question: "How often are job listings updated?",
      answer: "We update our job listings twice daily to ensure you see the latest opportunities. New positions are added automatically from our trusted sources."
    },
    {
      question: "What types of organizations post jobs here?",
      answer: "We feature jobs from UN agencies, international NGOs, humanitarian organizations, and development agencies working in Kenya and Somalia. This includes organizations like WHO, UNICEF, UNHCR, and many others."
    },
    {
      question: "Do you charge fees for job applications?",
      answer: "No, Somken Jobs is completely free for job seekers. We never charge fees for accessing job listings or applying to positions."
    },
    {
      question: "How can I get notified about new jobs?",
      answer: "You can subscribe to our newsletter in the footer to receive updates about new job opportunities and career resources."
    }
  ];

  const supportChannels = [
    {
      title: "Email Support",
      description: "Get detailed help via email",
      contact: "support@somkenjobs.com",
      icon: Mail,
      responseTime: "24-48 hours"
    },
    {
      title: "General Inquiries",
      description: "For partnerships and general questions",
      contact: "info@somkenjobs.com",
      icon: MessageCircle,
      responseTime: "2-3 business days"
    }
  ];

  const quickLinks = [
    { title: "Job Search Tips", icon: Search, description: "Learn effective search strategies" },
    { title: "Career Resources", icon: BookOpen, description: "CV writing and interview guides" },
    { title: "About Organizations", icon: Users, description: "Learn about humanitarian employers" },
    { title: "Contact Us", icon: Phone, description: "Get in touch with our team" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions and get the support you need to make the most of Somken Jobs.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {quickLinks.map((link, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <link.icon className="h-8 w-8 text-[#0077B5] mx-auto mb-2" />
                <h3 className="font-semibold mb-1">{link.title}</h3>
                <p className="text-sm text-gray-600">{link.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#0077B5]" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqData.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Support Channels */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#0077B5]" />
              Contact Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {supportChannels.map((channel, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <channel.icon className="h-5 w-5 text-[#0077B5]" />
                    <h3 className="font-semibold">{channel.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-2">{channel.description}</p>
                  <p className="font-medium text-[#0077B5] mb-2">{channel.contact}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Response time: {channel.responseTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Operating Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#0077B5]" />
              Support Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Monday - Friday</span>
                <span className="text-gray-600">9:00 AM - 6:00 PM (EAT)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Saturday</span>
                <span className="text-gray-600">10:00 AM - 4:00 PM (EAT)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Sunday</span>
                <span className="text-gray-600">Closed</span>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>We typically respond to emails within 24-48 hours during business days</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}