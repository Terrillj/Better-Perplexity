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
              {searchQuery.data?.results.map((result, idx) => (
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
                  index={idx + 1}
                  onClick={() => handleSourceClick(result.id, query)}
                />
              ))}
              {answer?.sources.map((source, idx) => (
                <SourceCard
                  key={source.id}
                  source={source}
                  index={idx + 1}
                  onClick={() => handleSourceClick(source.id, answer.queryId)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

