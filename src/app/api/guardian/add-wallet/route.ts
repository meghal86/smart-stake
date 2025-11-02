import { NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { createServiceClient } from '@/integrations/supabase/service';
import { withRedisLock } from '@/lib/redis/client';
import { resolveEns } from '@/lib/guardian/ens';
import { isAddress, type Address } from 'viem';

type WalletType =
  | 'browser'
  | 'mobile'
  | 'hardware'
  | 'exchange'
  | 'smart'
  | 'social'
  | 'readonly';

interface AddWalletRequest {
  input: string;
  alias?: string;
  walletType?: WalletType;
}

const STATUS_BY_TYPE: Record<WalletType, 'connected' | 'linked' | 'readonly'> = {
  browser: 'connected',
  readonly: 'readonly',
  mobile: 'linked',
  hardware: 'linked',
  exchange: 'linked',
  smart: 'linked',
  social: 'linked',
};

function sanitizeWalletType(type: WalletType | undefined): WalletType {
  if (!type) return 'readonly';
  if (STATUS_BY_TYPE[type]) return type;
  return 'readonly';
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as AddWalletRequest;
    const walletType = sanitizeWalletType(payload.walletType);

    if (!payload.input) {
      return NextResponse.json({ error: 'Wallet input is required.' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service client for database operations
    const serviceClient = createServiceClient();

    const { address, ensName } = await resolveEns(payload.input).catch((error: unknown) => {
      if (isAddress(payload.input)) {
        return { address: payload.input as Address, ensName: null };
      }

      throw error;
    });

    const normalizedAddress = address.toLowerCase();
    const redisKey = `guardian:wallet:add:${normalizedAddress}`;

    const executeAddWallet = async () => {
      const { data: existing, error: existingError } = await serviceClient
        .from('guardian_wallets')
        .select('id')
        .eq('user_id', user.id)
        .eq('address', normalizedAddress)
        .maybeSingle();

      if (existingError) {
        console.error('Error checking existing wallet:', existingError);
        throw existingError;
      }

      if (existing) {
        return NextResponse.json(
          { error: 'Wallet already added.' },
          { status: 409 },
        );
      }

      const status = STATUS_BY_TYPE[walletType];

      const { data: wallet, error: insertError } = await serviceClient
        .from('guardian_wallets')
        .insert({
          user_id: user.id,
          address: normalizedAddress,
          alias: payload.alias?.trim() || null,
          wallet_type: walletType,
          status,
          ens_name: ensName,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting wallet:', insertError);
        throw insertError;
      }

      // Log the wallet addition
      const { error: logError } = await serviceClient.from('guardian_logs').insert({
        user_id: user.id,
        event_type: 'wallet_add',
        metadata: {
          address: normalizedAddress,
          wallet_type: walletType,
          alias: payload.alias?.trim() || null,
          ens_name: ensName,
          status,
        },
      });

      if (logError) {
        console.error('Error logging wallet addition:', logError);
      }

      // Trigger scan asynchronously
      let scanTriggered = false;
      try {
        const { error: scanError } = await serviceClient.functions.invoke('guardian-scan-v2', {
          body: {
            wallet_address: normalizedAddress,
            user_id: user.id,
            trigger: 'add-wallet',
          },
        });

        if (scanError) {
          console.error('Scan error:', scanError);
          await serviceClient.from('guardian_logs').insert({
            user_id: user.id,
            event_type: 'wallet_scan_error',
            metadata: {
              address: normalizedAddress,
              wallet_type: walletType,
              reason: scanError.message,
            },
          });
        } else {
          scanTriggered = true;
        }
      } catch (scanError) {
        console.error('Failed to trigger scan:', scanError);
      }

      return NextResponse.json(
        {
          wallet,
          ensName,
          status,
          scanTriggered,
        },
        { status: 201 },
      );
    };

    // Try to use Redis lock if available, otherwise execute directly
    let result;
    try {
      result = await withRedisLock(redisKey, 30, executeAddWallet);
    } catch (lockError) {
      // If Redis lock fails, execute directly (fallback)
      console.warn('Redis lock failed, executing without lock:', lockError);
      result = await executeAddWallet();
    }

    return result;
  } catch (error) {
    console.error('[guardian][add-wallet] error', error);
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const status = message.includes('locked') ? 429 : 500;

    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}
