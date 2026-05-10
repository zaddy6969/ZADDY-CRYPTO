import { useMemo, useState } from "react";
import { useArcWalletSnapshot } from "../lib/use-arc-wallet-snapshot";

const starterQuestions = [
  "Summarize my current wallet status.",
  "What does my recent activity suggest?",
  "What should I watch based on my USDC balance?",
  "Explain arc-ai-wallet like I'm a new user."
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
  statCards,
  chainMetrics,
  assistantMode
}) {
  const {
    address,
    isConnected,
    onArc,
    usdcBalance,
    balanceStatus
  } = useArcWalletSnapshot();
  const [runtimeMode, setRuntimeMode] = useState(assistantMode || "local");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        assistantMode === "openai"
          ? "Ask about your wallet activity, USDC balance, or the recent dashboard events and I'll explain what the current data suggests."
          : "Ask anything about the current dashboard. OpenAI is not configured yet, so I'll answer using local dashboard analysis."
    }
  ]);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(
    assistantMode === "openai"
      ? ""
      : "Running in local analysis mode until OPENAI_API_KEY is added to the active environment."
  );

  const walletSummary = useMemo(
    () => ({
      address: address || null,
      connected: isConnected,
      onArc,
      usdcBalance: balanceStatus === "ready" ? usdcBalance : balanceStatus,
      network: "Arc Testnet"
    }),
    [address, balanceStatus, isConnected, onArc, usdcBalance]
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
            <div className="assistant-banner">
              {notice}
            </div>
          ) : null}

          <div className="assistant-messages">
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
                runtimeMode === "openai"
                  ? "Why might my recent activity matter?"
                  : "Ask about the connected wallet, balance, or recent activity."
              }
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={4}
            />
            <div className="assistant-actions">
              <span className="assistant-hint">
                {runtimeMode === "openai"
                  ? "The assistant uses the current dashboard snapshot, not full explorer history."
                  : "This mode reasons from the dashboard snapshot locally while OpenAI setup is missing or unavailable."}
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

          {error ? <p className="wallet-error">{error}</p> : null}
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
        </aside>
      </div>
    </section>
  );
}
