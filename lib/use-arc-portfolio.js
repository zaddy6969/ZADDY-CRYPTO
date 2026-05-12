import { formatUnits, erc20Abi, getAddress } from "viem";
import { useEffect, useMemo, useState } from "react";
import { usePublicClient } from "wagmi";
import { arcTestnet } from "./arc-chain";
import {
  ARC_PORTFOLIO_ASSETS,
  formatTokenBalance
} from "./arc-portfolio";

const EMPTY_STATE = {
  assets: [],
  totalValueUsd: 0,
  pricedAssetsCount: 0,
  status: "idle",
  error: ""
};

function normalizeAddress(address) {
  if (!address) {
    return "";
  }

  try {
    return getAddress(address);
  } catch {
    return address;
  }
}

function deriveAllocation(assets, totalValueUsd) {
  return assets.map((asset) => ({
    ...asset,
    allocation:
      totalValueUsd > 0 && typeof asset.valueUsd === "number"
        ? (asset.valueUsd / totalValueUsd) * 100
        : 0
  }));
}

export function useArcPortfolio(address) {
  const publicClient = usePublicClient({ chainId: arcTestnet.id });
  const [portfolio, setPortfolio] = useState(EMPTY_STATE);

  const normalizedAddress = useMemo(
    () => normalizeAddress(address),
    [address]
  );

  useEffect(() => {
    let cancelled = false;

    if (!normalizedAddress || !publicClient) {
      setPortfolio(EMPTY_STATE);
      return undefined;
    }

    const loadPortfolio = async () => {
      try {
        setPortfolio((current) => ({
          ...current,
          status: current.assets.length > 0 ? "refreshing" : "loading",
          error: ""
        }));

        const balances = await publicClient.multicall({
          allowFailure: true,
          contracts: ARC_PORTFOLIO_ASSETS.map((asset) => ({
            address: asset.address,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [normalizedAddress]
          }))
        });

        if (cancelled) {
          return;
        }

        const mappedAssets = ARC_PORTFOLIO_ASSETS.map((asset, index) => {
          const result = balances[index];
          const rawBalance =
            result?.status === "success" && typeof result.result === "bigint"
              ? result.result
              : 0n;
          const balance = Number(formatUnits(rawBalance, asset.decimals));
          const valueUsd =
            typeof asset.priceUsd === "number" ? balance * asset.priceUsd : null;

          return {
            ...asset,
            rawBalance,
            balance,
            balanceLabel: formatTokenBalance(balance),
            valueUsd,
            hasValue: typeof valueUsd === "number" && Number.isFinite(valueUsd)
          };
        });

        const visibleAssets = mappedAssets.filter(
          (asset) => asset.rawBalance > 0n
        );
        const totalValueUsd = visibleAssets.reduce((sum, asset) => {
          return sum + (asset.hasValue ? asset.valueUsd : 0);
        }, 0);

        setPortfolio({
          assets: deriveAllocation(visibleAssets, totalValueUsd),
          totalValueUsd,
          pricedAssetsCount: visibleAssets.filter((asset) => asset.hasValue)
            .length,
          status: "ready",
          error: ""
        });
      } catch {
        if (!cancelled) {
          setPortfolio({
            ...EMPTY_STATE,
            status: "error",
            error: "Portfolio temporarily unavailable. Please try again later."
          });
        }
      }
    };

    loadPortfolio();

    return () => {
      cancelled = true;
    };
  }, [normalizedAddress, publicClient]);

  return portfolio;
}
