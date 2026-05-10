import { useEffect, useState } from "react";
import { buildUnavailableMarketData } from "./market-prices";

export function useMarketPrices(initialMarketData) {
  const [marketData, setMarketData] = useState(
    initialMarketData || buildUnavailableMarketData()
  );
  const [status, setStatus] = useState(
    initialMarketData?.updatedAt ? "ready" : "loading"
  );

  useEffect(() => {
    let cancelled = false;

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

    loadPrices();

    const intervalId = setInterval(loadPrices, 30_000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return {
    marketData,
    status
  };
}
