import type { RankedDoc } from '../features/search/types';
import { formatDate } from '../lib/utils';

interface SourceCardProps {
  source: RankedDoc;
  index: number;
  onClick?: () => void;
}

export function SourceCard({ source, index, onClick }: SourceCardProps) {
  const signalBadges = [];
  
  if (source.signals.relevance > 0.7) signalBadges.push('Relevant');
  if (source.signals.recency > 0.7) signalBadges.push('Recent');
  if (source.signals.sourceQuality > 0.7) signalBadges.push('Quality Source');

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

