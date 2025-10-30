// Generate relayer wallet
const crypto = require('crypto');

function generateWallet() {
  const privateKey = '0x' + crypto.randomBytes(32).toString('hex');
  console.log('Generated Relayer Wallet:');
  console.log('Private Key:', privateKey);
  console.log('');
  console.log('Steps to enable transactions:');
  console.log('1. Add this private key to .env.local RELAYER_PRIVATE_KEY');
  console.log('2. Import to MetaMask to get address');
  console.log('3. Fund address with ETH for gas fees');
  console.log('4. Restart relayer service');
}

generateWallet();