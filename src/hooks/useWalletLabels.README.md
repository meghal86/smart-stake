# useWalletLabels Hook

Manages user-defined labels for wallet addresses in the Hunter Screen.

## Overview

The `useWalletLabels` hook provides functionality to create, read, update, and delete custom labels for wallet addresses. Labels are stored in the `user_preferences.wallet_labels` JSONB column and are protected by Row Level Security (RLS) to ensure users can only access their own labels.

## Features

- ✅ Get label for a specific wallet address
- ✅ Set/update label for a wallet address
- ✅ Remove label for a wallet address
- ✅ Get all wallet labels
- ✅ Optimistic updates with React Query
- ✅ RLS enforcement (users can only access their own labels)
- ✅ Address normalization (lowercase)
- ✅ Automatic caching (5 minute stale time)

## Usage

### Basic Usage

```typescript
import { useWalletLabels } from '@/hooks/useWalletLabels';

function MyComponent() {
  const { 
    labels, 
    getLabel, 
    setLabel, 
    removeLabel,
    isLoading,
    isSettingLabel,
    isRemovingLabel 
  } = useWalletLabels();

  // Get all labels
  console.log(labels); // { "0x1234...": "My Main Wallet", "0x5678...": "Trading Wallet" }

  // Get label for specific address
  const label = getLabel('0x1234567890abcdef1234567890abcdef12345678');
  console.log(label); // "My Main Wallet"

  // Set label
  const handleSetLabel = () => {
    setLabel('0x1234567890abcdef1234567890abcdef12345678', 'My New Label');
  };

  // Remove label
  const handleRemoveLabel = () => {
    removeLabel('0x1234567890abcdef1234567890abcdef12345678');
  };

  return (
    <div>
      {isLoading && <p>Loading labels...</p>}
      {isSettingLabel && <p>Saving label...</p>}
      {/* Your UI here */}
    </div>
  );
}
```

### Integration with WalletContext

The `WalletContext` automatically syncs wallet labels from user preferences:

```typescript
import { useWallet } from '@/contexts/WalletContext';

function MyComponent() {
  const { connectedWallets } = useWallet();

  return (
    <div>
      {connectedWallets.map(wallet => (
        <div key={wallet.address}>
          {/* Label is automatically populated from user preferences */}
          <p>{wallet.label || wallet.address}</p>
        </div>
      ))}
    </div>
  );
}
```

### Using WalletLabelEditor Component

The `WalletLabelEditor` component provides a pre-built UI for editing wallet labels:

```typescript
import { WalletLabelEditor } from '@/components/hunter/WalletLabelEditor';

function MyComponent() {
  const wallet = {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    label: 'My Wallet',
  };

  return (
    <WalletLabelEditor
      address={wallet.address}
      currentLabel={wallet.label}
      onSave={() => console.log('Label saved')}
      onCancel={() => console.log('Edit canceled')}
    />
  );
}
```

## API Reference

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `labels` | `WalletLabels` | Object mapping wallet addresses to labels |
| `isLoading` | `boolean` | Whether labels are being fetched |
| `error` | `Error \| null` | Error if fetch failed |
| `getLabel` | `(address: string) => string \| undefined` | Get label for specific address |
| `setLabel` | `(address: string, label: string) => void` | Set label for address |
| `removeLabel` | `(address: string) => void` | Remove label for address |
| `isSettingLabel` | `boolean` | Whether a label is being saved |
| `isRemovingLabel` | `boolean` | Whether a label is being removed |

### Types

```typescript
export interface WalletLabels {
  [address: string]: string;
}

export interface WalletLabelUpdate {
  address: string;
  label: string;
}
```

## Database Schema

Labels are stored in the `user_preferences` table:

```sql
ALTER TABLE user_preferences 
ADD COLUMN wallet_labels JSONB DEFAULT '{}';

-- Example data:
-- {
--   "0x1234567890abcdef1234567890abcdef12345678": "My Main Wallet",
--   "0xabcdef1234567890abcdef1234567890abcdef12": "Trading Wallet"
-- }
```

## Row Level Security (RLS)

The hook enforces RLS policies to ensure users can only access their own labels:

```sql
-- Users can only read their own preferences
CREATE POLICY p_sel_user_prefs ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own preferences
CREATE POLICY p_ins_user_prefs ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own preferences
CREATE POLICY p_upd_user_prefs ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);
```

## Caching Strategy

- **Stale Time**: 5 minutes
- **Cache Time**: 10 minutes
- **Optimistic Updates**: Yes
- **Automatic Refetch**: On window focus, reconnect

## Address Normalization

All wallet addresses are normalized to lowercase before storage and retrieval to ensure consistency:

```typescript
// These will access the same label:
getLabel('0x1234567890abcdef1234567890abcdef12345678');
getLabel('0X1234567890ABCDEF1234567890ABCDEF12345678');
```

## Error Handling

The hook handles errors gracefully:

- **No user preferences**: Returns empty object `{}`
- **Not authenticated**: Returns empty object `{}`
- **Database error**: Throws error (caught by React Query)
- **Optimistic update failure**: Rolls back to previous state

## Testing

See `src/__tests__/hooks/useWalletLabels.test.tsx` for comprehensive test coverage.

## Requirements

- ✅ Requirement 18.18: Display labels in WalletSelector
- ✅ Task 51: Add Wallet Labels Management

## Related Files

- `src/hooks/useWalletLabels.ts` - Hook implementation
- `src/components/hunter/WalletLabelEditor.tsx` - UI component for editing labels
- `src/contexts/WalletContext.tsx` - Wallet context integration
- `supabase/migrations/20250105000000_add_wallet_labels.sql` - Database migration
- `src/__tests__/hooks/useWalletLabels.test.tsx` - Tests

