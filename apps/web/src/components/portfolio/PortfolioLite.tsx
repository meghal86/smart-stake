'use client';
import { useEffect, useState } from 'react';
type Entry = { symbol: string; amount: number };

export default function PortfolioLite() {
  const [items, setItems] = useState<Entry[]>([]);
  useEffect(() => { const s = localStorage.getItem('aw_portfolio_lite'); if (s) setItems(JSON.parse(s)); }, []);
  useEffect(() => { localStorage.setItem('aw_portfolio_lite', JSON.stringify(items)); }, [items]);

  function add(symbol: string, amount: number) {
    if (!symbol) return;
    setItems(prev => [...prev, { symbol: symbol.toUpperCase(), amount }]);
  }
  function remove(i: number) { setItems(prev => prev.filter((_, idx) => idx !== i)); }

  return (
    <section className="rounded-lg border p-4">
      <div className="text-sm font-semibold">📊 Portfolio Lite</div>
      <form onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget as HTMLFormElement);
        add(String(f.get('symbol')||''), Number(f.get('amount')||0));
        (e.currentTarget as HTMLFormElement).reset();
      }} className="mt-3 flex gap-2">
        <input name="symbol" placeholder="ETH" className="px-3 py-2 rounded border bg-transparent" required />
        <input name="amount" type="number" step="any" placeholder="1.0" className="px-3 py-2 rounded border bg-transparent" required />
        <button className="px-3 py-2 rounded bg-[#3B82F6] text-white">Add</button>
      </form>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((e, i) => (
          <li key={i} className="flex justify-between">
            <span>{e.symbol} — {e.amount}</span>
            <button className="text-red-400" onClick={() => remove(i)}>Remove</button>
          </li>
        ))}
      </ul>
    </section>
  );
}