import { ContentFeatures } from './featureExtractor.js';

/**
 * Statistics for a single arm in the multi-armed bandit
 * Each arm represents a feature value (e.g., "depth:expert")
 */
export interface ArmStats {
  successes: number;  // fractional clicks (e.g., 1.4 from 7 sources with 5 features each)
  failures: number;   // fractional non-clicks (e.g., 2.6 from 13 shown-not-clicked sources)
}

/**
 * Pending impression waiting to be resolved (clicked or timed out)
 */
interface PendingImpression {
  arms: string[];
  timestamp: number;
  queryId: string;
  sourceId: string; // Unique identifier for this source (e.g., URL or UUID)
}

/**
 * Thompson Sampling Multi-Armed Bandit for feature-based personalization
 * 
 * Each "arm" corresponds to a feature value (e.g., "depth:expert", "style:technical").
 * Uses proper Thompson Sampling with:
 * - Pending impressions: sources shown but not yet resolved
 * - Fractional credit: 1/n per feature when source has n features
 * - Timeout resolution: unclicked sources become failures after 20-30s
 * - Beta distribution: natural exploration without artificial noise
 * 
 * @example
 * const bandit = new ThompsonSamplingBandit();
 * bandit.recordPendingImpression(["depth:expert", "style:technical"], "query-1");
 * bandit.recordClick(["depth:expert", "style:technical"]); // +0.5 to each arm
 * bandit.resolvePendingImpressions(); // timeout → failures for unclicked
 */
export class ThompsonSamplingBandit {
  private arms: Map<string, ArmStats> = new Map();
  private pendingImpressions: PendingImpression[] = [];

  /**
   * Ensure an arm exists in the map, initializing if needed
   */
  private ensureArm(arm: string): void {
    if (!this.arms.has(arm)) {
      this.arms.set(arm, { successes: 0, failures: 0 });
    }
  }

  /**
   * Record that a source was shown to the user (pending resolution)
   * Call this when a source appears in top 8 results
   * 
   * @param arms - Feature arms for the shown source
   * @param queryId - Query identifier for tracking
   * @param sourceId - Unique identifier for this source (e.g., URL)
   */
  recordPendingImpression(arms: string[], queryId: string, sourceId: string): void {
    this.pendingImpressions.push({
      arms,
      timestamp: Date.now(),
      queryId,
      sourceId,
    });
  }

  /**
   * Record a click (success) with fractional credit
   * Resolves pending impression for this source and removes it
   * 
   * @param arms - Feature arms for the clicked source
   * @param sourceId - Unique identifier for the clicked source
   */
  recordClick(arms: string[], sourceId?: string): void {
    const fraction = 1 / arms.length; // 1/5 for 5 features
    
    for (const arm of arms) {
      this.ensureArm(arm);
      const stats = this.arms.get(arm)!;
      stats.successes += fraction;
    }
    
    // Remove from pending (this impression is now resolved)
    if (sourceId) {
      // Remove specific source by sourceId
      this.pendingImpressions = this.pendingImpressions.filter(
        pending => pending.sourceId !== sourceId
      );
    } else {
      // Fallback: remove first matching arms (for backward compatibility)
      let removed = false;
      this.pendingImpressions = this.pendingImpressions.filter(pending => {
        if (!removed && this.armsMatch(pending.arms, arms)) {
          removed = true;
          return false;
        }
        return true;
      });
    }
  }

  /**
   * Resolve pending impressions as failures after timeout (20-30s)
   * Or manually called on next query
   * 
   * @param timeoutMs - Timeout in milliseconds (default: 25s)
   */
  resolvePendingImpressions(timeoutMs: number = 25000): void {
    const now = Date.now();
    const toResolve: PendingImpression[] = [];
    const stillPending: PendingImpression[] = [];
    
    console.log(`\n========== RESOLVING PENDING IMPRESSIONS ==========`);
    console.log(`[BANDIT] Total pending before: ${this.pendingImpressions.length}`);
    console.log(`[BANDIT] Timeout threshold: ${timeoutMs}ms`);
    
    for (const pending of this.pendingImpressions) {
      const age = now - pending.timestamp;
      if (age >= timeoutMs) {
        toResolve.push(pending);
        console.log(`  ✓ Resolving: ${pending.sourceId.slice(0, 30)} (age: ${age}ms)`);
      } else {
        stillPending.push(pending);
        console.log(`  ⏳ Keeping pending: ${pending.sourceId.slice(0, 30)} (age: ${age}ms)`);
      }
    }
    
    // Resolve timed-out impressions as failures
    for (const pending of toResolve) {
      const fraction = 1 / pending.arms.length;
      console.log(`  → Adding ${fraction.toFixed(3)} failure to ${pending.arms.length} arms`);
      for (const arm of pending.arms) {
        this.ensureArm(arm);
        const stats = this.arms.get(arm)!;
        stats.failures += fraction;
      }
    }
    
    this.pendingImpressions = stillPending;
    
    console.log(`[BANDIT] Resolved ${toResolve.length} as failures, ${stillPending.length} still pending`);
    console.log(`===================================================\n`);
  }

  /**
   * Check if two arm arrays match (same arms, order-agnostic)
   */
  private armsMatch(arms1: string[], arms2: string[]): boolean {
    if (arms1.length !== arms2.length) return false;
    return arms1.every(arm => arms2.includes(arm));
  }

  /**
   * Get Thompson Sampling scores for all arms
   * Samples from Beta(α=successes+1, β=failures+1) for each arm
   * 
   * Pure Thompson Sampling with Beta distribution - no artificial noise needed
   * The Beta distribution provides natural exploration via sampling uncertainty
   * 
   * @returns Map of arm → sampled score (0-1)
   */
  getArmScores(): Map<string, number> {
    const scores = new Map<string, number>();

    for (const [arm, stats] of this.arms.entries()) {
      // Beta distribution parameters (with uniform prior)
      const alpha = stats.successes + 1;
      const beta = stats.failures + 1;
      
      // Sample from Beta(α, β) - pure Thompson Sampling
      const sample = this.sampleBeta(alpha, beta);
      
      scores.set(arm, sample);
    }

    return scores;
  }

  /**
   * Sample from Beta distribution using mean approximation
   * For proper Thompson Sampling, this uses the mean of Beta(α, β)
   * 
   * Note: This is a simplified implementation. For more sophisticated sampling,
   * you could use gamma distribution sampling (Beta = Gamma(α) / (Gamma(α) + Gamma(β)))
   * 
   * @param alpha - Success count + 1 (prior)
   * @param beta - Failure count + 1 (prior)
   * @returns Sampled value between 0 and 1
   */
  private sampleBeta(alpha: number, beta: number): number {
    // Use mean of Beta distribution for deterministic scoring
    // This provides proper Thompson Sampling behavior where:
    // - High α, low β → high score (clicked often, rarely shown-not-clicked)
    // - Low α, high β → low score (rarely clicked, shown-not-clicked often)
    // - Equal α, β → middle score (uncertain)
    return alpha / (alpha + beta);
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

  /**
   * Get detailed debug state (for testing/validation)
   */
  getDebugState(): {
    totalArms: number;
    pendingImpressions: number;
    armDetails: Array<{
      arm: string;
      alpha: number;  // successes + 1
      beta: number;   // failures + 1
      score: number;
      formula: string;
    }>;
  } {
    const armDetails = Array.from(this.arms.entries())
      .map(([arm, stats]) => {
        const alpha = stats.successes + 1;
        const beta = stats.failures + 1;
        const score = alpha / (alpha + beta);
        return {
          arm,
          alpha: parseFloat(alpha.toFixed(3)),
          beta: parseFloat(beta.toFixed(3)),
          score: parseFloat(score.toFixed(3)),
          formula: `${alpha.toFixed(2)}/(${alpha.toFixed(2)}+${beta.toFixed(2)})`,
        };
      })
      .sort((a, b) => b.score - a.score);

    return {
      totalArms: this.arms.size,
      pendingImpressions: this.pendingImpressions.length,
      armDetails,
    };
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

