import { useState } from "react";
import { Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Filters {
  country: string[];
  organization: string[];
  sector: string[];
  datePosted?: string;
}

interface AvailableFilters {
  countries: string[];
  organizations: string[];
  sectors: string[];
}

interface SidebarProps {
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
  availableFilters?: AvailableFilters;
  isLoading: boolean;
}

export default function Sidebar({ filters, onFilterChange, availableFilters, isLoading }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    country: false,
    organization: false,
    sector: false,
    datePosted: true, // Keep date filter always expanded as it's a dropdown
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCountryChange = (country: string, checked: boolean) => {
    const newCountries = checked
      ? [...filters.country, country]
      : filters.country.filter(c => c !== country);
    onFilterChange({ country: newCountries });
  };

  const handleOrganizationChange = (org: string, checked: boolean) => {
    const newOrgs = checked
      ? [...filters.organization, org]
      : filters.organization.filter(o => o !== org);
    onFilterChange({ organization: newOrgs });
  };

  const handleSectorChange = (sector: string, checked: boolean) => {
    const newSectors = checked
      ? [...filters.sector, sector]
      : filters.sector.filter(s => s !== sector);
    onFilterChange({ sector: newSectors });
  };

  const clearAllFilters = () => {
    onFilterChange({
      country: [],
      organization: [],
      sector: [],
      datePosted: undefined,
    });
  };

  const getOrgDisplayName = (org: string) => {
    if (org.includes("World Health Organization")) return "WHO";
    if (org.includes("United Nations")) return "UN Agencies";
    if (org.includes("UNICEF")) return "UNICEF";
    if (org.includes("World Food Programme")) return "WFP";
    return org.length > 25 ? org.substring(0, 25) + "..." : org;
  };

  const getFilterSummary = (filterType: string) => {
    switch (filterType) {
      case 'country':
        return filters.country.length > 0 ? `${filters.country.length} selected` : 'All countries';
      case 'organization':
        return filters.organization.length > 0 ? `${filters.organization.length} selected` : 'All organizations';
      case 'sector':
        return filters.sector.length > 0 ? `${filters.sector.length} selected` : 'All sectors';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <aside className="w-full">
        <Card className="border-l-4 border-l-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="text-primary mr-2 h-5 w-5" />
              Filter Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-20 mb-3" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </aside>
    );
  }

  return (
    <aside className="w-full">
      <Card className="border-l-4 border-l-primary/20 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="text-primary mr-2 h-5 w-5" />
            Filter Jobs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Country Filter */}
          <div>
            <Button
              variant="ghost"
              onClick={() => toggleSection('country')}
              className="w-full justify-between p-0 h-auto font-medium text-sm hover:bg-transparent"
            >
              <div className="flex items-center">
                <span>Country</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  ({getFilterSummary('country')})
                </span>
              </div>
              {expandedSections.country ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {expandedSections.country && (
              <div className="mt-3 space-y-2">
                {(availableFilters?.countries || ["Kenya", "Somalia"]).map((country) => (
                  <div key={country} className="flex items-center space-x-2">
                    <Checkbox
                      id={`country-${country}`}
                      checked={filters.country.includes(country)}
                      onCheckedChange={(checked) => handleCountryChange(country, !!checked)}
                      className="filter-checkbox"
                    />
                    <label
                      htmlFor={`country-${country}`}
                      className="text-sm cursor-pointer"
                    >
                      {country}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Organization Filter */}
          <div>
            <Button
              variant="ghost"
              onClick={() => toggleSection('organization')}
              className="w-full justify-between p-0 h-auto font-medium text-sm hover:bg-transparent"
            >
              <div className="flex items-center">
                <span>Organization</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  ({getFilterSummary('organization')})
                </span>
              </div>
              {expandedSections.organization ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {expandedSections.organization && (
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {(availableFilters?.organizations || []).slice(0, 10).map((org) => (
                  <div key={org} className="flex items-center space-x-2">
                    <Checkbox
                      id={`org-${org}`}
                      checked={filters.organization.includes(org)}
                      onCheckedChange={(checked) => handleOrganizationChange(org, !!checked)}
                      className="filter-checkbox"
                    />
                    <label
                      htmlFor={`org-${org}`}
                      className="text-sm cursor-pointer"
                      title={org}
                    >
                      {getOrgDisplayName(org)}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium mb-3">Posted</label>
            <Select
              value={filters.datePosted || "all"}
              onValueChange={(value) => onFilterChange({ datePosted: value === "all" ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="last24hours">Last 24 hours</SelectItem>
                <SelectItem value="last7days">Last 7 days</SelectItem>
                <SelectItem value="last30days">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sector Filter */}
          <div>
            <Button
              variant="ghost"
              onClick={() => toggleSection('sector')}
              className="w-full justify-between p-0 h-auto font-medium text-sm hover:bg-transparent"
            >
              <div className="flex items-center">
                <span>Sector</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  ({getFilterSummary('sector')})
                </span>
              </div>
              {expandedSections.sector ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {expandedSections.sector && (
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {(availableFilters?.sectors || []).map((sector) => (
                  <div key={sector} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sector-${sector}`}
                      checked={filters.sector.includes(sector)}
                      onCheckedChange={(checked) => handleSectorChange(sector, !!checked)}
                      className="filter-checkbox"
                    />
                    <label
                      htmlFor={`sector-${sector}`}
                      className="text-sm cursor-pointer"
                    >
                      {sector}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clear Filters */}
          <Button
            variant="outline"
            onClick={clearAllFilters}
            className="w-full"
          >
            Clear All Filters
          </Button>
        </CardContent>
      </Card>
    </aside>
  );
}
