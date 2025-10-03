import { z } from 'zod';
import {
  QueryPlanSchema,
  SearchResultSchema,
  AnswerPacketSchema,
  UserEventSchema,
  UserPreferencesSchema,
  type QueryPlan,
  type SearchResult,
  type AnswerPacket,
  type UserEvent,
  type UserPreferences,
} from './types';

const API_BASE = '/api';

// GET /api/search?q=<query>
export async function fetchSearch(query: string): Promise<{ plan: QueryPlan; results: SearchResult[] }> {
  const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }

  const data = await response.json();

  // Validate with zod
  return {
    plan: QueryPlanSchema.parse(data.plan),
    results: z.array(SearchResultSchema).parse(data.results),
  };
}

// POST /api/answer
export async function fetchAnswer(
  query: string,
  userId?: string,
  plan?: QueryPlan
): Promise<AnswerPacket> {
  const response = await fetch(`${API_BASE}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, userId, plan }),
  });

  if (!response.ok) {
    throw new Error(`Answer generation failed: ${response.statusText}`);
  }

  const data = await response.json();
  return AnswerPacketSchema.parse(data);
}

// POST /api/events
export async function logUserEvent(event: UserEvent): Promise<void> {
  const validated = UserEventSchema.parse(event);

  const response = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validated),
  });

  if (!response.ok) {
    console.error('Failed to log event:', response.statusText);
  }
}

// GET /api/preferences?userId=<userId>
export async function fetchPreferences(userId: string): Promise<UserPreferences> {
  const response = await fetch(`${API_BASE}/preferences?userId=${encodeURIComponent(userId)}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch preferences: ${response.statusText}`);
  }

  const data = await response.json();
  return UserPreferencesSchema.parse(data);
}

