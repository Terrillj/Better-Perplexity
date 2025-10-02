import { UserEvent } from '../types/contracts.js';

// In-memory event store (TODO: Replace with SQLite)
const eventLog: UserEvent[] = [];

/**
 * Logs a user interaction event
 */
export function logEvent(event: UserEvent): void {
  eventLog.push(event);
  console.log(`[EVENT] ${event.eventType} by ${event.userId}`);
}

/**
 * Retrieves events for a user
 */
export function getUserEvents(userId: string): UserEvent[] {
  return eventLog.filter(e => e.userId === userId);
}

/**
 * Computes user preferences from event history
 * Used for personalization reweighting
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

  // TODO: Implement actual preference computation
  // - Count clicks by TLD (.edu, .gov, .com, etc.)
  // - Compute recency preference (% clicks on fresh content)
  // - Track content type preferences

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

