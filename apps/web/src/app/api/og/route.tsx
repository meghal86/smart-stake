import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'whale';
    const title = searchParams.get('title') || 'AlphaWhale Intelligence';
    const subtitle = searchParams.get('subtitle') || 'Whale movement detected';
    const value = searchParams.get('value') || '$12.5M ETH';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            backgroundImage: 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              borderRadius: '24px',
              padding: '60px',
              border: '2px solid #334155',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div
              style={{
                fontSize: '72px',
                marginBottom: '20px',
              }}
            >
              {type === 'whale' ? '🐋' : type === 'fear' ? '🧭' : '📊'}
            </div>
            
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#ffffff',
                textAlign: 'center',
                marginBottom: '16px',
                lineHeight: 1.2,
              }}
            >
              {title}
            </div>
            
            <div
              style={{
                fontSize: '32px',
                color: '#94a3b8',
                textAlign: 'center',
                marginBottom: '24px',
              }}
            >
              {subtitle}
            </div>
            
            <div
              style={{
                fontSize: '40px',
                fontWeight: 'bold',
                color: '#06b6d4',
                textAlign: 'center',
                marginBottom: '32px',
              }}
            >
              {value}
            </div>
            
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '24px',
                color: '#64748b',
              }}
            >
              <span>🐋</span>
              <span>AlphaWhale</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}