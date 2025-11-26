# HarvestPro CSV Export

Form 8949-compatible CSV export generation for tax-loss harvesting records.

## Overview

The CSV export system generates IRS Form 8949-compatible CSV files from completed harvest sessions. These files can be imported into tax software or provided to tax preparers.

## Features

- ✅ Form 8949 compatible format
- ✅ All required columns (description, dates, proceeds, cost basis, gain/loss)
- ✅ Monetary values formatted with exactly 2 decimal places
- ✅ One row per harvested lot
- ✅ Compatible with Excel, Google Sheets, Numbers
- ✅ Proper CSV escaping for special characters
- ✅ Fast generation (<2 seconds)

## Usage

### API Endpoint

```typescript
GET /api/harvest/sessions/:id/export
```

**Authentication**: Required  
**Session Status**: Must be 'completed'

**Response**:
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="harvest-{sessionId}-form8949.csv"
```

### Programmatic Usage

```typescript
import { generateForm8949CSV } from '@/lib/harvestpro/csv-export';

// Generate CSV from completed session
const session = await getHarvestSession(sessionId, userId);
const csv = generateForm8949CSV(session);

// Download in browser
const blob = new Blob([csv], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `harvest-${sessionId.slice(0, 8)}-form8949.csv`;
a.click();
```

## CSV Format

### Columns

1. **Description**: Quantity and token symbol (e.g., "0.12345678 BTC")
2. **Date Acquired**: ISO 8601 date (YYYY-MM-DD)
3. **Date Sold**: ISO 8601 date (YYYY-MM-DD)
4. **Proceeds**: Sale price in USD (2 decimal places)
5. **Cost Basis**: Purchase price in USD (2 decimal places)
6. **Gain or Loss**: Net gain/loss in USD (2 decimal places, negative for losses)

### Example

```csv
Description,Date Acquired,Date Sold,Proceeds,Cost Basis,Gain or Loss
0.12345678 BTC,2023-01-15,2024-11-19,1234.56,1500.00,-265.44
1.50000000 ETH,2023-03-20,2024-11-19,2800.00,3200.00,-400.00
100.00000000 USDC,2023-06-10,2024-11-19,98.50,100.00,-1.50
```

## Functions

### `formatMonetaryValue(value: number): string`

Formats a monetary value with exactly 2 decimal places.

```typescript
formatMonetaryValue(1234.5678); // "1234.57"
formatMonetaryValue(-265.444);  // "-265.44"
```

### `generateForm8949CSV(session: HarvestSession): string`

Generates Form 8949-compatible CSV from a completed harvest session.

```typescript
const csv = generateForm8949CSV(session);
// Returns: "Description,Date Acquired,Date Sold,Proceeds,Cost Basis,Gain or Loss\n..."
```

### `sessionToHarvestedLots(session: HarvestSession): HarvestedLotForExport[]`

Converts harvest session data to exportable lot format.

```typescript
const lots = sessionToHarvestedLots(session);
// Returns array of lots with all required fields
```

## Error Handling

### API Errors

```typescript
// 401 Unauthorized
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}

// 404 Not Found
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Harvest session not found"
  }
}

// 400 Bad Request
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Can only export completed harvest sessions"
  }
}

// 500 Internal Server Error
{
  "error": {
    "code": "INTERNAL",
    "message": "Failed to generate CSV export"
  }
}
```

## Performance

- **Target**: <2 seconds for CSV generation
- **Monitoring**: Warnings logged if generation exceeds 2 seconds
- **Caching**: API responses cached for 1 hour

## Testing

Comprehensive property-based tests ensure correctness:

```bash
npm run test -- src/lib/harvestpro/__tests__/csv-export.test.ts --run
```

### Test Coverage

- ✅ Property 10: CSV Export Completeness (100 iterations)
- ✅ Property 11: Monetary Value Formatting (100 iterations)
- ✅ Round-trip parsing validation
- ✅ Special character escaping
- ✅ Empty data handling
- ✅ Session to lots conversion

## Integration

### With Success Screen

```typescript
import { HarvestSuccessScreen } from '@/components/harvestpro/HarvestSuccessScreen';

<HarvestSuccessScreen
  sessionId={sessionId}
  onDownloadCSV={() => {
    window.location.href = `/api/harvest/sessions/${sessionId}/export`;
  }}
/>
```

### With React Query

```typescript
import { useQuery } from '@tanstack/react-query';

function useCSVExport(sessionId: string) {
  return useQuery({
    queryKey: ['harvest-csv', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/harvest/sessions/${sessionId}/export`);
      if (!response.ok) throw new Error('Failed to generate CSV');
      return response.text();
    },
    enabled: false, // Only fetch when explicitly triggered
  });
}
```

## Requirements

Implements the following requirements:

- **11.1**: Generate CSV file within 2 seconds ✅
- **11.2**: Include all required columns ✅
- **11.3**: Format monetary values with 2 decimal places ✅
- **11.4**: Include a row for each harvested lot ✅
- **11.5**: Ensure compatibility with Excel, Google Sheets, Numbers ✅

## Related Files

- `src/lib/harvestpro/csv-export.ts` - Core export logic
- `src/app/api/harvest/sessions/[id]/export/route.ts` - API endpoint
- `src/lib/harvestpro/__tests__/csv-export.test.ts` - Property-based tests
- `src/types/harvestpro.ts` - Type definitions

## Future Enhancements

- PDF export generation
- Email delivery of CSV files
- Multi-year export support
- Custom column selection
- International tax form formats
