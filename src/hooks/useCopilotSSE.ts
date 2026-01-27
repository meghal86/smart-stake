import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Types from design document
export type CopilotStreamEvent =
  | { type: 'message'; text: string }
  | { type: 'action_card'; payload: ActionCard }
  | { type: 'intent_plan'; payload: IntentPlan }
  | { type: 'capability_notice'; payload: { code: string; message: string } }
  | { type: 'done' };

export interface ActionCard {
  type: 'ActionCard';
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  why: string[];
  impactPreview: {
    riskDelta: number;
    preventedLossP50Usd: number;
    expectedGainUsd: number;
    gasEstimateUsd: number;
    timeEstimateSec: number;
    confidence: number;
  };
  cta: {
    label: string;
    intent: string;
    params: Record<string, any>;
  };
  walletScope: WalletScope;
}

export interface IntentPlan {
  type: 'IntentPlan';
  id: string;
  intent: string;
  steps: ExecutionStep[];
  policy: {
    status: 'allowed' | 'blocked';
    violations: string[];
  };
  simulation: {
    status: 'pass' | 'warn' | 'block';
    receiptId: string;
  };
  impactPreview: {
    gasEstimateUsd: number;
    timeEstimateSec: number;
    riskDelta: number;
  };
  walletScope: WalletScope;
}

export interface ExecutionStep {
  stepId: string;
  kind: 'revoke' | 'approve' | 'swap' | 'transfer';
  chainId: number;
  target: string;
  status: 'pending' | 'simulated' | 'blocked' | 'ready' | 'signing' | 'submitted' | 'confirmed' | 'failed';
  payload?: string;
  gasEstimate?: number;
  error?: string;
}

export type WalletScope =
  | { mode: 'active_wallet'; address: `0x${string}` }
  | { mode: 'all_wallets' };

export interface UseCopilotSSEOptions {
  walletScope: WalletScope;
  enabled?: boolean; // Only connect when enabled
  onMessage?: (message: string) => void;
  onActionCard?: (actionCard: ActionCard) => void;
  onIntentPlan?: (intentPlan: IntentPlan) => void;
  onCapabilityNotice?: (notice: { code: string; message: string }) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export interface UseCopilotSSEReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  messages: string[];
  actionCards: ActionCard[];
  intentPlans: IntentPlan[];
  capabilityNotices: { code: string; message: string }[];
  sendMessage: (message: string) => void;
  clearHistory: () => void;
  reconnect: () => void;
  disconnect: () => void;
}

export function useCopilotSSE(options: UseCopilotSSEOptions): UseCopilotSSEReturn {
  const {
    walletScope,
    enabled = true,
    onMessage,
    onActionCard,
    onIntentPlan,
    onCapabilityNotice,
    onError,
    onConnectionChange,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [actionCards, setActionCards] = useState<ActionCard[]>([]);
  const [intentPlans, setIntentPlans] = useState<IntentPlan[]>([]);
  const [capabilityNotices, setCapabilityNotices] = useState<{ code: string; message: string }[]>([]);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const buildStreamUrl = useCallback(() => {
    const params = new URLSearchParams();
    
    if (walletScope.mode === 'active_wallet') {
      params.set('wallet', walletScope.address);
    }
    params.set('scope', walletScope.mode);
    
    return `/api/v1/portfolio/copilot/stream?${params.toString()}`;
  }, [walletScope.mode, walletScope.mode === 'active_wallet' ? walletScope.address : null]); // Memoize based on actual values

  const handleEvent = useCallback((event: MessageEvent) => {
    try {
      const data: CopilotStreamEvent = JSON.parse(event.data);
      
      switch (data.type) {
        case 'message':
          setMessages(prev => [...prev, data.text]);
          onMessage?.(data.text);
          break;
          
        case 'action_card':
          setActionCards(prev => [...prev, data.payload]);
          onActionCard?.(data.payload);
          break;
          
        case 'intent_plan':
          setIntentPlans(prev => [...prev, data.payload]);
          onIntentPlan?.(data.payload);
          break;
          
        case 'capability_notice':
          setCapabilityNotices(prev => [...prev, data.payload]);
          onCapabilityNotice?.(data.payload);
          break;
          
        case 'done':
          // Stream completed successfully
          break;
          
        default:
          console.warn('Unknown Copilot stream event type:', data);
      }
    } catch (err) {
      console.error('Error parsing Copilot stream event:', err);
      const parseError = new Error('Failed to parse stream event');
      setError(parseError);
      onError?.(parseError);
    }
  }, [onMessage, onActionCard, onIntentPlan, onCapabilityNotice, onError]);

  const handleMetaEvent = useCallback((event: MessageEvent) => {
    try {
      const meta = JSON.parse(event.data);
      
      // Validate API version from first SSE event
      if (meta.apiVersion !== 'v1') {
        console.warn('Unexpected API version in SSE meta event:', meta.apiVersion);
      }
    } catch (err) {
      console.error('Error parsing meta event:', err);
    }
  }, []);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setIsConnecting(true);
    setError(null);

    const url = buildStreamUrl();
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('open', () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      reconnectAttemptsRef.current = 0;
      onConnectionChange?.(true);
    });

    eventSource.addEventListener('error', (event) => {
      setIsConnected(false);
      setIsConnecting(false);
      
      const connectionError = new Error('SSE connection error');
      setError(connectionError);
      onError?.(connectionError);
      onConnectionChange?.(false);

      // Attempt reconnection with exponential backoff
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000; // 1s, 2s, 4s, 8s, 16s
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connect();
        }, delay);
      }
    });

    // Handle meta event (first event with API version)
    eventSource.addEventListener('meta', handleMetaEvent);

    // Handle stream events
    eventSource.addEventListener('message', handleEvent);
    eventSource.addEventListener('action_card', handleEvent);
    eventSource.addEventListener('intent_plan', handleEvent);
    eventSource.addEventListener('capability_notice', handleEvent);
    eventSource.addEventListener('done', handleEvent);

  }, [buildStreamUrl, handleEvent, handleMetaEvent, onConnectionChange, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
    reconnectAttemptsRef.current = 0;
    onConnectionChange?.(false);
  }, [onConnectionChange]);

  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [disconnect, connect]);

  const sendMessage = useCallback((message: string) => {
    // For now, this would trigger a new SSE connection with the message
    // In a real implementation, this might POST to an endpoint that triggers the stream
    console.log('Sending message to Copilot:', message);
    
    // Clear previous responses and reconnect with new context
    setMessages([]);
    setActionCards([]);
    setIntentPlans([]);
    setCapabilityNotices([]);
    
    reconnect();
  }, [reconnect]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setActionCards([]);
    setIntentPlans([]);
    setCapabilityNotices([]);
  }, []);

  // Connect on mount and wallet scope changes - only if enabled
  useEffect(() => {
    if (!enabled) {
      disconnect();
      return;
    }
    
    connect();
    
    return () => {
      disconnect();
    };
  }, [enabled, walletScope.mode, walletScope.mode === 'active_wallet' ? walletScope.address : null]); // Only reconnect when relevant scope changes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    messages,
    actionCards,
    intentPlans,
    capabilityNotices,
    sendMessage,
    clearHistory,
    reconnect,
    disconnect,
  };
}