interface LoadingSkeletonProps {
  stage?: 'planning' | 'searching' | 'analyzing' | 'synthesizing';
  message?: string;
}

export function LoadingSkeleton({ stage = 'searching', message }: LoadingSkeletonProps) {
  const stages = [
    { key: 'planning', label: 'Planning search strategy...', defaultMessage: 'Analyzing query and creating search plan' },
    { key: 'searching', label: 'Gathering sources...', defaultMessage: 'Searching across multiple sources' },
    { key: 'analyzing', label: 'Analyzing and ranking...', defaultMessage: 'Evaluating and ranking results' },
    { key: 'synthesizing', label: 'Synthesizing answer...', defaultMessage: 'Generating comprehensive answer' },
  ];

  const currentStageIndex = stages.findIndex(s => s.key === stage);
  const currentStage = stages[currentStageIndex];

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {currentStage?.label}
          </span>
          <span className="text-xs text-gray-500">
            Step {currentStageIndex + 1} of {stages.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
            style={{ width: `${((currentStageIndex + 1) / stages.length) * 100}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {message || currentStage?.defaultMessage}
        </p>
      </div>

      {/* Skeleton cards */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="p-4 border border-gray-200 rounded-lg bg-white relative overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              {/* Index circle skeleton */}
              <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
              
              <div className="flex-1 space-y-3">
                {/* Title skeleton */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>
                
                {/* Domain skeleton */}
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4" />
                
                {/* Excerpt skeleton */}
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-full" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-5/6" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-4/6" />
                </div>
                
                {/* Badges skeleton */}
                <div className="flex gap-2">
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-16" />
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-20" />
                </div>
              </div>
            </div>

            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
          </div>
        ))}
      </div>

      {/* Info message */}
      <div className="text-center pt-4">
        <p className="text-xs text-gray-500">
          Finding and analyzing the best sources for your query...
        </p>
      </div>
    </div>
  );
}

