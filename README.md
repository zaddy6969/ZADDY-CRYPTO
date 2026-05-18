# Arc AI Wallet

A simple, working Arc wallet app built around Arc App Kit.

## What it includes

- `Dashboard`
- `Send` tab
- `Bridge` tab
- `Unified Balance` tab
- `AI Assistant` tab
- `Activity` tab

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

- `/` single-page dashboard for all wallet actions
- `/send`, `/bridge`, `/unified-balance`, `/assistant`, `/activity` redirect back to the matching dashboard tab for backward compatibility

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

- `OPENAI_API_KEY` is only used server-side through `/api/ai`
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

1. Open `/`
2. Connect wallet and switch to Arc Testnet
3. Open the `Send` tab
4. Enter a recipient and USDC amount
5. Click `Estimate Fee`
6. Click `Send USDC`
7. Confirm in wallet
8. Check the ArcScan transaction link and then confirm the action appears in the `Activity` tab

### 3. Bridge USDC

1. Open `/`
2. Connect wallet
3. Open the `Bridge` tab
4. Choose `Ethereum Sepolia` or `Base Sepolia`
5. Enter amount and recipient
6. Click `Estimate Bridge`
7. Click `Bridge USDC to Arc`
8. Confirm in wallet
9. Check the step feed and ArcScan/explorer links
10. Confirm the bridge action appears in the `Activity` tab

### 4. Unified Balance

1. Open `/`
2. Connect wallet
3. Open the `Unified Balance` tab
4. Click `Refresh Unified Balance`
5. Deposit USDC from a supported source chain
6. After confirmation, verify confirmed/pending balances update
7. Enter an Arc recipient and spend amount
8. Click `Spend on Arc`
9. Confirm the spend in wallet
10. Confirm both deposit and spend appear in the `Activity` tab

### 5. AI Assistant

1. Open `/`
2. Open the `AI Assistant` tab
3. Connect wallet for live context, or ask general Arc/App Kit questions without connecting
4. Ask:
   - `Analyze my wallet`
   - `How much USDC do I have?`
   - `Show recent activity`
   - `Explain Arc USDC gas`
5. If `OPENAI_API_KEY` is missing, the assistant falls back to local wallet guidance

### 6. Activity

1. Open `/`
2. Open the `Activity` tab
3. Confirm local App Kit actions appear:
   - `Send`
   - `Bridge`
   - `Unified Balance Deposit`
   - `Unified Balance Spend`
4. Confirm live Arc activity appears when recent onchain events are available

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
