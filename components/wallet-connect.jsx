import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import {
  formatMarketUpdatedAt,
  formatPercentChange,
  formatUsdPrice
} from "../lib/market-prices";
import {
  ARC_NETWORK_DETAILS,
  ARC_USDC_ERC20_ADDRESS,
  arcTestnet,
  hasWalletConnectProjectId
} from "../lib/arc-chain";
import { useArcWalletSnapshot } from "../lib/use-arc-wallet-snapshot";

function truncateAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function WalletConnect({ marketData }) {
  const [copied, setCopied] = useState(false);
  const { address: displayAddress, usdcBalance, balanceStatus, balanceError } =
    useArcWalletSnapshot();
  const liveAssets = marketData?.assets || [];

  const handleCopy = async () => {
    if (!displayAddress) return;

    try {
      await navigator.clipboard.writeText(displayAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <ConnectButton.Custom>
      {({
        account,
        authenticationStatus,
        chain,
        mounted,
        openAccountModal,
        openChainModal,
        openConnectModal
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === "authenticated");
        const onArc = chain?.id === arcTestnet.id;

        return (
          <div
            className="wallet-panel"
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none"
              }
            })}
          >
            <div className="wallet-topline">
              <span className="eyebrow">RainbowKit Wallet</span>
              <span
                className={
                  connected && onArc
                    ? "status-pill connected"
                    : "status-pill pending"
                }
              >
                {connected ? (onArc ? "Arc Ready" : "Wrong Network") : "Disconnected"}
              </span>
            </div>

            <div className="wallet-balance-card">
              <p>Connect with RainbowKit, use Arc Testnet, and display the signer address via ethers.js.</p>

              <div className="wallet-balance-stat">
                <span>Arc USDC balance</span>
                <strong>
                  {!connected
                    ? "Connect wallet"
                    : balanceStatus === "loading"
                      ? "Loading..."
                      : balanceStatus === "error"
                        ? "Unavailable"
                        : usdcBalance || "0.00 USDC"}
                </strong>
              </div>

              {!connected ? (
                <button
                  type="button"
                  className="primary-button"
                  onClick={openConnectModal}
                >
                  Connect Wallet
                </button>
              ) : (
                <div className="wallet-address-row">
                  <button
                    type="button"
                    className="address-chip"
                    onClick={handleCopy}
                    title={displayAddress}
                  >
                    {copied ? "Copied" : truncateAddress(displayAddress || account.address)}
                  </button>
                  {!onArc ? (
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={openChainModal}
                    >
                      Switch to Arc
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={openAccountModal}
                  >
                    Manage
                  </button>
                </div>
              )}
            </div>

            <div className="wallet-meta">
              <div className="wallet-meta-row">
                <span>Target network</span>
                <strong>{arcTestnet.name}</strong>
              </div>
              <div className="wallet-meta-row">
                <span>Chain ID</span>
                <strong>{arcTestnet.id}</strong>
              </div>
              <div className="wallet-meta-row">
                <span>Native gas</span>
                <strong>{arcTestnet.nativeCurrency.symbol}</strong>
              </div>
              <div className="wallet-meta-row">
                <span>Connected address</span>
                <strong className="wallet-address-text">
                  {connected ? displayAddress || account.address : "Not connected"}
                </strong>
              </div>
              <div className="wallet-meta-row">
                <span>USDC contract</span>
                <strong className="wallet-address-text">
                  {ARC_USDC_ERC20_ADDRESS}
                </strong>
              </div>
            </div>

            <div className="wallet-meta">
              {ARC_NETWORK_DETAILS.map((item) => (
                <div key={item.label} className="wallet-meta-row">
                  <span>{item.label}</span>
                  <a className="wallet-link" href={item.value} target="_blank" rel="noreferrer">
                    {item.value.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              ))}
            </div>

            <div className="wallet-market-panel">
              <div className="wallet-topline wallet-market-head">
                <span className="eyebrow">Live token prices</span>
                <span className="section-chip">
                  {marketData?.sourceStatus === "stale"
                    ? "Using cached prices"
                    : marketData?.updatedAt
                      ? `Updated ${formatMarketUpdatedAt(marketData.updatedAt)}`
                      : "Feed unavailable"}
                </span>
              </div>

              <div className="wallet-market-grid">
                {liveAssets.map((asset) => (
                  <div key={asset.symbol} className="wallet-market-card">
                    <span>{asset.symbol}</span>
                    <strong>{formatUsdPrice(asset.priceUsd)}</strong>
                    <em
                      className={
                        Number.isFinite(asset.change24h)
                          ? asset.change24h < 0
                            ? "delta negative wallet-market-change"
                            : "delta positive wallet-market-change"
                          : "wallet-market-change"
                      }
                    >
                      {formatPercentChange(asset.change24h)}
                    </em>
                  </div>
                ))}
              </div>
            </div>

            {!hasWalletConnectProjectId ? (
              <p className="wallet-error">
                Set <code>NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID</code> in your environment variables for full WalletConnect support on local and deployed builds.
              </p>
            ) : null}

            {balanceError ? <p className="wallet-error">{balanceError}</p> : null}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
