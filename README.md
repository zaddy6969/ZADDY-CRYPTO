# arc-ai-wallet

A modern Next.js Arc wallet product with:

- wallet connect
- Arc blue and black UI
- AI wallet assistant
- Arc Testnet contract integration
- live onchain activity feed
- responsive layout
- separate portfolio dashboard
- wallet health scoring
- guided USDC transfer flow
- homepage demo mode before wallet connection

Target production URL:

- `https://arc-ai-wallet.vercel.app`

## Stack

- Next.js `15.5.9`
- React `19.1.1`
- React DOM `19.1.1`

These versions were current on npm when I scaffolded this on `2026-05-10`.

## Structure

- `pages/index.js` contains the arc-ai-wallet homepage
- `pages/portfolio.js` contains the dedicated portfolio dashboard route
- `pages/_app.js` loads the global stylesheet
- `pages/api/chat.js` streams wallet-aware AI responses server-side
- `pages/api/wallet-assistant.js` contains the legacy assistant route
- `pages/api/wallet-activity.js` fetches recent Arc wallet activity
- `components/app-providers.jsx` wires RainbowKit, wagmi, and React Query
- `components/wallet-assistant.jsx` renders the AI wallet copilot experience
- `components/wallet-connect.jsx` contains the Arc wallet connect UI
- `components/portfolio/*` contains the dedicated portfolio analytics and activity panels
- `contracts/ArcAiWalletAssistant.sol` is the onchain assistant contract
- `scripts/deploy-assistant.js` deploys the contract to Arc Testnet and writes the frontend deployment file
- `hardhat.config.js` configures Hardhat for Arc Testnet
- `lib/arc-chain.js` contains the Arc Testnet chain definition
- `lib/arc-assistant-contract.js` contains the frontend contract ABI and helpers
- `lib/use-arc-assistant-contract.js` reads and writes the assistant contract from the browser
- `lib/wallet-activity.js` reads recent Arc wallet activity from RPC logs
- `lib/use-arc-wallet-activity.js` polls the wallet activity feed in the browser
- `lib/generated/arc-assistant-deployment.json` stores the deployed contract address used by the frontend
- `lib/use-arc-wallet-snapshot.js` shares the live wallet address and USDC balance logic
- `lib/wallet-copilot.js` builds the wallet-aware AI prompt context, fallback logic, and insights
- `lib/portfolio-page.js` powers portfolio analytics, activity windows, and health signals
- `styles/globals.css` contains the Arc blue and black responsive design system

## Product Overview

Arc AI Wallet is designed as an AI-native wallet experience for Arc Testnet.
The product flow is:

1. Connect wallet
2. Load Arc balances and recent activity
3. Let Wallet Copilot analyze the portfolio
4. Review wallet health, risk, and portfolio composition
5. Take guided actions like sending USDC
6. Save useful assistant responses onchain

The homepage now supports a demo-ready preview mode so the product remains understandable even before wallet connection.

## Run

1. Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_SITE_URL=https://arc-ai-wallet.vercel.app
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.4-mini
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
ARC_TESTNET_PRIVATE_KEY=your_arc_testnet_private_key
ARC_ASSISTANT_NAME=arc-ai-wallet
NEXT_PUBLIC_ARC_ASSISTANT_CONTRACT_ADDRESS=
```

2. Install dependencies:

```bash
npm install
```

3. Compile the contract:

```bash
npm run contract:compile
```

4. Deploy it to Arc Testnet:

```bash
npm run contract:deploy:arc
```

That deploy script writes the deployed address to:

```text
lib/generated/arc-assistant-deployment.json
```

The frontend reads that file automatically, or you can override it with:

```bash
NEXT_PUBLIC_ARC_ASSISTANT_CONTRACT_ADDRESS=0x...
```

5. Start the dev server:

```bash
npm run dev
```

6. Open `http://localhost:3000`

## Deployment

1. Push `main` to GitHub
2. Import the repo into Vercel
3. Set these environment variables in Vercel:
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - `NEXT_PUBLIC_SITE_URL`
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`
   - `NEXT_PUBLIC_ARC_ASSISTANT_CONTRACT_ADDRESS` optional override
4. Redeploy

Production routes:

- `/` homepage and live demo mode
- `/portfolio` dedicated portfolio dashboard

## Notes

- The wallet connect panel now uses `RainbowKit` with `wagmi`.
- The displayed connected address is resolved with `ethers.js` and falls back to the wagmi account address if needed.
- The dashboard fetches Arc Testnet USDC balance with `ethers.js` through the USDC ERC-20 interface at `0x3600000000000000000000000000000000000000`.
- The activity feed reads recent Arc wallet transfers, approvals, and assistant saves directly from RPC logs.
- The AI assistant sends wallet snapshot and recent dashboard activity to a server-side OpenAI Responses API route and falls back to local wallet intelligence when model access is unavailable.
- The onchain assistant contract stores a user's trimmed prompt/response pair and exposes the latest saved interaction per wallet.
- The frontend assistant panel can save the latest AI answer on Arc Testnet once the contract is deployed and the wallet is connected to Arc.
- The portfolio route includes asset allocation, wallet flow analytics, activity export, and security scoring.
- `OPENAI_MODEL` is optional; the default is `gpt-5.4-mini` for a faster, lower-cost assistant.
- The Arc Testnet chain config uses:
  - chain ID `5042002`
  - RPC `https://rpc.testnet.arc.network`
  - explorer `https://testnet.arcscan.app`
- The Hardhat config uses:
  - network `arcTestnet`
  - RPC `https://rpc.testnet.arc.network`
  - private key from `ARC_TESTNET_PRIVATE_KEY`
