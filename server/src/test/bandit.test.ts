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

  describe('Record Impression', () => {
    it('should initialize arm with failure count on first impression', () => {
      bandit.recordImpression(['depth:expert']);
      
      const stats = bandit.getArmStats('depth:expert');
      expect(stats).toEqual({ successes: 0, failures: 1 });
    });

    it('should increment failures for multiple impressions', () => {
      bandit.recordImpression(['depth:expert']);
      bandit.recordImpression(['depth:expert']);
      bandit.recordImpression(['depth:expert']);
      
      const stats = bandit.getArmStats('depth:expert');
      expect(stats).toEqual({ successes: 0, failures: 3 });
    });

    it('should handle multiple arms in single impression', () => {
      bandit.recordImpression(['depth:expert', 'style:technical', 'format:tutorial']);
      
      expect(bandit.getArmStats('depth:expert')).toEqual({ successes: 0, failures: 1 });
      expect(bandit.getArmStats('style:technical')).toEqual({ successes: 0, failures: 1 });
      expect(bandit.getArmStats('format:tutorial')).toEqual({ successes: 0, failures: 1 });
    });
  });

  describe('Record Click', () => {
    it('should increment successes and decrement failures when click after impression', () => {
      bandit.recordImpression(['depth:expert']);
      bandit.recordClick(['depth:expert']);
      
      const stats = bandit.getArmStats('depth:expert');
      expect(stats).toEqual({ successes: 1, failures: 0 });
    });

    it('should handle click without prior impression', () => {
      bandit.recordClick(['depth:expert']);
      
      const stats = bandit.getArmStats('depth:expert');
      expect(stats).toEqual({ successes: 1, failures: 0 });
    });

    it('should not decrement failures below zero', () => {
      // Click without impression
      bandit.recordClick(['depth:expert']);
      bandit.recordClick(['depth:expert']);
      
      const stats = bandit.getArmStats('depth:expert');
      expect(stats?.failures).toBe(0);
      expect(stats?.successes).toBe(2);
    });

    it('should handle multiple arms in single click', () => {
      bandit.recordImpression(['depth:expert', 'style:technical', 'format:tutorial']);
      bandit.recordClick(['depth:expert', 'style:technical', 'format:tutorial']);
      
      expect(bandit.getArmStats('depth:expert')).toEqual({ successes: 1, failures: 0 });
      expect(bandit.getArmStats('style:technical')).toEqual({ successes: 1, failures: 0 });
      expect(bandit.getArmStats('format:tutorial')).toEqual({ successes: 1, failures: 0 });
    });
  });

  describe('Get Arm Scores', () => {
    it('should return scores between 0 and 1', () => {
      bandit.recordImpression(['depth:expert']);
      bandit.recordClick(['depth:expert']);
      
      const scores = bandit.getArmScores();
      const expertScore = scores.get('depth:expert')!;
      
      expect(expertScore).toBeGreaterThanOrEqual(0);
      expect(expertScore).toBeLessThanOrEqual(1);
    });

    it('should give higher average scores to clicked arms vs non-clicked', () => {
      // Setup: Record clicks for expert, only impressions for introductory
      for (let i = 0; i < 5; i++) {
        bandit.recordImpression(['depth:expert', 'depth:introductory']);
        bandit.recordClick(['depth:expert']);
      }
      
      // Sample scores many times to get average (due to randomness)
      const samples = 100;
      let expertTotal = 0;
      let introTotal = 0;
      
      for (let i = 0; i < samples; i++) {
        const scores = bandit.getArmScores();
        expertTotal += scores.get('depth:expert')!;
        introTotal += scores.get('depth:introductory')!;
      }
      
      const expertAvg = expertTotal / samples;
      const introAvg = introTotal / samples;
      
      // Expert should have significantly higher average score
      expect(expertAvg).toBeGreaterThan(introAvg);
      expect(expertAvg - introAvg).toBeGreaterThan(0.2); // At least 20% higher
    });

    it('should return different scores on each call (exploration via randomness)', () => {
      bandit.recordImpression(['depth:expert']);
      bandit.recordClick(['depth:expert']);
      
      const scores1 = bandit.getArmScores();
      const scores2 = bandit.getArmScores();
      
      // Due to random noise, scores should differ
      expect(scores1.get('depth:expert')).not.toBe(scores2.get('depth:expert'));
    });
  });

  describe('Get Top Arms', () => {
    it('should return empty array when no arms exist', () => {
      const topArms = bandit.getTopArms(3);
      expect(topArms).toEqual([]);
    });

    it('should return arms sorted by score (highest first)', () => {
      // Create clear preference: expert > moderate > introductory
      for (let i = 0; i < 10; i++) {
        bandit.recordImpression(['depth:expert', 'depth:moderate', 'depth:introductory']);
      }
      
      // Give expert 8 clicks, moderate 4 clicks, introductory 0 clicks
      for (let i = 0; i < 8; i++) {
        bandit.recordClick(['depth:expert']);
      }
      for (let i = 0; i < 4; i++) {
        bandit.recordClick(['depth:moderate']);
      }
      
      // Sample top arms multiple times and check most frequent ordering
      const orderingsMap = new Map<string, number>();
      
      for (let i = 0; i < 50; i++) {
        const topArms = bandit.getTopArms(3);
        const ordering = topArms.join(',');
        orderingsMap.set(ordering, (orderingsMap.get(ordering) || 0) + 1);
      }
      
      // Most common ordering should be expert > moderate > introductory
      const mostCommonOrdering = Array.from(orderingsMap.entries())
        .sort((a, b) => b[1] - a[1])[0][0];
      
      expect(mostCommonOrdering).toBe('depth:expert,depth:moderate,depth:introductory');
    });

    it('should respect k parameter', () => {
      bandit.recordImpression(['depth:expert', 'style:technical', 'format:tutorial']);
      bandit.recordClick(['depth:expert', 'style:technical', 'format:tutorial']);
      
      const top1 = bandit.getTopArms(1);
      const top2 = bandit.getTopArms(2);
      const top3 = bandit.getTopArms(3);
      
      expect(top1.length).toBe(1);
      expect(top2.length).toBe(2);
      expect(top3.length).toBe(3);
    });
  });

  describe('Exploration vs Exploitation', () => {
    it('should mostly exploit (choose best arm) but can occasionally vary due to sampling', () => {
      // Heavily favor one arm
      for (let i = 0; i < 20; i++) {
        bandit.recordImpression(['depth:expert', 'depth:introductory']);
        bandit.recordClick(['depth:expert']);
      }
      
      // Sample top arm 100 times
      const topArms = Array.from({ length: 100 }, () => bandit.getTopArms(1)[0]);
      const expertWins = topArms.filter(a => a === 'depth:expert').length;
      
      // Should win most of the time (exploitation)
      // Due to randomness, it may win 100% or slightly less
      expect(expertWins).toBeGreaterThan(70); // At least 70% exploitation
      
      // Verify the scores show expert has much higher mean
      const scores = Array.from({ length: 100 }, () => bandit.getArmScores());
      const expertAvg = scores.reduce((sum, s) => sum + s.get('depth:expert')!, 0) / 100;
      const introAvg = scores.reduce((sum, s) => sum + s.get('depth:introductory')!, 0) / 100;
      
      expect(expertAvg).toBeGreaterThan(introAvg + 0.3); // Expert avg is significantly higher
    });
  });

  describe('Get All Arms', () => {
    it('should return all tracked arms', () => {
      bandit.recordImpression(['depth:expert', 'style:technical']);
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
