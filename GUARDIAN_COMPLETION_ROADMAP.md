# 🛡️ Guardian Completion Roadmap
## Path to 100% Production-Ready

**Current Status:** 67% Complete (10/15 ✅)  
**UX Grade:** A+ (98/100) — World-Class  
**Functionality Grade:** C (60/100) — Needs Work  

**Target:** 100% Production Launch in **4-5 days**

---

## 📊 **Remaining Items Overview**

| Priority | Item | Status | Effort | Dependency |
|----------|------|--------|--------|------------|
| 🔴 **CRITICAL** | Real Wallet Connection | ❌ Mock only | 4 hours | Wagmi installed |
| 🔴 **CRITICAL** | Live Data Probes | ❌ Stub functions | 2 days | API keys ready |
| 🔴 **CRITICAL** | Error Handling UI | ❌ Missing | 2 hours | None |
| 🟡 **HIGH** | Fix-Risks Modal Wiring | ⚠️ Partial | 1 hour | Item #1 |
| 🟡 **HIGH** | Accessibility Port | ⚠️ Partial | 30 min | None |
| 🟢 **MEDIUM** | Performance Audit | ⚠️ Untested | 15 min | None |
| 🟢 **MEDIUM** | Security Verification | ⚠️ Partial | 2 hours | None |

**Total Estimated Time:** 4-5 days

---

## 🚀 **PHASE 1: CRITICAL PATH (2-3 days)**

### **Day 1: Real Wallet Connection** 🔴

**Goal:** Replace mock wallet with Wagmi + RainbowKit

#### **Tasks:**

**1.1 Install/Verify Dependencies** (15 min)
```bash
# Check if already installed
npm list wagmi viem @rainbow-me/rainbowkit

# If missing:
npm install wagmi viem @tanstack/react-query
npm install @rainbow-me/rainbowkit
```

**1.2 Configure Wagmi** (30 min)
Create: `src/config/wagmi.ts`
```typescript
import { createConfig, http } from 'wagmi';
import { mainnet, base, polygon, arbitrum } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, base, polygon, arbitrum],
  connectors: [
    injected(),
    walletConnect({ projectId: process.env.VITE_WALLETCONNECT_PROJECT_ID! }),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
  },
});
```

**1.3 Wrap App with Wagmi Provider** (15 min)
Update: `src/App.tsx`
```typescript
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from './config/wagmi';

const queryClient = new QueryClient();

// Wrap your app:
<WagmiProvider config={config}>
  <QueryClientProvider client={queryClient}>
    <RainbowKitProvider>
      {/* existing providers */}
    </RainbowKitProvider>
  </QueryClientProvider>
</WagmiProvider>
```

**1.4 Replace useMockWallet in GuardianUX2Pure** (30 min)
```typescript
// Remove:
// const { address, isConnected, connect } = useMockWallet();

// Add:
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

const { address, isConnected } = useAccount();
const { openConnectModal } = useConnectModal();

// Update connect button:
onClick={openConnectModal}
```

**1.5 Test Wallet Connection** (30 min)
- [ ] MetaMask connects
- [ ] Coinbase Wallet connects
- [ ] WalletConnect works
- [ ] Address displays correctly
- [ ] Disconnect/reconnect works

**Acceptance Criteria:**
- ✅ Real wallet addresses display
- ✅ Multiple wallet types supported
- ✅ State persists on refresh
- ✅ No mock data

**Estimated Time:** 2-3 hours

---

### **Day 2: Live Data Probes** 🔴

**Goal:** Replace stub functions with real blockchain API calls

#### **2.1 ERC20 Approvals (Alchemy)** (4 hours)

**File:** `supabase/functions/guardian-scan-v2/index.ts`

```typescript
async function probeApprovals(address: string, network: string) {
  const alchemyKey = Deno.env.get('ALCHEMY_API_KEY');
  const alchemyUrl = `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`;
  
  try {
    // Get token balances with metadata
    const balancesRes = await fetch(alchemyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getTokenBalances',
        params: [address, 'erc20'],
      }),
    });
    
    const balancesData = await balancesRes.json();
    const tokens = balancesData.result.tokenBalances;
    
    // For each token, check allowances
    const approvals = [];
    for (const token of tokens.slice(0, 10)) { // Limit to 10 tokens
      const allowanceRes = await fetch(alchemyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{
            to: token.contractAddress,
            data: `0xdd62ed3e${address.slice(2).padStart(64, '0')}${KNOWN_SPENDERS[0].slice(2).padStart(64, '0')}`,
          }, 'latest'],
        }),
      });
      
      const allowanceData = await allowanceRes.json();
      if (allowanceData.result !== '0x0') {
        approvals.push({
          token: token.contractAddress,
          spender: KNOWN_SPENDERS[0],
          amount: allowanceData.result,
          symbol: token.symbol || 'UNKNOWN',
        });
      }
    }
    
    return {
      error: false,
      data: { approvals, count: approvals.length },
      evidence: { approvals, checkedAt: new Date().toISOString() },
    };
  } catch (error) {
    return {
      error: true,
      data: { approvals: [], count: 0 },
      evidence: { error: error.message },
    };
  }
}
```

**Known Spenders to Check:**
```typescript
const KNOWN_SPENDERS = [
  '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // Uniswap V3 Router
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
  '0xDef1C0ded9bec7F1a1670819833240f027b25EfF', // 0x Exchange
  '0x1111111254EEB25477B68fb85Ed929f73A960582', // 1inch V5
  '0x881D40237659C251811CEC9c364ef91dC08D300C', // MetaMask Swap Router
];
```

**Acceptance Criteria:**
- ✅ Real approvals detected
- ✅ Risk level calculated (unlimited = high, limited = medium)
- ✅ Spender addresses identified
- ✅ Token symbols displayed

---

#### **2.2 Address Reputation (Etherscan)** (2 hours)

```typescript
async function probeReputation(address: string) {
  const etherscanKey = Deno.env.get('ETHERSCAN_API_KEY');
  const baseUrl = 'https://api.etherscan.io/api';
  
  try {
    // Check if address is a contract
    const codeRes = await fetch(
      `${baseUrl}?module=proxy&action=eth_getCode&address=${address}&apikey=${etherscanKey}`
    );
    const codeData = await codeRes.json();
    const isContract = codeData.result !== '0x';
    
    // If contract, get verification status
    let verified = false;
    let contractName = '';
    if (isContract) {
      const sourceRes = await fetch(
        `${baseUrl}?module=contract&action=getsourcecode&address=${address}&apikey=${etherscanKey}`
      );
      const sourceData = await sourceRes.json();
      verified = sourceData.result[0].SourceCode !== '';
      contractName = sourceData.result[0].ContractName || 'Unknown';
    }
    
    // Check transaction history
    const txRes = await fetch(
      `${baseUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${etherscanKey}`
    );
    const txData = await txRes.json();
    const txCount = txData.result?.length || 0;
    
    // Determine reputation level
    let level = 'unknown';
    if (isContract && verified && txCount > 100) level = 'good';
    else if (isContract && !verified) level = 'medium';
    else if (txCount > 10) level = 'good';
    else level = 'low';
    
    return {
      error: false,
      data: { level, isContract, verified, contractName, txCount },
      evidence: { reputation: level, details: { isContract, verified } },
    };
  } catch (error) {
    return {
      error: true,
      data: { level: 'unknown' },
      evidence: { error: error.message },
    };
  }
}
```

**Acceptance Criteria:**
- ✅ Contract vs EOA detected
- ✅ Verification status checked
- ✅ Transaction count assessed
- ✅ Reputation level accurate

---

#### **2.3 Mixer Proximity Detection** (2 hours)

```typescript
async function probeMixer(address: string, network: string) {
  const alchemyKey = Deno.env.get('ALCHEMY_API_KEY');
  const alchemyUrl = `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`;
  
  const KNOWN_MIXERS = [
    '0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b', // Tornado Cash 0.1 ETH
    '0x47CE0C6eD5B0Ce3d3A51fdb1C52DC66a7c3c2936', // Tornado Cash 1 ETH
    '0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc', // Tornado Cash 10 ETH
    '0x910Cbd523D972eb0a6f4cAe4618aD62622b39DbF', // Railgun
  ];
  
  try {
    // Get last 100 transactions
    const res = await fetch(alchemyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromAddress: address,
          category: ['external', 'erc20', 'erc721', 'erc1155'],
          maxCount: 100,
        }],
      }),
    });
    
    const data = await res.json();
    const transfers = data.result?.transfers || [];
    
    // Check for interactions with known mixers
    let directInteractions = 0;
    const mixers = [];
    
    for (const tx of transfers) {
      if (KNOWN_MIXERS.includes(tx.to?.toLowerCase())) {
        directInteractions++;
        mixers.push({ address: tx.to, hash: tx.hash });
      }
    }
    
    return {
      error: false,
      data: { directInteractions, mixers },
      evidence: { mixers, checkedAt: new Date().toISOString() },
    };
  } catch (error) {
    return {
      error: true,
      data: { directInteractions: 0, mixers: [] },
      evidence: { error: error.message },
    };
  }
}
```

**Acceptance Criteria:**
- ✅ Tornado Cash detected
- ✅ Railgun detected
- ✅ Transaction history analyzed
- ✅ Risk impact calculated

---

**Day 2 Acceptance Criteria:**
- ✅ All three probe functions return real data
- ✅ Trust score calculated from live data
- ✅ Flags accurate and relevant
- ✅ Evidence metadata complete

**Estimated Time:** 6-8 hours (1 full day)

---

### **Day 3: Error Handling UI** 🔴

**Goal:** Add user-facing error states and retry logic

#### **3.1 Create Error Components** (1 hour)

**File:** `src/components/guardian/ErrorBanner.tsx`
```typescript
interface ErrorBannerProps {
  title: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorBanner({ title, message, onRetry, onDismiss }: ErrorBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-red-600 flex-shrink-0" size={20} />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">{title}</h3>
          <p className="text-sm text-red-700 mt-1">{message}</p>
          <div className="flex gap-2 mt-3">
            {onRetry && (
              <button onClick={onRetry} className="btn-sm btn-outline-red">
                <RefreshCw size={14} /> Try Again
              </button>
            )}
            {onDismiss && (
              <button onClick={onDismiss} className="btn-sm btn-ghost">
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
```

#### **3.2 Add Error States to GuardianUX2Pure** (1 hour)

```typescript
const [error, setError] = useState<{ title: string; message: string } | null>(null);

// In useEffect:
useEffect(() => {
  if (isConnected && address && !data) {
    setIsScanning(true);
    setShowResults(false);
    setError(null); // Clear previous errors
    analytics.scanStarted(address, 'ethereum', true);
    // ...
  }
}, [isConnected, address, data, analytics]);

// Update error handling:
const handleRescan = async () => {
  if (!address) return;
  setIsScanning(true);
  setShowResults(false);
  setError(null);
  
  try {
    await rescan();
    setTimeout(() => {
      setIsScanning(false);
      setTimeout(() => setShowResults(true), 100);
    }, 2000);
  } catch (error) {
    setIsScanning(false);
    setError({
      title: 'Scan Failed',
      message: error instanceof Error 
        ? error.message 
        : 'Unable to scan wallet. Please check your connection and try again.',
    });
    analytics.scanFailed(address, error instanceof Error ? error.message : 'Unknown error');
  }
};

// Add error display:
{error && (
  <ErrorBanner
    title={error.title}
    message={error.message}
    onRetry={handleRescan}
    onDismiss={() => setError(null)}
  />
)}
```

**Error Scenarios to Handle:**
- Network failure
- API timeout
- Rate limiting
- Invalid address
- Wallet disconnection
- Edge function errors

**Acceptance Criteria:**
- ✅ Network errors show retry UI
- ✅ Error messages are user-friendly
- ✅ Retry button works
- ✅ Error state clears on success
- ✅ Analytics track failures

**Estimated Time:** 2 hours

---

## 🟡 **PHASE 2: HIGH-PRIORITY (1 day)**

### **Day 4: Polish & Integration**

#### **4.1 Fix-Risks Modal Wiring** (1 hour)

```typescript
import { RevokeModal } from '@/components/guardian/RevokeModal';

const [showRevokeModal, setShowRevokeModal] = useState(false);
const [selectedApprovals, setSelectedApprovals] = useState([]);

// Extract risky approvals from scan data
const riskyApprovals = data?.flags
  ?.filter(f => f.category === 'Approvals')
  ?.flatMap(f => f.evidence?.approvals || [])
  || [];

// Wire up Fix Risks button:
<button
  onClick={() => setShowRevokeModal(true)}
  disabled={riskyApprovals.length === 0}
>
  Fix Risks
</button>

// Add modal:
<RevokeModal
  open={showRevokeModal}
  onOpenChange={setShowRevokeModal}
  approvals={riskyApprovals}
  onRevoke={handleRevoke}
  walletAddress={address}
  currentTrustScore={trustScore}
/>

// Implement revoke handler:
const handleRevoke = async (selectedApprovals) => {
  // Call guardian-revoke-v2 edge function
  // Update trust score after success
  // Show success message
};
```

**Acceptance Criteria:**
- ✅ Modal opens with real approvals
- ✅ Gas estimation works
- ✅ Trust score delta shows
- ✅ Revoke transactions execute
- ✅ Success feedback displayed

---

#### **4.2 Accessibility Port** (30 min)

Port from GuardianMobile to GuardianUX2Pure:

```typescript
// Add ARIA live regions
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {isScanning ? 'Scanning wallet, please wait' : 
   showResults ? `Trust score: ${trustScore}%` :
   'Ready to connect wallet'}
</div>

// Add keyboard navigation
<button
  onKeyDown={(e) => e.key === 'Enter' && handleRescan()}
  aria-label="Rescan wallet for security risks"
>
  Scan Again
</button>

// Add aria-describedby
<div aria-describedby="trust-score-description">
  <div id="trust-score-description" className="sr-only">
    Your wallet has a trust score of {trustScore}%, indicating 
    {trustScore >= 90 ? 'excellent' : trustScore >= 70 ? 'good' : 'fair'} security
  </div>
</div>
```

**Acceptance Criteria:**
- ✅ Screen readers announce state changes
- ✅ Keyboard navigation works
- ✅ Focus visible on all interactive elements
- ✅ ARIA labels descriptive

---

#### **4.3 Performance Audit** (15 min)

```bash
# Run Lighthouse
npm run build
npx serve dist
# Open Chrome DevTools → Lighthouse → Run Audit

# Target scores:
# Performance: > 90
# Accessibility: > 95
# Best Practices: > 90
# SEO: > 90
```

**If scores low:**
- Optimize images
- Lazy load components
- Code split routes
- Remove unused dependencies

**Acceptance Criteria:**
- ✅ Lighthouse Performance > 90
- ✅ Lighthouse Accessibility > 95
- ✅ No console errors
- ✅ Fast load time (< 2s)

---

## 🟢 **PHASE 3: SECURITY & POLISH (1 day)**

### **Day 5: Security Verification**

#### **5.1 API Key Security** (1 hour)

```typescript
// Verify .env.local has all keys
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
ALCHEMY_API_KEY=...
ETHERSCAN_API_KEY=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

// Verify keys not exposed in client code
npm run build
grep -r "ALCHEMY_API_KEY" dist/  # Should return nothing

// Verify Supabase secrets
supabase secrets list
# Should show: ALCHEMY_API_KEY, ETHERSCAN_API_KEY
```

**Acceptance Criteria:**
- ✅ No API keys in client bundle
- ✅ All keys in Supabase secrets
- ✅ .env.local gitignored
- ✅ Environment validation at startup

---

#### **5.2 RLS Policies** (1 hour)

```sql
-- Verify scans table RLS
SELECT * FROM pg_policies WHERE tablename = 'scans';

-- Test as different users
-- Should only see own scans:
SELECT * FROM scans WHERE user_id = auth.uid();

-- Test Edge Function auth
-- Should require valid JWT:
curl -X POST https://...supabase.co/functions/v1/guardian-scan \
  -H "Authorization: Bearer INVALID" \
  -d '{"wallet_address":"0x..."}'
# Expected: 401 Unauthorized
```

**Acceptance Criteria:**
- ✅ Users can only see own scans
- ✅ Edge functions require auth
- ✅ Rate limiting works
- ✅ Input validation secure

---

## 📋 **FINAL CHECKLIST**

### **Functionality** (All ✅ Required)
- [ ] Real wallet connects (MetaMask, Coinbase, WalletConnect)
- [ ] Live approvals detected from blockchain
- [ ] Reputation scoring accurate
- [ ] Mixer detection working
- [ ] Trust score calculated correctly
- [ ] Fix Risks modal functional
- [ ] Error states handle all failures
- [ ] Retry logic works
- [ ] Loading states smooth
- [ ] Theme switching works

### **Quality** (All ✅ Required)
- [ ] Lighthouse Performance > 90
- [ ] Lighthouse Accessibility > 95
- [ ] No console errors
- [ ] No linter warnings
- [ ] Mobile responsive
- [ ] Keyboard navigation works
- [ ] Screen reader compatible

### **Security** (All ✅ Required)
- [ ] API keys secure
- [ ] RLS policies active
- [ ] Rate limiting tested
- [ ] Input validation strict
- [ ] CORS configured
- [ ] Authentication required

---

## 🎯 **SUCCESS METRICS**

**When Guardian is 100%:**
- ✅ All 15 Tier 1 items complete
- ✅ Grade: A+ (98/100)
- ✅ Real wallet + live data
- ✅ Production-ready security
- ✅ World-class UX

**Estimated Launch:** **5 business days** from now

---

## 📊 **Daily Progress Tracking**

| Day | Focus | Tasks | Status |
|-----|-------|-------|--------|
| **Day 1** | Wallet Connection | Wagmi setup, RainbowKit, testing | ⏳ Pending |
| **Day 2** | Live Data | Approvals, Reputation, Mixer APIs | ⏳ Pending |
| **Day 3** | Error Handling | Error UI, retry logic, edge cases | ⏳ Pending |
| **Day 4** | Integration | Revoke modal, accessibility, perf | ⏳ Pending |
| **Day 5** | Security | API keys, RLS, final testing | ⏳ Pending |

---

## 🚀 **NEXT STEP**

**Start with:** Day 1 — Real Wallet Connection

**First Command:**
```bash
npm list wagmi @rainbow-me/rainbowkit
```

**Ready to begin?** Say **"Start Day 1"** and I'll guide you through the wallet integration step-by-step! 🛡️


