import { useState, FormEvent } from 'react';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  heroMode?: boolean;
}

export function SearchBox({ onSearch, isLoading, heroMode = false }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const inputClasses = heroMode
    ? `w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-base sm:text-lg border-2 rounded-xl focus:outline-none transition-all duration-300 ${
        isFocused
          ? 'border-transparent shadow-lg ring-2 ring-offset-2 ring-blue-500'
          : 'border-slate-200 shadow-md hover:shadow-lg hover:border-slate-300'
      }`
    : `w-full pl-10 pr-4 py-2.5 text-base border rounded-lg focus:outline-none transition-all duration-200 ${
        isFocused
          ? 'border-transparent shadow-md ring-2 ring-blue-500'
          : 'border-slate-300 hover:border-slate-400'
      }`;

  const buttonClasses = heroMode
    ? 'px-5 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium text-white rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 min-w-[100px] sm:min-w-0'
    : 'px-4 sm:px-6 py-2.5 text-sm sm:text-base font-medium text-white rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md active:scale-95';

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className={`flex ${heroMode ? 'gap-2 sm:gap-3' : 'gap-2'}`}>
        <div className="relative flex-1 min-w-0">
          {/* Search Icon */}
          <div className={`absolute left-3 sm:left-4 ${heroMode ? 'top-3 sm:top-4' : 'top-2.5'} text-slate-400 pointer-events-none`}>
            <svg className={`${heroMode ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask anything..."
            className={inputClasses}
            disabled={isLoading}
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className={buttonClasses}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {heroMode ? 'Searching...' : 'Searching'}
            </span>
          ) : (
            'Search'
          )}
        </button>
      </div>
    </form>
  );
}

