import { NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { cacheValue, getCachedValue, withRedisLock } from '@/lib/redis/client';
import { isAddress } from 'viem';

interface ScanRequestBody {
  address?: string;
}

export async function GET() {
  return NextResponse.json({ error: 'guardian scan route disabled in dev' }, { status: 404 });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ScanRequestBody;
  const address = body.address;

  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: 'Valid wallet address is required.' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const normalizedAddress = address.toLowerCase();
    const cacheKey = `guardian:scan:${normalizedAddress}`;

    const cached = await getCachedValue<{ result: unknown }>(cacheKey);
    if (cached) {
      return NextResponse.json({ result: cached.result, cached: true }, { status: 200 });
    }

    const response = await withRedisLock(
      cacheKey,
      30,
      async () => {
        const { data, error } = await supabase.functions.invoke('guardian-scan-v2', {
          body: {
            wallet_address: normalizedAddress,
            user_id: user.id,
            trigger: 'manual-rescan',
          },
        });

        if (error) {
          throw error;
        }

        if (data?.trust_score_percent) {
          await supabase
            .from('guardian_wallets')
            .update({
              trust_score: data.trust_score_percent,
              last_scan: new Date().toISOString(),
            })
            .eq('user_id', user.id)
            .eq('address', normalizedAddress);
        } else {
          await supabase
            .from('guardian_wallets')
            .update({ last_scan: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('address', normalizedAddress);
        }

        await supabase.from('guardian_logs').insert({
          user_id: user.id,
          event_type: 'wallet_scan',
          metadata: {
            address: normalizedAddress,
            trust_score: data?.trust_score_percent ?? null,
          },
        });

        await cacheValue(cacheKey, { result: data }, 600);

        return NextResponse.json({ result: data, cached: false }, { status: 200 });
      },
    );

    return response;
  } catch (error) {
    console.error('[guardian][scan] error', error);
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
