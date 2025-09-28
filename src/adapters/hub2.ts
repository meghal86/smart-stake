import { EntitySummary, SignalEvent, Gauges } from "@/types/hub2";

const clamp = (n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
const nz = (n:any, d=0)=> (Number.isFinite(+n) ? +n : d);

export function toGauges(src:any): Gauges {
  const sentiment = clamp(nz(src.sentiment), 0, 100);
  const pressure  = clamp(nz(src.whale_in) - nz(src.whale_out), -100, 100);
  const risk10    = clamp(nz(src.risk ?? (nz(src.riskIndex)*0.1)), 0, 10);
  return { sentiment, whalePressure: pressure, risk: risk10 };
}

export function toSignalEvent(src:any): SignalEvent {
  const type = src.type ?? src.cluster_type ?? 'sentiment_change';
  const ts = String(src.ts ?? src.timestamp ?? src.created_at);
  const impactUsd = src.impact_usd ?? src.amount_usd ?? src.size_usd ?? src.netFlow24h;
  const reasons = src.reasons ?? src.reasonCodes ?? [];
  return {
    id: String(src.id ?? src.hash ?? `${type}-${ts}`),
    ts, type,
    entity: src.entity ?? { kind: (src.entity_kind ?? 'asset'), id: String(src.entity_id ?? src.symbol ?? src.chain), symbol: src.symbol, name: src.name },
    impactUsd, delta: src.delta,
    confidence: (src.confidence ?? 'med'),
    source: (src.source ?? 'internal'),
    reasonCodes: reasons,
  } as SignalEvent;
}

export function toEntitySummary(src:any): EntitySummary {
  const metrics = src.metrics ?? src.summary?.metrics ?? src;
  return {
    id: String(src.id ?? src.entity_id ?? src.symbol ?? src.chain),
    kind: (src.kind ?? src.entity_kind ?? 'asset'),
    symbol: src.symbol, name: src.name ?? src.symbol ?? src.chain,
    badges: src.is_real ? ['real'] : ['sim'],
    gauges: toGauges(metrics),
    priceUsd: src.price_usd ?? src.price,
    change24h: src.change_24h ?? src.change24h ?? src.delta_24h,
    lastEvents: (src.events ?? src.alerts ?? src.recent_events ?? []).map(toSignalEvent).slice(0,3),
    provenance: {
      source: (src.source ?? metrics?.source ?? 'internal'),
      updatedAt: src.updated_at ?? metrics?.updated_at ?? new Date().toISOString(),
      latencyMs: src.latency_ms ?? metrics?.latency_ms
    }
  };
}
