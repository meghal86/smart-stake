# Portfolio System Logger

## Overview

The Portfolio Logger provides privacy-preserving logging for the Unified Portfolio System. It automatically redacts sensitive data (wallet addresses, transaction hashes) to comply with privacy requirements R12.5-R12.7.

## Quick Start

```typescript
import { portfolioLogger, logWalletOperation } from '@/lib/portfolio/logger';

// Simple logging with automatic address redaction
logWalletOperation('snapshot_created', {
  userId: user.id,
  walletAddress: '0x1234...', // Automatically converted to hash
  netWorth: 50000,
});

// Using the logger directly
portfolioLogger.info('Processing portfolio', {
  userId: user.id,
  walletAddress: wallet.address, // Auto-redacted
  scopeMode: 'active_wallet',
});
```

## Features

- **Automatic Redaction**: Wallet addresses, token addresses, spender addresses automatically converted to hashes
- **Transaction Hash Truncation**: Transaction hashes truncated to first 10 characters
- **Child Loggers**: Create contextual loggers with inherited context
- **Audit Logging**: Special audit logs for security events
- **Debug Mode**: Optional raw address logging for development (NEVER in production)

## API Reference

### PortfolioLogger Class

```typescript
const logger = new PortfolioLogger({
  userId: 'user-123',
  service: 'portfolio',
});

// Log levels
logger.debug('Debug message', context);  // Development only
logger.info('Info message', context);
logger.warn('Warning message', context);
logger.error('Error message', error, context);
logger.audit('event_type', context);     // Always logged

// Child logger
const childLogger = logger.child({ planId: 'plan-456' });
childLogger.info('Step executing'); // Inherits parent context
```

### Utility Functions

```typescript
// Log wallet operations
logWalletOperation('snapshot_created', {
  userId: user.id,
  walletAddress: wallet.address,
  netWorth: 50000,
});

// Log plan execution
logPlanExecution(
  'plan-123',
  'step-456',
  'executing',
  { userId: 'user-789' }
);

// Log security events
logSecurityEvent('payload_mismatch_blocked', 'critical', {
  planId: 'plan-123',
  walletAddress: wallet.address,
  reason: 'Simulation receipt differs',
});

// Safe address formatting for error messages
const formatted = safeFormatAddress(wallet.address);
throw new Error(`Invalid wallet: ${formatted}`);

// Check if debug mode is enabled
if (isDebugRawAddressesEnabled()) {
  // Debug-only code
}
```

### Hash Function

```typescript
import { hashAddress } from '@/lib/portfolio/logger';

// Generate consistent hash for an address
const hash = hashAddress('0x1234567890abcdef');
// Returns: 'a1b2c3d4e5f6g7h8' (first 16 chars of SHA-256)
```

## Automatic Redaction

The logger automatically redacts these fields:

| Original Field | Redacted To | Notes |
|---------------|-------------|-------|
| `walletAddress` | `walletAddressHash` | SHA-256 hash (16 chars) |
| `address` | `addressHash` | SHA-256 hash (16 chars) |
| `spenderAddress` | `spenderAddressHash` | SHA-256 hash (16 chars) |
| `tokenAddress` | `tokenAddressHash` | SHA-256 hash (16 chars) |
| `targetAddress` | `targetAddressHash` | SHA-256 hash (16 chars) |
| `transactionHash` | `transactionHashPrefix` | First 10 characters only |

## Log Output Format

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "message": "Wallet operation: snapshot_created",
  "userId": "uuid-here",
  "walletAddressHash": "a1b2c3d4e5f6g7h8",
  "netWorth": 50000,
  "service": "unified-portfolio"
}
```

## Debug Mode

**WARNING: NEVER enable debug mode in production!**

Debug mode can be enabled in development to include raw addresses in logs:

```bash
# .env.local (development only)
DEBUG_RAW_ADDRESSES=true
```

When enabled, logs include raw addresses with a warning:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "message": "Wallet operation: snapshot_created",
  "walletAddressHash": "a1b2c3d4e5f6g7h8",
  "_debug_raw_address": "0x1234567890abcdef",
  "_debug_warning": "RAW ADDRESS LOGGING ENABLED - DO NOT USE IN PRODUCTION"
}
```

## Best Practices

### ✅ DO

```typescript
// Use the logger for all wallet-related operations
import { portfolioLogger } from '@/lib/portfolio/logger';

portfolioLogger.info('Processing snapshot', {
  userId: user.id,
  walletAddress: wallet.address, // Auto-redacted
  scopeMode: 'active_wallet',
});

// Use child loggers for contextual logging
const planLogger = portfolioLogger.child({
  planId: plan.id,
  userId: user.id,
});

planLogger.info('Step executing', {
  stepId: step.id,
  walletAddress: wallet.address, // Auto-redacted
});

// Use audit logging for security events
import { logSecurityEvent } from '@/lib/portfolio/logger';

logSecurityEvent('payload_mismatch_blocked', 'critical', {
  planId: plan.id,
  walletAddress: wallet.address, // Auto-redacted
  reason: 'Simulation receipt differs',
});

// Use safe formatting for error messages
import { safeFormatAddress } from '@/lib/portfolio/logger';
throw new Error(`Invalid wallet: ${safeFormatAddress(wallet.address)}`);
```

### ❌ DON'T

```typescript
// NEVER use console.log/console.error directly with addresses
console.log('User wallet:', wallet.address); // FORBIDDEN

// NEVER include raw addresses in error messages
throw new Error(`Invalid wallet: ${wallet.address}`); // FORBIDDEN

// NEVER log raw addresses in production
if (process.env.NODE_ENV === 'production') {
  console.log('Address:', wallet.address); // FORBIDDEN
}

// NEVER bypass the logger for wallet operations
fetch('/api/log', {
  body: JSON.stringify({
    address: wallet.address // FORBIDDEN
  })
});
```

## Testing

The logger includes comprehensive unit tests:

```bash
npm test -- src/lib/portfolio/__tests__/logger.test.ts
```

Tests cover:
- Hash consistency and normalization
- Automatic redaction of all address fields
- Transaction hash truncation
- Child logger context inheritance
- Debug mode behavior
- Utility function correctness

## Integration with Existing Code

### Replacing console.log

```typescript
// Before
console.log('Snapshot created for', wallet.address);

// After
import { portfolioLogger } from '@/lib/portfolio/logger';
portfolioLogger.info('Snapshot created', {
  walletAddress: wallet.address, // Auto-redacted
});
```

### Error Handling

```typescript
// Before
try {
  await processWallet(wallet);
} catch (error) {
  console.error('Failed to process wallet', wallet.address, error);
}

// After
import { portfolioLogger } from '@/lib/portfolio/logger';
try {
  await processWallet(wallet);
} catch (error) {
  portfolioLogger.error('Failed to process wallet', error, {
    walletAddress: wallet.address, // Auto-redacted
  });
}
```

### API Responses

```typescript
// Before
return NextResponse.json({
  success: true,
  wallet: {
    address: wallet.address, // Exposed!
  },
});

// After
import { hashAddress } from '@/lib/portfolio/logger';
return NextResponse.json({
  success: true,
  wallet: {
    addressHash: hashAddress(wallet.address), // Privacy-preserving
  },
});
```

## Compliance

The logger ensures compliance with:

- **R12.5**: Wallet-user linkage protection via address hashing
- **R12.6**: No raw addresses in logs (production)
- **R12.7**: PolicyEngineConfig stored securely in cockpit_state.prefs

## Monitoring

Monitor for compliance violations:

```bash
# Check for raw addresses in logs (should return 0 in production)
grep -E '0x[a-fA-F0-9]{40}' /var/log/portfolio.log | wc -l

# Check for debug warnings (should return 0 in production)
grep 'RAW ADDRESS LOGGING ENABLED' /var/log/portfolio.log | wc -l

# Verify address hashes are present
grep 'walletAddressHash' /var/log/portfolio.log | wc -l
```

## Related Documentation

- [Privacy Model Documentation](../../../.kiro/specs/unified-portfolio/PRIVACY_MODEL.md)
- [Database Schema](../../../supabase/migrations/20260123000001_unified_portfolio_schema.sql)
- [Logging Rules Migration](../../../supabase/migrations/20260214000000_privacy_logging_rules.sql)

## Support

For questions or issues with the logger:

1. Check the [Privacy Model Documentation](../../../.kiro/specs/unified-portfolio/PRIVACY_MODEL.md)
2. Review the [unit tests](../__tests__/logger.test.ts) for usage examples
3. Ensure DEBUG_RAW_ADDRESSES is not enabled in production

## License

This logger is part of the AlphaWhale Unified Portfolio System and follows the same license as the main project.
