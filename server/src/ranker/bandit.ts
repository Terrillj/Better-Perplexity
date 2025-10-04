import { ContentFeatures } from './featureExtractor.js';

/**
 * Statistics for a single arm in the multi-armed bandit
 * Each arm represents a feature value (e.g., "depth:expert")
 */
export interface ArmStats {
  successes: number;  // clicks on sources with this feature
  failures: number;   // impressions without clicks
}

/**
 * Thompson Sampling Multi-Armed Bandit for feature-based personalization
 * 
 * Each "arm" corresponds to a feature value (e.g., "depth:expert", "style:technical").
 * Uses click-only learning: only tracks explicit clicks as successes, avoiding false
 * negatives from unviewed sources. The bandit uses Beta distribution sampling to
 * balance exploration vs exploitation.
 * 
 * @example
 * const bandit = new ThompsonSamplingBandit();
 * bandit.recordClick(["depth:expert", "style:technical"]);
 * const scores = bandit.getArmScores(); // clicked features will have higher scores
 */
export class ThompsonSamplingBandit {
  private arms: Map<string, ArmStats> = new Map();

  /**
   * Ensure an arm exists in the map, initializing if needed
   */
  private ensureArm(arm: string): void {
    if (!this.arms.has(arm)) {
      this.arms.set(arm, { successes: 0, failures: 0 });
    }
  }

  /**
   * @deprecated Using click-only learning to avoid false negatives.
   * 
   * Recording impressions creates false negatives: users see ~15 sources but
   * only engage with 2-3. Recording all 15 as impressions implies 13 "failures"
   * when the user simply didn't have time to read them all.
   * 
   * This method is kept for backwards compatibility but should not be used.
   * 
   * @param featureArms - Array of feature arm strings (e.g., ["depth:expert", "style:technical"])
   */
  recordImpression(featureArms: string[]): void {
    for (const arm of featureArms) {
      this.ensureArm(arm);
      const stats = this.arms.get(arm)!;
      stats.failures += 1;
    }
  }

  /**
   * Record a click on a source with given feature arms
   * Increments success count for each arm (click-only learning)
   * 
   * @param featureArms - Array of feature arm strings for the clicked source
   */
  recordClick(featureArms: string[]): void {
    for (const arm of featureArms) {
      this.ensureArm(arm);
      const stats = this.arms.get(arm)!;
      stats.successes += 1;
    }
  }

  /**
   * Get Thompson Sampling scores for all arms
   * Samples from Beta(α=successes+1, β=failures+1) for each arm
   * 
   * Uses simplified Beta sampling for MVP:
   * - Base score: (successes + 1) / (successes + failures + 2)
   * - Add random noise (±0.1) to encourage exploration
   * 
   * @returns Map of arm → sampled score (0-1)
   */
  getArmScores(): Map<string, number> {
    const scores = new Map<string, number>();

    for (const [arm, stats] of this.arms.entries()) {
      // Beta distribution parameters (with uniform prior)
      const alpha = stats.successes + 1;
      const beta = stats.failures + 1;
      
      // Simplified Beta sampling: mean + random noise
      const mean = alpha / (alpha + beta);
      const noise = (Math.random() - 0.5) * 0.2; // ±0.1 noise
      const score = Math.max(0, Math.min(1, mean + noise));
      
      scores.set(arm, score);
    }

    return scores;
  }

  /**
   * Get top k arms with highest sampled scores
   * 
   * @param k - Number of top arms to return
   * @returns Array of arm strings sorted by score (highest first)
   */
  getTopArms(k: number): string[] {
    const scores = this.getArmScores();
    
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, k)
      .map(([arm]) => arm);
  }

  /**
   * Get raw statistics for an arm (for debugging/testing)
   */
  getArmStats(arm: string): ArmStats | undefined {
    return this.arms.get(arm);
  }

  /**
   * Get all arms tracked by this bandit
   */
  getAllArms(): string[] {
    return Array.from(this.arms.keys());
  }
}

/**
 * Convert ContentFeatures object to array of arm strings
 * 
 * @param features - Content features object
 * @returns Array of arm strings in format "feature:value"
 * 
 * @example
 * featuresToArms({
 *   depth: "expert",
 *   style: "technical",
 *   format: "tutorial",
 *   approach: "practical",
 *   density: "moderate"
 * })
 * // Returns: ["depth:expert", "style:technical", "format:tutorial", "approach:practical", "density:moderate"]
 */
export function featuresToArms(features: ContentFeatures): string[] {
  return [
    `depth:${features.depth}`,
    `style:${features.style}`,
    `format:${features.format}`,
    `approach:${features.approach}`,
    `density:${features.density}`,
  ];
}

/*
 * VALIDATION TESTS (for reference)
 * 
 * Test 1: Cold start (no data)
 * const bandit = new ThompsonSamplingBandit();
 * const scores = bandit.getArmScores();
 * Expected: Empty map (no arms initialized yet)
 * 
 * Test 2: Record impressions
 * const bandit = new ThompsonSamplingBandit();
 * bandit.recordImpression(["depth:expert", "style:technical"]);
 * const stats1 = bandit.getArmStats("depth:expert");
 * Expected: {successes: 0, failures: 1}
 * 
 * Test 3: Record click increases score
 * const bandit = new ThompsonSamplingBandit();
 * bandit.recordImpression(["depth:expert", "depth:introductory"]);
 * bandit.recordClick(["depth:expert"]);
 * 
 * // After many samples, depth:expert should have higher average score
 * const scores = Array.from({length: 100}, () => bandit.getArmScores());
 * const avgExpert = scores.reduce((sum, s) => sum + s.get("depth:expert")!, 0) / 100;
 * const avgIntro = scores.reduce((sum, s) => sum + s.get("depth:introductory")!, 0) / 100;
 * Expected: avgExpert > avgIntro (because expert has 1 success, intro has 0)
 * 
 * Test 4: Feature conversion
 * const features: ContentFeatures = {
 *   depth: "expert",
 *   style: "technical",
 *   format: "tutorial",
 *   approach: "practical",
 *   density: "moderate"
 * };
 * const arms = featuresToArms(features);
 * Expected: ["depth:expert", "style:technical", "format:tutorial", "approach:practical", "density:moderate"]
 * 
 * Test 5: Exploration vs exploitation
 * const bandit = new ThompsonSamplingBandit();
 * // Heavily favor one arm
 * for (let i = 0; i < 10; i++) {
 *   bandit.recordImpression(["depth:expert", "depth:introductory"]);
 *   bandit.recordClick(["depth:expert"]);
 * }
 * 
 * // Expert should win most of the time, but not always (exploration)
 * const topArms = Array.from({length: 100}, () => bandit.getTopArms(1)[0]);
 * const expertWins = topArms.filter(a => a === "depth:expert").length;
 * Expected: expertWins > 80 (mostly exploitation) but < 100 (some exploration due to noise)
 */

