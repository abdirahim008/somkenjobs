import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Debounced search - trigger search after user stops typing
    const timeoutId = setTimeout(() => {
      onSearch(e.target.value);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };

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
          <Button type="submit" className="btn-primary">
            Search Jobs
          </Button>
        </div>
      </form>
    </div>
  );
}
