import type { AnswerPacket } from '../features/search/types';

interface AnswerStreamProps {
  answer: AnswerPacket | null;
  isLoading?: boolean;
}

export function AnswerStream({ answer, isLoading }: AnswerStreamProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    );
  }

  if (!answer) {
    return (
      <div className="text-gray-500 text-center py-8">
        Enter a query to get started
      </div>
    );
  }

  // Simple markdown-like rendering with citation highlighting
  const renderTextWithCitations = (text: string) => {
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, idx) => {
      const citationMatch = part.match(/\[(\d+)\]/);
      if (citationMatch) {
        return (
          <sup
            key={idx}
            className="text-blue-600 font-semibold cursor-pointer hover:underline"
            title="Click to see source"
          >
            {citationMatch[1]}
          </sup>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="prose prose-sm max-w-none">
      <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
        {renderTextWithCitations(answer.text)}
      </div>
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Answer generated from {answer.sources.length} sources
        </div>
      </div>
    </div>
  );
}

