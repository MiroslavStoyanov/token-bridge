# Token Bridge Backend

## Overview
The **Token Bridge Backend** is a **NestJS** application that facilitates cross-chain token transfers by interacting with deployed **Ethereum & Binance Smart Chain (BSC) contracts**.

### Features
✔ **Blockchain event listeners** for monitoring locked & minted tokens.

✔ **BullMQ queue** for transaction retries.

✔ **JWT Authentication & Role-Based Access Control (RBAC)**.

✔ **PostgreSQL database** for transaction logging.

---

## Installation
### 1️⃣ Clone Repository
```sh
git clone https://github.com/your-repo/token-bridge.git
cd token-bridge/backend
```

### 2️⃣ Install Dependencies
```sh
yarn install
```

### 3️⃣ Environment Variables
Create a `.env` file:
```sh
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=token_bridge
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=mysecretkey
SEPOLIA_RPC_URL=https://eth-sepolia.alchemyapi.io/v2/YOUR_API_KEY
BSC_TESTNET_RPC_URL=https://bsc-testnet.nodereal.io/v1/YOUR_API_KEY
ETHEREUM_BRIDGE_ADDRESS=0x...
BSC_BRIDGE_ADDRESS=0x...
```

---

## Running the Server
### 🚀 Start Development Mode
```sh
yarn start:dev
```

### 🏗️ Start with Docker
```sh
docker-compose up --build
```

This starts the backend with **PostgreSQL & Redis**.

---

## API Endpoints

### Transactions
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/transactions` | Fetch all transactions |
| GET | `/transactions/:id` | Fetch a specific transaction |
| POST | `/transactions/retried` | Get all retried transactions |


---

## Queue System (BullMQ)
The backend uses **BullMQ (Redis-based queueing)** for failed transaction retries.

---

## Logging
- **Winston Logger**: Stores logs in `logs/error.log`.

---

## Deployment
### 🚀 Using Docker
```sh
docker-compose up --build -d
```

---

## Contributors
Developed by **Miroslav Stoyanov** & Contributors.

## License
MIT License © 2025 Token Bridge Project

