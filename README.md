# arc-ai-wallet

A modern Next.js Arc wallet product with:

- wallet connect
- dark UI
- AI wallet assistant
- transaction analyzer
- responsive layout

## Stack

- Next.js `15.5.9`
- React `19.1.1`
- React DOM `19.1.1`

These versions were current on npm when I scaffolded this on `2026-05-10`.

## Structure

- `pages/index.js` contains the arc-ai-wallet homepage
- `pages/_app.js` loads the global stylesheet
- `pages/api/wallet-assistant.js` calls the OpenAI Responses API server-side
- `pages/api/market-prices.js` fetches live token prices server-side
- `pages/api/transaction-analyzer.js` fetches and explains Arc transactions
- `components/app-providers.jsx` wires RainbowKit, wagmi, and React Query
- `components/transaction-analyzer.jsx` renders the plain-English transaction analyzer
- `components/wallet-assistant.jsx` renders the AI wallet activity chatbox
- `components/wallet-connect.jsx` contains the Arc wallet connect UI
- `lib/arc-chain.js` contains the Arc Testnet chain definition
- `lib/transaction-analyzer.js` decodes Arc transactions and common ERC-20 events
- `lib/use-arc-wallet-snapshot.js` shares the live wallet address and USDC balance logic
- `styles/globals.css` contains the dark responsive design system

## Run

1. Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.4-mini
```

2. Install dependencies:

```bash
npm install
```

3. Start the dev server:

```bash
npm run dev
```

4. Open `http://localhost:3000`

## Notes

- The wallet connect panel now uses `RainbowKit` with `wagmi`.
- The displayed connected address is resolved with `ethers.js` and falls back to the wagmi account address if needed.
- The dashboard fetches Arc Testnet USDC balance with `ethers.js` through the USDC ERC-20 interface at `0x3600000000000000000000000000000000000000`.
- The wallet and market panel now fetch live BTC, ETH, SOL, and USDC prices from Coinbase market data APIs and refresh them every 30 seconds in the browser.
- The transaction analyzer accepts an Arc transaction hash, fetches it from RPC, decodes common ERC-20 actions, and explains the result in plain English.
- The AI assistant sends wallet snapshot and recent dashboard activity to a server-side OpenAI Responses API route.
- `OPENAI_MODEL` is optional; the default is `gpt-5.4-mini` for a faster, lower-cost assistant.
- The Arc Testnet chain config uses:
  - chain ID `5042002`
  - RPC `https://rpc.testnet.arc.network`
  - explorer `https://testnet.arcscan.app`
- In this Codex shell, `npm` is not available, so I could not install dependencies or run the Next.js dev server here.
