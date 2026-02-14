@echo off
echo ========================================
echo Active Wallet Display Test
echo ========================================
echo.

echo This script will help you test the active wallet display fix.
echo.
echo Test Steps:
echo 1. Start the development server (npm run dev)
echo 2. Open the app in your browser
echo 3. Sign in with your account
echo 4. Connect a wallet via MetaMask/RainbowKit
echo 5. Check if the wallet chip appears in the header
echo 6. Refresh the page
echo 7. Check if the wallet chip persists
echo.
echo Expected Behavior:
echo - Wallet chip should appear immediately after connecting
echo - Wallet chip should show the active wallet address
echo - Wallet chip should persist after page refresh
echo - Wallet chip should show "Demo Wallet" in demo mode
echo.
echo Debug Information:
echo - Check browser console for debug logs starting with:
echo   * "🔍 GlobalHeader - Wallet State:"
echo   * "🔍 WalletChip - State:"
echo   * "🔄 Immediately restoring active wallet from localStorage:"
echo   * "✅ Set active wallet:"
echo.
echo If the wallet chip is not showing:
echo 1. Check if localStorage has 'aw_active_address' key
echo 2. Check if user_wallets table has entries for your user
echo 3. Check browser console for errors
echo 4. Verify RLS policies allow reading from user_wallets
echo.

pause
