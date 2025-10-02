import { render, screen } from '@testing-library/react';
import { SourceCard } from '../components/SourceCard';
import type { RankedDoc } from '../features/search/types';

describe('SourceCard', () => {
  const mockSource: RankedDoc = {
    id: '1',
    url: 'https://example.edu/article',
    title: 'Test Article',
    excerpt: 'This is a test excerpt',
    score: 0.85,
    signals: {
      relevance: 0.9,
      recency: 0.8,
      sourceQuality: 0.9,
    },
    rankingReason: 'High relevance, .edu',
    domain: 'example.edu',
    publishedDate: '2025-09-15',
  };

  it('renders source information correctly', () => {
    render(<SourceCard source={mockSource} index={1} />);

    expect(screen.getByText('Test Article')).toBeInTheDocument();
    expect(screen.getByText('This is a test excerpt')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('displays signal badges for high scores', () => {
    render(<SourceCard source={mockSource} index={1} />);

    expect(screen.getByText('Relevant')).toBeInTheDocument();
    expect(screen.getByText('Recent')).toBeInTheDocument();
    expect(screen.getByText('Quality Source')).toBeInTheDocument();
  });
});

