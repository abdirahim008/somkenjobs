import { useState, useEffect, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Plus } from "lucide-react";

interface SectorAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export const SectorAutocomplete = ({
  value,
  onChange,
  placeholder = "Type to search sectors...",
  required = false,
}: SectorAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sectors, setSectors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch sectors when component mounts or search term changes
  useEffect(() => {
    const fetchSectors = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("auth_token");
        const response = await fetch(`/api/sectors?search=${encodeURIComponent(searchTerm)}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setSectors(data);
        }
      } catch (error) {
        console.error("Error fetching sectors:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSectors();
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleSectorSelect = (sector: string) => {
    onChange(sector);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleAddNewSector = async () => {
    if (!value.trim()) return;
    
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/sectors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ name: value.trim() }),
      });
      
      if (response.ok) {
        // Refresh sectors list
        const sectorsResponse = await fetch("/api/sectors", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        if (sectorsResponse.ok) {
          const data = await sectorsResponse.json();
          setSectors(data);
        }
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Error adding sector:", error);
    }
  };

  const filteredSectors = sectors.filter(sector =>
    sector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showAddOption = searchTerm && !sectors.some(sector => 
    sector.toLowerCase() === searchTerm.toLowerCase()
  );

  return (
    <div className="relative">
      <div className="relative">
        <Input
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </Button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-sm text-gray-500">Loading sectors...</div>
          ) : (
            <Fragment>
              {filteredSectors.length > 0 ? (
                filteredSectors.map((sector, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0"
                    onClick={() => handleSectorSelect(sector)}
                  >
                    {sector}
                  </button>
                ))
              ) : (
                <div className="p-3 text-sm text-gray-500">
                  No sectors found
                </div>
              )}
              
              {showAddOption && (
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-t border-gray-200 text-blue-600 flex items-center gap-2"
                  onClick={handleAddNewSector}
                >
                  <Plus className="h-4 w-4" />
                  Add "{value}" as new sector
                </button>
              )}
            </Fragment>
          )}
        </div>
      )}
    </div>
  );
};