import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Cookie, Mail, Lock, UserCheck, Calendar, Globe } from "lucide-react";

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy - Data Protection & Privacy | Somken Jobs";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Learn how Somken Jobs protects your privacy and handles your personal data. Our comprehensive privacy policy explains data collection, usage, and your rights.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Learn how Somken Jobs protects your privacy and handles your personal data. Our comprehensive privacy policy explains data collection, usage, and your rights.';
      document.head.appendChild(meta);
    }
  }, []);

  const sections = [
    {
      title: "Information We Collect",
      icon: Eye,
      content: [
        "Personal information you provide when creating an account (name, email, professional details)",
        "Usage data including pages visited, search queries, and interaction patterns",
        "Device information such as IP address, browser type, and operating system",
        "Cookies and similar tracking technologies for website functionality"
      ]
    },
    {
      title: "How We Use Your Information",
      icon: UserCheck,
      content: [
        "Provide and improve our job search platform and services",
        "Send relevant job opportunities and career resources",
        "Analyze usage patterns to enhance user experience",
        "Communicate important updates about our services",
        "Ensure platform security and prevent fraud"
      ]
    },
    {
      title: "Information Sharing",
      icon: Shield,
      content: [
        "We do not sell, trade, or share your personal information with third parties",
        "Job applications are submitted directly to hiring organizations",
        "Anonymous usage statistics may be shared with partners for improvement",
        "Legal compliance may require disclosure in specific circumstances"
      ]
    },
    {
      title: "Data Security",
      icon: Lock,
      content: [
        "Industry-standard encryption for data transmission and storage",
        "Regular security audits and vulnerability assessments",
        "Limited access to personal data on a need-to-know basis",
        "Secure servers with comprehensive backup and recovery procedures"
      ]
    },
    {
      title: "Your Rights",
      icon: UserCheck,
      content: [
        "Access and review your personal information",
        "Request corrections to inaccurate data",
        "Delete your account and associated data",
        "Opt out of marketing communications",
        "Request data portability in machine-readable format"
      ]
    },
    {
      title: "Cookies and Tracking",
      icon: Cookie,
      content: [
        "Essential cookies for website functionality and security",
        "Analytics cookies to understand user behavior and improve services",
        "You can control cookie settings through your browser preferences",
        "Disabling cookies may limit website functionality"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Last updated: July 3, 2025</span>
          </div>
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Shield className="h-8 w-8 text-[#0077B5] mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold mb-3">Our Commitment to Your Privacy</h2>
                <p className="text-gray-600 leading-relaxed">
                  Somken Jobs is committed to protecting your privacy and handling your personal information responsibly. 
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use 
                  our website and services. By using our platform, you agree to the practices described in this policy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <section.icon className="h-5 w-5 text-[#0077B5]" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-[#0077B5] rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-600 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Data Retention */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-[#0077B5]" />
              Data Retention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed mb-4">
              We retain your personal information only as long as necessary to provide our services and comply with legal obligations:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li>• Account information: Retained while your account is active</li>
              <li>• Usage data: Typically retained for 24 months for analytics purposes</li>
              <li>• Communication records: Retained for 3 years for customer service</li>
              <li>• Legal compliance: As required by applicable laws and regulations</li>
            </ul>
          </CardContent>
        </Card>

        {/* International Data Transfers */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-[#0077B5]" />
              International Data Transfers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. 
              We ensure appropriate safeguards are in place to protect your personal information, including 
              contractual commitments and compliance with international data protection standards.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-[#0077B5]" />
              Contact Us About Privacy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed mb-4">
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="space-y-2 text-gray-600">
              <p><strong>Email:</strong> privacy@somkenjobs.com</p>
              <p><strong>Subject Line:</strong> Privacy Policy Inquiry</p>
              <p><strong>Response Time:</strong> We typically respond within 5 business days</p>
            </div>
          </CardContent>
        </Card>

        {/* Changes to Policy */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-[#0077B5]" />
              Changes to This Policy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
              We will notify you of any material changes by posting the updated policy on our website and updating the 
              "Last updated" date. Your continued use of our services after such changes indicates your acceptance of the updated policy.
            </p>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}