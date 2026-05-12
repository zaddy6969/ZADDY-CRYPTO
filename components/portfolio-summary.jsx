import {
  formatUsdValue,
  shortAddress
} from "../lib/arc-portfolio";

function AssetRow({ asset }) {
  return (
    <div className="asset-row">
      <div className={`asset-logo asset-logo-${asset.accent}`}>
        {asset.symbol.slice(0, 1)}
      </div>
      <div className="asset-copy">
        <strong>
          {asset.name} <span>{asset.symbol}</span>
        </strong>
        <small>{asset.tokenType}</small>
      </div>
      <div className="asset-metrics">
        <strong>{asset.balanceLabel}</strong>
        <span>
          {asset.hasValue
            ? formatUsdValue(asset.valueUsd)
            : "Estimated value unavailable"}
        </span>
      </div>
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="portfolio-skeleton-grid" aria-hidden="true">
      {[0, 1, 2].map((item) => (
        <div key={item} className="skeleton-card">
          <div className="skeleton-line skeleton-line-title" />
          <div className="skeleton-line skeleton-line-value" />
          <div className="skeleton-line skeleton-line-small" />
        </div>
      ))}
    </div>
  );
}

export default function PortfolioSummary({ walletSnapshot, portfolio }) {
  const { address, isSignedIn, onArc } = walletSnapshot || {};
  const {
    assets,
    totalValueUsd,
    pricedAssetsCount,
    status,
    error
  } = portfolio || {};

  const topAsset = assets?.[0];

  return (
    <section className="card" id="section-portfolio">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Portfolio Summary</p>
          <h2>Real Arc wallet balances</h2>
        </div>
        <span className="status-badge">
          {!isSignedIn
            ? "Wallet required"
            : status === "loading" || status === "refreshing"
              ? "Loading portfolio"
              : status === "error"
                ? "Unavailable"
                : "Live"}
        </span>
      </div>

      {!isSignedIn ? (
        <div className="empty-state">
          <strong>Connect wallet to view portfolio.</strong>
          <p>
            After wallet connection, this section loads supported Arc token
            balances and estimated values where pricing is available.
          </p>
        </div>
      ) : status === "loading" && (!assets || assets.length === 0) ? (
        <PortfolioSkeleton />
      ) : status === "error" ? (
        <div className="empty-state">
          <strong>Portfolio temporarily unavailable.</strong>
          <p>{error || "Please try again later."}</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="empty-state">
          <strong>No supported Arc token balances found.</strong>
          <p>
            This wallet is connected, but no supported Arc portfolio assets were
            detected in the latest balance check.
          </p>
        </div>
      ) : (
        <>
          <div className="portfolio-summary-grid">
            <div className="summary-card">
              <span className="field-label">Estimated portfolio value</span>
              <strong>{formatUsdValue(totalValueUsd)}</strong>
              <small>Based on priced assets only</small>
            </div>
            <div className="summary-card">
              <span className="field-label">Wallet summary</span>
              <strong>{shortAddress(address)}</strong>
              <small>{onArc ? "Arc Testnet connected" : "Wrong network detected"}</small>
            </div>
            <div className="summary-card">
              <span className="field-label">Top holding</span>
              <strong>{topAsset ? topAsset.symbol : "None"}</strong>
              <small>
                {topAsset
                  ? `${topAsset.balanceLabel} ${topAsset.symbol}`
                  : "No holdings found"}
              </small>
            </div>
            <div className="summary-card">
              <span className="field-label">Priced assets</span>
              <strong>{pricedAssetsCount}</strong>
              <small>Supported values available right now</small>
            </div>
          </div>

          <div className="asset-list">
            {assets.map((asset) => (
              <AssetRow key={`${asset.address}-${asset.symbol}`} asset={asset} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
