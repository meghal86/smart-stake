import { EntitySummary, SignalEvent, Gauges } from "@/types/hub2";

const clamp = (n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));

export function toGauges(src: { sentiment?: number; whale_in?: number; whale_out?: number; risk?: number }): Gauges {
  const whaleIn = src.whale_in ?? 0, whaleOut = src.whale_out ?? 0;
  return {
    sentiment: clamp(src.sentiment ?? 0, 0, 100),
    whalePressure: clamp(whaleIn - whaleOut, -100, 100),
    risk: clamp(src.risk ?? 0, 0, 10),
  };
}

export function toSignalEvent(src: any): SignalEvent {
  return {
    id: String(src.id),
    ts: src.ts ?? src.timestamp,
    type: src.type,
    entity: src.entity ?? { kind: src.entity_kind, id: src.entity_id, symbol: src.symbol, name: src.name },
    impactUsd: src.impact_usd ?? src.usd,
    delta: src.delta,
    confidence: src.confidence ?? 'med',
    source: src.source ?? 'internal',
    reasonCodes: src.reasons ?? [],
  };
}

export function toEntitySummary(src: any): EntitySummary {
  return {
    id: String(src.id ?? src.entity_id),
    kind: src.kind ?? src.entity_kind,
    symbol: src.symbol,
    name: src.name,
    badges: src.is_real ? ['real'] : ['sim'],
    gauges: toGauges(src.metrics ?? src),
    priceUsd: src.price_usd,
    change24h: src.change_24h,
    lastEvents: (src.events ?? []).map(toSignalEvent).slice(0,3),
    provenance: { source: src.source ?? 'internal', updatedAt: src.updated_at ?? new Date().toISOString() }
  };
}
