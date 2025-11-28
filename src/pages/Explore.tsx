import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';

export default function Explore() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['explore'],
    queryFn: () => fetch('/api/edge/hub/explore?window=24h').then(res => res.json())
  });

  if (isLoading) return <div>Loading Explore...</div>;
  if (error) return <div>Error loading Explore.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex gap-2 mb-4">
        {/* Filter chips placeholder */}
        <button className="px-3 py-1 bg-gray-200 rounded">Chains</button>
        <button className="px-3 py-1 bg-gray-200 rounded">Assets</button>
        <button className="px-3 py-1 bg-gray-200 rounded">Time</button>
        <button className="px-3 py-1 bg-gray-200 rounded">Signal Type</button>
        <button className="px-3 py-1 bg-gray-200 rounded">Min USD</button>
        <button className="px-3 py-1 bg-gray-200 rounded">Real/Sim</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.items.map((item: unknown) => (
          <Card key={item.id} className="p-4">
            <div className="font-bold">{item.name || item.id}</div>
            <div className="text-sm">Price: ${item.priceUsd}</div>
            <div className="text-sm">Sentiment: {item.gauges.sentiment}</div>
            <div className="text-sm">Whale Pressure: {item.gauges.whalePressure}</div>
            <div className="text-sm">Risk: {item.gauges.risk}</div>
            <div className="text-xs">Last Events: {item.lastEvents.length}</div>
            <button className="mt-2 text-blue-600 underline">Compare</button>
          </Card>
        ))}
      </div>
    </div>
  );
}
