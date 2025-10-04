import { useState } from 'react';
import type { UserPreferences, UserEvent } from '../features/search/types';

interface DemoPanelProps {
  preferences: UserPreferences | null;
  recentEvents: UserEvent[];
  onReset: () => void;
  isResetting?: boolean;
}

export function DemoPanel({ preferences, recentEvents, onReset, isResetting = false }: DemoPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!preferences || preferences.totalInteractions === 0) {
    return null;
  }

  // Get all arm scores sorted by value
  const allArms = preferences.topArms.slice(0, 10); // Show top 10

  // Get recent SOURCE_CLICKED events
  const recentClicks = recentEvents
    .filter(e => e.eventType === 'SOURCE_CLICKED')
    .slice(-5)
    .reverse(); // Most recent first

  return (
    <div className="border-2 border-purple-300 rounded-lg bg-purple-50/50 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-purple-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🔬</span>
          <span className="text-sm font-semibold text-purple-900">
            For Testers: Personalization Debug
          </span>
          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
            {preferences.totalInteractions} interactions
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-purple-700 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Bandit State */}
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <h4 className="text-xs font-semibold text-purple-900 mb-2 flex items-center gap-1">
              <span>⚡</span> Thompson Sampling Bandit State
            </h4>
            <div className="space-y-1">
              {allArms.map(({ arm, score }) => {
                const [category, value] = arm.split(':');
                return (
                  <div key={arm} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700">
                      <span className="font-medium text-purple-700">{category}</span>:{value}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${score * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-600 font-mono w-12 text-right">
                        {(score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Clicks */}
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <h4 className="text-xs font-semibold text-purple-900 mb-2 flex items-center gap-1">
              <span>👆</span> Last {Math.min(recentClicks.length, 5)} Clicks
            </h4>
            {recentClicks.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No clicks yet</p>
            ) : (
              <div className="space-y-2">
                {recentClicks.map((event, idx) => {
                  const features = event.meta?.features as any;
                  return (
                    <div key={`${event.timestamp}-${idx}`} className="text-xs border-l-2 border-purple-300 pl-2">
                      <div className="text-gray-600 mb-0.5">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                      {features && (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(features).map(([key, val]) => (
                            <span
                              key={key}
                              className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-xs"
                            >
                              {key}:{String(val)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* How Sources Were Boosted */}
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <h4 className="text-xs font-semibold text-purple-900 mb-2 flex items-center gap-1">
              <span>📊</span> How Personalization Works
            </h4>
            <div className="text-xs text-gray-700 space-y-1">
              <p>• Sources matching your top preferences get a <span className="font-semibold text-purple-700">ranking boost</span></p>
              <p>• Each click teaches the system what you like</p>
              <p>• Thompson Sampling balances exploration vs exploitation</p>
              <p>• Purple star (⭐) = source matches your preferences</p>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={onReset}
            disabled={isResetting}
            className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 font-medium text-sm rounded border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResetting ? 'Resetting...' : '🔄 Reset Personalization Data'}
          </button>
          <p className="text-xs text-gray-500 text-center">
            Clears all bandit state and event history for fresh testing
          </p>
        </div>
      )}
    </div>
  );
}

