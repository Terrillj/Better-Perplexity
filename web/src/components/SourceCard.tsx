import type { RankedDoc } from '../features/search/types';
import { formatDate } from '../lib/utils';
import DOMPurify from 'dompurify';

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

  // Format feature tags for display
  const formatFeatureTag = (category: string, value: string): { display: string; tooltip: string } => {
    const labels: Record<string, Record<string, { display: string; tooltip: string }>> = {
      depth: {
        introductory: { display: 'Introductory', tooltip: 'Beginner-friendly content' },
        intermediate: { display: 'Intermediate', tooltip: 'Moderate technical depth' },
        expert: { display: 'Expert', tooltip: 'Advanced technical content' },
      },
      style: {
        academic: { display: 'Academic', tooltip: 'Scholarly research style' },
        technical: { display: 'Technical', tooltip: 'Technical documentation style' },
        journalistic: { display: 'Journalistic', tooltip: 'News article style' },
        conversational: { display: 'Conversational', tooltip: 'Casual, approachable style' },
      },
      format: {
        tutorial: { display: 'Tutorial', tooltip: 'Step-by-step guide' },
        research: { display: 'Research', tooltip: 'Research paper or study' },
        opinion: { display: 'Opinion', tooltip: 'Opinion or editorial piece' },
        reference: { display: 'Reference', tooltip: 'Reference documentation' },
      },
      approach: {
        conceptual: { display: 'Conceptual', tooltip: 'Theory-focused approach' },
        practical: { display: 'Practical', tooltip: 'Hands-on, applied approach' },
        'data-driven': { display: 'Data-driven', tooltip: 'Evidence-based approach' },
      },
      density: {
        concise: { display: 'Concise', tooltip: 'Brief and to-the-point' },
        moderate: { display: 'Moderate', tooltip: 'Balanced detail level' },
        comprehensive: { display: 'Comprehensive', tooltip: 'Detailed and thorough' },
      },
    };
    return labels[category]?.[value] || { display: value, tooltip: value };
  };

  // Extract feature tags if available
  const featureTags = source.features
    ? Object.entries(source.features)
        .map(([category, value]) => formatFeatureTag(category, value))
        .slice(0, 3) // Show top 3 features
    : [];

  // Sanitize excerpt HTML
  const sanitizeHTML = (html: string): string => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['strong', 'em', 'code', 'b', 'i', 'u'],
      ALLOWED_ATTR: [],
    });
  };

  // Handle card click - open URL in new tab and log event
  const handleCardClick = () => {
    // Log the event for personalization
    if (onClick) {
      onClick();
    }
    // Open the URL in a new tab
    window.open(source.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={handleCardClick}
      className="p-4 border rounded-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer bg-white relative group border-slate-200 hover:border-indigo-300 hover:shadow-lg"
    >
      {/* External link icon */}
      <div className="absolute top-4 right-4 text-slate-400 group-hover:text-indigo-600 transition-all group-hover:scale-110">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
      
      <div className="flex items-start gap-3 relative z-10">
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shadow-sm bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          {index}
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <h3 
            className="font-medium text-slate-900 mb-1 line-clamp-2 group-hover:text-indigo-700 transition-colors"
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(source.title) }}
          />
          <div className="text-xs text-slate-500 mb-2 font-medium">
            {source.domain} • {formatDate(source.publishedDate)}
          </div>
          <p 
            className="text-sm text-slate-600 line-clamp-3 mb-3 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(source.excerpt) }}
          />
          
          {/* Feature Tags */}
          {featureTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {featureTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md hover:bg-slate-200 transition-colors font-medium"
                  title={tag.tooltip}
                >
                  {tag.display}
                </span>
              ))}
            </div>
          )}
          
          {/* Signal Badges */}
          <div className="flex flex-wrap gap-1.5">
            {signalBadges.map((badge) => (
              <span
                key={badge}
                className="px-2 py-0.5 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 text-xs rounded-md border border-emerald-200/50 font-medium shadow-sm"
              >
                {badge}
              </span>
            ))}
            {source.rankingReason && (
              <span className="px-2 py-0.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 text-xs rounded-md border border-indigo-200/50 font-medium shadow-sm">
                {source.rankingReason}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

