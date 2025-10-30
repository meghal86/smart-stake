# Guardian Automation - Next Steps

## ❌ Current Issues:
1. Invalid Supabase service role key
2. Invalid anon key for edge functions

## ✅ What You Need To Do:

### 1. Get Real Supabase Keys
- Go to https://supabase.com/dashboard/project/rebeznxivaxgserswhbn/settings/api
- Copy the **service_role** key (secret)
- Copy the **anon** key (public)

### 2. Update .env.local
Replace these lines in your .env.local:
```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_real_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_real_service_role_key_here
```

### 3. Test Again
```bash
# Test database
node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const { data, error } = await supabase.from('guardian_automations').select('count');
console.log('DB Test:', error ? 'FAILED: ' + error.message : 'SUCCESS');
"

# Start relayer
cd services/guardian-relayer
npm start

# Test edge function
curl -X POST "https://rebeznxivaxgserswhbn.supabase.co/functions/v1/guardian-automation-propose" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### 4. Add to Guardian Page
Once working, add this to your Guardian component:
```tsx
import { GuardianAutomationPanel } from '@/components/guardian/GuardianAutomationPanel';

// In your Guardian page
<GuardianAutomationPanel />
```

## 🔧 Optional: Add Real Blockchain Keys
For production automation:
- Get Infura/Alchemy RPC URL
- Create relayer wallet with ETH
- Update RPC_URL and RELAYER_PRIVATE_KEY in .env.local