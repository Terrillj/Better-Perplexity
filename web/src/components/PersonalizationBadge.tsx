interface PersonalizationBadgeProps {
  preferences: Record<string, number>;
  totalInteractions: number;
}

export function PersonalizationBadge({ preferences, totalInteractions }: PersonalizationBadgeProps) {
  // Only show if user has at least 5 interactions (avoid cold-start noise)
  if (totalInteractions < 5) {
    return null;
  }

  // Convert preferences object to sorted array
  const sortedPreferences = Object.entries(preferences)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3); // Top 3

  if (sortedPreferences.length === 0) {
    return null;
  }

  // Format arm names for display (e.g., "depth:expert" -> "Expert content")
  const formatArm = (arm: string): string => {
    const [category, value] = arm.split(':');
    
    // Capitalize and make readable
    const formattedValue = value.charAt(0).toUpperCase() + value.slice(1);
    
    const categoryLabels: Record<string, string> = {
      depth: 'content',
      style: 'style',
      format: 'format',
      approach: 'approach',
      density: 'density',
    };
    
    const categoryLabel = categoryLabels[category] || category;
    return `${formattedValue} ${categoryLabel}`;
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-purple-900 mb-1">
            Personalized for You
          </h3>
          <p className="text-xs text-purple-700">
            Based on {totalInteractions} interactions, we've learned you prefer:{' '}
            {sortedPreferences.map(([arm, score], idx) => (
              <span key={arm}>
                <span className="font-medium">
                  {formatArm(arm)} ({Math.round(score * 100)}%)
                </span>
                {idx < sortedPreferences.length - 1 && ', '}
              </span>
            ))}
          </p>
        </div>
      </div>
    </div>
  );
}

