import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSearch, fetchAnswer, logUserEvent, fetchPreferences, fetchUserEvents, resetUserData } from './api';
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

export function usePreferences(userId: string, enabled = true) {
  return useQuery({
    queryKey: ['preferences', userId],
    queryFn: () => fetchPreferences(userId),
    enabled: enabled && userId.length > 0,
    staleTime: 30000, // 30 seconds - preferences change slowly
  });
}

export function useUserEvents(userId: string, enabled = true) {
  return useQuery({
    queryKey: ['events', userId],
    queryFn: () => fetchUserEvents(userId),
    enabled: enabled && userId.length > 0,
    refetchInterval: 5000, // Refetch every 5 seconds for demo panel
  });
}

export function useResetUserData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => resetUserData(userId),
    onSuccess: (_, userId) => {
      // Invalidate all queries for this user
      queryClient.invalidateQueries({ queryKey: ['preferences', userId] });
      queryClient.invalidateQueries({ queryKey: ['events', userId] });
    },
  });
}

