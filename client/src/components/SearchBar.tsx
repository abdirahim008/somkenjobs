import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Search form submitted with term:", searchTerm);
    onSearch(searchTerm);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for debounced search
    timeoutRef.current = setTimeout(() => {
      onSearch(value);
    }, 500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="bg-card rounded-xl shadow-lg p-2 flex items-center">
          <div className="flex-1 flex items-center">
            <Search className="text-muted-foreground ml-4 mr-3 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search jobs by title, organization, or keyword..."
              value={searchTerm}
              onChange={handleInputChange}
              className="search-input border-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <Button 
            type="submit" 
            className="bg-[#0077B5] hover:bg-[#005A87] text-white"
            onClick={handleSubmit}
          >
            Search Jobs
          </Button>
        </div>
      </form>
    </div>
  );
}
