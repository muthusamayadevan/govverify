# GovVerify

Full-stack Web3 government document verification app.

## Stack

- **client/** — React 19 + Vite + Tailwind CSS (frontend)
- **server/** — Node.js + Express + MongoDB + JWT auth + GridFS + Ethers.js (backend)
- **contracts/** — Solidity smart contracts, deployed to Sepolia testnet via Hardhat

## Running on Replit

Two workflows must both be running:

| Workflow | Command | Port |
|---|---|---|
| **Start Backend** | `cd server && PORT=3001 npm run dev` | 3001 (console) |
| **Start application** | `cd client && npm run dev` | 5000 (webview) |

The Vite dev server proxies `/api/*` requests to `http://localhost:3001` server-side,
so the browser only needs to talk to port 5000.

## Required Secrets

⚠️ **The backend will not start until all 5 secrets below are set.** `server/config/blockchain.js` initializes an `ethers.Wallet` at import time, so a missing `PRIVATE_KEY` crashes the process immediately. Add all secrets in the Replit Secrets panel, then start (or restart) the **Start Backend** workflow.

Add these in the Replit Secrets panel before starting the backend:

| Key | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `SEPOLIA_RPC_URL` | Alchemy/Infura Sepolia RPC endpoint |
| `PRIVATE_KEY` | Deployer wallet private key (contract interactions) |
| `CONTRACT_ADDRESS` | Deployed contract address on Sepolia |
| `SESSION_SECRET` | Already set via Replit |

## Notes

- Smart contracts are already deployed to Sepolia — do not redeploy or modify them.
- `client/src/api/axios.js` uses a relative `baseURL: '/api'` (Replit-specific change from the original `http://localhost:5000/api`; the Vite proxy makes this equivalent).
- `client/vite.config.js` has `host: true` and a `/api` proxy (Replit-specific config).
- The server listens on `process.env.PORT || 5000`; the workflow sets `PORT=3001` to avoid conflicting with Vite's port 5000 webview.
