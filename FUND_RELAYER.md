# Fund Relayer Wallet for Transactions

## Your Relayer Wallet:
**Private Key:** `0x77870296aa253909da037caa2b69f7b6ab3cfadcd22d8b9b51b238d2c18e4cd4`

## Steps to Enable Transactions:

### 1. Get Wallet Address
- Open MetaMask
- Click "Import Account"
- Paste private key: `0x77870296aa253909da037caa2b69f7b6ab3cfadcd22d8b9b51b238d2c18e4cd4`
- Copy the wallet address

### 2. Fund with ETH
**Mainnet:** Send 0.1+ ETH to the address
**Testnet (Sepolia):** Get free ETH from faucet:
- https://sepoliafaucet.com/
- https://faucets.chain.link/sepolia

### 3. Update RPC for Testnet (Optional)
For testing, use Sepolia testnet:
```bash
# In .env.local, change:
RPC_URL=https://sepolia.infura.io/v3/demo
```

### 4. Test Transaction
Once funded, the relayer can execute actual revoke transactions:
- Start relayer: `cd services/guardian-relayer && npm start`
- Trigger automation from Guardian UI
- Check transaction on Etherscan

## Security Notes:
- Keep private key secure
- Use testnet for development
- Monitor gas costs
- Set up alerts for low balance