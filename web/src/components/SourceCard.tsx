import type { RankedDoc } from '../features/search/types';
import { formatDate } from '../lib/utils';

interface SourceCardProps {
  source: RankedDoc;
  index: number;
  onClick?: () => void;
  userTopArms?: string[]; // Top preferred feature arms for personalization indicator
}

export function SourceCard({ source, index, onClick, userTopArms = [] }: SourceCardProps) {
  const signalBadges = [];
  
  if (source.signals.relevance > 0.7) signalBadges.push('Relevant');
  if (source.signals.recency > 0.7) signalBadges.push('Recent');
  if (source.signals.sourceQuality > 0.7) signalBadges.push('Quality Source');

  // Check if source matches user's top preferences
  const isPersonalized = source.features && userTopArms.length > 0 && userTopArms.some(arm => {
    const [category, value] = arm.split(':');
    return source.features?.[category as keyof typeof source.features] === value;
  });

  return (
    <div
      onClick={onClick}
      className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all cursor-pointer bg-white"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
          {index}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
            {source.title}
          </h3>
          <div className="text-xs text-gray-500 mb-2">
            {source.domain} • {formatDate(source.publishedDate)}
          </div>
          <p className="text-sm text-gray-600 line-clamp-3 mb-2">
            {source.excerpt}
          </p>
          <div className="flex flex-wrap gap-1">
            {isPersonalized && (
              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded border border-purple-200 font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Matches your preferences
              </span>
            )}
            {signalBadges.map((badge) => (
              <span
                key={badge}
                className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded border border-green-200"
              >
                {badge}
              </span>
            ))}
            {source.rankingReason && (
              <span className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded border border-gray-200">
                {source.rankingReason}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

