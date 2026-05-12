function ActivityRow({ item }) {
  return (
    <div className="activity-row">
      <div>
        <strong>{item.type}</strong>
        <span>{item.summary}</span>
      </div>
      <div>
        <strong>{item.token || "Contract"}</strong>
        <span>{item.contract}</span>
      </div>
      <div>
        <strong>{item.amount || "N/A"}</strong>
        <span>Block {item.blockNumber}</span>
      </div>
      <div>
        <strong>{item.txHashShort}</strong>
        <span>{item.timeLabel}</span>
      </div>
      <div className="activity-link-cell">
        <a href={item.explorerUrl} target="_blank" rel="noreferrer">
          View on ArcScan
        </a>
      </div>
    </div>
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
          <p className="section-kicker">Transaction Activity</p>
          <h2>Latest Arc wallet activity</h2>
        </div>
        <span className="status-badge">
          {!isSignedIn
            ? "Wallet required"
            : status === "loading" || status === "refreshing"
              ? "Loading"
              : status === "error"
                ? "Unavailable"
                : `${activity.length} items`}
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
        <div className="activity-list">
          {activity.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
