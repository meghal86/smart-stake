export function DigestList({ items }: { items: { id: string; text: string; direction: 'buy'|'sell' }[] }) {
  return (
    <section className="rounded-lg border p-4">
      <div className="text-sm font-semibold">📩 Daily Whale Digest</div>
      <ul className="mt-2 space-y-2">
        {items.map(i => (<li key={i.id} className="text-sm">{i.text} {i.direction === 'buy' ? '🟢' : '🔴'}</li>))}
      </ul>
    </section>
  );
}
