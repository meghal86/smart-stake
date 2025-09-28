import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';

export default function Pulse() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['pulse'],
    queryFn: () => fetch('/api/edge/hub/pulse?window=24h').then(res => res.json())
  });

  if (isLoading) return <div>Loading Pulse...</div>;
  if (error) return <div>Error loading Pulse.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold">{data.kpis.sentiment}</div>
          <div className="text-sm text-muted-foreground">Market Sentiment</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold">{data.kpis.whale_in}</div>
          <div className="text-sm text-muted-foreground">Whale Pressure</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold">{data.kpis.riskIndex}</div>
          <div className="text-sm text-muted-foreground">Risk Index</div>
        </Card>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-2">Top Signals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.entities.slice(0, 6).map((signal: any) => (
            <Card key={signal.id} className="p-4">
              <div className="font-bold">{signal.name || signal.id}</div>
              <div className="text-sm text-muted-foreground">Risk: {signal.gauges.risk}</div>
              <div className="text-xs">Source: {signal.provenance?.source}</div>
              <button className="mt-2 text-blue-600 underline">View {signal.lastEvents.length} affected assets</button>
            </Card>
          ))}
        </div>
        {data.entities.length > 6 && (
          <button className="mt-4 text-blue-600 underline">Show more</button>
        )}
      </div>
      {data.ai && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <strong>AI Insight:</strong> {data.ai.soWhat}
        </div>
      )}
    </div>
  );
}
