import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Shield, AlertTriangle, Scale, Globe, Calendar, Mail } from "lucide-react";

export default function TermsOfService() {
  useEffect(() => {
    document.title = "Terms of Service - Legal Terms & Conditions | Somken Jobs";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Read the Terms of Service for Somken Jobs. Understand your rights and responsibilities when using our humanitarian job search platform.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Read the Terms of Service for Somken Jobs. Understand your rights and responsibilities when using our humanitarian job search platform.';
      document.head.appendChild(meta);
    }
  }, []);

  const sections = [
    {
      title: "Acceptance of Terms",
      icon: FileText,
      content: [
        "By accessing or using Somken Jobs, you agree to be bound by these Terms of Service",
        "If you disagree with any part of these terms, you may not access the service",
        "These terms apply to all visitors, users, and others who access or use the service",
        "We reserve the right to update these terms at any time with notice to users"
      ]
    },
    {
      title: "Description of Service",
      icon: Globe,
      content: [
        "Somken Jobs is a job search platform specializing in humanitarian opportunities",
        "We aggregate job listings from verified organizations working in Kenya and Somalia",
        "Our service includes job search, career resources, and professional development content",
        "We facilitate connections between job seekers and humanitarian organizations"
      ]
    },
    {
      title: "User Accounts and Responsibilities",
      icon: Users,
      content: [
        "You are responsible for maintaining the confidentiality of your account information",
        "You must provide accurate and complete information when creating an account",
        "You are responsible for all activities that occur under your account",
        "You must notify us immediately of any unauthorized use of your account"
      ]
    },
    {
      title: "Acceptable Use Policy",
      icon: Shield,
      content: [
        "Use the service only for lawful purposes and in accordance with these terms",
        "Do not use the service to transmit harmful, offensive, or inappropriate content",
        "Do not attempt to gain unauthorized access to any part of the service",
        "Do not interfere with or disrupt the service or servers connected to the service"
      ]
    },
    {
      title: "Job Applications and Third-Party Organizations",
      icon: AlertTriangle,
      content: [
        "Job applications are submitted directly to hiring organizations, not to Somken Jobs",
        "We are not responsible for the hiring practices of third-party organizations",
        "Employment relationships are solely between you and the hiring organization",
        "We do not guarantee job placement or interview opportunities"
      ]
    },
    {
      title: "Intellectual Property Rights",
      icon: Scale,
      content: [
        "The service and its content are owned by Somken Jobs and protected by copyright",
        "You may not reproduce, distribute, or create derivative works without permission",
        "Job listings are sourced from public databases and remain property of original posters",
        "Your account information and usage data are governed by our Privacy Policy"
      ]
    }
  ];

  const limitations = [
    "Services are provided 'as is' without warranties of any kind",
    "We do not guarantee the accuracy or completeness of job listings",
    "We are not liable for any damages resulting from use of the service",
    "Our liability is limited to the maximum extent permitted by law"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            These terms govern your use of Somken Jobs and outline your rights and responsibilities as a user.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Effective date: July 3, 2025</span>
          </div>
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Scale className="h-8 w-8 text-[#0077B5] mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold mb-3">Legal Agreement</h2>
                <p className="text-gray-600 leading-relaxed">
                  These Terms of Service constitute a legally binding agreement between you and Somken Jobs 
                  regarding your use of our website and services. Please read these terms carefully before 
                  using our platform. Your access to and use of the service is conditioned on your acceptance 
                  of and compliance with these terms.
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

        {/* Disclaimers and Limitations */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-[#0077B5]" />
              Disclaimers and Limitation of Liability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {limitations.map((limitation, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#0077B5] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-600 leading-relaxed">{limitation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Termination */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Users className="h-5 w-5 text-[#0077B5]" />
              Account Termination
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed mb-4">
              We may terminate or suspend your account and access to the service immediately, without prior notice 
              or liability, for any reason, including:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li>• Breach of these Terms of Service</li>
              <li>• Violation of our Acceptable Use Policy</li>
              <li>• Extended period of inactivity</li>
              <li>• Legal or regulatory requirements</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              You may also terminate your account at any time by contacting us or deleting your account through 
              the platform settings.
            </p>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Scale className="h-5 w-5 text-[#0077B5]" />
              Governing Law and Jurisdiction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed">
              These Terms of Service are governed by and construed in accordance with the laws of Kenya. 
              Any disputes arising from these terms or your use of the service will be subject to the 
              exclusive jurisdiction of the courts of Kenya. If any provision of these terms is found to be 
              unenforceable, the remaining provisions will remain in full force and effect.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Terms */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-[#0077B5]" />
              Changes to Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to modify or replace these Terms of Service at any time. If a revision is material, 
              we will try to provide at least 30 days advance notice prior to any new terms taking effect. 
              Material changes will be communicated through email notifications or prominent notices on our website. 
              Your continued use of the service after changes become effective constitutes acceptance of the updated terms.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-[#0077B5]" />
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="space-y-2 text-gray-600">
              <p><strong>Email:</strong> legal@somkenjobs.com</p>
              <p><strong>Subject Line:</strong> Terms of Service Inquiry</p>
              <p><strong>Business Address:</strong> Nairobi, Kenya</p>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}