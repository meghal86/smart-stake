/**
 * Hunter Demand-Side Environment Validation
 * 
 * Validates environment variables for all 7 Hunter modules across 3 phases:
 * - Phase 1 (MVP): DeFiLlama, Alchemy, Supabase, Admin Seeds ($0/month)
 * - Phase 2 (Enhanced): Layer3, Galxe, Zealy, QuestN ($0-100/month)
 * - Phase 3 (Scale): DeBank, RWA.xyz, DeFiLlama Pro ($100-500/month)
 */

export interface EnvValidationResult {
  phase: 1 | 2 | 3;
  isValid: boolean;
  capabilities: {
    yieldModule: boolean;
    walletSignals: boolean;
    airdropsModule: boolean;
    questsModule: boolean;
    pointsModule: boolean;
    rwaModule: boolean;
    strategiesModule: boolean;
    referralsModule: boolean;
  };
  warnings: string[];
  errors: string[];
  info: string[];
}

/**
 * Validates Hunter environment configuration
 * 
 * Phase 1 (Required):
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - CRON_SECRET
 * - DEFILLAMA_API_URL (optional, defaults to https://yields.llama.fi)
 * 
 * Phase 1 (Optional):
 * - ALCHEMY_TRANSFERS_API_KEY (wallet age)
 * - ALCHEMY_ETH_RPC_URL (wallet signals)
 * - ALCHEMY_BASE_RPC_URL (wallet signals)
 * - ALCHEMY_ARB_RPC_URL (wallet signals)
 * 
 * Phase 2 (Optional):
 * - LAYER3_API_KEY
 * - GALXE_API_KEY
 * - ZEALY_API_KEY
 * - QUESTN_API_KEY
 * 
 * Phase 3 (Optional):
 * - DEBANK_API_KEY
 * - RWA_API_KEY
 * - DEFILLAMA_PRO_API_KEY
 */
export function validateHunterEnv(): EnvValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const info: string[] = [];

  // Phase 1 Required Variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const cronSecret = process.env.CRON_SECRET;

  if (!supabaseUrl) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required for database access');
  }

  if (!supabaseAnonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required for database access');
  }

  if (!cronSecret) {
    errors.push('CRON_SECRET is required for secure sync job endpoints');
  } else if (cronSecret.length < 32) {
    warnings.push('CRON_SECRET should be at least 32 characters for security');
  }

  // Phase 1 Optional Variables (Alchemy)
  const alchemyTransfersKey = process.env.ALCHEMY_TRANSFERS_API_KEY;
  const alchemyEthRpc = process.env.ALCHEMY_ETH_RPC_URL;
  const alchemyBaseRpc = process.env.ALCHEMY_BASE_RPC_URL;
  const alchemyArbRpc = process.env.ALCHEMY_ARB_RPC_URL;

  const hasAlchemyTransfers = !!alchemyTransfersKey;
  const hasAlchemyRpc = !!(alchemyEthRpc || alchemyBaseRpc || alchemyArbRpc);

  if (!hasAlchemyTransfers) {
    warnings.push(
      'ALCHEMY_TRANSFERS_API_KEY not configured - wallet age will be null (degraded wallet signals)'
    );
  }

  if (!hasAlchemyRpc) {
    warnings.push(
      'ALCHEMY_*_RPC_URL not configured - wallet signals will be null (degraded personalization)'
    );
  }

  // DeFiLlama (defaults to public API)
  const defiLlamaUrl = process.env.DEFILLAMA_API_URL || 'https://yields.llama.fi';
  if (!process.env.DEFILLAMA_API_URL) {
    info.push(`DEFILLAMA_API_URL not set, using default: ${defiLlamaUrl}`);
  }

  // Phase 2 Optional Variables
  const layer3Key = process.env.LAYER3_API_KEY;
  const galxeKey = process.env.GALXE_API_KEY;
  const zealyKey = process.env.ZEALY_API_KEY;
  const questnKey = process.env.QUESTN_API_KEY;

  const hasPhase2Apis = !!(layer3Key || galxeKey || zealyKey || questnKey);

  if (!hasPhase2Apis) {
    info.push(
      'Phase 2 APIs not configured (Layer3, Galxe, Zealy, QuestN) - using admin seed data for Airdrops, Quests, Points'
    );
  }

  // Phase 3 Optional Variables
  const debankKey = process.env.DEBANK_API_KEY;
  const rwaKey = process.env.RWA_API_KEY;
  const defiLlamaProKey = process.env.DEFILLAMA_PRO_API_KEY;

  const hasPhase3Apis = !!(debankKey || rwaKey || defiLlamaProKey);

  if (!hasPhase3Apis) {
    info.push(
      'Phase 3 APIs not configured (DeBank, RWA.xyz, DeFiLlama Pro) - using free tiers and admin seeds'
    );
  }

  // Determine phase
  let phase: 1 | 2 | 3 = 1;
  if (hasPhase3Apis) {
    phase = 3;
  } else if (hasPhase2Apis) {
    phase = 2;
  }

  // Determine capabilities
  const capabilities = {
    yieldModule: !!defiLlamaUrl, // Always true (public API)
    walletSignals: hasAlchemyTransfers && hasAlchemyRpc,
    airdropsModule: true, // Admin seeds always available
    questsModule: true, // Admin seeds always available
    pointsModule: true, // Admin seeds always available
    rwaModule: true, // Admin seeds always available
    strategiesModule: true, // Internal system
    referralsModule: true, // Internal system
  };

  const isValid = errors.length === 0;

  return {
    phase,
    isValid,
    capabilities,
    warnings,
    errors,
    info,
  };
}

/**
 * Logs environment validation results
 * Should be called once at application startup (server-side only)
 */
export function logEnvValidation(): void {
  const result = validateHunterEnv();

  console.log('\n========================================');
  console.log('Hunter Demand-Side Environment Validation');
  console.log('========================================\n');

  console.log(`Phase: ${result.phase}`);
  console.log(`Valid: ${result.isValid ? '✅' : '❌'}\n`);

  console.log('Capabilities:');
  Object.entries(result.capabilities).forEach(([key, value]) => {
    console.log(`  ${value ? '✅' : '❌'} ${key}`);
  });
  console.log('');

  if (result.errors.length > 0) {
    console.error('❌ Errors:');
    result.errors.forEach((error) => console.error(`  - ${error}`));
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Warnings:');
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
    console.log('');
  }

  if (result.info.length > 0) {
    console.info('ℹ️  Info:');
    result.info.forEach((info) => console.info(`  - ${info}`));
    console.log('');
  }

  console.log('========================================\n');

  if (!result.isValid) {
    throw new Error('Hunter environment validation failed. Check errors above.');
  }
}

/**
 * Gets current phase indicator
 */
export function getHunterPhase(): 1 | 2 | 3 {
  return validateHunterEnv().phase;
}

/**
 * Checks if a specific capability is available
 */
export function hasCapability(capability: keyof EnvValidationResult['capabilities']): boolean {
  return validateHunterEnv().capabilities[capability];
}
