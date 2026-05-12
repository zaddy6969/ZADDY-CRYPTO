import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import {
  ARC_AI_WALLET_ASSISTANT_CONTRACT_ADDRESS,
  buildAssistantExplorerUrl
} from "../lib/arc-assistant-contract";
import {
  ARC_NETWORK_DETAILS,
  ARC_USDC_ERC20_ADDRESS,
  arcTestnet
} from "../lib/arc-chain";

function truncateAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const assistantContractUrl = buildAssistantExplorerUrl(
  ARC_AI_WALLET_ASSISTANT_CONTRACT_ADDRESS,
  "address"
);

export function WalletConnectCta({ className = "hero-actions" }) {
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

        const handlePrimaryClick = () => {
          if (!connected) {
            openConnectModal();
            return;
          }

          if (!onArc) {
            openChainModal();
            return;
          }

          openAccountModal();
        };

        return (
          <div className={className}>
            <button
              type="button"
              className="primary-button"
              onClick={handlePrimaryClick}
              disabled={!ready}
            >
              {!connected
                ? "Connect Wallet"
                : !onArc
                  ? "Switch to Arc"
                  : "Manage Wallet"}
            </button>
            {assistantContractUrl ? (
              <a
                className="ghost-button"
                href={assistantContractUrl}
                target="_blank"
                rel="noreferrer"
              >
                View Contract on ArcScan
              </a>
            ) : null}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

export default function WalletConnect({ walletSnapshot }) {
  const [copied, setCopied] = useState(false);
  const {
    address: displayAddress,
    usdcBalance,
    balanceStatus,
    balanceError
  } = walletSnapshot || {};

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
              <p>
                Connect your wallet to load live Arc USDC balance, recent
                activity, and onchain assistant actions from the correct
                network.
              </p>

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
                <div className="wallet-cta-row">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={openConnectModal}
                  >
                    Connect Wallet
                  </button>
                  {assistantContractUrl ? (
                    <a
                      className="ghost-button"
                      href={assistantContractUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Contract on ArcScan
                    </a>
                  ) : null}
                </div>
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

            {balanceError ? <p className="wallet-error">{balanceError}</p> : null}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
