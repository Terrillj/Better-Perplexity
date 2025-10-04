import { useState } from 'react';
import { SearchBox } from '../../components/SearchBox';
import { HeroSearch } from '../../components/HeroSearch';
import { PlanChips } from '../../components/PlanChips';
import { AnswerStream } from '../../components/AnswerStream';
import { SourceCard } from '../../components/SourceCard';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { PersonalizationBadge } from '../../components/PersonalizationBadge';
import { DemoPanel } from '../../components/DemoPanel';
import { useSearch, useLogEvent, usePreferences, useUserEvents, useResetUserData } from '../../features/search/hooks';
import { getUserId } from '../../lib/utils';
import { fetchAnswerStream } from '../../features/search/api';
import type { AnswerPacket } from '../../features/search/types';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<AnswerPacket | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [isAnswerLoading, setIsAnswerLoading] = useState(false);
  const [progressStage, setProgressStage] = useState<'planning' | 'searching' | 'analyzing' | 'synthesizing'>('searching');
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);

  const userId = getUserId();
  const searchQuery = useSearch(query, query.length > 0);
  const logEvent = useLogEvent();
  const preferencesQuery = usePreferences(userId);
  const eventsQuery = useUserEvents(userId);
  const resetMutation = useResetUserData();

  const handleSearch = async (newQuery: string) => {
    setHasSearched(true);
    setQuery(newQuery);
    setAnswer(null);
    setStreamingText('');
    setIsAnswerLoading(true);
    setProgressStage('planning');
    setProgressMessage('');

    try {
      const answerData = await fetchAnswerStream(
        newQuery,
        getUserId(),
        (chunk: string) => {
          // Accumulate streaming text chunks
          setStreamingText((prev) => prev + chunk);
        },
        (stage, message) => {
          // Update progress stage and message
          setProgressStage(stage);
          setProgressMessage(message || '');
        }
      );
      
      // Once complete, set the full answer
      setAnswer(answerData);
      setStreamingText(''); // Clear streaming text
      setIsAnswerLoading(false);
    } catch (error) {
      console.error('Answer error:', error);
      setIsAnswerLoading(false);
    }
  };

  const handleSourceClick = (sourceId: string, queryId: string) => {
    // Find the clicked source to get its features
    const clickedSource = answer?.sources.find(s => s.id === sourceId);
    
    logEvent.mutate({
      userId,
      timestamp: Date.now(),
      eventType: 'SOURCE_CLICKED',
      sourceId,
      queryId,
      meta: clickedSource?.features ? { features: clickedSource.features } : undefined,
    });
    
    // Refetch preferences after a click to update the badge
    setTimeout(() => {
      preferencesQuery.refetch();
    }, 500);
  };

  const handleCitationClick = (citationNumber: number, sourceId: string, queryId: string) => {
    // Find the clicked source to get its features
    const clickedSource = answer?.sources.find(s => s.id === sourceId);
    
    logEvent.mutate({
      userId,
      timestamp: Date.now(),
      eventType: 'CITATION_CLICKED',
      sourceId,
      queryId,
      meta: {
        citationNumber,
        ...(clickedSource?.features ? { features: clickedSource.features } : {}),
      },
    });
    
    // Refetch preferences after a click to update the badge
    setTimeout(() => {
      preferencesQuery.refetch();
      eventsQuery.refetch();
    }, 500);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all personalization data? This will clear your bandit state and event history.')) {
      resetMutation.mutate(userId);
    }
  };

  // Show hero state if user hasn't searched yet
  if (!hasSearched) {
    return <HeroSearch onSearch={handleSearch} isLoading={searchQuery.isLoading || isAnswerLoading} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 motion-safe:animate-fade-in">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Compact Search Box */}
        <div className="mb-6 motion-safe:animate-slide-down">
          <SearchBox onSearch={handleSearch} isLoading={searchQuery.isLoading || isAnswerLoading} />
        </div>

        {/* Plan Chips */}
        {searchQuery.data?.plan && (
          <div className="mb-6 motion-safe:animate-fade-in">
            <PlanChips plan={searchQuery.data.plan} />
          </div>
        )}

        {/* Demo Panel for Testers */}
        {preferencesQuery.data && preferencesQuery.data.totalInteractions > 0 && (
          <div className="mb-6 motion-safe:animate-fade-in">
            <DemoPanel
              preferences={preferencesQuery.data}
              recentEvents={eventsQuery.data || []}
              onReset={handleReset}
              isResetting={resetMutation.isPending}
            />
          </div>
        )}

        {/* Personalization Badge */}
        {preferencesQuery.data && (
          <div className="mb-4 motion-safe:animate-fade-in">
            <PersonalizationBadge
              preferences={Object.fromEntries(
                preferencesQuery.data.topArms.map(({ arm, score }) => [arm, score])
              )}
              totalInteractions={preferencesQuery.data.totalInteractions}
            />
          </div>
        )}

        {/* Results Layout: Answer (left) + Sources (right) */}
        {(searchQuery.data || answer || isAnswerLoading) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 motion-safe:animate-slide-up">
            {/* Left Panel: Answer */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <h2 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></span>
                Answer
              </h2>
              <AnswerStream 
                answer={answer} 
                isLoading={isAnswerLoading} 
                streamingText={streamingText}
                onCitationClick={handleCitationClick}
              />
            </div>

            {/* Right Panel: Sources */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <h2 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></span>
                Sources
              </h2>
              <div className="space-y-3">
                {/* Show loading skeleton while processing */}
                {isAnswerLoading && !answer && (
                  <LoadingSkeleton stage={progressStage} message={progressMessage} />
                )}
                
                {/* Show final sources only after answer is complete */}
                {answer?.sources.map((source, idx) => {
                  const displayIndex = idx + 1;
                  return (
                    <div 
                      key={source.id} 
                      id={`source-card-${displayIndex}`}
                      className="motion-safe:animate-slide-up"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <SourceCard
                        source={source}
                        index={displayIndex}
                        onClick={() => handleSourceClick(source.id, answer.queryId)}
                        userTopArms={preferencesQuery.data?.topArms.slice(0, 3).map(t => t.arm)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

