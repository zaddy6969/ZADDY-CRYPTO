import { useEffect, useState } from "react";

const REFRESH_INTERVAL_MS = 30000;

export function useArcWalletActivity(address) {
  const [activity, setActivity] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

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
            payload.error || "Unable to load recent Arc wallet activity."
          );
        }

        if (!cancelled) {
          setActivity(Array.isArray(payload.activity) ? payload.activity : []);
          setStatus("ready");
        }
      } catch (requestError) {
        if (!cancelled) {
          setActivity([]);
          setStatus("error");
          setError(
            requestError.message ||
              "Unable to load recent Arc wallet activity."
          );
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
  }, [address]);

  return {
    activity,
    status,
    error
  };
}
