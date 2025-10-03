import { describe, it, expect } from 'vitest';
import { parseBraveAge } from '../utils/dateParser.js';

describe('parseBraveAge', () => {
  it('parses relative dates', () => {
    expect(parseBraveAge('2 days ago')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(parseBraveAge('1 week ago')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(parseBraveAge('3 months ago')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  
  it('parses ISO dates', () => {
    expect(parseBraveAge('2024-12-15')).toBe('2024-12-15');
    expect(parseBraveAge('2024-12-15T10:30:00Z')).toBe('2024-12-15');
  });
  
  it('parses "Month DD, YYYY" format', () => {
    expect(parseBraveAge('January 11, 2024')).toBe('2024-01-11');
    expect(parseBraveAge('May 28, 2024')).toBe('2024-05-28');
    expect(parseBraveAge('December 19, 2024')).toBe('2024-12-19');
  });
  
  it('handles invalid input', () => {
    expect(parseBraveAge('invalid')).toBe(null);
    expect(parseBraveAge(undefined)).toBe(null);
  });
  
  it('handles singular and plural units', () => {
    expect(parseBraveAge('1 day ago')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(parseBraveAge('1 hour ago')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(parseBraveAge('5 years ago')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  
  it('handles different time units correctly', () => {
    const result = parseBraveAge('7 days ago');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    
    // Verify it's approximately 7 days ago
    if (result) {
      const parsed = new Date(result);
      const now = new Date();
      const diffDays = (now.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(6);
      expect(diffDays).toBeLessThan(8);
    }
  });
});

