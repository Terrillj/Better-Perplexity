import { SearchBox } from './SearchBox';

interface HeroSearchProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export function HeroSearch({ onSearch, isLoading }: HeroSearchProps) {
  const exampleQueries = [
    'What are the latest developments in quantum computing?',
    'How does photosynthesis work at the molecular level?',
    'What caused the 2008 financial crisis?',
  ];

  const randomExample = exampleQueries[Math.floor(Math.random() * exampleQueries.length)];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 motion-safe:animate-fade-in">
      <div className="max-w-6xl w-full text-center">
        {/* Logo/Title */}
        <div className="mb-8 sm:mb-10 motion-safe:animate-slide-up">
          <div className="inline-flex items-center justify-center mb-4">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium text-slate-900 mb-3 sm:mb-4 tracking-tight px-2">
            Better-Perplexity
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-2 px-4">
            A transparent search assistant that learns your preferences.
          </p>
          <p className="text-sm sm:text-base text-slate-500 px-4">
            Get comprehensive answers with verifiable citations.
          </p>
        </div>

        {/* Search Box */}
        <div className="motion-safe:animate-slide-up-delayed px-2 sm:px-0">
          <SearchBox onSearch={onSearch} isLoading={isLoading} heroMode={true} />
        </div>

        {/* Example Query Hint */}
        <div className="mt-6 motion-safe:animate-fade-in-delayed px-4">
          <p className="text-xs sm:text-sm text-slate-500 mb-2">Try asking:</p>
          <button
            onClick={() => onSearch(randomExample)}
            className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 hover:underline transition-colors min-h-[44px] sm:min-h-0 inline-flex items-center"
            disabled={isLoading}
          >
            "{randomExample}"
          </button>
        </div>

        {/* Feature Pills */}
        <div className="mt-8 sm:mt-12 flex flex-wrap justify-center gap-2 sm:gap-3 text-xs text-slate-600 motion-safe:animate-fade-in-delayed px-2">
          <div className="px-3 sm:px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-slate-200/50 shadow-sm">
            🎯 Personalized Results
          </div>
          <div className="px-3 sm:px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-slate-200/50 shadow-sm">
            📚 Multi-Source Synthesis
          </div>
          <div className="px-3 sm:px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-slate-200/50 shadow-sm">
            🔍 Transparent Citations
          </div>
        </div>
      </div>
    </div>
  );
}

