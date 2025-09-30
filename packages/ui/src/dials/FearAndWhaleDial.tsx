'use client';
export function FearAndWhaleDial({ data }: { data: { score: number; label: string } }) {
  return (
    <section className="rounded-lg border p-4">
      <div className="text-sm font-semibold">🧭 Fear & Whale Index</div>
      <div className="mt-2 flex items-center gap-4">
        <div className="h-4 flex-1 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 rounded" />
        <div className="text-sm font-medium">{data.score} – {data.label}</div>
      </div>
    </section>
  );
}
