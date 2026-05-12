function shortenValue(value) {
  if (!value || value.length < 14) {
    return value || "";
  }

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function ActivityRow({ item }) {
  return (
    <article className="activity-card">
      <div className="activity-card-head">
        <div className="activity-card-copy">
          <strong>{item.type}</strong>
          <span>{item.summary}</span>
        </div>
        <div className="activity-card-amount">
          <strong>{item.amount || "Tracked event"}</strong>
          <span>{item.token || "Contract activity"}</span>
        </div>
      </div>
      <div className="activity-card-meta">
        <span>{item.timeLabel}</span>
        <span>Block {item.blockNumber}</span>
        <span>{item.txHashShort}</span>
      </div>
      <div className="activity-card-footer">
        <span>{shortenValue(item.contract)}</span>
        <a href={item.explorerUrl} target="_blank" rel="noreferrer">
          View on ArcScan
        </a>
      </div>
    </article>
  );
}

export default function TransactionActivity({
  isSignedIn,
  activity,
  status,
  error
}) {
  return (
    <section className="card" id="section-activity">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Wallet Feed</p>
          <h2>Recent Arc wallet activity</h2>
        </div>
        <span className="status-badge">
          {!isSignedIn
            ? "Wallet required"
            : status === "loading" || status === "refreshing"
              ? "Loading"
              : status === "error"
                ? "Unavailable"
                : `${activity.length} events`}
        </span>
      </div>

      {!isSignedIn ? (
        <div className="empty-state">
          <strong>Connect wallet to view activity.</strong>
          <p>
            Recent Arc transfers and approvals appear here after the wallet is
            connected and onchain activity loads successfully.
          </p>
        </div>
      ) : status === "loading" && activity.length === 0 ? (
        <div className="empty-state">
          <strong>Loading activity...</strong>
          <p>Fetching the latest Arc wallet transactions safely.</p>
        </div>
      ) : status === "error" ? (
        <div className="empty-state">
          <strong>Activity temporarily unavailable.</strong>
          <p>{error || "Please try again later."}</p>
        </div>
      ) : activity.length === 0 ? (
        <div className="empty-state">
          <strong>No transactions found.</strong>
          <p>No supported Arc activity was found in the latest safe lookback window.</p>
        </div>
      ) : (
        <div className="activity-feed">
          {activity.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
