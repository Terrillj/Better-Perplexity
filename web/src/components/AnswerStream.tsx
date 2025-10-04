import type { AnswerPacket } from '../features/search/types';
import DOMPurify from 'dompurify';

interface AnswerStreamProps {
  answer: AnswerPacket | null;
  isLoading?: boolean;
  streamingText?: string;
  onCitationClick?: (citationNumber: number, sourceId: string, queryId: string) => void;
}

export function AnswerStream({ answer, isLoading, streamingText, onCitationClick }: AnswerStreamProps) {
  if (isLoading && !streamingText) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    );
  }

  if (!answer && !streamingText) {
    return (
      <div className="text-gray-500 text-center py-8">
        Enter a query to get started
      </div>
    );
  }

  // Convert markdown to HTML
  const markdownToHTML = (text: string): string => {
    let html = text;
    // Bold: **text** or __text__ -> <strong>text</strong>
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    // Italic: *text* or _text_ -> <em>text</em>
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');
    // Code: `text` -> <code>text</code>
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    return html;
  };

  // Sanitize HTML to only allow safe tags
  const sanitizeHTML = (html: string): string => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['strong', 'em', 'code', 'a', 'b', 'i', 'u', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'title', 'target'],
    });
  };

  // Handle citation click - scroll to and highlight source card
  const handleCitationClick = (citationNumber: number) => {
    const sourceCard = document.getElementById(`source-card-${citationNumber}`);
    if (sourceCard) {
      // Scroll to the source card
      sourceCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add highlight class
      sourceCard.classList.add('source-highlight');
      
      // Remove highlight after animation completes
      setTimeout(() => {
        sourceCard.classList.remove('source-highlight');
      }, 2000);

      // Log citation click event for personalization
      if (onCitationClick && answer) {
        const source = answer.sources[citationNumber - 1];
        if (source) {
          onCitationClick(citationNumber, source.id, answer.queryId);
        }
      }
    }
  };

  // Render text with citations and HTML formatting
  const renderTextWithCitations = (text: string) => {
    // First, split by citations to preserve them
    const parts = text.split(/(\[\d+(?:,\s*\d+)*\])/g);
    
    return parts.map((part, idx) => {
      const citationMatch = part.match(/\[(\d+(?:,\s*\d+)*)\]/);
      if (citationMatch) {
        const citationNumbers = citationMatch[1].split(',').map(n => parseInt(n.trim()));
        return (
          <sup
            key={idx}
            className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 mx-0.5 text-xs font-medium text-white bg-gradient-to-br from-blue-600 to-purple-600 rounded cursor-pointer hover:from-blue-700 hover:to-purple-700 hover:scale-110 transition-all duration-150 shadow-sm hover:shadow-md"
            title="Click to see source"
            onClick={() => handleCitationClick(citationNumbers[0])}
          >
            {citationMatch[1]}
          </sup>
        );
      }
      
      // Convert markdown to HTML, then sanitize and render
      const withHTML = markdownToHTML(part);
      const sanitized = sanitizeHTML(withHTML);
      return (
        <span 
          key={idx} 
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
      );
    });
  };

  // Use streaming text if available, otherwise use final answer
  const displayText = streamingText || answer?.text || '';

  return (
    <div className="prose prose-sm max-w-none">
      <div className="relative">
        {/* Subtle background gradient for emphasis */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 rounded-lg -z-10 blur-3xl opacity-50" />
        
        <div className="text-slate-800 leading-7 text-[15px] whitespace-pre-wrap">
          {renderTextWithCitations(displayText)}
          {streamingText && (
            <span className="inline-block w-1.5 h-5 bg-gradient-to-b from-blue-600 to-purple-600 animate-pulse ml-1 rounded-full" />
          )}
        </div>
      </div>
      {answer && !streamingText && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Answer synthesized from <span className="font-medium text-slate-700">{answer.sources.length}</span> sources</span>
          </div>
        </div>
      )}
    </div>
  );
}

