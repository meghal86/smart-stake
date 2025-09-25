// Market Intelligence - Formulas and Thresholds
import { ClusterMetrics } from '@/types/cluster';

export function calculateShareOfTotal(
  clusterNetFlow: number, 
  allClustersNetFlows: number[]
): number {
  const totalAbsFlow = allClustersNetFlows.reduce((sum, flow) => sum + Math.abs(flow), 0);
  if (totalAbsFlow === 0) return 0;
  
  const share = (Math.abs(clusterNetFlow) / totalAbsFlow) * 100;
  return Math.min(Math.max(share, 0), 100); // Clamp 0-100
}

export function getRiskThreshold(score: number): "Safe" | "Watch" | "High" {
  if (score >= 67) return "High";
  if (score >= 34) return "Watch";
  return "Safe";
}

export function getConfidenceLabel(confidencePct: number): string {
  if (confidencePct < 20) return "Uncertain";
  if (confidencePct < 60) return "Moderate";
  return "High";
}

export function formatUSD(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "−" : amount > 0 ? "+" : "";
  
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function validateClusterMetrics(metrics: ClusterMetrics): string[] {
  const errors: string[] = [];
  
  if (metrics.shareOfTotalPct > 100 || metrics.shareOfTotalPct < 0) {
    errors.push(`share_out_of_bounds: ${metrics.shareOfTotalPct}%`);
  }
  
  if (Math.abs(metrics.netFlowUSD) > 0 && metrics.activeAddresses === 0) {
    errors.push(`data_incoherent: netFlow=${metrics.netFlowUSD} but activeAddresses=0`);
  }
  
  return errors;
}

export const CLUSTER_THRESHOLDS = {
  minConfidenceForClassification: 20,
  riskLevels: {
    safe: { min: 0, max: 33 },
    watch: { min: 34, max: 66 },
    high: { min: 67, max: 100 }
  }
} as const;