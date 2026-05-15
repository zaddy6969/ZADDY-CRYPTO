import {
  formatUsdValue,
  getAssetLogoLabel,
  shortAddress
} from "../lib/arc-portfolio";

function AssetRow({ asset }) {
  const logoLabel = getAssetLogoLabel(asset);
  const assetAccent = asset.accent || "neutral";

  return (
    <article className="asset-row">
      <div className={`asset-logo asset-logo-${assetAccent}`}>
        <span>{logoLabel}</span>
      </div>
      <div className="asset-copy">
        <strong>
          {asset.name} <span>{asset.symbol || "TOKEN"}</span>
        </strong>
        <small>{asset.tokenType || "Tracked Arc asset"}</small>
      </div>
      <div className="asset-metrics">
        <strong>{asset.balanceLabel}</strong>
        <span>
          {asset.hasValue
            ? formatUsdValue(asset.valueUsd)
            : "Estimated value unavailable"}
        </span>
      </div>
      <div className="asset-metrics asset-metrics-trailing">
        <strong>{asset.allocation > 0 ? asset.allocation.toFixed(1) : "0.0"}%</strong>
        <span>{asset.allocationLabel}</span>
      </div>
    </article>
  );
}

function PortfolioSkeleton() {
  return (
    <>
      <div className="portfolio-skeleton-grid" aria-hidden="true">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="skeleton-card">
            <div className="skeleton-line skeleton-line-title" />
            <div className="skeleton-line skeleton-line-value" />
            <div className="skeleton-line skeleton-line-small" />
          </div>
        ))}
      </div>
      <div className="asset-list" aria-hidden="true">
        {[0, 1].map((item) => (
          <div key={item} className="skeleton-card">
            <div className="skeleton-line skeleton-line-title" />
            <div className="skeleton-line skeleton-line-value" />
          </div>
        ))}
      </div>
    </>
  );
}

export default function PortfolioSummary({ walletSnapshot, portfolio }) {
  const { address, isSignedIn, onArc } = walletSnapshot || {};
  const {
    assets = [],
    totalValueUsd = null,
    pricedAssetsCount = 0,
    nativeAsset = null,
    status = "idle",
    error = "",
    partialFailure = false
  } = portfolio || {};

  const topAsset = assets[0] || null;
  const isInitialLoading =
    status === "loading" && assets.length === 0 && !nativeAsset;

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
              ? "Refreshing"
              : status === "error"
                ? "Unavailable"
                : partialFailure
                  ? "Partial live data"
                  : "Live"}
        </span>
      </div>

      {!isSignedIn ? (
        <div className="empty-state">
          <strong>Connect wallet to view portfolio.</strong>
          <p>
            After wallet connection, this section loads native Arc balance,
            supported token balances, and estimated values where pricing is available.
          </p>
        </div>
      ) : isInitialLoading ? (
        <PortfolioSkeleton />
      ) : status === "error" ? (
        <div className="empty-state">
          <strong>Portfolio temporarily unavailable.</strong>
          <p>{error || "Please try again later."}</p>
        </div>
      ) : (
        <>
          <div className="portfolio-summary-grid">
            <div className="summary-card">
              <span className="field-label">Estimated portfolio value</span>
              <strong>{formatUsdValue(totalValueUsd)}</strong>
              <small>Based on priced token interface assets</small>
            </div>
            <div className="summary-card">
              <span className="field-label">Native Arc gas balance</span>
              <strong>
                {nativeAsset
                  ? `${nativeAsset.balanceLabel} ${nativeAsset.symbol}`
                  : "Balance unavailable"}
              </strong>
              <small>
                {nativeAsset
                  ? "Fetched from the Arc native balance"
                  : "Retrying Arc native balance reads"}
              </small>
            </div>
            <div className="summary-card">
              <span className="field-label">Wallet summary</span>
              <strong>{shortAddress(address)}</strong>
              <small>{onArc ? "Arc Testnet connected" : "Switch to Arc Testnet"}</small>
            </div>
            <div className="summary-card">
              <span className="field-label">Top holding</span>
              <strong>{topAsset ? topAsset.symbol : "No holdings yet"}</strong>
              <small>
                {topAsset
                  ? `${topAsset.balanceLabel} ${topAsset.symbol}`
                  : "No supported Arc assets detected yet"}
              </small>
            </div>
            <div className="summary-card">
              <span className="field-label">Tracked assets</span>
              <strong>{assets.length}</strong>
              <small>Visible token balances in this wallet</small>
            </div>
            <div className="summary-card">
              <span className="field-label">Priced assets</span>
              <strong>{pricedAssetsCount}</strong>
              <small>Estimated values available right now</small>
            </div>
          </div>

          {partialFailure ? (
            <p className="helper-copy">
              Some asset reads needed a retry, so this view may still fill in as Arc
              RPC responses settle.
            </p>
          ) : null}

          {assets.length === 0 ? (
            <div className="empty-state empty-state-compact">
              <strong>No supported Arc token balances found.</strong>
              <p>
                This wallet is connected, but no supported token balances were
                detected in the latest successful portfolio refresh.
              </p>
            </div>
          ) : (
            <div className="asset-list">
              {assets.map((asset) => (
                <AssetRow key={`${asset.address}-${asset.symbol}`} asset={asset} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
