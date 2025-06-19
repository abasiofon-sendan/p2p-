const hre = require("hardhat");

async function main() {
  const [deployer, feeCollector, user1, user2] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy MockUSDT
  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();
  await mockUSDT.waitForDeployment();
  
  console.log("MockUSDT deployed to:", await mockUSDT.getAddress());

  // Deploy Escrow
  const Escrow = await hre.ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(await mockUSDT.getAddress(), feeCollector.address);
  await escrow.waitForDeployment();
  
  console.log("Escrow deployed to:", await escrow.getAddress());

  // Mint some test tokens
  console.log("\nMinting test tokens...");
  await mockUSDT.mint(deployer.address, hre.ethers.parseUnits("10000", 6));
  await mockUSDT.mint(user1.address, hre.ethers.parseUnits("5000", 6));
  await mockUSDT.mint(user2.address, hre.ethers.parseUnits("5000", 6));
  
  console.log("Test tokens minted successfully!");
  
  // Print addresses for .env file
  console.log("\n=== Add these to your .env file ===");
  console.log(`MOCK_USDT_ADDRESS=${await mockUSDT.getAddress()}`);
  console.log(`ESCROW_ADDRESS=${await escrow.getAddress()}`);
  console.log("=====================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});