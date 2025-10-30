const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance));

  const GuardianSmartWallet = await ethers.getContractFactory("GuardianSmartWallet");
  const guardianWallet = await GuardianSmartWallet.deploy();
  
  await guardianWallet.waitForDeployment();
  const address = await guardianWallet.getAddress();
  
  console.log("GuardianSmartWallet deployed to:", address);
  
  // Set up initial relayer authorization
  if (process.env.RELAYER_ADDRESS) {
    console.log("Authorizing relayer:", process.env.RELAYER_ADDRESS);
    await guardianWallet.setRelayerAuthorization(process.env.RELAYER_ADDRESS, true);
  }

  console.log("Deployment complete!");
  console.log("Contract address:", address);
  console.log("Verify with: npx hardhat verify --network", hre.network.name, address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });