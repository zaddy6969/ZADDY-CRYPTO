import { ConnectButton } from "@rainbow-me/rainbowkit";
import { arcTestnet } from "../lib/arc-chain";

export default function WalletLoginScreen() {
  return (
    <main className="login-page-shell">
      <span className="login-blob login-blob-left" />
      <span className="login-blob login-blob-right" />
      <section className="login-card-premium">
        <div className="login-brand-mark">
          <img src="/arc-ai-wallet-logo.png" alt="Arc AI Wallet" />
        </div>

        <p className="login-built-label">Built on Arc</p>
        <h1>Arc AI Wallet</h1>
        <p className="login-tagline">
          Send, bridge, and manage USDC on Arc with AI.
        </p>
        <p className="login-description">
          A cleaner way to connect, receive, send USDC, and understand wallet
          activity on Arc Testnet.
        </p>

        <ConnectButton.Custom>
          {({ authenticationStatus, mounted, openConnectModal }) => {
            const ready = mounted && authenticationStatus !== "loading";

            return (
              <button
                type="button"
                className="button button-primary login-connect-button"
                disabled={!ready}
                onClick={openConnectModal}
              >
                {ready ? "Connect Wallet" : "Loading wallet..."}
              </button>
            );
          }}
        </ConnectButton.Custom>

        <div className="login-meta-row">
          <span className="status-badge status-good">{arcTestnet.name}</span>
          <span>USDC powered payments on Arc</span>
        </div>
      </section>
    </main>
  );
}
