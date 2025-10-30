# How to Get Guardian Automation Keys

## 1. Supabase Service Role Key
- Go to: https://supabase.com/dashboard/project/rebeznxivaxgserswhbn/settings/api
- Copy the **service_role** key (secret, starts with eyJ...)
- Replace `SERVICE_ROLE_KEY_NEEDED` in .env.local

## 2. Ethereum RPC URL (Optional for testing)
**Free Options:**
- Infura: https://infura.io → Create project → Copy endpoint
- Alchemy: https://alchemy.com → Create app → Copy HTTP URL
- Public RPC: `https://eth.llamarpc.com` (rate limited)

## 3. Relayer Private Key (Optional for testing)
**For Development:**
```bash
# Generate a test wallet
node -e "
import { ethers } from 'ethers';
const wallet = ethers.Wallet.createRandom();
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
"
```

**For Production:**
- Create new wallet with MetaMask
- Fund with ETH for gas fees
- Export private key (Settings → Security → Export Private Key)

## 4. Test Without Blockchain Keys
The system can run in test mode without RPC/private keys:
- Database and edge functions work
- Relayer service starts
- Frontend components display
- Only actual transaction execution is disabled

## Quick Start (Test Mode)
1. Get Supabase service role key
2. Update .env.local
3. Start relayer: `cd services/guardian-relayer && npm start`
4. Add `<GuardianAutomationPanel />` to Guardian page