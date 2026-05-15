import { useEffect, useMemo, useRef, useState } from "react";
import SendUsdcComposer from "./send-usdc-composer";
import { useArcAssistantContract } from "../lib/use-arc-assistant-contract";
import { arcTestnet } from "../lib/arc-chain";
import { buildWalletInsights } from "../lib/wallet-copilot";

const quickPrompts = [
  "Analyze my wallet",
  "What does this transaction do?",
  "How much USDC do I have?",
  "Show recent activity",
  "Is my portfolio risky?"
];

function MessageBubble({ role, content }) {
  return (
    <div className={`assistant-message assistant-message-${role}`}>
      <span className="field-label">
        {role === "assistant" ? "Wallet Copilot" : "You"}
      </span>
      <p>{content || "..."}</p>
    </div>
  );
}

function InsightCard({ item }) {
  return (
    <article className={`insight-card insight-card-${item.tone || "neutral"}`}>
      <span className="field-label">{item.title}</span>
      <strong>{item.body}</strong>
    </article>
  );
}

function ActionButton({ action, onAction, disabled }) {
  if (action.kind === "link") {
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noreferrer"
        className="button button-secondary"
      >
        {action.label}
      </a>
    );
  }

  return (
    <button
      type="button"
      className="button button-secondary"
      onClick={() => onAction(action)}
      disabled={disabled}
    >
      {action.label}
    </button>
  );
}

function extractLastExchange(messages) {
  const assistant = [...messages].reverse().find((item) => item.role === "assistant");
  const user = [...messages].reverse().find((item) => item.role === "user");

  return {
    prompt: user?.content || "",
    response: assistant?.content || ""
  };
}

export default function WalletAssistant({
  walletSnapshot,
  portfolio,
  activity,
  activityStatus
}) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "I'm your Arc wallet copilot. Ask me to analyze balances, explain a transaction, check risk, or prepare a USDC action."
    }
  ]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("Wallet Copilot Ready");
  const [error, setError] = useState("");
  const [actions, setActions] = useState([]);
  const [insights, setInsights] = useState([]);
  const [isComposerOpen, setComposerOpen] = useState(false);
  const autoAnalyzeAddressRef = useRef("");
  const assistantContract = useArcAssistantContract();

  const assistantContext = useMemo(
    () => ({
      wallet: {
        address: walletSnapshot?.address || "",
        connected: Boolean(walletSnapshot?.isSignedIn),
        onArc: Boolean(walletSnapshot?.onArc),
        usdcBalance: walletSnapshot?.usdcBalance || "",
        balanceStatus: walletSnapshot?.balanceStatus || "idle"
      },
      portfolio: {
        status: portfolio?.status || "idle",
        totalValueUsd: portfolio?.totalValueUsd ?? null,
        assets: portfolio?.assets || []
      },
      activity: {
        status: activityStatus,
        items: activity || []
      }
    }),
    [activity, activityStatus, portfolio, walletSnapshot]
  );

  useEffect(() => {
    setInsights(buildWalletInsights(assistantContext));
  }, [assistantContext]);

  const streamAssistantReply = async (nextMessages, trimmed) => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question: trimmed,
        messages: nextMessages.slice(-8),
        context: assistantContext
      })
    });

    if (!response.ok || !response.body) {
      throw new Error("AI assistant temporarily unavailable.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let done = false;

    while (!done) {
      const { done: readerDone, value } = await reader.read();

      if (readerDone) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() || "";

      for (const frame of frames) {
        const dataLine = frame
          .split("\n")
          .find((line) => line.startsWith("data:"));

        if (!dataLine) {
          continue;
        }

        let payload;

        try {
          payload = JSON.parse(dataLine.slice(5).trim());
        } catch {
          continue;
        }

        if (payload.type === "delta") {
          setMessages((current) => {
            const updated = [...current];
            const last = updated[updated.length - 1];

            if (last?.role === "assistant") {
              updated[updated.length - 1] = {
                ...last,
                content: `${last.content || ""}${payload.delta || ""}`
              };
            }

            return updated;
          });
        }

        if (payload.type === "meta") {
          setNotice(payload.notice || "Wallet Copilot Ready");
          setInsights(
            Array.isArray(payload.insights) && payload.insights.length
              ? payload.insights
              : buildWalletInsights(assistantContext)
          );
          setActions(Array.isArray(payload.actions) ? payload.actions : []);
        }

        if (payload.type === "done") {
          done = true;
          break;
        }
      }
    }
  };

  const askAssistant = async (input) => {
    const trimmed = input.trim();

    if (!trimmed || loading) {
      return;
    }

    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setQuestion("");
    setError("");
    setLoading(true);

    try {
      await streamAssistantReply(nextMessages, trimmed);
    } catch {
      setMessages((current) =>
        current.filter((item, index) => {
          if (index < current.length - 1) {
            return true;
          }

          return item.content;
        })
      );
      setError("Wallet Copilot is temporarily unavailable. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      walletSnapshot?.isSignedIn &&
      walletSnapshot?.address &&
      autoAnalyzeAddressRef.current !== walletSnapshot.address
    ) {
      autoAnalyzeAddressRef.current = walletSnapshot.address;
      setTimeout(() => {
        askAssistant("Analyze my wallet");
      }, 120);
    }
  }, [walletSnapshot?.address, walletSnapshot?.isSignedIn]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await askAssistant(question);
  };

  const handleAction = async (action) => {
    if (action.kind === "prompt" && action.prompt) {
      await askAssistant(action.prompt);
      return;
    }

    if (action.kind === "composer" && action.composer === "send-usdc") {
      setComposerOpen(true);
    }
  };

  const handleSaveLatest = async () => {
    const { prompt, response } = extractLastExchange(messages);
    setError("");

    try {
      await assistantContract.saveInteraction({
        prompt,
        response
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save the latest answer on Arc."
      );
    }
  };

  return (
    <section className="card" id="section-assistant">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Wallet Copilot</p>
          <h2>AI-powered wallet intelligence built on Arc</h2>
        </div>
        <span className="status-badge">
          {loading
            ? "Thinking"
            : walletSnapshot?.isSignedIn
              ? walletSnapshot?.onArc
                ? "Arc ready"
                : "Switch network"
              : "Preview mode"}
        </span>
      </div>

      <div className="copilot-summary-grid">
        <div className="summary-card">
          <span className="field-label">Connected wallet</span>
          <strong>{walletSnapshot?.address || "No wallet connected"}</strong>
          <small>
            {walletSnapshot?.onArc
              ? "Arc Testnet connected"
              : "Switch to Arc Testnet for full AI actions"}
          </small>
        </div>
        <div className="summary-card">
          <span className="field-label">Visible balance</span>
          <strong>{walletSnapshot?.usdcBalance || "Balance syncing"}</strong>
          <small>
            {walletSnapshot?.balanceStatus === "ready"
              ? "Live wallet snapshot"
              : "Waiting for Arc balance data"}
          </small>
        </div>
        <div className="summary-card">
          <span className="field-label">Recent activity</span>
          <strong>{Array.isArray(activity) ? activity.length : 0} events</strong>
          <small>
            {activityStatus === "ready"
              ? "Loaded from Arc RPC"
              : "Fetching latest Arc wallet feed"}
          </small>
        </div>
      </div>

      {notice ? <p className="helper-copy">{notice}</p> : null}
      {!walletSnapshot?.isSignedIn ? (
        <p className="helper-copy">
          Copilot can answer in preview mode right now. Connect your wallet for live
          Arc balances, wallet activity, and onchain actions.
        </p>
      ) : null}

      <div className="insight-grid">
        {insights.map((item) => (
          <InsightCard key={item.id} item={item} />
        ))}
      </div>

      <div className="prompt-row">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="prompt-chip"
            onClick={() => askAssistant(prompt)}
            disabled={loading}
          >
            {prompt}
          </button>
        ))}
      </div>

      {actions.length ? (
        <div className="action-row">
          {actions.map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              onAction={handleAction}
              disabled={loading}
            />
          ))}
        </div>
      ) : null}

      <div className="assistant-thread">
        {messages.map((message, index) => (
          <MessageBubble
            key={`${message.role}-${index}`}
            role={message.role}
            content={message.content}
          />
        ))}

        {loading ? (
          <div className="assistant-message assistant-message-assistant">
            <span className="field-label">Wallet Copilot</span>
            <p>Analyzing your Arc wallet context...</p>
          </div>
        ) : null}
      </div>

      <form className="assistant-form" onSubmit={handleSubmit}>
        <textarea
          className="assistant-input"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about your wallet activity..."
          rows={4}
        />
        <div className="assistant-form-row">
          <span className="helper-copy">
            Ask things like "What does this transaction do?" or "How much USDC do I have?"
          </span>
          <button
            type="submit"
            className="button button-primary"
            disabled={loading}
          >
            {loading ? "Thinking..." : "Ask Copilot"}
          </button>
        </div>
      </form>

      <SendUsdcComposer
        open={isComposerOpen}
        walletAddress={walletSnapshot?.address}
        onClose={() => setComposerOpen(false)}
        onTransactionSubmitted={(hash) => {
          setNotice("USDC transfer submitted to your wallet.");
          setActions((current) => [
            {
              id: "view-transfer",
              label: "View submitted transfer",
              kind: "link",
              href: `${arcTestnet.blockExplorers.default.url}/tx/${hash}`
            },
            ...current
          ]);
        }}
      />

      <div className="assistant-actions-panel">
        <div className="summary-card">
          <span className="field-label">Onchain memory</span>
          <strong>
            {assistantContract.contractStatus === "ready"
              ? assistantContract.assistantName || "Arc AI Wallet"
              : "Contract syncing"}
          </strong>
          <small>
            {assistantContract.contractStatus === "ready"
              ? `${assistantContract.interactionCount} saved interactions on Arc`
              : "The assistant contract is loading from Arc Testnet"}
          </small>
        </div>

        <div className="wallet-actions">
          <button
            type="button"
            className="button button-primary"
            onClick={handleSaveLatest}
            disabled={
              !walletSnapshot?.isSignedIn ||
              !walletSnapshot?.onArc ||
              assistantContract.saveStatus === "awaiting-wallet" ||
              assistantContract.saveStatus === "confirming" ||
              loading
            }
          >
            {assistantContract.saveStatus === "awaiting-wallet"
              ? "Confirm in wallet..."
              : assistantContract.saveStatus === "confirming"
                ? "Saving on Arc..."
                : !walletSnapshot?.isSignedIn
                  ? "Connect wallet to save on Arc"
                  : "Save latest answer on Arc"}
          </button>
          {assistantContract.contractExplorerUrl ? (
            <a
              href={assistantContract.contractExplorerUrl}
              target="_blank"
              rel="noreferrer"
              className="button button-secondary"
            >
              View assistant contract
            </a>
          ) : null}
        </div>
      </div>

      {assistantContract.latestInteraction ? (
        <div className="empty-state empty-state-compact">
          <strong>Latest saved copilot memory</strong>
          <p>
            Stored on {assistantContract.latestInteraction.createdAtLabel}. Prompt:{" "}
            {assistantContract.latestInteraction.prompt}
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="empty-state empty-state-compact">
          <strong>Wallet Copilot needs attention.</strong>
          <p>{error}</p>
        </div>
      ) : null}
    </section>
  );
}
