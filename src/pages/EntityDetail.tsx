import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';

export default function EntityDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['entity', id],
    queryFn: () => fetch(`/api/edge/hub/entity/${id}`).then(res => res.json())
  });

  if (isLoading) return <div>Loading Entity Detail...</div>;
  if (error) return <div>Error loading Entity Detail.</div>;

  return (
    <div className="p-6 space-y-6">
      <Card className="p-4">
        <div className="font-bold text-xl">{data.summary.name || data.summary.id}</div>
        <div className="flex gap-4 mt-2">
          <div>Sentiment: {data.summary.gauges.sentiment}</div>
          <div>Whale Pressure: {data.summary.gauges.whalePressure}</div>
          <div>Risk: {data.summary.gauges.risk}</div>
        </div>
        <div className="mt-2">Badges: {data.summary.badges.join(', ')}</div>
        <div className="mt-2">Price: ${data.summary.priceUsd}</div>
        <div className="mt-2">Change 24h: {data.summary.change24h}</div>
      </Card>
      <div>
        <h2 className="text-lg font-bold mb-2">Timeline</h2>
        <div className="space-y-2">
          {data.events.map((event: any) => (
            <Card key={event.id} className="p-2">
              <div>{event.type} - {event.ts}</div>
              <div>Impact: {event.impactUsd}</div>
              <div>Confidence: {event.confidence}</div>
              <div>Source: {event.source}</div>
              <div>Reason: {event.reasonCodes.join(', ')}</div>
            </Card>
          ))}
        </div>
      </div>
      {data.ai && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <strong>AI So What:</strong> {data.ai.soWhat}
        </div>
      )}
    </div>
  );
}
