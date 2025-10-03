import { useState } from 'react';
import { SearchBox } from '../../components/SearchBox';
import { PlanChips } from '../../components/PlanChips';
import { AnswerStream } from '../../components/AnswerStream';
import { SourceCard } from '../../components/SourceCard';
import { MetricsBar } from '../../components/MetricsBar';
import { useSearch } from '../../features/search/hooks';
import { useLogEvent } from '../../features/search/hooks';
import { getUserId } from '../../lib/utils';
import { fetchAnswer } from '../../features/search/api';
import type { AnswerPacket } from '../../features/search/types';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<AnswerPacket | null>(null);
  const [isAnswerLoading, setIsAnswerLoading] = useState(false);

  const searchQuery = useSearch(query, query.length > 0);
  const logEvent = useLogEvent();

  const handleSearch = async (newQuery: string) => {
    setQuery(newQuery);
    setAnswer(null);
    setIsAnswerLoading(true);

    try {
      // Wait for search results first to get the plan
      // In a real app, this would be more sophisticated
      setTimeout(async () => {
        const answerData = await fetchAnswer(newQuery, getUserId());
        setAnswer(answerData);
        setIsAnswerLoading(false);
      }, 100);
    } catch (error) {
      console.error('Answer error:', error);
      setIsAnswerLoading(false);
    }
  };

  const handleSourceClick = (sourceId: string, queryId: string) => {
    logEvent.mutate({
      userId: getUserId(),
      timestamp: Date.now(),
      eventType: 'SOURCE_CLICKED',
      sourceId,
      queryId,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Box */}
      <div className="mb-8">
        <SearchBox onSearch={handleSearch} isLoading={searchQuery.isLoading || isAnswerLoading} />
      </div>

      {/* Plan Chips */}
      {searchQuery.data?.plan && (
        <div className="mb-6">
          <PlanChips plan={searchQuery.data.plan} />
        </div>
      )}

      {/* Results Layout: Answer (left) + Sources (right) */}
      {(searchQuery.data || answer || isAnswerLoading) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Answer */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Answer</h2>
            <AnswerStream answer={answer} isLoading={isAnswerLoading} />
            {answer && (
              <div className="mt-4">
                <MetricsBar sourceCount={answer.sources.length} />
              </div>
            )}
          </div>

          {/* Right Panel: Sources */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sources</h2>
            <div className="space-y-3">
              {searchQuery.isLoading && (
                <div className="text-center text-gray-500 py-8">Loading sources...</div>
              )}
              {/* First: Show sources used in answer synthesis */}
              {answer?.sources && console.log(`\n=== SOURCE DISPLAY SUMMARY ===\nTotal synthesis sources: ${answer.sources.length}\nTotal search results: ${searchQuery.data?.results.length || 0}\n==============================\n`)}
              {answer?.sources.map((source, idx) => {
                const displayIndex = idx + 1;
                console.log(`[SYNTHESIS SOURCE #${displayIndex}] ID: ${source.id}, Title: ${source.title}, Used in answer: YES`);
                return (
                  <SourceCard
                    key={source.id}
                    source={source}
                    index={displayIndex}
                    onClick={() => handleSourceClick(source.id, answer.queryId)}
                  />
                );
              })}
              {/* Second: Show additional sources from search results not in answer */}
              {searchQuery.data?.results
                .filter((result) => {
                  const isInAnswer = answer?.sources.some((s) => s.id === result.id);
                  if (isInAnswer) {
                    console.log(`[FILTERED OUT] ID: ${result.id}, Title: ${result.title}, Reason: Already in synthesis sources`);
                  }
                  return !isInAnswer;
                })
                .map((result, idx) => {
                  const displayIndex = (answer?.sources.length || 0) + idx + 1;
                  console.log(`[ADDITIONAL SOURCE #${displayIndex}] ID: ${result.id}, Title: ${result.title}, Used in answer: NO`);
                  return (
                    <SourceCard
                      key={result.id}
                      source={{
                        ...result,
                        score: 0.8,
                        excerpt: result.snippet,
                        signals: {
                          relevance: 0.8,
                          recency: 0.6,
                          sourceQuality: 0.7,
                        },
                        rankingReason: 'matched query',
                      }}
                      index={displayIndex}
                      onClick={() => handleSourceClick(result.id, query)}
                    />
                  );
                })}
              {answer?.sources && searchQuery.data?.results && console.log(`\n=== FINAL SOURCE COUNT ===\nSynthesis sources shown: ${answer.sources.length}\nAdditional sources shown: ${searchQuery.data.results.filter((r) => !answer.sources.some((s) => s.id === r.id)).length}\nTotal sources displayed: ${answer.sources.length + searchQuery.data.results.filter((r) => !answer.sources.some((s) => s.id === r.id)).length}\n==========================\n`)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

