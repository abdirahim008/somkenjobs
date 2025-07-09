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
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative">
          <Input
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className="pr-10"
            onFocus={() => setOpen(true)}
          />
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setOpen(!open)}
              disabled={disabled}
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[200px] p-0" align="start">
          <Command>
            <CommandList>
              {isLoading ? (
                <div className="py-2 px-3 text-sm text-muted-foreground">Loading...</div>
              ) : (
                <>
                  {filteredOrganizations.length > 0 && (
                    <CommandGroup heading="Existing Organizations">
                      {filteredOrganizations.map((org) => (
                        <CommandItem
                          key={org}
                          value={org}
                          onSelect={() => handleSelect(org)}
                          className="cursor-pointer"
                        >
                          <Building2 className="mr-2 h-4 w-4" />
                          <span>{org}</span>
                          {value === org && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  
                  {showAddNew && (
                    <CommandGroup heading="Add New">
                      <CommandItem
                        value={inputValue}
                        onSelect={() => handleSelect(inputValue)}
                        className="cursor-pointer text-blue-600"
                      >
                        <Building2 className="mr-2 h-4 w-4" />
                        <span>Add "{inputValue}"</span>
                      </CommandItem>
                    </CommandGroup>
                  )}
                  
                  {filteredOrganizations.length === 0 && !showAddNew && inputValue && (
                    <CommandEmpty>No organizations found.</CommandEmpty>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}