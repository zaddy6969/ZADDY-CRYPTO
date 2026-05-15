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
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to prepare the USDC transfer."
      );
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
