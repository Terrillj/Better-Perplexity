import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchSearch, fetchAnswer, logUserEvent } from './api';
import type { QueryPlan, UserEvent } from './types';

export function useSearch(query: string, enabled = false) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => fetchSearch(query),
    enabled: enabled && query.length > 0,
  });
}

export function useAnswer(query: string, userId?: string, plan?: QueryPlan) {
  return useQuery({
    queryKey: ['answer', query, userId],
    queryFn: () => fetchAnswer(query, userId, plan),
    enabled: false, // Manually triggered
  });
}

export function useLogEvent() {
  return useMutation({
    mutationFn: (event: UserEvent) => logUserEvent(event),
  });
}

