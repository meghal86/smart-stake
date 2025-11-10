# Hunter Screen - Save/Share/Report Actions

This document describes the implementation of save, share, and report functionality for the Hunter Screen.

## Overview

The Hunter Screen provides three key actions for each opportunity:
- **Save**: Bookmark opportunities for later viewing
- **Share**: Generate shareable links with social metadata
- **Report**: Flag problematic opportunities with abuse prevention

## Components

### OpportunityActions

Main component that renders action buttons for opportunities.

```tsx
import { OpportunityActions } from '@/components/hunter/OpportunityActions';

<OpportunityActions
  opportunityId="123e4567-e89b-12d3-a456-426614174000"
  opportunityTitle="Example Opportunity"
  opportunitySlug="example-opportunity"
  isSaved={false}
  onSaveToggle={(saved) => console.log('Saved:', saved)}
  compact={false}
/>
```

**Props:**
- `opportunityId`: UUID of the opportunity
- `opportunityTitle`: Display title for modals/toasts
- `opportunitySlug`: URL slug for sharing
- `isSaved`: Initial saved state (optional)
- `onSaveToggle`: Callback when save state changes (optional)
- `compact`: Use icon-only buttons (optional)

### ReportModal

Modal for reporting opportunities with abuse categories.

```tsx
import { ReportModal } from '@/components/hunter/ReportModal';

<ReportModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  opportunityId="123e4567-e89b-12d3-a456-426614174000"
  opportunityTitle="Example Opportunity"
/>
```

**Report Categories:**
- `phishing`: Malicious or suspicious links
- `impersonation`: Fake protocol impersonation
- `reward_not_paid`: Completed but reward not received
- `scam`: General scam or fraud
- `other`: Other issues

## API Endpoints

### POST /api/hunter/save

Save an opportunity to user's collection.

**Request:**
```json
{
  "opportunity_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response:**
```json
{
  "success": true,
  "saved_at": "2025-01-04T12:00:00Z",
  "opportunity": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Example Opportunity"
  }
}
```

**Rate Limit:** 60 requests/hour per user

### DELETE /api/hunter/save

Remove an opportunity from user's collection.

**Query Parameters:**
- `opportunity_id`: UUID of opportunity to unsave

**Response:**
```json
{
  "success": true
}
```

### GET /api/hunter/share

Generate shareable link and metadata for an opportunity.

**Query Parameters:**
- `opportunity_id`: UUID of opportunity to share

**Response:**
```json
{
  "url": "https://alphawhale.com/hunter/example-opportunity",
  "text": "Check out this airdrop opportunity: Example by Protocol. 100-500 USD",
  "opportunity": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "slug": "example-opportunity",
    "title": "Example Opportunity",
    "protocol_name": "Protocol",
    "protocol_logo": "https://example.com/logo.png",
    "type": "airdrop",
    "trust_level": "green"
  },
  "meta": {
    "og_title": "Example Opportunity - Protocol",
    "og_description": "Check out this airdrop opportunity...",
    "og_image": "https://example.com/logo.png",
    "og_url": "https://alphawhale.com/hunter/example-opportunity",
    "twitter_card": "summary_large_image",
    "twitter_title": "Example Opportunity - Protocol",
    "twitter_description": "Check out this airdrop opportunity...",
    "twitter_image": "https://example.com/logo.png"
  }
}
```

### POST /api/hunter/report

Submit an abuse report for an opportunity.

**Headers:**
- `Idempotency-Key`: Unique key to prevent duplicate submissions

**Request:**
```json
{
  "opportunity_id": "123e4567-e89b-12d3-a456-426614174000",
  "category": "phishing",
  "description": "This looks like a phishing attempt"
}
```

**Response:**
```json
{
  "success": true,
  "report_id": "456e7890-e89b-12d3-a456-426614174000",
  "status": "pending"
}
```

**Rate Limits:**
- Per-opportunity: 3 reports/minute
- Per-account: Cooldown between reports

## Hooks

### useSavedOpportunities

Hook for managing saved opportunities with realtime updates.

```tsx
import { useSavedOpportunities } from '@/hooks/useSavedOpportunities';

function MyComponent() {
  const {
    savedOpportunities,
    savedIds,
    isLoading,
    error,
    isSaved,
    addToSaved,
    removeFromSaved,
    refresh,
  } = useSavedOpportunities();

  return (
    <div>
      {savedOpportunities.map(saved => (
        <div key={saved.id}>
          {saved.opportunity?.title}
        </div>
      ))}
    </div>
  );
}
```

**Returns:**
- `savedOpportunities`: Array of saved opportunities with details
- `savedIds`: Set of saved opportunity IDs for quick lookup
- `isLoading`: Loading state
- `error`: Error object if fetch failed
- `isSaved(id)`: Check if opportunity is saved
- `addToSaved(id)`: Optimistically add to saved list
- `removeFromSaved(id)`: Optimistically remove from saved list
- `refresh()`: Manually refresh saved list

## Features

### Save Functionality

**Persistence:**
- Saves are stored in `saved_opportunities` table
- Persists across sessions and devices
- Syncs in realtime via Supabase subscriptions

**Rate Limiting:**
- 60 saves per hour per user
- Prevents abuse and spam

**Optimistic Updates:**
- UI updates immediately before API response
- Reverts on error with toast notification

### Share Functionality

**Native Share API:**
- Uses `navigator.share()` on mobile devices
- Falls back to clipboard copy on desktop

**Social Metadata:**
- Generates Open Graph tags for rich previews
- Includes Twitter Card metadata
- Protocol logo as share image

**Share Text:**
- Includes opportunity title, protocol, and reward
- Formatted for readability

### Report Functionality

**Abuse Prevention:**
- Idempotency keys prevent duplicate submissions
- Per-opportunity rate limiting (3/min)
- Per-account cooldown between reports

**Auto-Quarantine:**
- Automatically quarantines opportunities with ≥5 unique reports in 1 hour
- Counts unique reporters (by user_id or IP)
- Triggers database function on report insert

**Report Categories:**
- Structured categories for better moderation
- Optional description field for context
- All reports reviewed by moderation team

## Database Schema

### saved_opportunities

```sql
CREATE TABLE saved_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, opportunity_id)
);
```

### report_events

```sql
CREATE TABLE report_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idempotency_key TEXT NOT NULL UNIQUE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_ip TEXT,
  category report_category NOT NULL,
  description TEXT,
  status report_status NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security

### Authentication

- Save/unsave requires authentication
- Report can be submitted anonymously (tracked by IP)
- Share is public (no auth required)

### Rate Limiting

- Implemented via Upstash Rate Limit
- Different limits for different actions
- Returns 429 with Retry-After header

### Input Validation

- All inputs validated with Zod schemas
- UUIDs validated for format
- Description limited to 1000 characters

### RLS Policies

- Users can only view/modify their own saved opportunities
- Reports are write-only from client
- Service role can access all data

## Testing

### Unit Tests

```bash
npm test src/__tests__/api/hunter-save.test.ts
npm test src/__tests__/api/hunter-share.test.ts
npm test src/__tests__/components/hunter/OpportunityActions.test.tsx
```

### Integration Tests

```bash
npm test src/__tests__/api/hunter-save.integration.test.ts
npm test src/__tests__/api/hunter-report.integration.test.ts
```

**Test Coverage:**
- ✅ Save persists across sessions
- ✅ Rate limiting prevents abuse
- ✅ Idempotency prevents duplicates
- ✅ Auto-quarantine after 5 reports
- ✅ Share generates correct metadata
- ✅ Report flood control works

## Error Handling

### Common Errors

**401 Unauthorized:**
- User not authenticated for save/unsave
- Show "Please sign in" toast

**404 Not Found:**
- Opportunity doesn't exist
- Show "Opportunity not found" toast

**429 Rate Limited:**
- Too many requests
- Show retry time in toast
- Respect Retry-After header

**500 Internal Error:**
- Server error
- Show generic error toast
- Log to monitoring service

## Monitoring

### Metrics to Track

- Save rate per user
- Share click-through rate
- Report submission rate
- Auto-quarantine frequency
- Rate limit hit rate

### Alerts

- High report rate (potential attack)
- Auto-quarantine triggered
- Rate limit exceeded frequently
- API error rate > 1%

## Future Enhancements

- [ ] Saved opportunity collections/folders
- [ ] Share to specific platforms (Twitter, Discord)
- [ ] Report status tracking for users
- [ ] Bulk save/unsave operations
- [ ] Export saved opportunities
- [ ] Report appeal process
- [ ] Moderator dashboard for reports

## Requirements Satisfied

- ✅ 5.8: Action buttons (save, share, report)
- ✅ 11.4: Rate limiting for save operations
- ✅ 11.9: Report categories and idempotency
- ✅ 11.10: Auto-quarantine (≥5 unique reporters in 1h)
