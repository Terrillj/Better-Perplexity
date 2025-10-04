import { describe, it, expect, beforeEach } from 'vitest';
import { ThompsonSamplingBandit, featuresToArms } from '../ranker/bandit.js';
import type { ContentFeatures } from '../ranker/featureExtractor.js';

describe('ThompsonSamplingBandit', () => {
  let bandit: ThompsonSamplingBandit;

  beforeEach(() => {
    bandit = new ThompsonSamplingBandit();
  });

  describe('Cold Start', () => {
    it('should return empty scores map when no data', () => {
      const scores = bandit.getArmScores();
      expect(scores.size).toBe(0);
    });

    it('should return empty array for getAllArms when no data', () => {
      const arms = bandit.getAllArms();
      expect(arms).toEqual([]);
    });

    it('should return undefined for getArmStats of non-existent arm', () => {
      const stats = bandit.getArmStats('depth:expert');
      expect(stats).toBeUndefined();
    });
  });

  describe('Pending Impressions', () => {
    it('should record pending impression without updating stats', () => {
      bandit.recordPendingImpression(['depth:expert', 'style:technical'], 'query-1', 'source-1');
      
      // Stats should not exist yet (not resolved)
      expect(bandit.getArmStats('depth:expert')).toBeUndefined();
      expect(bandit.getArmStats('style:technical')).toBeUndefined();
    });

    it('should resolve pending impressions as failures after timeout', () => {
      const arms = ['depth:expert', 'style:technical', 'format:tutorial'];
      bandit.recordPendingImpression(arms, 'query-1', 'source-1');
      
      // Wait and resolve (immediate timeout)
      bandit.resolvePendingImpressions(0);
      
      // Each feature should get fractional failure (1/3 per feature)
      const expectedFailure = 1 / 3;
      expect(bandit.getArmStats('depth:expert')).toEqual({ 
        successes: 0, 
        failures: expectedFailure 
      });
      expect(bandit.getArmStats('style:technical')).toEqual({ 
        successes: 0, 
        failures: expectedFailure 
      });
      expect(bandit.getArmStats('format:tutorial')).toEqual({ 
        successes: 0, 
        failures: expectedFailure 
      });
    });

    it('should not resolve pending impressions before timeout', () => {
      bandit.recordPendingImpression(['depth:expert'], 'query-1', 'source-1');
      
      // Try to resolve with long timeout
      bandit.resolvePendingImpressions(99999);
      
      // Should still be pending (not resolved)
      expect(bandit.getArmStats('depth:expert')).toBeUndefined();
    });

    it('should resolve multiple pending impressions', () => {
      bandit.recordPendingImpression(['depth:expert', 'style:technical'], 'query-1', 'source-1');
      bandit.recordPendingImpression(['depth:introductory', 'style:casual'], 'query-2', 'source-2');
      
      // Resolve both
      bandit.resolvePendingImpressions(0);
      
      // Each should have fractional failure
      expect(bandit.getArmStats('depth:expert')?.failures).toBe(0.5);
      expect(bandit.getArmStats('style:technical')?.failures).toBe(0.5);
      expect(bandit.getArmStats('depth:introductory')?.failures).toBe(0.5);
      expect(bandit.getArmStats('style:casual')?.failures).toBe(0.5);
    });
  });

  describe('Record Click with Fractional Credit', () => {
    it('should use fractional credit for multiple features', () => {
      const arms = ['depth:expert', 'style:technical', 'format:tutorial', 'approach:practical', 'density:moderate'];
      bandit.recordClick(arms);
      
      const fraction = 1 / 5;
      for (const arm of arms) {
        const stats = bandit.getArmStats(arm);
        expect(stats?.successes).toBeCloseTo(fraction, 5);
        expect(stats?.failures).toBe(0);
      }
    });

    it('should accumulate fractional credit over multiple clicks', () => {
      const arms = ['depth:expert', 'style:technical'];
      
      bandit.recordClick(arms); // +0.5 each
      bandit.recordClick(arms); // +0.5 each
      bandit.recordClick(arms); // +0.5 each
      
      expect(bandit.getArmStats('depth:expert')?.successes).toBeCloseTo(1.5, 5);
      expect(bandit.getArmStats('style:technical')?.successes).toBeCloseTo(1.5, 5);
    });

    it('should resolve pending impression on click', () => {
      const arms = ['depth:expert', 'style:technical'];
      const sourceId = 'source-1';
      bandit.recordPendingImpression(arms, 'query-1', sourceId);
      
      // Click resolves the pending impression
      bandit.recordClick(arms, sourceId);
      
      // Should have successes, no failures (impression resolved as success)
      expect(bandit.getArmStats('depth:expert')?.successes).toBeCloseTo(0.5, 5);
      expect(bandit.getArmStats('depth:expert')?.failures).toBe(0);
      
      // Timeout should not create failures (already resolved)
      bandit.resolvePendingImpressions(0);
      expect(bandit.getArmStats('depth:expert')?.failures).toBe(0);
    });

    it('should handle mixed clicked and unclicked sources', () => {
      // Show 3 sources
      bandit.recordPendingImpression(['depth:expert', 'style:technical'], 'query-1', 'source-1');
      bandit.recordPendingImpression(['depth:introductory', 'style:casual'], 'query-1', 'source-2');
      bandit.recordPendingImpression(['depth:moderate', 'style:neutral'], 'query-1', 'source-3');
      
      // User clicks only the first source
      bandit.recordClick(['depth:expert', 'style:technical'], 'source-1');
      
      // Resolve timeout for unclicked
      bandit.resolvePendingImpressions(0);
      
      // Clicked source: successes, no failures
      expect(bandit.getArmStats('depth:expert')?.successes).toBeCloseTo(0.5, 5);
      expect(bandit.getArmStats('depth:expert')?.failures).toBe(0);
      
      // Unclicked sources: no successes, fractional failures
      expect(bandit.getArmStats('depth:introductory')?.successes).toBe(0);
      expect(bandit.getArmStats('depth:introductory')?.failures).toBeCloseTo(0.5, 5);
      expect(bandit.getArmStats('depth:moderate')?.successes).toBe(0);
      expect(bandit.getArmStats('depth:moderate')?.failures).toBeCloseTo(0.5, 5);
    });
  });

  describe('Get Arm Scores (Beta Distribution)', () => {
    it('should return scores between 0 and 1', () => {
      // Record pending and resolve as failure
      bandit.recordPendingImpression(['depth:expert', 'style:technical'], 'query-1', 'source-1');
      bandit.resolvePendingImpressions(0);
      
      // Click another source
      bandit.recordClick(['depth:expert', 'style:technical']);
      
      const scores = bandit.getArmScores();
      const expertScore = scores.get('depth:expert')!;
      
      expect(expertScore).toBeGreaterThanOrEqual(0);
      expect(expertScore).toBeLessThanOrEqual(1);
    });

    it('should give higher scores to clicked vs unclicked features', () => {
      // Show 8 sources with depth:expert, 8 with depth:introductory
      for (let i = 0; i < 8; i++) {
        bandit.recordPendingImpression(['depth:expert', 'style:technical', 'format:tutorial', 'approach:practical', 'density:moderate'], 'query-1', `expert-${i}`);
        bandit.recordPendingImpression(['depth:introductory', 'style:casual', 'format:article', 'approach:theoretical', 'density:sparse'], 'query-1', `intro-${i}`);
      }
      
      // Click only depth:expert sources (5 features each)
      for (let i = 0; i < 5; i++) {
        bandit.recordClick(['depth:expert', 'style:technical', 'format:tutorial', 'approach:practical', 'density:moderate'], `expert-${i}`);
      }
      
      // Resolve unclicked as failures
      bandit.resolvePendingImpressions(0);
      
      // Check scores
      const scores = bandit.getArmScores();
      const expertScore = scores.get('depth:expert')!;
      const introScore = scores.get('depth:introductory')!;
      
      // Expert clicked 5 times: α = 5*(1/5) + 1 = 2.0
      // Expert shown-not-clicked 3 times: β = 3*(1/5) + 1 = 1.6
      // Expert score ≈ 2.0 / (2.0 + 1.6) = 0.556
      expect(expertScore).toBeCloseTo(0.556, 2);
      
      // Introductory never clicked: α = 1.0
      // Introductory shown-not-clicked 8 times: β = 8*(1/5) + 1 = 2.6
      // Intro score ≈ 1.0 / (1.0 + 2.6) = 0.278
      expect(introScore).toBeCloseTo(0.278, 2);
      
      // Expert should be significantly higher
      expect(expertScore).toBeGreaterThan(introScore + 0.2);
    });

    it('should use deterministic scoring (mean of Beta)', () => {
      bandit.recordClick(['depth:expert', 'style:technical']);
      
      const scores1 = bandit.getArmScores();
      const scores2 = bandit.getArmScores();
      
      // Scores should be deterministic (same on each call)
      expect(scores1.get('depth:expert')).toBe(scores2.get('depth:expert'));
    });

    it('should handle cold start (no data)', () => {
      const scores = bandit.getArmScores();
      expect(scores.size).toBe(0);
    });
  });

  describe('Get Top Arms', () => {
    it('should return empty array when no arms exist', () => {
      const topArms = bandit.getTopArms(3);
      expect(topArms).toEqual([]);
    });

    it('should return arms sorted by score (highest first)', () => {
      // Create clear preference: expert > moderate > introductory
      // Show all 3, click expert most, moderate some, introductory none
      for (let i = 0; i < 10; i++) {
        bandit.recordPendingImpression(['depth:expert'], 'query-1', `expert-${i}`);
        bandit.recordPendingImpression(['depth:moderate'], 'query-1', `moderate-${i}`);
        bandit.recordPendingImpression(['depth:introductory'], 'query-1', `intro-${i}`);
      }
      
      // Give expert 8 clicks, moderate 4 clicks, introductory 0 clicks
      for (let i = 0; i < 8; i++) {
        bandit.recordClick(['depth:expert'], `expert-${i}`);
      }
      for (let i = 0; i < 4; i++) {
        bandit.recordClick(['depth:moderate'], `moderate-${i}`);
      }
      
      // Resolve remaining as failures
      bandit.resolvePendingImpressions(0);
      
      // Get top arms (deterministic with mean-based scoring)
      const topArms = bandit.getTopArms(3);
      
      // Should be ordered: expert > moderate > introductory
      expect(topArms).toEqual(['depth:expert', 'depth:moderate', 'depth:introductory']);
    });

    it('should respect k parameter', () => {
      bandit.recordClick(['depth:expert', 'style:technical', 'format:tutorial']);
      
      const top1 = bandit.getTopArms(1);
      const top2 = bandit.getTopArms(2);
      const top3 = bandit.getTopArms(3);
      
      expect(top1.length).toBe(1);
      expect(top2.length).toBe(2);
      expect(top3.length).toBe(3);
    });
  });

  describe('Expected Behavior Validation', () => {
    it('should match expected probabilities after 1 click + timeout scenario', () => {
      // Query 1: Show 8 sources (5 features each)
      const allFeatures = ['depth:expert', 'style:technical', 'format:tutorial', 'approach:practical', 'density:moderate'];
      
      for (let i = 0; i < 8; i++) {
        bandit.recordPendingImpression(allFeatures, 'query-1', `source-${i}`);
      }
      
      // User clicks source #3 - fractional credit: 1/5 = 0.2 per feature
      bandit.recordClick(allFeatures, 'source-3'); // +0.2 per feature
      
      // Resolve unclicked (7 sources remain) - fractional failures: 7 * (1/5) = 1.4 per feature
      bandit.resolvePendingImpressions(0);
      
      const scores = bandit.getArmScores();
      
      // After 1 click + 7 failures:
      // α = 0.2 (click) + 1.0 (prior) = 1.2
      // β = 1.4 (failures) + 1.0 (prior) = 2.4
      // Score = 1.2 / (1.2 + 2.4) = 1.2 / 3.6 ≈ 0.333
      const clickedScore = scores.get('depth:expert')!;
      expect(clickedScore).toBeCloseTo(0.333, 2);
    });

    it('should show proper gradual confidence after 5 clicks', () => {
      // Simulate 5 queries with 8 sources each
      const clickedFeatures = ['depth:expert', 'style:technical', 'format:tutorial', 'approach:practical', 'density:moderate'];
      const otherFeatures = ['depth:introductory', 'style:casual', 'format:article', 'approach:theoretical', 'density:sparse'];
      
      for (let query = 0; query < 5; query++) {
        // Show 4 clicked-type sources and 4 other sources
        for (let i = 0; i < 4; i++) {
          bandit.recordPendingImpression(clickedFeatures, `query-${query}`, `source-${query}-clicked-${i}`);
          bandit.recordPendingImpression(otherFeatures, `query-${query}`, `source-${query}-other-${i}`);
        }
        
        // User clicks 1 clicked-type source per query
        bandit.recordClick(clickedFeatures, `source-${query}-clicked-0`);
        
        // Resolve unclicked
        bandit.resolvePendingImpressions(0);
      }
      
      const scores = bandit.getArmScores();
      const clickedScore = scores.get('depth:expert')!;
      const otherScore = scores.get('depth:introductory')!;
      
      // After 5 queries:
      // Clicked features: 5 clicks (5 * 0.2 = 1.0) + 15 shown-not-clicked (15 * 0.2 = 3.0)
      // α = 1.0 + 1.0 = 2.0, β = 3.0 + 1.0 = 4.0
      // Score = 2.0 / 6.0 = 0.333
      
      // Other features: 0 clicks + 20 shown-not-clicked (20 * 0.2 = 4.0)
      // α = 0 + 1.0 = 1.0, β = 4.0 + 1.0 = 5.0
      // Score = 1.0 / 6.0 = 0.167
      
      expect(clickedScore).toBeCloseTo(0.333, 2);
      expect(otherScore).toBeCloseTo(0.167, 2);
      
      // Verify proper separation
      expect(clickedScore - otherScore).toBeGreaterThan(0.10);
    });

    it('should never-shown features start at 50% with uniform prior', () => {
      // Never-shown features don't appear in scores (cold start)
      const scores1 = bandit.getArmScores();
      expect(scores1.has('depth:never-seen')).toBe(false);
      
      // After first click with a single feature arm
      // α = 0 + 1 (click) + 1 (prior) = 2.0
      // β = 0 + 0 + 1 (prior) = 1.0
      // Score = 2.0 / (2.0 + 1.0) = 0.667
      bandit.recordClick(['depth:never-seen']);
      const neverSeenScore = bandit.getArmScores().get('depth:never-seen')!;
      expect(neverSeenScore).toBeCloseTo(0.667, 2);
      
      // If we show but don't click another feature, it gets uniform prior
      bandit.recordPendingImpression(['depth:new-feature'], 'query-1', 'source-new');
      bandit.resolvePendingImpressions(0);
      
      // α = 0 + 1 (prior) = 1.0
      // β = 1 (shown-not-clicked) + 1 (prior) = 2.0
      // Score = 1.0 / (1.0 + 2.0) = 0.333
      const newFeatureScore = bandit.getArmScores().get('depth:new-feature')!;
      expect(newFeatureScore).toBeCloseTo(0.333, 2);
    });
  });

  describe('Get All Arms', () => {
    it('should return all tracked arms', () => {
      bandit.recordPendingImpression(['depth:expert', 'style:technical'], 'query-1', 'source-1');
      bandit.resolvePendingImpressions(0);
      bandit.recordClick(['format:tutorial']);
      
      const allArms = bandit.getAllArms();
      
      expect(allArms).toContain('depth:expert');
      expect(allArms).toContain('style:technical');
      expect(allArms).toContain('format:tutorial');
      expect(allArms.length).toBe(3);
    });
  });
});

describe('featuresToArms', () => {
  it('should convert ContentFeatures to array of arm strings', () => {
    const features: ContentFeatures = {
      depth: 'expert',
      style: 'technical',
      format: 'tutorial',
      approach: 'practical',
      density: 'moderate',
    };
    
    const arms = featuresToArms(features);
    
    expect(arms).toEqual([
      'depth:expert',
      'style:technical',
      'format:tutorial',
      'approach:practical',
      'density:moderate',
    ]);
  });

  it('should handle different feature values', () => {
    const features: ContentFeatures = {
      depth: 'introductory',
      style: 'casual',
      format: 'article',
      approach: 'theoretical',
      density: 'sparse',
    };
    
    const arms = featuresToArms(features);
    
    expect(arms).toContain('depth:introductory');
    expect(arms).toContain('style:casual');
    expect(arms).toContain('format:article');
    expect(arms).toContain('approach:theoretical');
    expect(arms).toContain('density:sparse');
  });
});
