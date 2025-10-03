import { RankedDoc } from '../types/contracts.js';
import { getUserBanditScores } from '../events/store.js';
import { featuresToArms } from './bandit.js';

/**
 * Applies personalization reweighting to ranked documents
 * Uses Thompson Sampling bandit to boost documents with preferred features
 */
export function applyPersonalization(userId: string, docs: RankedDoc[]): RankedDoc[] {
  const banditScores = getUserBanditScores(userId);

  // If no bandit data yet, return unchanged
  if (banditScores.size === 0) {
    return docs;
  }

  const personalizedDocs = docs.map(doc => {
    let boost = 0;
    let topFeatures: string[] = [];

    // Apply bandit-based feature preference boost
    if (doc.features) {
      const arms = featuresToArms(doc.features);
      const armScoresForDoc: Array<{ arm: string; score: number }> = [];

      // Collect scores for this document's features
      for (const arm of arms) {
        const score = banditScores.get(arm);
        if (score !== undefined) {
          armScoresForDoc.push({ arm, score });
        }
      }

      if (armScoresForDoc.length > 0) {
        // Calculate average score across all feature arms
        const avgScore = armScoresForDoc.reduce((sum, { score }) => sum + score, 0) / armScoresForDoc.length;
        boost = avgScore;

        // Get top 2 preferred features for ranking reason
        topFeatures = armScoresForDoc
          .sort((a, b) => b.score - a.score)
          .slice(0, 2)
          .map(({ arm }) => arm.split(':')[1]); // Extract just the value (e.g., "expert" from "depth:expert")
      }
    }

    // Apply multiplicative boost: newScore = score * (1 + boost * 0.3)
    // Cap maximum boost at 1.3x original score
    const boostMultiplier = Math.min(1 + boost * 0.3, 1.3);
    const newScore = doc.score * boostMultiplier;

    // Update ranking reason if significant boost applied
    let rankingReason = doc.rankingReason;
    if (boost > 0.05 && topFeatures.length > 0) {
      rankingReason = `${doc.rankingReason} + personalized (${topFeatures.join(', ')})`;
      
      // Log personalization for demo visibility
      const boostPercent = ((boostMultiplier - 1) * 100).toFixed(1);
      console.log(`[PERSONALIZATION] Applied +${boostPercent}% boost to "${doc.title.slice(0, 50)}..." for features [${topFeatures.join(', ')}]`);
    }

    return {
      ...doc,
      score: newScore,
      rankingReason,
    };
  });

  // Re-sort by new personalized scores
  return personalizedDocs.sort((a, b) => b.score - a.score);
}

