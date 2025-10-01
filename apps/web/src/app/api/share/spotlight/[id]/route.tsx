import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(_: Request, { params }: { params: { id: string }}) {
  // TODO: pull real spotlight by ID
  const data = { id: params.id, asset: 'ETH', amount: 12500000, date: new Date().toISOString().slice(0,10) };
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', background: '#0B1020', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 64 }}>
      <div style={{ fontSize: 28, opacity: .8 }}>🚨 Whale Spotlight</div>
      <div style={{ fontSize: 64, fontWeight: 800, marginTop: 8 }}>${data.amount.toLocaleString()} {data.asset}</div>
      <div style={{ fontSize: 28, marginTop: 8 }}>Detected: {data.date}</div>
      <div style={{ fontSize: 24, marginTop: 24, opacity: .7 }}>alphawhale.app</div>
    </div>,
    { width: 1200, height: 630 }
  );
}