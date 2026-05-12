import { useMemo, useState } from "react";
import { ARC_AI_WALLET_ASSISTANT_LIMITS } from "../lib/arc-assistant-contract";
import { useArcAssistantContract } from "../lib/use-arc-assistant-contract";

const starterQuestions = [
  "Summarize my current wallet status.",
  "What does my recent activity suggest?",
  "What should I watch based on my USDC balance?",
  "What should I do after connecting my wallet?"
];

function MessageBubble({ message }) {
  return (
    <div className={`assistant-message ${message.role}`}>
      <span className="assistant-message-role">
        {message.role === "assistant" ? "AI Assistant" : "You"}
      </span>
      <p>{message.content}</p>
    </div>
  );
}

export default function WalletAssistant({
  activity,
  activityStatus,
  activityError,
  statCards,
  chainMetrics,
  assistantMode,
  walletSnapshot
}) {
  const { address, isConnected, onArc, usdcBalance, balanceStatus } =
    walletSnapshot || {};
  const {
    assistantName,
    contractAddress,
    contractConfigured,
    contractError,
    contractExplorerUrl,
    contractStatus,
    interactionCount,
    lastTransactionHash,
    latestInteraction,
    latestTransactionUrl,
    saveError,
    saveInteraction,
    saveStatus
  } = useArcAssistantContract();
  const [runtimeMode, setRuntimeMode] = useState(assistantMode || "local");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Ask about your wallet activity, Arc USDC balance, or recent dashboard events and I will keep the answer grounded in the current Arc dashboard context."
    }
  ]);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [latestOnchainDraft, setLatestOnchainDraft] = useState(null);
  const [notice, setNotice] = useState(
    "Responses stay grounded in the current wallet snapshot and visible Arc activity."
  );

  const walletSummary = useMemo(
    () => ({
      address: address || null,
      connected: isConnected,
      onArc,
      usdcBalance: balanceStatus === "ready" ? usdcBalance : balanceStatus,
      activityStatus,
      network: "Arc Testnet"
    }),
    [activityStatus, address, balanceStatus, isConnected, onArc, usdcBalance]
  );

  const askQuestion = async (nextQuestion) => {
    const trimmed = nextQuestion.trim();
    if (!trimmed || isLoading) return;

    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setQuestion("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/wallet-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: trimmed,
          messages: nextMessages.slice(-8),
          wallet: walletSummary,
          dashboard: {
            activity,
            activityStatus,
            activityError,
            statCards,
            chainMetrics
          }
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Assistant request failed.");
      }

      setRuntimeMode(payload.mode || assistantMode || "local");
      setNotice(payload.notice || "");

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            payload.answer ||
            "I couldn't produce an answer from the current wallet data."
        }
      ]);
      setLatestOnchainDraft({
        prompt: trimmed,
        response:
          payload.answer ||
          "I couldn't produce an answer from the current wallet data."
      });
    } catch (requestError) {
      setError(
        requestError.message ||
          "The wallet assistant is unavailable right now."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await askQuestion(question);
  };

  const handleSaveOnchain = async () => {
    if (!latestOnchainDraft) return;

    try {
      await saveInteraction(latestOnchainDraft);
    } catch {}
  };

  const canSaveOnchain =
    Boolean(latestOnchainDraft) &&
    contractConfigured &&
    saveStatus !== "awaiting-wallet" &&
    saveStatus !== "confirming";
  const hasUserMessages = messages.some((message) => message.role === "user");
  const showEmptyState = !hasUserMessages && !isLoading;

  return (
    <section className="panel assistant-panel" id="section-assistant">
      <div className="section-header">
        <div>
          <p className="eyebrow">AI Assistant</p>
          <h2>Wallet activity copilot</h2>
        </div>
        <span className="section-chip">
          {runtimeMode === "openai"
            ? isConnected
              ? "OpenAI live"
              : "OpenAI ready"
            : "Local analysis"}
        </span>
      </div>

      <div className="assistant-layout">
        <div className="assistant-chat">
          {notice ? (
            <div className="assistant-banner">{notice}</div>
          ) : null}

          <div className="assistant-messages">
            {showEmptyState ? (
              <div
                className={
                  !isConnected && !activityError
                    ? "assistant-state"
                    : activityError
                      ? "assistant-state assistant-state-error"
                      : "assistant-state"
                }
              >
                <span className="eyebrow">Assistant Ready</span>
                <strong>
                  {!isConnected
                    ? "Connect a wallet to unlock personalized Arc guidance."
                    : activityError
                      ? "Activity context is temporarily unavailable."
                      : "Ask a question about your Arc wallet and recent activity."}
                </strong>
                <p>
                  {!isConnected
                    ? "You can still explore the product, but connected wallets unlock live balance, network, and onchain activity context for better answers."
                    : activityError
                      ? activityError
                      : "The assistant will stay grounded in the wallet snapshot and the onchain activity currently visible in this dashboard."}
                </p>
              </div>
            ) : null}

            {messages.map((message, index) => (
              <MessageBubble
                key={`${message.role}-${index}`}
                message={message}
              />
            ))}
            {isLoading ? (
              <div className="assistant-message assistant">
                <span className="assistant-message-role">AI Assistant</span>
                <p>Thinking through your wallet context...</p>
              </div>
            ) : null}
          </div>

          <form className="assistant-form" onSubmit={handleSubmit}>
            <label className="assistant-label" htmlFor="wallet-question">
              Ask about wallet activity
            </label>
            <textarea
              id="wallet-question"
              className="assistant-input"
              placeholder={
                !isConnected
                  ? "Connect a wallet, or ask what this Arc dashboard can do."
                  : "Ask about the connected wallet, balance, or recent activity."
              }
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={4}
            />
            <div className="assistant-actions">
              <span className="assistant-hint">
                {runtimeMode === "openai"
                  ? "Answers are based on the current dashboard snapshot, not full explorer history."
                  : "Answers are based on the current dashboard snapshot visible here."}
              </span>
              <button
                type="submit"
                className="primary-button"
                disabled={isLoading}
              >
                {isLoading ? "Asking..." : "Ask Assistant"}
              </button>
            </div>
          </form>

          {error ? (
            <div className="assistant-state assistant-state-error assistant-inline-state">
              <span className="eyebrow">Assistant Error</span>
              <strong>We could not complete that request.</strong>
              <p>{error}</p>
            </div>
          ) : null}
        </div>

        <aside className="assistant-side">
          <div className="assistant-side-card">
            <span className="eyebrow">Live Context</span>
            <div className="assistant-context-list">
              <div className="assistant-context-row">
                <span>Address</span>
                <strong>{address || "Not connected"}</strong>
              </div>
              <div className="assistant-context-row">
                <span>Arc USDC</span>
                <strong>
                  {balanceStatus === "ready"
                    ? usdcBalance
                    : balanceStatus === "loading"
                      ? "Loading..."
                      : "Unavailable"}
                </strong>
              </div>
              <div className="assistant-context-row">
                <span>Network</span>
                <strong>{onArc ? "Arc Testnet" : "Not on Arc"}</strong>
              </div>
              <div className="assistant-context-row">
                <span>Activity feed</span>
                <strong>
                  {activityStatus === "loading"
                    ? "Loading..."
                    : activityStatus === "refreshing"
                      ? "Refreshing..."
                      : activityStatus === "error"
                        ? "Unavailable"
                        : activity.length > 0
                          ? `${activity.length} live events`
                          : "No recent events"}
                </strong>
              </div>
            </div>
          </div>

          <div className="assistant-side-card">
            <span className="eyebrow">Try Asking</span>
            <div className="assistant-suggestions">
              {starterQuestions.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="assistant-suggestion"
                  onClick={() => askQuestion(prompt)}
                  disabled={isLoading}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="assistant-side-card">
            <span className="eyebrow">Onchain Assistant</span>
            <div className="assistant-context-list">
              <div className="assistant-context-row">
                <span>Contract status</span>
                <strong>
                  {contractConfigured
                    ? contractStatus === "ready"
                      ? "Connected"
                      : contractStatus === "loading"
                        ? "Loading..."
                        : contractStatus
                    : "Not deployed"}
                </strong>
              </div>
              <div className="assistant-context-row">
                <span>Assistant name</span>
                <strong>{assistantName || "arc-ai-wallet"}</strong>
              </div>
              <div className="assistant-context-row">
                <span>Contract address</span>
                <strong>{contractAddress || "Run the Hardhat deploy first"}</strong>
              </div>
              <div className="assistant-context-row">
                <span>Total interactions</span>
                <strong>{contractConfigured ? interactionCount : "0"}</strong>
              </div>
              <div className="assistant-context-row">
                <span>Prompt limit</span>
                <strong>{ARC_AI_WALLET_ASSISTANT_LIMITS.prompt} chars</strong>
              </div>
              <div className="assistant-context-row">
                <span>Response limit</span>
                <strong>{ARC_AI_WALLET_ASSISTANT_LIMITS.response} chars</strong>
              </div>
            </div>

            {contractExplorerUrl ? (
              <a
                className="inline-link"
                href={contractExplorerUrl}
                target="_blank"
                rel="noreferrer"
              >
                View contract on ArcScan
              </a>
            ) : null}

            {latestInteraction ? (
              <div className="assistant-contract-preview">
                <span className="assistant-message-role">
                  Latest saved interaction
                </span>
                <strong>#{latestInteraction.interactionId}</strong>
                <p>{latestInteraction.prompt}</p>
                <p>{latestInteraction.response}</p>
                <span className="assistant-hint">
                  Saved {latestInteraction.createdAtLabel}
                </span>
              </div>
            ) : (
              <p className="assistant-hint">
                {contractConfigured
                  ? "No interaction has been saved from this wallet yet."
                  : "Deploy the assistant contract, then the frontend will read its address and onchain state here."}
              </p>
            )}

            <button
              type="button"
              className="primary-button"
              onClick={handleSaveOnchain}
              disabled={!canSaveOnchain}
            >
              {saveStatus === "awaiting-wallet"
                ? "Confirm in wallet..."
                : saveStatus === "confirming"
                  ? "Saving on Arc..."
                  : saveStatus === "success"
                    ? "Saved on Arc"
                    : "Save latest answer on Arc"}
            </button>

            {latestOnchainDraft ? (
              <div className="assistant-contract-preview compact">
                <span className="assistant-message-role">Ready to save</span>
                <p>{latestOnchainDraft.prompt}</p>
              </div>
            ) : (
              <p className="assistant-hint">
                Ask a question first, then you can write that prompt and answer to the Arc assistant contract.
              </p>
            )}

            {latestTransactionUrl ? (
              <a
                className="inline-link"
                href={latestTransactionUrl}
                target="_blank"
                rel="noreferrer"
              >
                View transaction {lastTransactionHash.slice(0, 10)}...
              </a>
            ) : null}

            {saveError ? <p className="wallet-error">{saveError}</p> : null}
            {contractError ? <p className="wallet-error">{contractError}</p> : null}
          </div>
        </aside>
      </div>
    </section>
  );
}
