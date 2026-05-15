import { erc20Abi, isAddress, parseUnits } from "viem";
import { useMemo, useState } from "react";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract
} from "wagmi";
import { ARC_USDC_ERC20_ADDRESS, arcTestnet } from "../lib/arc-chain";

function normalizeAmount(value) {
  return String(value || "").replace(/[^\d.]/g, "");
}

function shortAddress(address) {
  if (!address) {
    return "";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function normalizeUiError(error) {
  const message = error instanceof Error ? error.message : "";

  if (!message) {
    return "Unable to prepare the USDC transfer.";
  }

  if (message.toLowerCase().includes("user rejected")) {
    return "The wallet request was rejected before the transfer was submitted.";
  }

  if (message.toLowerCase().includes("insufficient")) {
    return "The wallet does not have enough balance or gas to complete this transfer.";
  }

  return message;
}

export default function SendUsdcComposer({
  walletAddress,
  open,
  onClose,
  onTransactionSubmitted
}) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { data: hash, error: writeError, isPending, writeContractAsync, reset } =
    useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      chainId: arcTestnet.id,
      hash
    });
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState("");
  const recipientValid = Boolean(recipient) && isAddress(recipient);
  const amountValue = Number(amount || 0);
  const amountValid = Boolean(amount) && Number.isFinite(amountValue) && amountValue > 0;
  const networkReady = chainId === arcTestnet.id;

  const explorerUrl = useMemo(() => {
    if (!hash) {
      return "";
    }

    return `${arcTestnet.blockExplorers.default.url}/tx/${hash}`;
  }, [hash]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!isConnected || !walletAddress) {
      setFormError("Connect your wallet before sending USDC.");
      return;
    }

    if (!isAddress(recipient)) {
      setFormError("Enter a valid wallet address.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setFormError("Enter a valid USDC amount.");
      return;
    }

    try {
      if (chainId !== arcTestnet.id && switchChainAsync) {
        await switchChainAsync({ chainId: arcTestnet.id });
      }

      const transactionHash = await writeContractAsync({
        address: ARC_USDC_ERC20_ADDRESS,
        abi: erc20Abi,
        functionName: "transfer",
        args: [recipient, parseUnits(amount, 6)],
        chainId: arcTestnet.id
      });

      onTransactionSubmitted?.(transactionHash);
    } catch (error) {
      setFormError(normalizeUiError(error));
    }
  };

  const handleClose = () => {
    setRecipient("");
    setAmount("");
    setFormError("");
    reset?.();
    onClose?.();
  };

  return (
    <div className="composer-panel">
      <div className="section-heading">
        <div>
          <p className="section-kicker">AI Action</p>
          <h2>Send USDC with wallet confirmation</h2>
        </div>
        <button type="button" className="button button-secondary" onClick={handleClose}>
          Close
        </button>
      </div>

      <form className="composer-form" onSubmit={handleSubmit}>
        <div className="composer-summary-grid">
          <div className="summary-card">
            <span className="field-label">Sender</span>
            <strong>{walletAddress ? shortAddress(walletAddress) : "No wallet connected"}</strong>
            <small>Wallet confirmation is required before broadcast.</small>
          </div>
          <div className="summary-card">
            <span className="field-label">Recipient</span>
            <strong>{recipient ? shortAddress(recipient) : "Waiting for address"}</strong>
            <small>
              {recipient
                ? recipientValid
                  ? "Valid wallet address detected."
                  : "Address format is not valid yet."
                : "Paste the destination wallet address."}
            </small>
          </div>
          <div className="summary-card">
            <span className="field-label">Amount</span>
            <strong>{amountValid ? `${amount} USDC` : "0.00 USDC"}</strong>
            <small>USDC transfers use the Arc native payment model.</small>
          </div>
          <div className="summary-card">
            <span className="field-label">Network</span>
            <strong>{networkReady ? "Arc Testnet" : "Network switch required"}</strong>
            <small>
              {networkReady
                ? "Ready to submit on chain ID 5042002."
                : "The app will request a switch before sending."}
            </small>
          </div>
        </div>

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
          <span className="field-label">Amount</span>
          <input
            value={amount}
            onChange={(event) => setAmount(normalizeAmount(event.target.value))}
            placeholder="0.00"
            className="composer-input"
            inputMode="decimal"
          />
        </label>

        <div className="empty-state empty-state-compact">
          <strong>Transaction safety check</strong>
          <p>
            {recipient && !recipientValid
              ? "The recipient address is not valid yet, so the transfer is blocked."
              : !amountValid
                ? "Enter a positive USDC amount to unlock the transfer action."
                : !networkReady
                  ? "The wallet is not on Arc Testnet yet. The app will request the correct network before submission."
                  : "Review the recipient and amount carefully. This transfer will move real testnet USDC once you confirm in your wallet."}
          </p>
        </div>

        <div className="composer-actions">
          <button
            type="submit"
            className="button button-primary"
            disabled={isPending || isConfirming || isSwitching}
          >
            {isSwitching
              ? "Switching network..."
              : isPending
                ? "Confirm in wallet..."
                : isConfirming
                  ? "Submitting..."
                  : "Send USDC"}
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={handleClose}
          >
            Cancel
          </button>
        </div>
      </form>

      {formError ? (
        <div className="empty-state empty-state-compact">
          <strong>Action blocked</strong>
          <p>{formError}</p>
        </div>
      ) : null}

      {writeError?.message && !formError ? (
        <div className="empty-state empty-state-compact">
          <strong>Transfer not submitted</strong>
          <p>{writeError.message}</p>
        </div>
      ) : null}

      {hash ? (
        <div className="empty-state empty-state-compact">
          <strong>{isConfirmed ? "Transfer confirmed" : "Transfer pending"}</strong>
          <p>
            {isConfirmed
              ? "Your USDC transfer was confirmed on Arc Testnet."
              : "Your transfer is waiting for Arc Testnet confirmation."}
          </p>
          {explorerUrl ? (
            <a href={explorerUrl} target="_blank" rel="noreferrer">
              View transaction on ArcScan
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
