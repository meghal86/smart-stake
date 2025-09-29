'use client';
import { useEffect, useState } from 'react';

export default function TopStatusBar5() {
  const [score, setScore] = useState<number | null>(null);
  const [label, setLabel] = useState<string>('');

  useEffect(() => {
    fetch('/api/lite5/whale-index')
      .then((res) => res.json())
      .then((d) => {
        if (d?.score) {
          setScore(d.score);
          setLabel(d.label);
        }
      });
  }, []);

  const today = new Date().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-2 backdrop-blur">
      <div className="flex items-center gap-3 text-sm text-slate-300">
        <span className="font-semibold text-white">{today}</span>
        {score !== null && (
          <span>
            Index: <span className="font-bold text-teal-400">{score}</span>{' '}
            <span className="text-xs text-slate-400">{label}</span>
          </span>
        )}
      </div>
      <form action="/api/lite5/upgrade" method="post">
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 px-3 py-1 text-xs font-bold text-white shadow hover:from-teal-600 hover:to-blue-700"
        >
          Upgrade
        </button>
      </form>
    </header>
  );
}
