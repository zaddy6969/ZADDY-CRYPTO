export const TRACKED_ASSETS = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    currency: "BTC",
    productId: "BTC-USD"
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    currency: "ETH",
    productId: "ETH-USD"
  },
  {
    symbol: "SOL",
    name: "Solana",
    currency: "SOL",
    productId: "SOL-USD"
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    currency: "USDC",
    productId: null
  }
];

const MARKET_CACHE_TTL_MS = 30_000;

let cachedMarketData = null;
let cachedAt = 0;

function buildUnavailableAsset(asset) {
  return {
    symbol: asset.symbol,
    name: asset.name,
    priceUsd: null,
    change24h: null
  };
}

export function buildUnavailableMarketData() {
  return {
    assets: TRACKED_ASSETS.map(buildUnavailableAsset),
    updatedAt: null,
    source: "coinbase",
    sourceStatus: "unavailable"
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Market request failed with ${response.status}.`);
  }

  return response.json();
}

async function fetchSpotPriceUsd(currency) {
  const payload = await fetchJson(
    `https://api.coinbase.com/v2/exchange-rates?currency=${currency}`
  );
  const usdRate = Number(payload?.data?.rates?.USD);

  if (!Number.isFinite(usdRate)) {
    throw new Error(`Missing USD rate for ${currency}.`);
  }

  return usdRate;
}

async function fetchExchangeStats(productId) {
  const payload = await fetchJson(
    `https://api.exchange.coinbase.com/products/${productId}/stats`
  );
  const last = Number(payload?.last);
  const open = Number(payload?.open);

  if (!Number.isFinite(last) || last <= 0) {
    throw new Error(`Missing last price for ${productId}.`);
  }

  return {
    last,
    change24h:
      Number.isFinite(open) && open > 0
        ? ((last - open) / open) * 100
        : null
  };
}

async function fetchAssetMarketData(asset) {
  if (!asset.productId) {
    const spotPriceUsd = await fetchSpotPriceUsd(asset.currency);

    return {
      symbol: asset.symbol,
      name: asset.name,
      priceUsd: spotPriceUsd,
      change24h: null
    };
  }

  try {
    const stats = await fetchExchangeStats(asset.productId);

    return {
      symbol: asset.symbol,
      name: asset.name,
      priceUsd: stats.last,
      change24h: stats.change24h
    };
  } catch {
    const spotPriceUsd = await fetchSpotPriceUsd(asset.currency);

    return {
      symbol: asset.symbol,
      name: asset.name,
      priceUsd: spotPriceUsd,
      change24h: null
    };
  }
}

export async function getLiveMarketPrices(options = {}) {
  const maxAgeMs = options.maxAgeMs ?? MARKET_CACHE_TTL_MS;
  const now = Date.now();

  if (cachedMarketData && now - cachedAt < maxAgeMs) {
    return cachedMarketData;
  }

  try {
    const assets = await Promise.all(
      TRACKED_ASSETS.map((asset) => fetchAssetMarketData(asset))
    );

    const marketData = {
      assets,
      updatedAt: new Date().toISOString(),
      source: "coinbase",
      sourceStatus: "live"
    };

    cachedMarketData = marketData;
    cachedAt = now;

    return marketData;
  } catch {
    if (cachedMarketData) {
      return {
        ...cachedMarketData,
        sourceStatus: "stale"
      };
    }

    return buildUnavailableMarketData();
  }
}

export function formatUsdPrice(value) {
  if (!Number.isFinite(value)) {
    return "Unavailable";
  }

  const fractionDigits =
    value >= 1000 ? 0 : value >= 1 ? 2 : 4;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value);
}

export function formatPercentChange(value) {
  if (!Number.isFinite(value)) {
    return "Spot";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatMarketUpdatedAt(value) {
  if (!value) {
    return "Live feed unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}
