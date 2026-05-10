import { useEffect, useState } from "react";
import { buildUnavailableMarketData } from "./market-prices";

const MARKET_REFRESH_INTERVAL_MS = 30_000;

export function useMarketPrices(initialMarketData) {
  const [marketData, setMarketData] = useState(
    initialMarketData || buildUnavailableMarketData()
  );
  const [status, setStatus] = useState(
    initialMarketData?.updatedAt ? "ready" : "loading"
  );

  useEffect(() => {
    let cancelled = false;
    let timeoutId;

    const loadPrices = async () => {
      try {
        const response = await fetch("/api/market-prices");
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Unable to fetch market prices.");
        }

        if (!cancelled) {
          setMarketData(payload.marketData || buildUnavailableMarketData());
          setStatus("ready");
        }
      } catch {
        if (!cancelled) {
          setStatus((currentStatus) =>
            currentStatus === "ready" ? currentStatus : "error"
          );
        }
      }
    };

    const hasFreshInitialData = Boolean(initialMarketData?.updatedAt);

    if (hasFreshInitialData) {
      timeoutId = setTimeout(loadPrices, MARKET_REFRESH_INTERVAL_MS);
    } else {
      loadPrices();
    }

    const intervalId = setInterval(loadPrices, MARKET_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [initialMarketData?.updatedAt]);

  return {
    marketData,
    status
  };
}
