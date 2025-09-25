// API Route for Individual Cluster Bundle
import { NextRequest, NextResponse } from 'next/server';
import { getClusterBundle } from '@/lib/market/data';
import { Window } from '@/types/cluster';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cluster = searchParams.get('cluster');
  const window = (searchParams.get('window') as Window) || '24h';
  
  if (!cluster) {
    return NextResponse.json(
      { error: 'Cluster ID is required' },
      { status: 400 }
    );
  }
  
  try {
    const bundle = await getClusterBundle(cluster, window);
    
    return NextResponse.json(bundle, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300'
      }
    });
    
  } catch (error) {
    console.error('Cluster bundle API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cluster bundle' },
      { status: 500 }
    );
  }
}