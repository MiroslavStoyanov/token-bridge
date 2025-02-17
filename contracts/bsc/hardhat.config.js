require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    hardhat: {}, // Local Hardhat network
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL, // BSC Testnet RPC
      accounts: [`0x${process.env.PRIVATE_KEY}`],  // Private key for deployment
      chainId: 97                           // BSC Testnet chain ID
    }
  },
  etherscan: {
    apiKey: process.env.BSCSCAN_API_KEY // API key for BscScan verification
  }
};
