/**
 * Example: How to integrate GlobalHeader into your pages
 * 
 * This file shows three different integration approaches
 */

// ============================================================================
// APPROACH 1: Using PageLayout wrapper (Recommended)
// ============================================================================

import { PageLayout } from '@/components/layout/PageLayout';

export function MyPageWithLayout() {
  return (
    <PageLayout>
      <div className="container mx-auto p-6">
        <h1>My Page Content</h1>
        <p>GlobalHeader is automatically included</p>
      </div>
    </PageLayout>
  );
}

// ============================================================================
// APPROACH 2: Direct GlobalHeader import
// ============================================================================

import { GlobalHeader } from '@/components/header/GlobalHeader';

export function MyPageDirect() {
  return (
    <div className="min-h-screen">
      <GlobalHeader />
      <div className="container mx-auto p-6">
        <h1>My Page Content</h1>
        <p>GlobalHeader manually added</p>
      </div>
    </div>
  );
}

// ============================================================================
// APPROACH 3: Replacing existing header
// ============================================================================

// BEFORE:
// import { Header } from '@/components/hunter/Header';
// 
// export function Hunter() {
//   const [isDemo, setIsDemo] = useState(true);
//   const [isDarkTheme, setIsDarkTheme] = useState(true);
//   
//   return (
//     <div>
//       <Header
//         isDemo={isDemo}
//         setIsDemo={setIsDemo}
//         isDarkTheme={isDarkTheme}
//         setIsDarkTheme={setIsDarkTheme}
//         // ... many other props
//       />
//       <div>Content</div>
//     </div>
//   );
// }

// AFTER:
import { GlobalHeader } from '@/components/header/GlobalHeader';

export function Hunter() {
  // Remove header-specific state - GlobalHeader manages it internally
  
  return (
    <div>
      <GlobalHeader />
      <div>Content</div>
    </div>
  );
}

// ============================================================================
// FEATURES AVAILABLE IN GLOBALHEADER
// ============================================================================

/**
 * 1. Sign In
 *    - Visible for: Guest users (S0_GUEST)
 *    - Action: Redirects to /auth/signin
 * 
 * 2. Connect Wallet
 *    - Visible for: Guest users (S0_GUEST), Authenticated users (S1_ACCOUNT)
 *    - Action: Opens wallet connection modal via WalletContext
 * 
 * 3. Add Wallet
 *    - Visible for: Authenticated users without wallet (S1_ACCOUNT)
 *    - Action: Connects additional wallet
 * 
 * 4. Wallet Pill
 *    - Visible for: Users with connected wallet (S2_WALLET, S3_BOTH)
 *    - Shows: Truncated address, network, copy button
 *    - Interactive: Only on Portfolio page
 * 
 * 5. Profile Dropdown
 *    - Visible for: Authenticated users (S1_ACCOUNT, S3_BOTH)
 *    - Options: Profile, Settings, Sign Out
 * 
 * 6. Theme Toggle
 *    - Visible for: All users
 *    - Cycles: Light → Dark → System
 * 
 * 7. Context-Aware Title
 *    - Automatically shows page-specific title and subtitle
 *    - Based on current route pathname
 */

// ============================================================================
// MIGRATION STEPS
// ============================================================================

/**
 * Step 1: Remove old header import
 * ❌ import { Header } from '@/components/hunter/Header';
 * ❌ import { DashboardHeader } from '@/components/home/DashboardHeader';
 * ❌ import { HarvestProHeader } from '@/components/harvestpro/HarvestProHeader';
 * 
 * Step 2: Add GlobalHeader import
 * ✅ import { GlobalHeader } from '@/components/header/GlobalHeader';
 * 
 * Step 3: Replace header component
 * ❌ <Header isDemo={isDemo} setIsDemo={setIsDemo} ... />
 * ✅ <GlobalHeader />
 * 
 * Step 4: Remove header-specific state
 * ❌ const [isDemo, setIsDemo] = useState(true);
 * ❌ const [isDarkTheme, setIsDarkTheme] = useState(true);
 * 
 * Step 5: Test all features
 * - Sign in flow
 * - Wallet connection
 * - Sign out
 * - Theme toggle
 * - Responsive behavior
 */
