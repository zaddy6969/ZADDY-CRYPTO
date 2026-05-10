import { useState } from "react";

const sampleHashes = [
  "Paste an Arc testnet transaction hash to explain what happened.",
  "Works best for transfers, approvals, and common token actions."
];

export default function TransactionAnalyzer() {
  const [hash, setHash] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmed = hash.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/transaction-analyzer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ hash: trimmed })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Transaction analysis failed.");
      }

      setResult(payload.analysis);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to analyze this transaction right now."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="panel analyzer-panel" id="section-analyzer">
      <div className="section-header">
        <div>
          <p className="eyebrow">Transaction Analyzer</p>
          <h2>Explain blockchain activity in plain English</h2>
        </div>
        <span className="section-chip">
          Arc Testnet RPC
        </span>
      </div>

      <div className="analyzer-layout">
        <form className="analyzer-form" onSubmit={handleSubmit}>
          <label className="assistant-label" htmlFor="tx-hash">
            Transaction hash
          </label>
          <input
            id="tx-hash"
            className="assistant-input analyzer-input"
            placeholder="0x..."
            value={hash}
            onChange={(event) => setHash(event.target.value)}
          />

          <div className="analyzer-notes">
            {sampleHashes.map((note) => (
              <span key={note}>{note}</span>
            ))}
          </div>

          <div className="assistant-actions">
            <span className="assistant-hint">
              The analyzer fetches the Arc transaction, receipt, fees, and common token events before writing the explanation.
            </span>
            <button type="submit" className="primary-button" disabled={isLoading}>
              {isLoading ? "Analyzing..." : "Analyze Transaction"}
            </button>
          </div>

          {error ? <p className="wallet-error">{error}</p> : null}
        </form>

        <div className="analyzer-output">
          {result ? (
            <>
              <div className="assistant-side-card">
                <span className="eyebrow">Simple English</span>
                <p className="analyzer-explanation">{result.explanation}</p>
              </div>

              <div className="assistant-side-card">
                <span className="eyebrow">Key Facts</span>
                <div className="assistant-context-list">
                  <div className="assistant-context-row">
                    <span>Status</span>
                    <strong>{result.status}</strong>
                  </div>
                  <div className="assistant-context-row">
                    <span>From</span>
                    <strong>{result.summary.from}</strong>
                  </div>
                  <div className="assistant-context-row">
                    <span>To</span>
                    <strong>{result.summary.to || "Contract creation"}</strong>
                  </div>
                  <div className="assistant-context-row">
                    <span>Fee</span>
                    <strong>{result.summary.fee}</strong>
                  </div>
                  <div className="assistant-context-row">
                    <span>Block</span>
                    <strong>{result.summary.blockNumber}</strong>
                  </div>
                  <div className="assistant-context-row">
                    <span>Time</span>
                    <strong>{result.summary.timestamp}</strong>
                  </div>
                </div>
              </div>

              <div className="assistant-side-card">
                <span className="eyebrow">Highlights</span>
                <div className="analyzer-highlights">
                  {result.highlights.map((highlight) => (
                    <div key={highlight} className="analyzer-highlight">
                      {highlight}
                    </div>
                  ))}
                </div>
                <a
                  className="wallet-link"
                  href={result.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in ArcScan
                </a>
              </div>
            </>
          ) : (
            <div className="assistant-side-card analyzer-empty">
              <span className="eyebrow">Ready</span>
              <p className="analyzer-explanation">
                Paste a transaction hash and the analyzer will translate the onchain activity into short, readable English.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
