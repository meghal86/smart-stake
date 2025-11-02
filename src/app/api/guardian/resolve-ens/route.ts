import { NextResponse } from 'next/server';
import { resolveEns } from '@/lib/guardian/ens';
import { isAddress } from 'viem';

interface ResolveEnsRequestBody {
  input?: string;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as ResolveEnsRequestBody;

    if (!payload.input) {
      return NextResponse.json({ error: 'ENS or address input is required.' }, { status: 400 });
    }

    const result = await resolveEns(payload.input).catch(async (error: unknown) => {
      if (isAddress(payload.input!)) {
        return {
          address: payload.input!.toLowerCase(),
          ensName: null,
        };
      }

      throw error;
    });

    return NextResponse.json(
      {
        address: result.address.toLowerCase(),
        ensName: result.ensName,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[guardian][resolve-ens] error', error);
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
