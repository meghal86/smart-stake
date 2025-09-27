import { useQuery, useMutation } from "@tanstack/react-query";
import { toEntitySummary, toSignalEvent } from "@/adapters/hub2";
import { AlertRule, BacktestResult, EntitySummary, SignalEvent, PulseData, ExploreData, EntityDetail } from "@/types/hub2";
import { mockAPIResponses } from "@/data/hub2MockData";

// Mock API function to simulate network delay
const mockFetch = async (data: any, delay: number = 500) => {
  await new Promise(resolve => setTimeout(resolve, delay));
  return data;
};

// Use mock data instead of real API calls
const API = {
  pulse: (w:string) => mockAPIResponses.pulse(w),
  explore: (qs:string) => mockAPIResponses.explore(qs),
  entity: (id:string) => mockAPIResponses.entity(id),
  backtest: () => mockAPIResponses.backtest(),
  alerts: () => mockAPIResponses.alerts(),
};

export function usePulse(window: '24h'|'7d'|'30d') {
  return useQuery({
    queryKey: ['hub2','pulse',window],
    queryFn: async () => {
      const data = await mockFetch(API.pulse(window));
      return data as PulseData;
    },
    staleTime: 15_000,
  });
}

export function useExplore(qs: string) {
  return useQuery({
    queryKey: ['hub2','explore',qs],
    queryFn: async () => {
      const data = await mockFetch(API.explore(qs));
      return data as ExploreData;
    }
  });
}

export function useEntity(id: string) {
  return useQuery({
    queryKey: ['hub2','entity',id],
    queryFn: async () => {
      const data = await mockFetch(API.entity(id));
      return data as EntityDetail;
    }
  });
}

export function useBacktest() {
  return useMutation({
    mutationFn: async (payload: any) => {
      const data = await mockFetch(API.backtest());
      return data as BacktestResult;
    }
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: ['hub2','alerts'],
    queryFn: async () => {
      const data = await mockFetch(API.alerts());
      return data as AlertRule[];
    }
  });
}

export function useCreateAlert() {
  return useMutation({
    mutationFn: async (rule: Omit<AlertRule, 'id'>) => {
      const data = await mockFetch({ success: true, id: `alert-${Date.now()}` });
      return data;
    }
  });
}
