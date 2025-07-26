import React from "react";
import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  const quickLinks = [
    { label: "Browse Jobs", href: "/" },
    { label: "Career Resources", href: "/career-resources" },
    { label: "Job Alerts", href: "#" },
  ];

  const supportLinks = [
    { label: "Help Center", href: "/help-center" },
    { label: "Contact Us", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" },
  ];

  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
              Connecting humanitarian professionals with meaningful opportunities across Kenya and Somalia.
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

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © 2025 Somken Jobs East Africa. All rights reserved.
            <span className="mx-2">•</span>
            Job data sourced from ReliefWeb and UN Jobs
          </p>
        </div>
      </div>
    </footer>
  );
}
