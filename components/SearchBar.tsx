'use client';

import { useState, FormEvent } from 'react';
import { Search, MapPin } from 'lucide-react';

interface SearchBarProps {
  onSearch: (location: string) => void;
  onUseGeolocation: () => void;
  isLoading: boolean;
}

export function SearchBar({ onSearch, onUseGeolocation, isLoading }: SearchBarProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSearch(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search city (e.g., London, Tokyo, Jakarta)"
            className="w-full pl-9 pr-3 py-2.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
            disabled={isLoading}
          />
        </div>
        <button
          type="button"
          onClick={onUseGeolocation}
          className="px-3 py-2.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/30 transition-all disabled:opacity-50"
          disabled={isLoading}
          title="Use my location"
        >
          <MapPin className="w-4 h-4 text-white" />
        </button>
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2.5 bg-white/30 backdrop-blur-sm rounded-xl font-medium text-white hover:bg-white/40 transition-all disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Search'}
        </button>
      </div>
    </form>
  );
}