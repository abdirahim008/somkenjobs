import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ChevronDown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrganizationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export function OrganizationAutocomplete({
  value,
  onChange,
  placeholder = "Select or type organization name",
  disabled = false,
  className = "",
  required = false
}: OrganizationAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // Sync input value with prop value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Debug log to check if component is receiving correct props
  console.log('OrganizationAutocomplete props:', { value, disabled, placeholder });

  // Fetch organizations with search
  const { data: organizations = [], isLoading } = useQuery<string[]>({
    queryKey: ['/api/organizations', inputValue],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (inputValue) {
        params.append('search', inputValue);
      }
      const response = await fetch(`/api/organizations?${params}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }
      return response.json();
    },
  });

  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue);
    onChange(selectedValue);
    setOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
    if (!open) setOpen(true);
  };

  // Filter organizations based on input
  const filteredOrganizations = organizations.filter(org =>
    org.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Show "Add new organization" option if input doesn't match any existing org
  const showAddNew = inputValue && !organizations.some(org => 
    org.toLowerCase() === inputValue.toLowerCase()
  );

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Input
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="pr-10"
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Delay closing to allow for clicks on suggestions
            setTimeout(() => setOpen(false), 200);
          }}
        />
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setOpen(!open)}
          disabled={disabled}
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
      
      {/* Dropdown suggestions */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="py-2 px-3 text-sm text-gray-500">Loading...</div>
          ) : (
            <>
              {filteredOrganizations.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-50">
                    Existing Organizations
                  </div>
                  {filteredOrganizations.slice(0, 10).map((org) => (
                    <div
                      key={org}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 flex items-center"
                      onClick={() => handleSelect(org)}
                    >
                      <Building2 className="mr-2 h-4 w-4 text-gray-400" />
                      <span>{org}</span>
                      {value === org && (
                        <Check className="ml-auto h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {showAddNew && (
                <div>
                  <div className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-50">
                    Add New
                  </div>
                  <div
                    className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 flex items-center text-blue-600"
                    onClick={() => handleSelect(inputValue)}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>Add "{inputValue}"</span>
                  </div>
                </div>
              )}
              
              {filteredOrganizations.length === 0 && !showAddNew && inputValue && (
                <div className="px-3 py-2 text-sm text-gray-500">No organizations found.</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}