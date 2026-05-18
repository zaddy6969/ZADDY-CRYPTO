import { useCallback, useEffect, useState } from "react";

const REFRESH_INTERVAL_MS = 15000;

export function useArcWalletActivity(address) {
  const [activity, setActivity] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);
  const refresh = useCallback(() => {
    setRefreshIndex((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let intervalId;

    if (!address) {
      setActivity([]);
      setStatus("idle");
      setError("");
      return undefined;
    }

    setActivity([]);
    setStatus("loading");
    setError("");

    const loadActivity = async () => {
      try {
        setStatus((current) =>
          current === "ready" ? "refreshing" : "loading"
        );
        setError("");

        const response = await fetch(
          `/api/wallet-activity?address=${encodeURIComponent(address)}`
        );
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(
            payload.error ||
              "Activity temporarily unavailable. Please try again later."
          );
        }

        if (!cancelled) {
          setActivity(Array.isArray(payload.activity) ? payload.activity : []);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) {
          setActivity([]);
          setStatus("error");
          setError("Activity temporarily unavailable. Please try again later.");
        }
      }
    };

    loadActivity();
    intervalId = window.setInterval(loadActivity, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;

      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [address, refreshIndex]);

  return {
    activity,
    status,
    error,
    refresh
  };
}
