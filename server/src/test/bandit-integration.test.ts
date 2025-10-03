import { describe, it, expect, beforeEach } from 'vitest';
import { logEvent, getUserBandit, getUserBanditScores } from '../events/store.js';
import type { ContentFeatures } from '../ranker/featureExtractor.js';

describe('Bandit Integration with Event Store', () => {
  const userId = 'test-user-123';
  
  beforeEach(() => {
    // Note: In-memory store persists across tests in same process
    // For true isolation, would need a reset function
  });

  it('should update bandit when SOURCE_CLICKED event is logged', () => {
    const features: ContentFeatures = {
      depth: 'expert',
      style: 'technical',
      format: 'tutorial',
      approach: 'practical',
      density: 'moderate',
    };

    logEvent({
      userId,
      timestamp: Date.now(),
      eventType: 'SOURCE_CLICKED',
      sourceId: 'src-123',
      meta: { features },
    });

    const bandit = getUserBandit(userId);
    const expertStats = bandit.getArmStats('depth:expert');
    
    expect(expertStats).toBeDefined();
    expect(expertStats!.successes).toBeGreaterThanOrEqual(1);
  });

  it('should update bandit when SOURCE_EXPANDED event is logged', () => {
    const allSourceFeatures: ContentFeatures[] = [
      {
        depth: 'expert',
        style: 'technical',
        format: 'tutorial',
        approach: 'practical',
        density: 'moderate',
      },
      {
        depth: 'introductory',
        style: 'conversational',
        format: 'reference',
        approach: 'conceptual',
        density: 'concise',
      },
    ];

    logEvent({
      userId,
      timestamp: Date.now(),
      eventType: 'SOURCE_EXPANDED',
      queryId: 'q-456',
      meta: { allSourceFeatures },
    });

    const bandit = getUserBandit(userId);
    const expertStats = bandit.getArmStats('depth:expert');
    const introStats = bandit.getArmStats('depth:introductory');
    
    expect(expertStats).toBeDefined();
    expect(introStats).toBeDefined();
    expect(expertStats!.failures).toBeGreaterThanOrEqual(1);
    expect(introStats!.failures).toBeGreaterThanOrEqual(1);
  });

  it('should learn user preferences over multiple interactions', () => {
    const testUserId = 'learning-test-user';
    
    // Simulate user viewing sources and consistently clicking expert content
    for (let i = 0; i < 5; i++) {
      // Show sources
      logEvent({
        userId: testUserId,
        timestamp: Date.now(),
        eventType: 'SOURCE_EXPANDED',
        queryId: `q-${i}`,
        meta: {
          allSourceFeatures: [
            {
              depth: 'expert',
              style: 'technical',
              format: 'research',
              approach: 'data-driven',
              density: 'comprehensive',
            },
            {
              depth: 'introductory',
              style: 'conversational',
              format: 'tutorial',
              approach: 'practical',
              density: 'moderate',
            },
          ],
        },
      });

      // Click expert content
      logEvent({
        userId: testUserId,
        timestamp: Date.now(),
        eventType: 'SOURCE_CLICKED',
        sourceId: `src-${i}`,
        meta: {
          features: {
            depth: 'expert',
            style: 'technical',
            format: 'research',
            approach: 'data-driven',
            density: 'comprehensive',
          },
        },
      });
    }

    // Check that bandit learned the preference
    const scores = getUserBanditScores(testUserId);
    const expertScore = scores.get('depth:expert') || 0;
    const introScore = scores.get('depth:introductory') || 0;

    // Expert should have higher score due to clicks
    expect(expertScore).toBeGreaterThan(introScore);
    expect(expertScore).toBeGreaterThan(0.5);
  });

  it('should provide bandit scores for personalization', () => {
    const testUserId = 'scores-test-user';
    
    // Record some interactions
    logEvent({
      userId: testUserId,
      timestamp: Date.now(),
      eventType: 'SOURCE_CLICKED',
      sourceId: 'src-999',
      meta: {
        features: {
          depth: 'expert',
          style: 'academic',
          format: 'research',
          approach: 'conceptual',
          density: 'comprehensive',
        },
      },
    });

    const scores = getUserBanditScores(testUserId);
    
    expect(scores).toBeInstanceOf(Map);
    expect(scores.size).toBeGreaterThan(0);
    
    // All scores should be between 0 and 1
    for (const [arm, score] of scores.entries()) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
      expect(typeof arm).toBe('string');
      expect(arm).toMatch(/^[a-z]+:[a-z-]+$/);
    }
  });
});

