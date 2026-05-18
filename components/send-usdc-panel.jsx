import { useEffect, useMemo, useState } from "react";
import { isAddress } from "viem";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import {
  createArcAppKitClient,
  formatAppKitError,
  formatEstimatedGas,
  getPrimaryExplorerUrl,
  getPrimaryTxHash
} from "../lib/arc-app-kit";
import { arcTestnet } from "../lib/arc-chain";
import { createWalletActionRecord } from "../lib/local-activity";

function normalizeAmount(value) {
  return String(value || "").replace(/[^\d.]/g, "");
}

function shortAddress(address) {
  if (!address) {
    return "";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function SendUsdcPanel({ walletSnapshot, onActivitySaved }) {
  const { connector } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const [recipient, setRecipient] = useState(walletSnapshot?.address || "");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [estimateLabel, setEstimateLabel] = useState("");
  const [result, setResult] = useState(null);

  const recipientValid = Boolean(recipient) && isAddress(recipient);
  const amountValue = Number(amount || 0);
  const amountValid = Number.isFinite(amountValue) && amountValue > 0;
  const availableBalance = Number(
    String(walletSnapshot?.usdcBalance || "").replace(/[^\d.-]/g, "")
  );
  const hasKnownBalance = Number.isFinite(availableBalance);
  const hasEnoughBalance = !hasKnownBalance || amountValue <= availableBalance;
  const isSignedIn = walletSnapshot?.isSignedIn;
  const needsArcSwitch = isSignedIn && chainId !== arcTestnet.id;

  useEffect(() => {
    if (walletSnapshot?.address && !recipient) {
      setRecipient(walletSnapshot.address);
    }
  }, [recipient, walletSnapshot?.address]);

  const explorerUrl = useMemo(
    () => getPrimaryExplorerUrl(result),
    [result]
  );

  const txHash = useMemo(() => getPrimaryTxHash(result), [result]);

  const buildSendParams = (client) => ({
    from: {
      adapter: client.adapter,
      chain: client.chainLookup.Arc_Testnet
    },
    to: recipient,
    amount,
    token: "USDC"
  });

  const ensureArcNetwork = async () => {
    if (chainId === arcTestnet.id || !switchChainAsync) {
      return;
    }

    await switchChainAsync({ chainId: arcTestnet.id });
  };

  const handleEstimate = async () => {
    if (!connector || !isSignedIn) {
      setError("Connect your wallet before sending USDC.");
      return;
    }

    if (!recipientValid) {
      setError("Enter a valid recipient address.");
      return;
    }

    if (!amountValid) {
      setError("Enter a valid USDC amount.");
      return;
    }

    if (!hasEnoughBalance) {
      setError("Amount exceeds your available USDC balance.");
      return;
    }

    setStatus("estimating");
    setError("");
    setEstimateLabel("");

    try {
      await ensureArcNetwork();
      const provider = await connector.getProvider();
      const client = await createArcAppKitClient(provider);
      const estimate = await client.kit.estimateSend(buildSendParams(client));
      setEstimateLabel(formatEstimatedGas(estimate));
      setStatus("ready");
    } catch (nextError) {
      setStatus("error");
      setError(
        formatAppKitError(nextError, "Unable to estimate the send transaction.")
      );
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();

    if (!connector || !isSignedIn) {
      setError("Connect your wallet before sending USDC.");
      return;
    }

    if (!recipientValid) {
      setError("Enter a valid recipient address.");
      return;
    }

    if (!amountValid) {
      setError("Enter a valid USDC amount.");
      return;
    }

    if (!hasEnoughBalance) {
      setError("Amount exceeds your available USDC balance.");
      return;
    }

    setStatus("sending");
    setError("");
    setResult(null);

    try {
      await ensureArcNetwork();
      const provider = await connector.getProvider();
      const client = await createArcAppKitClient(provider);
      const nextResult = await client.kit.send(buildSendParams(client));
      setResult(nextResult);
      setStatus("success");

      onActivitySaved?.(
        createWalletActionRecord({
          walletAddress: walletSnapshot.address,
          type: "Sent USDC",
          kind: "sent",
          amount: `${amount} USDC`,
          chain: arcTestnet.name,
          recipient,
          status: "Pending",
          txHash: getPrimaryTxHash(nextResult),
          explorerUrl: getPrimaryExplorerUrl(nextResult),
          summary: `Sent ${amount} USDC to ${shortAddress(recipient)} on Arc Testnet.`,
          metadata: {
            token: "USDC",
            network: "Arc_Testnet"
          }
        })
      );
    } catch (nextError) {
      setStatus("error");
      setError(formatAppKitError(nextError, "Unable to send USDC."));
    }
  };

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <p className="section-kicker">App Kit Send</p>
          <h2>Send USDC on Arc Testnet</h2>
        </div>
        <span className="status-badge">
          {!isSignedIn
            ? "Wallet required"
            : needsArcSwitch
              ? "Switch required"
              : status === "sending"
                ? "Sending"
                : "Ready"}
        </span>
      </div>

      {!isSignedIn ? (
        <div className="empty-state">
          <strong>Connect wallet to send USDC.</strong>
          <p>
            Arc App Kit uses your connected wallet to send USDC on Arc Testnet
            with a single `kit.send()` flow.
          </p>
        </div>
      ) : (
        <>
          <div className="wallet-summary-grid">
            <div className="wallet-summary-item">
              <span className="field-label">Sender</span>
              <strong>{walletSnapshot.address}</strong>
            </div>
            <div className="wallet-summary-item">
              <span className="field-label">Network</span>
              <strong>{walletSnapshot.onArc ? "Arc Testnet" : "Wrong network"}</strong>
            </div>
            <div className="wallet-summary-item">
              <span className="field-label">USDC balance</span>
              <strong>{walletSnapshot.usdcBalance || "Syncing..."}</strong>
            </div>
            <div className="wallet-summary-item">
              <span className="field-label">Estimated network fee</span>
              <strong>{estimateLabel || "Estimate first"}</strong>
            </div>
          </div>

          <form className="composer-form" onSubmit={handleSend}>
            <label className="composer-field">
              <span className="field-label">Recipient</span>
              <input
                value={recipient}
                onChange={(event) => setRecipient(event.target.value.trim())}
                placeholder="0x..."
                className="composer-input"
              />
            </label>

            <label className="composer-field">
              <span className="field-label">Amount in USDC</span>
              <input
                value={amount}
                onChange={(event) => setAmount(normalizeAmount(event.target.value))}
                inputMode="decimal"
                placeholder="1.00"
                className="composer-input"
              />
            </label>

            <div className="empty-state empty-state-compact">
              <strong>Transaction check</strong>
              <p>
                {!recipientValid
                  ? "Enter a valid wallet address before sending."
                  : !amountValid
                    ? "Enter a valid USDC amount to continue."
                    : !hasEnoughBalance
                      ? "Amount exceeds your available USDC balance."
                    : needsArcSwitch
                      ? "Your wallet needs to switch to Arc Testnet before App Kit can send."
                      : "This will submit a real Arc Testnet USDC transfer after wallet confirmation."}
              </p>
            </div>

            <div className="composer-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={handleEstimate}
                disabled={status === "estimating" || status === "sending" || isSwitchingChain}
              >
                {status === "estimating" ? "Estimating..." : "Estimate Fee"}
              </button>
              <button
                type="submit"
                className="button button-primary"
                disabled={status === "estimating" || status === "sending" || isSwitchingChain}
              >
                {isSwitchingChain
                  ? "Switching..."
                  : status === "sending"
                    ? "Confirm in wallet..."
                    : "Send USDC"}
              </button>
            </div>
          </form>
        </>
      )}

      {error ? (
        <div className="empty-state empty-state-compact">
          <strong>Send unavailable</strong>
          <p>{error}</p>
        </div>
      ) : null}

      {txHash ? (
        <div className="empty-state empty-state-compact">
          <strong>USDC sent</strong>
          <p>
            Your Arc Testnet send completed for {amount} USDC to{" "}
            {shortAddress(recipient)}.
          </p>
          {explorerUrl ? (
            <a href={explorerUrl} target="_blank" rel="noreferrer">
              View transaction on ArcScan
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
