import { UserEvent } from '../types/contracts.js';
import { ThompsonSamplingBandit, featuresToArms } from '../ranker/bandit.js';
import type { ContentFeatures } from '../ranker/featureExtractor.js';

// In-memory event store (TODO: Replace with SQLite)
const eventLog: UserEvent[] = [];

// In-memory bandit instances per user
const userBandits = new Map<string, ThompsonSamplingBandit>();

/**
 * Get or create a Thompson Sampling bandit for a user
 * @param userId - User identifier
 * @returns User's bandit instance
 */
export function getUserBandit(userId: string): ThompsonSamplingBandit {
  if (!userBandits.has(userId)) {
    userBandits.set(userId, new ThompsonSamplingBandit());
  }
  return userBandits.get(userId)!;
}

/**
 * Logs a user interaction event
 * Automatically updates the user's bandit based on event type
 * 
 * Proper Thompson Sampling: Records pending impressions when sources are shown,
 * resolves them as successes (clicks) or failures (timeout). Uses fractional
 * credit to avoid "5 features = 5x evidence" problem.
 */
export function logEvent(event: UserEvent): void {
  eventLog.push(event);
  console.log(`[EVENT] ${event.eventType} by ${event.userId}`);

  const bandit = getUserBandit(event.userId);

  // Update bandit based on event type
  if (event.eventType === 'SOURCE_CLICKED' && event.meta?.features) {
    // User clicked a source - resolve as success with fractional credit
    const features = event.meta.features as ContentFeatures;
    const arms = featuresToArms(features);
    
    console.log(`\n========== CLICK RECORDED ==========`);
    console.log(`[BANDIT] User: ${event.userId}`);
    console.log(`[BANDIT] Source: ${event.sourceId}`);
    console.log(`[BANDIT] Features: ${JSON.stringify(features, null, 2)}`);
    console.log(`[BANDIT] Arms: ${arms.join(', ')}`);
    console.log(`[BANDIT] Fractional credit: ${(1/arms.length).toFixed(3)} per arm`);
    
    // Log before state for first arm
    const firstArm = arms[0];
    const beforeStats = bandit.getArmStats(firstArm);
    console.log(`\n[BANDIT] Before click (${firstArm}):`);
    if (beforeStats) {
      console.log(`  α (successes) = ${beforeStats.successes.toFixed(3)}`);
      console.log(`  β (failures) = ${beforeStats.failures.toFixed(3)}`);
      console.log(`  Score = ${((beforeStats.successes + 1) / (beforeStats.successes + beforeStats.failures + 2)).toFixed(3)}`);
    } else {
      console.log(`  No prior stats (first time seeing this arm)`);
    }
    
    // Record click
    bandit.recordClick(arms, event.sourceId);
    
    // Log after state
    const afterStats = bandit.getArmStats(firstArm);
    console.log(`\n[BANDIT] After click (${firstArm}):`);
    if (afterStats) {
      console.log(`  α (successes) = ${afterStats.successes.toFixed(3)}`);
      console.log(`  β (failures) = ${afterStats.failures.toFixed(3)}`);
      console.log(`  Score = ${((afterStats.successes + 1) / (afterStats.successes + afterStats.failures + 2)).toFixed(3)}`);
    }
    
    console.log(`=====================================\n`);
  }
}

/**
 * Retrieves events for a user
 */
export function getUserEvents(userId: string): UserEvent[] {
  return eventLog.filter(e => e.userId === userId);
}

/**
 * Get Thompson Sampling scores for a user's bandit
 * Returns arm → score map for personalized reweighting
 * 
 * @param userId - User identifier
 * @returns Map of feature arms to sampled scores (0-1)
 */
export function getUserBanditScores(userId: string): Map<string, number> {
  const bandit = getUserBandit(userId);
  return bandit.getArmScores();
}

/**
 * Clears all data for a user (bandit state and event history)
 * Useful for demo resets and testing
 * 
 * @param userId - User identifier
 */
export function clearUserData(userId: string): void {
  // Remove user's bandit
  userBandits.delete(userId);
  
  // Remove user's events
  const initialLength = eventLog.length;
  for (let i = eventLog.length - 1; i >= 0; i--) {
    if (eventLog[i].userId === userId) {
      eventLog.splice(i, 1);
    }
  }
  
  const removedCount = initialLength - eventLog.length;
  console.log(`[CLEAR] Removed ${removedCount} events and bandit state for user: ${userId}`);
}

/**
 * @deprecated Use getUserBanditScores() instead
 * Legacy preference computation for backwards compatibility
 */
export function getUserPreferences(userId: string) {
  const events = getUserEvents(userId);
  const clicks = events.filter(e => e.eventType === 'SOURCE_CLICKED');

  if (clicks.length === 0) {
    return {
      totalEvents: 0,
      tldPreference: null,
      recencyPreference: null,
      contentTypePreference: null,
    };
  }

  // TODO: Remove this function once all code uses getUserBanditScores()
  return {
    totalEvents: events.length,
    tldPreference: { edu: 0.7, com: 0.2, org: 0.1 } as Record<string, number>,
    recencyPreference: 0.6,
    contentTypePreference: null,
  };
}

// TODO: Replace with SQLite implementation
// - Create schema: events(id, userId, timestamp, eventType, sourceId, queryId, meta)
// - Add index on userId and timestamp
// - Implement cleanup for old events (> 30 days)

