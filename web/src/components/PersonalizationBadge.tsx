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
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0">
          <svg
            className="w-4 h-4 text-gray-500"
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
          <h3 className="text-xs font-medium text-gray-700 mb-1">
            Sources you might find helpful
          </h3>
          <p className="text-xs text-gray-600">
            You tend to prefer:{' '}
            {sortedPreferences.map(([arm], idx) => (
              <span key={arm}>
                <span className="font-medium text-gray-700">
                  {formatArm(arm)}
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

