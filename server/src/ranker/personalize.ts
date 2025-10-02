import { RankedDoc } from '../types/contracts.js';
import { getUserPreferences } from '../events/store.js';

/**
 * Applies personalization reweighting to ranked documents
 * Based on user's historical preferences from event log
 */
export function applyPersonalization(userId: string, docs: RankedDoc[]): RankedDoc[] {
  const prefs = getUserPreferences(userId);

  // If insufficient data, return unchanged
  if (prefs.totalEvents < 10) {
    return docs;
  }

  return docs.map(doc => {
    let adjustment = 0;

    // TLD preference boost
    if (prefs.tldPreference) {
      const tld = doc.domain.split('.').pop() || '';
      const prefTld = Object.entries(prefs.tldPreference)
        .sort((a, b) => b[1] - a[1])[0];
      
      if (prefTld && tld === prefTld[0] && prefTld[1] > 0.6) {
        adjustment += 0.2;
      }
    }

    // Recency preference boost
    if (prefs.recencyPreference && prefs.recencyPreference > 0.6) {
      adjustment += doc.signals.recency * 0.3;
    }

    // Content type preference
    // TODO: Extract content type from page and match preference

    const newScore = doc.score + adjustment;

    return {
      ...doc,
      score: newScore,
      rankingReason: adjustment > 0 
        ? `${doc.rankingReason} + personalized`
        : doc.rankingReason,
    };
  }).sort((a, b) => b.score - a.score);
}

