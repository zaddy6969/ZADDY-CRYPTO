import { useEffect, useMemo, useState } from "react";
import { isAddress } from "viem";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import {
  createArcAppKitClient,
  formatAppKitError,
  formatUnifiedBalanceBreakdown,
  getChainLabel,
  getPrimaryExplorerUrl,
  getPrimaryTxHash
} from "../lib/arc-app-kit";
import {
  UNIFIED_BALANCE_SOURCE_OPTIONS,
  arcTestnet
} from "../lib/arc-chain";
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

export default function UnifiedBalancePanel({
  walletSnapshot,
  onActivitySaved
}) {
  const { connector } = useAccount();
  const currentChainId = useChainId();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const [balanceStatus, setBalanceStatus] = useState("idle");
  const [balanceError, setBalanceError] = useState("");
  const [balances, setBalances] = useState(null);
  const [sourceChainId, setSourceChainId] = useState(UNIFIED_BALANCE_SOURCE_OPTIONS[0].id);
  const [depositAmount, setDepositAmount] = useState("");
  const [spendAmount, setSpendAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState(walletSnapshot?.address || "");
  const [actionStatus, setActionStatus] = useState("idle");
  const [actionError, setActionError] = useState("");
  const [lastResult, setLastResult] = useState(null);

  const isSignedIn = walletSnapshot?.isSignedIn;
  const breakdown = useMemo(
    () => formatUnifiedBalanceBreakdown(balances),
    [balances]
  );
  const sourceOption =
    UNIFIED_BALANCE_SOURCE_OPTIONS.find((option) => option.id === sourceChainId) ||
    UNIFIED_BALANCE_SOURCE_OPTIONS[0];
  const recipientValid = Boolean(recipientAddress) && isAddress(recipientAddress);
  const depositValid = Number(depositAmount || 0) > 0;
  const spendValid = Number(spendAmount || 0) > 0;

  useEffect(() => {
    if (walletSnapshot?.address && !recipientAddress) {
      setRecipientAddress(walletSnapshot.address);
    }
  }, [recipientAddress, walletSnapshot?.address]);

  const refreshBalances = async () => {
    if (!connector || !isSignedIn) {
      setBalances(null);
      setBalanceStatus("idle");
      return;
    }

    setBalanceStatus((current) => (current === "ready" ? "refreshing" : "loading"));
    setBalanceError("");

    try {
      const provider = await connector.getProvider();
      const client = await createArcAppKitClient(provider);
      const nextBalances = await client.kit.unifiedBalance.getBalances({
        sources: [{ adapter: client.adapter }],
        token: "USDC",
        networkType: "testnet",
        includePending: true
      });

      setBalances(nextBalances);
      setBalanceStatus("ready");
    } catch (nextError) {
      setBalanceStatus("error");
      setBalanceError(
        formatAppKitError(
          nextError,
          "Unable to load your Unified Balance right now."
        )
      );
    }
  };

  useEffect(() => {
    refreshBalances();

    if (!isSignedIn) {
      return undefined;
    }

    const intervalId = window.setInterval(refreshBalances, 20000);
    return () => window.clearInterval(intervalId);
  }, [connector, isSignedIn, walletSnapshot?.address]);

  const switchToChain = async (chainId) => {
    if (currentChainId === chainId || !switchChainAsync) {
      return;
    }

    await switchChainAsync({ chainId });
  };

  const handleDeposit = async (event) => {
    event.preventDefault();

    if (!connector || !isSignedIn) {
      setActionError("Connect your wallet before depositing into Unified Balance.");
      return;
    }

    if (!depositValid) {
      setActionError("Enter a valid USDC amount to deposit.");
      return;
    }

    setActionStatus("depositing");
    setActionError("");
    setLastResult(null);

    try {
      await switchToChain(sourceOption.id);
      const provider = await connector.getProvider();
      const client = await createArcAppKitClient(provider);
      const result = await client.kit.unifiedBalance.deposit({
        from: {
          adapter: client.adapter,
          chain: client.chainLookup[sourceOption.appKitChain]
        },
        amount: depositAmount,
        token: "USDC"
      });

      setLastResult(result);
      setActionStatus("success");
      onActivitySaved?.(
        createWalletActionRecord({
          walletAddress: walletSnapshot.address,
          type: "Unified Balance Deposit",
          amount: `${depositAmount} USDC`,
          chain: getChainLabel(sourceOption.appKitChain),
          recipient: result.depositedTo,
          status: "Confirmed",
          txHash: result.txHash,
          explorerUrl: result.explorerUrl || "",
          summary: `Deposited ${depositAmount} USDC from ${getChainLabel(sourceOption.appKitChain)} into Unified Balance.`
        })
      );
      await refreshBalances();
    } catch (nextError) {
      setActionStatus("error");
      setActionError(formatAppKitError(nextError, "Unable to deposit into Unified Balance."));
    }
  };

  const handleSpend = async (event) => {
    event.preventDefault();

    if (!connector || !isSignedIn) {
      setActionError("Connect your wallet before spending from Unified Balance.");
      return;
    }

    if (!spendValid) {
      setActionError("Enter a valid USDC amount to spend.");
      return;
    }

    if (!recipientValid) {
      setActionError("Enter a valid Arc recipient address.");
      return;
    }

    setActionStatus("spending");
    setActionError("");
    setLastResult(null);

    try {
      await switchToChain(arcTestnet.id);
      const provider = await connector.getProvider();
      const client = await createArcAppKitClient(provider);
      const result = await client.kit.unifiedBalance.spend({
        amount: spendAmount,
        token: "USDC",
        from: [{ adapter: client.adapter }],
        to: {
          adapter: client.adapter,
          chain: client.chainLookup.Arc_Testnet,
          recipientAddress
        }
      });

      setLastResult(result);
      setActionStatus("success");
      onActivitySaved?.(
        createWalletActionRecord({
          walletAddress: walletSnapshot.address,
          type: "Unified Balance Spend",
          amount: `${spendAmount} USDC`,
          chain: arcTestnet.name,
          recipient: recipientAddress,
          status: "Confirmed",
          txHash: getPrimaryTxHash(result),
          explorerUrl: getPrimaryExplorerUrl(result),
          summary: `Spent ${spendAmount} USDC from Unified Balance to ${shortAddress(recipientAddress)} on Arc Testnet.`
        })
      );
      await refreshBalances();
    } catch (nextError) {
      setActionStatus("error");
      setActionError(formatAppKitError(nextError, "Unable to spend from Unified Balance."));
    }
  };

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Unified Balance</p>
          <h2>Combine USDC from multiple chains and spend instantly on Arc</h2>
        </div>
        <span className="status-badge">
          {!isSignedIn
            ? "Wallet required"
            : balanceStatus === "loading" || balanceStatus === "refreshing"
              ? "Syncing"
              : "Ready"}
        </span>
      </div>

      <div className="empty-state empty-state-compact">
        <strong>How it works</strong>
        <p>
          Deposit supported USDC into a single Unified Balance, then spend that
          combined balance directly onto Arc Testnet without moving funds manually
          between every chain first.
        </p>
      </div>

      {!isSignedIn ? (
        <div className="empty-state">
          <strong>Connect wallet to use Unified Balance.</strong>
          <p>
            After connection, you can deposit from supported testnet EVM chains,
            check confirmed and pending Unified Balance totals, and spend onto Arc.
          </p>
        </div>
      ) : (
        <>
          <div className="wallet-summary-grid">
            <div className="wallet-summary-item">
              <span className="field-label">Confirmed balance</span>
              <strong>{balances?.totalConfirmedBalance || "0.00"} USDC</strong>
            </div>
            <div className="wallet-summary-item">
              <span className="field-label">Pending balance</span>
              <strong>{balances?.totalPendingBalance || "0.00"} USDC</strong>
            </div>
            <div className="wallet-summary-item">
              <span className="field-label">Tracked sources</span>
              <strong>{breakdown.length}</strong>
            </div>
            <div className="wallet-summary-item">
              <span className="field-label">Status</span>
              <strong>
                {balanceStatus === "error" ? "Unavailable" : "App Kit connected"}
              </strong>
            </div>
          </div>

          <div className="wallet-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={refreshBalances}
              disabled={balanceStatus === "loading" || balanceStatus === "refreshing"}
            >
              {balanceStatus === "loading" || balanceStatus === "refreshing"
                ? "Refreshing..."
                : "Refresh Unified Balance"}
            </button>
          </div>

          {balanceError ? (
            <div className="empty-state empty-state-compact">
              <strong>Unified Balance unavailable</strong>
              <p>{balanceError}</p>
            </div>
          ) : null}

          <div className="dashboard-grid">
            <form className="card nested-card" onSubmit={handleDeposit}>
              <div className="section-heading">
                <div>
                  <p className="section-kicker">Deposit</p>
                  <h2>Deposit USDC into Unified Balance</h2>
                </div>
              </div>

              <label className="composer-field">
                <span className="field-label">Source chain</span>
                <select
                  value={sourceChainId}
                  onChange={(event) => setSourceChainId(Number(event.target.value))}
                  className="composer-input"
                >
                  {UNIFIED_BALANCE_SOURCE_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="composer-field">
                <span className="field-label">Amount</span>
                <input
                  value={depositAmount}
                  onChange={(event) => setDepositAmount(normalizeAmount(event.target.value))}
                  placeholder="1.00"
                  inputMode="decimal"
                  className="composer-input"
                />
              </label>

              <button
                type="submit"
                className="button button-primary"
                disabled={actionStatus === "depositing" || isSwitchingChain}
              >
                {isSwitchingChain
                  ? "Switching..."
                  : actionStatus === "depositing"
                    ? "Confirm deposit..."
                    : "Deposit USDC"}
              </button>
            </form>

            <form className="card nested-card" onSubmit={handleSpend}>
              <div className="section-heading">
                <div>
                  <p className="section-kicker">Spend</p>
                  <h2>Spend Unified Balance on Arc</h2>
                </div>
              </div>

              <label className="composer-field">
                <span className="field-label">Recipient on Arc</span>
                <input
                  value={recipientAddress}
                  onChange={(event) => setRecipientAddress(event.target.value.trim())}
                  placeholder="0x..."
                  className="composer-input"
                />
              </label>

              <label className="composer-field">
                <span className="field-label">Amount</span>
                <input
                  value={spendAmount}
                  onChange={(event) => setSpendAmount(normalizeAmount(event.target.value))}
                  placeholder="1.00"
                  inputMode="decimal"
                  className="composer-input"
                />
              </label>

              <button
                type="submit"
                className="button button-primary"
                disabled={actionStatus === "spending" || isSwitchingChain}
              >
                {isSwitchingChain
                  ? "Switching..."
                  : actionStatus === "spending"
                    ? "Confirm spend..."
                    : "Spend on Arc"}
              </button>
            </form>
          </div>

          {actionError ? (
            <div className="empty-state empty-state-compact">
              <strong>Unified Balance action unavailable</strong>
              <p>{actionError}</p>
            </div>
          ) : null}

          {lastResult ? (
            <div className="empty-state empty-state-compact">
              <strong>Latest Unified Balance action completed</strong>
              <p>
                Transaction hash:{" "}
                {getPrimaryTxHash(lastResult) || lastResult.txHash || "Unavailable"}
              </p>
              {getPrimaryExplorerUrl(lastResult) ? (
                <a
                  href={getPrimaryExplorerUrl(lastResult)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open on explorer
                </a>
              ) : null}
            </div>
          ) : null}

          {breakdown.length ? (
            <div className="dashboard-grid">
              {breakdown.map((item) => (
                <article key={`${item.account}-${item.appKitChain}`} className="summary-card">
                  <span className="field-label">{item.chain}</span>
                  <strong>{item.confirmedBalance} USDC</strong>
                  <small>
                    Pending: {item.pendingBalance} USDC
                    {item.pendingTransactions.length
                      ? ` • ${item.pendingTransactions.length} pending`
                      : ""}
                  </small>
                </article>
              ))}
            </div>
          ) : balanceStatus === "ready" ? (
            <div className="empty-state empty-state-compact">
              <strong>No Unified Balance deposits yet.</strong>
              <p>
                Deposit USDC from a supported chain to start building a spendable
                crosschain balance.
              </p>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
