# Guardian Automation - Demo Mode Setup

## What Works in Demo Mode:
- ✅ Complete UI/UX flow
- ✅ Database operations
- ✅ Policy configuration
- ✅ Activity logging
- ✅ Edge function integration
- ❌ Actual blockchain transactions (shows "demo" status)

## Quick Setup (5 minutes):

### 1. Get Supabase Service Role Key
- Go to: https://supabase.com/dashboard/project/rebeznxivaxgserswhbn/settings/api
- Copy the **service_role** key
- Replace `SERVICE_ROLE_KEY_NEEDED` in `.env.local`

### 2. Add to Guardian Page
```tsx
// In your Guardian component
import { GuardianAutomationPanel } from '@/components/guardian/GuardianAutomationPanel';

export function GuardianPage() {
  return (
    <div>
      {/* Your existing Guardian content */}
      
      <GuardianAutomationPanel />
    </div>
  );
}
```

### 3. Test Demo
```bash
# Start your app
npm run dev

# Visit Guardian page
# Click "Enable Automation"
# Configure settings
# View activity feed
```

## Demo Features:
- **Migration Modal**: Simulates smart wallet deployment
- **Settings Panel**: Configure trust score thresholds
- **Activity Feed**: Shows automation logs (demo entries)
- **Status Indicators**: Real-time automation status

## What Users See:
- Professional automation interface
- Policy configuration options
- Activity history and logs
- Status: "Demo Mode" or "Active (Demo)"

## Later: Enable Real Transactions
When ready for production:
1. Follow `GUARDIAN_AUTOMATION_ROADMAP.md`
2. Fund relayer wallet
3. Deploy smart contracts
4. Update configuration
5. Remove demo mode flags