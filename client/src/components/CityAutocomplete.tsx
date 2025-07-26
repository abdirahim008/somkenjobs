
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Check, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  country?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export function CityAutocomplete({
  value,
  onChange,
  country,
  placeholder = "Select or type city name",
  disabled = false,
  className = "",
  required = false
}: CityAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // Sync input value with prop value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Reset input when country changes
  useEffect(() => {
    if (country && value) {
      // Keep the value but refresh the query
      setInputValue(value);
    }
  }, [country, value]);

  // Fetch cities with search and country filter
  const { data: cities = [], isLoading } = useQuery<string[]>({
    queryKey: ['/api/cities', inputValue, country],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (inputValue) {
        params.append('search', inputValue);
      }
      if (country) {
        params.append('country', country);
      }
      const response = await fetch(`/api/cities?${params}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch cities');
      }
      return response.json();
    },
    enabled: !!country, // Only run query when country is selected
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

  // Filter cities based on input
  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Show "Add new city" option if input doesn't match any existing city
  const showAddNew = inputValue && country && !cities.some(city => 
    city.toLowerCase() === inputValue.toLowerCase()
  );

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Input
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={country ? placeholder : "Select country first"}
          disabled={disabled || !country}
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
          disabled={disabled || !country}
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
      
      {/* Dropdown suggestions */}
      {open && country && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="py-2 px-3 text-sm text-gray-500">Loading...</div>
          ) : (
            <>
              {filteredCities.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-50">
                    Cities in {country}
                  </div>
                  {filteredCities.slice(0, 10).map((city) => (
                    <div
                      key={city}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 flex items-center"
                      onClick={() => handleSelect(city)}
                    >
                      <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                      <span>{city}</span>
                      {value === city && (
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
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>Add "{inputValue}" to {country}</span>
                  </div>
                </div>
              )}
              
              {filteredCities.length === 0 && !showAddNew && inputValue && (
                <div className="px-3 py-2 text-sm text-gray-500">No cities found in {country}.</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}