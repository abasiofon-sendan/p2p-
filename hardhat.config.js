require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

// Get variables from .env
const SEPOLIA_PRIVATE_KEY = process.env.PRIVATE_KEY?.trim();
const FEE_COLLECTOR_PRIVATE_KEY = process.env.FEE_COLLECTOR_PRIVATE_KEY?.trim();
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL?.trim();
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY?.trim();

// Hard fail if any are missing
if (!SEPOLIA_PRIVATE_KEY) {
  throw new Error("Missing SEPOLIA_PRIVATE_KEY in .env file");
}
if (!FEE_COLLECTOR_PRIVATE_KEY) {
  throw new Error("Missing FEE_COLLECTOR_PRIVATE_KEY in .env file");
}

module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: SEPOLIA_RPC || "",
      accounts: [SEPOLIA_PRIVATE_KEY, FEE_COLLECTOR_PRIVATE_KEY],
    },
    'lisk-sepolia': {
      url: 'https://rpc.sepolia-api.lisk.com',
      accounts: [SEPOLIA_PRIVATE_KEY, FEE_COLLECTOR_PRIVATE_KEY],
      gasPrice: 1000000000,
      chainId: 4202,
    },
  },
  etherscan: {
    apiKey: {
      // Your API key for Etherscan
      sepolia: ETHERSCAN_API_KEY || "",
      // Blockscout on Lisk Sepolia does not require an API key.
      "lisk-sepolia": "no-api-key-needed"
    },
    customChains: [
      {
        network: "lisk-sepolia",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com"
        }
      }
    ]
  },
};