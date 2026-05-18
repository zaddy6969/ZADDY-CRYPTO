function shortenValue(value) {
  if (!value || value.length < 14) {
    return value || "";
  }

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function ActivityCard({ item }) {
  const sourceCopy =
    item.source === "merged"
      ? "Matched to a confirmed onchain wallet transaction"
      : item.source === "app"
        ? "Saved from an in-app wallet action"
        : "Tracked from live Arc onchain activity";
  const counterpartyLabel =
    item.kind === "sent"
      ? "Recipient"
      : item.kind === "received"
        ? "From"
        : item.kind === "bridge_received"
          ? "Destination"
          : "Counterparty";

  return (
    <article className="activity-card">
      <div className="activity-card-head">
        <div className="activity-card-copy">
          <strong>{item.type}</strong>
          <span>{item.summary || "Wallet activity recorded."}</span>
        </div>
        <div className="activity-card-amount">
          <strong>{item.amount || "Tracked event"}</strong>
          <span>{item.chain || "Arc Testnet"}</span>
        </div>
      </div>
      <div className="activity-card-meta">
        <span>{item.timeLabel || "Recently"}</span>
        <span>{item.status || "Confirmed"}</span>
        {item.txHashShort ? <span>{item.txHashShort}</span> : null}
      </div>
      <div className="activity-card-footer">
        <span>
          {item.recipient
            ? `${counterpartyLabel}: ${shortenValue(item.recipient)}`
            : sourceCopy}
        </span>
        {item.explorerUrl ? (
          <a href={item.explorerUrl} target="_blank" rel="noreferrer">
            View on explorer
          </a>
        ) : null}
      </div>
    </article>
  );
}

export default function TransactionActivity({
  walletSnapshot,
  items,
  liveStatus,
  liveError
}) {
  const isSignedIn = walletSnapshot?.isSignedIn;

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Activity</p>
          <h2>Wallet actions and Arc activity</h2>
        </div>
        <span className="status-badge">
          {!isSignedIn
            ? "Wallet required"
            : liveStatus === "loading" || liveStatus === "refreshing"
              ? "Syncing"
              : `${items.length} items`}
        </span>
      </div>

      {!isSignedIn ? (
        <div className="empty-state">
          <strong>Connect wallet to view activity.</strong>
          <p>
            This page combines local App Kit action history with recent Arc
            onchain activity for the connected wallet.
          </p>
        </div>
      ) : liveStatus === "loading" && items.length === 0 ? (
        <div className="empty-state">
          <strong>Loading activity...</strong>
          <p>Fetching recent Arc activity and local wallet actions.</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <strong>No transaction activity found yet.</strong>
          <p>
            Real sent, received, and bridge events will appear here after your
            wallet records them onchain.
          </p>
        </div>
      ) : (
        <div className="activity-feed">
          {items.map((item) => (
            <ActivityCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {liveStatus === "error" ? (
        <div className="empty-state empty-state-compact">
          <strong>Live Arc activity temporarily unavailable.</strong>
          <p>{liveError || "Please try again later."}</p>
        </div>
      ) : null}
    </section>
  );
}
