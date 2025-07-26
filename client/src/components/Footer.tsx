import React from "react";
import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  const quickLinks = [
    { label: "Browse Jobs", href: "/jobs" },
    { label: "View Tenders", href: "/tenders" },
    { label: "Career Resources", href: "/career-resources" },
    { label: "About Us", href: "/about" },
  ];

  const supportLinks = [
    { label: "Help Center", href: "/help" },
    { label: "Contact Us", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ];

  const jobCategories = [
    { label: "Jobs in Kenya", href: "/jobs?country=Kenya" },
    { label: "Jobs in Somalia", href: "/jobs?country=Somalia" },
    { label: "Health Jobs", href: "/jobs?sector=Health" },
    { label: "Protection Jobs", href: "/jobs?sector=Protection" },
    { label: "Education Jobs", href: "/jobs?sector=Education" },
    { label: "NGO Jobs", href: "/jobs" },
  ];

  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Briefcase className="text-primary-foreground h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-primary">Somken Jobs</h3>
                <p className="text-xs text-muted-foreground">East Africa</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              East Africa's leading job board connecting humanitarian professionals with career opportunities in Kenya, Somalia, and across the region. Find jobs with top NGOs, UN agencies, and development organizations.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Job Categories */}
          <div>
            <h4 className="font-semibold mb-4">Job Categories</h4>
            <ul className="space-y-2 text-sm">
              {jobCategories.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold mb-4">Stay Updated</h4>
            <p className="text-muted-foreground text-sm mb-3">
              Get notified about new job opportunities
            </p>
            <div className="flex">
              <Input
                type="email"
                placeholder="Enter your email"
                className="rounded-r-none"
              />
              <Button className="rounded-l-none">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8">
          <div className="text-center mb-4">
            <p className="text-muted-foreground text-sm">
              © 2025 Somken Jobs East Africa. All rights reserved.
              <span className="mx-2">•</span>
              Job data sourced from ReliefWeb and UN Jobs
            </p>
          </div>
          
          {/* Additional SEO text with internal links */}
          <div className="text-center text-xs text-muted-foreground space-y-2">
            <p>
              Find the best humanitarian jobs in 
              <a href="/jobs?country=Kenya" className="text-primary hover:underline mx-1">Kenya</a> 
              and 
              <a href="/jobs?country=Somalia" className="text-primary hover:underline mx-1">Somalia</a> 
              with leading organizations including UNHCR, WHO, Save the Children, and World Food Programme.
            </p>
            <p>
              Browse 
              <a href="/jobs?sector=Health" className="text-primary hover:underline mx-1">health jobs</a>, 
              <a href="/jobs?sector=Education" className="text-primary hover:underline mx-1">education positions</a>, 
              <a href="/jobs?sector=Protection" className="text-primary hover:underline mx-1">protection roles</a>, 
              and other opportunities in the humanitarian sector.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
