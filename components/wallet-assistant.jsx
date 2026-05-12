import { useMemo, useState } from "react";

const quickPrompts = [
  "Summarize wallet",
  "Explain latest transaction",
  "Risk check",
  "Portfolio insights"
];

function MessageBubble({ role, content }) {
  return (
    <div className={`assistant-message assistant-message-${role}`}>
      <span className="field-label">
        {role === "assistant" ? "AI Assistant" : "You"}
      </span>
      <p>{content}</p>
    </div>
  );
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
        "Ask about your wallet activity and I will keep the answer short, practical, and grounded in the current Arc dashboard data."
    }
  ]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(
    "The assistant reads your connected wallet, supported balances, and recent Arc activity."
  );
  const [error, setError] = useState("");

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
        totalValueUsd: portfolio?.totalValueUsd || 0,
        assets: portfolio?.assets || []
      },
      activity: {
        status: activityStatus,
        items: activity || []
      }
    }),
    [activity, activityStatus, portfolio, walletSnapshot]
  );

  const askAssistant = async (input) => {
    const trimmed = input.trim();

    if (!trimmed || loading) {
      return;
    }

    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setQuestion("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai-assistant", {
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

      const payload = await response.json();

      if (!response.ok) {
        throw new Error("AI assistant temporarily unavailable.");
      }

      setNotice(payload.notice || "");
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            payload.answer ||
            "I could not analyze that wallet state right now."
        }
      ]);
    } catch {
      setError("AI assistant temporarily unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await askAssistant(question);
  };

  return (
    <section className="card" id="section-assistant">
      <div className="section-heading">
        <div>
          <p className="section-kicker">AI Assistant</p>
          <h2>Simple wallet guidance</h2>
        </div>
        <span className="status-badge">
          {loading ? "Thinking" : "Ready"}
        </span>
      </div>

      {notice ? <p className="helper-copy">{notice}</p> : null}

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
            <span className="field-label">AI Assistant</span>
            <p>Reviewing your wallet activity...</p>
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
            Keep questions simple for the best Arc wallet summary.
          </span>
          <button
            type="submit"
            className="button button-primary"
            disabled={loading}
          >
            {loading ? "Thinking..." : "Ask Assistant"}
          </button>
        </div>
      </form>

      {error ? (
        <div className="empty-state empty-state-compact">
          <strong>AI assistant temporarily unavailable.</strong>
          <p>{error}</p>
        </div>
      ) : null}
    </section>
  );
}
