# Token Bridge Smart Contracts

## Overview
The **Token Bridge Smart Contracts** enable seamless **cross-chain token transfers** between **Ethereum (Sepolia Testnet)** and **Binance Smart Chain (BSC Testnet)**. The contracts include:
- **ERC-20 Token Contract**: Defines the bridgeable token.
- **Bridge Contract**: Handles locking & unlocking tokens across chains.

---

## 📌 Installation
### 1️⃣ Clone Repository & Install Dependencies
```sh
git clone https://github.com/your-repo/token-bridge.git
cd token-bridge/contracts
yarn install
```

### 2️⃣ Configure Environment Variables
Create a `.env` file:
```sh
SEPOLIA_RPC_URL=https://eth-sepolia.alchemyapi.io/v2/YOUR_API_KEY
BSC_TESTNET_RPC_URL=https://bsc-testnet.nodereal.io/v1/YOUR_API_KEY
PRIVATE_KEY=YOUR_WALLET_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
BSC_SCAN_API_KEY=YOUR_BSC_SCAN_API_KEY
```

---

## 🚀 Smart Contract Deployment
### Compile Contracts
```sh
npx hardhat compile
```

### Deploy to Ethereum (Sepolia Testnet)
```sh
npx hardhat run scripts/deploy.js --network sepolia
```

### Deploy to Binance Smart Chain (BSC Testnet)
```sh
npx hardhat run scripts/deploy.js --network bsctestnet
```

> **Note:** Ensure your wallet has sufficient testnet ETH & BNB for gas fees.

---

## 🔍 Verifying Contracts on Etherscan/BSCScan
```sh
npx hardhat verify --network sepolia YOUR_CONTRACT_ADDRESS
npx hardhat verify --network bsctestnet YOUR_CONTRACT_ADDRESS
```

---

## 🔄 Token Bridge Logic
1️⃣ **User locks tokens on Ethereum** → Bridge Contract emits `Locked` event.  
2️⃣ **Backend listens for events** → Calls `releaseTokens` on BSC.  
3️⃣ **Bridge Contract on BSC mints equivalent tokens**.  
4️⃣ **Vice versa for BSC to Ethereum transfers**.

---

## 🔧 Contract Functions
### ERC-20 Token Contract (`Token.sol`)
| Function | Description |
|----------|-------------|
| `mint(address, uint256)` | Mints new tokens (only bridge can call). |
| `burn(uint256)` | Burns tokens when locked for cross-chain transfer. |

### Bridge Contract (`Bridge.sol`)
| Function | Description |
|----------|-------------|
| `lockTokens(uint256, string, address)` | Locks tokens & emits `Locked` event. |
| `releaseTokens(address, uint256)` | Releases tokens on destination chain. |

---

## 🛠️ Testing Smart Contracts
```sh
npx hardhat test
```

Run tests to verify the **minting, burning, and bridging logic**.

---

## 🔥 Future Enhancements
- Add **multi-chain support** (Polygon, Avalanche, Solana).
- Implement **Layer 2 scaling** (Optimism, Arbitrum).

---

## Contributors
Developed by **Miroslav Stoyanov**.

## License
MIT License © 2025 Token Bridge Project

