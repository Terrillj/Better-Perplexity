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

// POST /api/answer with streaming
export async function fetchAnswerStream(
  query: string,
  userId: string | undefined,
  onChunk: (text: string) => void,
  onProgress?: (stage: 'planning' | 'searching' | 'analyzing' | 'synthesizing', message?: string) => void
): Promise<AnswerPacket> {
  const response = await fetch(`${API_BASE}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, userId }),
  });

  if (!response.ok) {
    throw new Error(`Answer generation failed: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body reader available');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let finalPacket: AnswerPacket | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // Process complete SSE messages (ending with \n\n)
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep incomplete message in buffer

      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue;
        
        const data = line.slice(6); // Remove 'data: ' prefix
        try {
          const event = JSON.parse(data);
          
          if (event.type === 'chunk') {
            onChunk(event.data);
          } else if (event.type === 'progress') {
            if (onProgress) {
              onProgress(event.data.stage, event.data.message);
            }
          } else if (event.type === 'complete') {
            finalPacket = AnswerPacketSchema.parse(event.data);
          } else if (event.type === 'error') {
            throw new Error(event.data.message || 'Answer generation failed');
          }
        } catch (parseError) {
          console.error('Failed to parse SSE event:', parseError);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!finalPacket) {
    throw new Error('No complete answer packet received');
  }

  return finalPacket;
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

// GET /api/events?userId=<userId>
export async function fetchUserEvents(userId: string): Promise<UserEvent[]> {
  const response = await fetch(`${API_BASE}/events?userId=${encodeURIComponent(userId)}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.statusText}`);
  }

  const data = await response.json();
  return z.array(UserEventSchema).parse(data);
}

// DELETE /api/preferences?userId=<userId>
export async function resetUserData(userId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/preferences?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to reset user data: ${response.statusText}`);
  }
}

