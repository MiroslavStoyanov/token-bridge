# Token Bridge Project

## Overview
The **Token Bridge** is a blockchain-based solution that enables seamless token transfers between **Ethereum (Sepolia Testnet)** and **Binance Smart Chain (BSC Testnet)**. It consists of:
- A **backend service** (NestJS) for transaction handling and event listening.
- **Smart contracts** (Solidity) for cross-chain token locking and minting.
- A **queue system** (Redis + BullMQ) for reliable retry mechanisms.
- **Logging** using **Winston**.
- **Dockerized deployment** with CI/CD support.

## Features
✔ **Cross-chain token bridging** between Ethereum & BSC.  
✔ **Automatic retry mechanism** for failed transactions.  
✔ **Scalable infrastructure** with Docker, Redis, and PostgreSQL.

---

## Project Structure
```
📦 token-bridge
├── 📂 backend       # NestJS backend for transaction handling
├── 📂 contracts     # Solidity smart contracts for token bridging
├── 📜 README.md     # Project documentation
└── 📜 docker-compose.yml # Dockerized setup
```

## Getting Started
### Prerequisites
Ensure you have installed:
- [Node.js](https://nodejs.org/) (v18+)
- [Yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Redis](https://redis.io/)

### Quick Start with Docker
Run the entire project using Docker:
```sh
docker-compose up --build
```

This will spin up:
- **NestJS Backend** (Port 3000)
- **PostgreSQL Database** (Port 5432)
- **Redis** (Port 6379)

---

## Smart Contracts Deployment
### 1️⃣ Install dependencies
```sh
cd contracts
yarn install
```

### 2️⃣ Compile & Deploy
```sh
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
npx hardhat run scripts/deploy.js --network bsctestnet
```

---

## API Documentation

### Transactions
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/transactions` | Fetch all transactions |
| GET | `/transactions/:id` | Fetch a specific transaction |
| POST | `/transactions/retry/:id` | Manually retry a failed transaction |

---

## Future Improvements
- ✅ Setup CI and CD using Docker.
- ✅ Add support for more blockchains (Polygon, Avalanche).
- ✅ Implement a **GraphQL API** for better querying.
- ✅ Improve bridge efficiency with **Layer 2 scaling solutions**.

### Contributors
🚀 Developed by Miroslav Stoyanov.

### License
MIT License © 2025 Token Bridge Project

