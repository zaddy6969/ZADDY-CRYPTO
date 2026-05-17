# Arc AI Wallet

A simple, working Arc wallet app built around Arc App Kit.

## What it includes

- `Dashboard`
- `Send USDC`
- `Bridge USDC`
- `Unified Balance`
- `AI Assistant`
- `Activity`

The app keeps the current Arc AI Wallet branding and dark premium UI, but removes the old demo-heavy portfolio flow and focuses on real App Kit actions.

## Stack

- Next.js
- React
- RainbowKit
- wagmi
- viem
- Arc App Kit
- OpenAI API

## Routes

- `/` dashboard
- `/send` send USDC on Arc Testnet with App Kit `send()`
- `/bridge` bridge USDC into Arc with App Kit `bridge()`
- `/unified-balance` deposit, inspect, and spend with App Kit Unified Balance
- `/assistant` wallet copilot
- `/activity` local App Kit history + live Arc activity

## Environment variables

Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_SITE_URL=https://arc-ai-wallet.vercel.app
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.4-mini
```

Notes:

- `OPENAI_API_KEY` is only used server-side through `/api/ai-assistant`
- do not put private keys or seed phrases in frontend env vars

## Local development

```bash
npm install
npm run build
npm run dev
```

Open:

- `http://localhost:3000`

## How to test

### 1. Dashboard

1. Open `/`
2. Connect a wallet with MetaMask or WalletConnect
3. Confirm the wallet address, Arc Testnet status, and USDC balance appear

### 2. Send USDC

1. Open `/send`
2. Connect wallet and switch to Arc Testnet
3. Enter a recipient and USDC amount
4. Click `Estimate Fee`
5. Click `Send USDC`
6. Confirm in wallet
7. Check the ArcScan transaction link and then confirm the action appears on `/activity`

### 3. Bridge USDC

1. Open `/bridge`
2. Connect wallet
3. Choose `Ethereum Sepolia` or `Base Sepolia`
4. Enter amount and recipient
5. Click `Estimate Bridge`
6. Click `Bridge USDC to Arc`
7. Confirm in wallet
8. Check the step feed and ArcScan/explorer links
9. Confirm the bridge action appears on `/activity`

### 4. Unified Balance

1. Open `/unified-balance`
2. Connect wallet
3. Click `Refresh Unified Balance`
4. Deposit USDC from a supported source chain
5. After confirmation, verify confirmed/pending balances update
6. Enter an Arc recipient and spend amount
7. Click `Spend on Arc`
8. Confirm the spend in wallet
9. Confirm both deposit and spend appear on `/activity`

### 5. AI Assistant

1. Open `/assistant`
2. Connect wallet for live context, or use preview mode
3. Ask:
   - `Analyze my wallet`
   - `How much USDC do I have?`
   - `Show recent activity`
   - `Explain Arc USDC gas`
4. If `OPENAI_API_KEY` is missing, the assistant falls back to local wallet guidance

### 6. Activity

1. Open `/activity`
2. Confirm local App Kit actions appear:
   - `Send`
   - `Bridge`
   - `Unified Balance Deposit`
   - `Unified Balance Spend`
3. Confirm live Arc activity appears when recent onchain events are available

## Deployment

1. Push `main` to GitHub
2. Import the repo into Vercel
3. Set these Vercel environment variables:
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_ARC_RPC_URL`
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`
4. Redeploy

## Arc config

- Chain ID: `5042002`
- RPC: `https://rpc.testnet.arc.network`
- Explorer: `https://testnet.arcscan.app`
- Gas token: `USDC`
- Faucet: `https://faucet.circle.com`
