import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { createArcAppKitClient, formatAppKitError } from "./arc-app-kit";

export function useUnifiedBalanceSummary(isEnabled) {
  const { connector } = useAccount();
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!connector || !isEnabled) {
      setSummary(null);
      setStatus("idle");
      setError("");
      return undefined;
    }

    const load = async () => {
      setStatus("loading");
      setError("");

      try {
        const provider = await connector.getProvider();
        const client = await createArcAppKitClient(provider);
        const balances = await client.kit.unifiedBalance.getBalances({
          sources: [{ adapter: client.adapter }],
          token: "USDC",
          networkType: "testnet",
          includePending: true
        });

        if (!cancelled) {
          setSummary(balances);
          setStatus("ready");
        }
      } catch (nextError) {
        if (!cancelled) {
          setSummary(null);
          setStatus("error");
          setError(
            formatAppKitError(
              nextError,
              "Unified Balance is temporarily unavailable."
            )
          );
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [connector, isEnabled]);

  return {
    summary,
    status,
    error
  };
}
