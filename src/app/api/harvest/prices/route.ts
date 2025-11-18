/**
 * GET /api/harvest/prices
 * Fetch current prices for tokens with caching
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPriceOracle } from '@/lib/harvestpro/price-oracle';
import { PriceResponse } from '@/types/harvestpro';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tokensParam = searchParams.get('tokens');

    if (!tokensParam) {
      return NextResponse.json(
        {
          error: {
            code: 'BAD_REQUEST',
            message: 'Missing required parameter: tokens',
          },
        },
        { status: 400 }
      );
    }

    const tokens = tokensParam.split(',').map(t => t.trim()).filter(Boolean);

    if (tokens.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: 'BAD_REQUEST',
            message: 'At least one token must be specified',
          },
        },
        { status: 400 }
      );
    }

    if (tokens.length > 50) {
      return NextResponse.json(
        {
          error: {
            code: 'BAD_REQUEST',
            message: 'Maximum 50 tokens per request',
          },
        },
        { status: 400 }
      );
    }

    const oracle = getPriceOracle();
    const priceData = await oracle.getPrices(tokens);

    // Convert to simple price map
    const prices: Record<string, number> = {};
    for (const [token, data] of Object.entries(priceData)) {
      prices[token] = data.price;
    }

    const response: PriceResponse = {
      ts: new Date().toISOString(),
      prices,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      },
    });
  } catch (error) {
    console.error('Price fetch error:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: error instanceof Error ? error.message : 'Failed to fetch prices',
        },
      },
      { status: 500 }
    );
  }
}
