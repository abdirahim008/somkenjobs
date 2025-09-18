import React from "react";
import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  // Generate structured data for Google rich snippets
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      ...(item.href && !item.isCurrentPage && {
        "item": `https://somkenjobs.com${item.href}`
      })
    }))
  };

  // Inject structured data into the page head
  React.useEffect(() => {
    // Remove any existing breadcrumb structured data
    const existingScript = document.querySelector('script[data-breadcrumb-structured-data]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-breadcrumb-structured-data', 'true');
    script.textContent = JSON.stringify(structuredData, null, 0);
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      const script = document.querySelector('script[data-breadcrumb-structured-data]');
      if (script) {
        script.remove();
      }
    };
  }, [items]);

  return (
    <nav aria-label="Breadcrumb" className="breadcrumb-nav mb-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-4 py-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronRight 
                className="h-4 w-4 text-muted-foreground/60" 
                aria-hidden="true"
              />
            )}
            
            {index === 0 && (
              <Home 
                className="h-4 w-4 text-muted-foreground/80 mr-1" 
                aria-hidden="true"
              />
            )}
            
            {item.href && !item.isCurrentPage ? (
              <Link 
                href={item.href}
                className="hover:text-primary transition-colors font-medium hover:underline"
                data-testid={`breadcrumb-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.label}
              </Link>
            ) : (
              <span 
                className={item.isCurrentPage ? "text-foreground font-semibold" : ""}
                aria-current={item.isCurrentPage ? "page" : undefined}
                data-testid={`breadcrumb-current-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Helper function to generate breadcrumb items for job pages
export function generateJobBreadcrumbs(
  jobTitle: string,
  jobSector?: string,
  isJobDetailPage: boolean = false
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Jobs", href: "/jobs" }
  ];

  // Add sector category if available
  if (jobSector) {
    breadcrumbs.push({
      label: `${jobSector} Jobs`,
      href: `/jobs?sector=${encodeURIComponent(jobSector)}`
    });
  }

  // Add current job title if on job detail page
  if (isJobDetailPage) {
    // Truncate very long job titles for breadcrumb display
    const truncatedTitle = jobTitle.length > 50 
      ? `${jobTitle.substring(0, 47)}...` 
      : jobTitle;
    
    breadcrumbs.push({
      label: truncatedTitle,
      isCurrentPage: true
    });
  }

  return breadcrumbs;
}