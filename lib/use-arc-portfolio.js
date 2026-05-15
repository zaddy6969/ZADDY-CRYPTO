import { erc20Abi, formatUnits, getAddress } from "viem";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBlockNumber, useChainId, usePublicClient } from "wagmi";
import { ARC_MULTICALL3_ADDRESS, arcTestnet } from "./arc-chain";
import {
  ARC_NATIVE_PORTFOLIO_ASSET,
  ARC_PORTFOLIO_ASSETS,
  formatTokenBalance,
  getAssetLogoLabel
} from "./arc-portfolio";

const ERC20_METADATA_FIELDS = ["name", "symbol", "decimals"];
const RETRY_DELAYS_MS = [0, 700, 1600];
const BLOCK_REFRESH_THROTTLE_MS = 6000;
const IS_DEVELOPMENT = process.env.NODE_ENV !== "production";

const EMPTY_STATE = {
  assets: [],
  totalValueUsd: null,
  pricedAssetsCount: 0,
  nativeAsset: null,
  status: "idle",
  error: "",
  partialFailure: false,
  lastUpdatedAt: null
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

function sleep(delayMs) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, delayMs);
  });
}

function debugPortfolioLog(event, detail) {
  if (!IS_DEVELOPMENT) {
    return;
  }

  console.info("[arc-portfolio]", event, detail);
}

async function withRetry(task, label) {
  let lastError;

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      if (attempt > 0) {
        debugPortfolioLog("retry", { label, attempt });
      }

      return await task();
    } catch (error) {
      lastError = error;
      debugPortfolioLog("request-failed", {
        label,
        attempt,
        message: error instanceof Error ? error.message : "Unknown error"
      });

      if (attempt < RETRY_DELAYS_MS.length - 1) {
        await sleep(RETRY_DELAYS_MS[attempt + 1]);
      }
    }
  }

  throw lastError;
}

function createTokenContracts(address) {
  return ARC_PORTFOLIO_ASSETS.flatMap((asset) => [
    {
      address: asset.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address]
    },
    ...ERC20_METADATA_FIELDS.map((field) => ({
      address: asset.address,
      abi: erc20Abi,
      functionName: field
    }))
  ]);
}

function extractResult(result) {
  return result?.status === "success" ? result.result : undefined;
}

function buildNativeAsset(rawBalance) {
  const balance = Number(
    formatUnits(rawBalance, ARC_NATIVE_PORTFOLIO_ASSET.decimals)
  );
  const valueUsd =
    typeof ARC_NATIVE_PORTFOLIO_ASSET.priceUsd === "number"
      ? balance * ARC_NATIVE_PORTFOLIO_ASSET.priceUsd
      : null;

  return {
    ...ARC_NATIVE_PORTFOLIO_ASSET,
    rawBalance,
    balance,
    balanceLabel: formatTokenBalance(balance),
    valueUsd,
    hasValue: typeof valueUsd === "number" && Number.isFinite(valueUsd),
    allocation: 0,
    allocationLabel: "Gas balance",
    logoLabel: getAssetLogoLabel(ARC_NATIVE_PORTFOLIO_ASSET),
    usesFallbackMetadata: false
  };
}

function buildTokenAsset(asset, results, offset) {
  const balanceResult = results[offset];
  const nameResult = results[offset + 1];
  const symbolResult = results[offset + 2];
  const decimalsResult = results[offset + 3];

  const rawBalance =
    balanceResult?.status === "success" && typeof balanceResult.result === "bigint"
      ? balanceResult.result
      : null;

  const resolvedName =
    typeof extractResult(nameResult) === "string"
      ? extractResult(nameResult)
      : asset.name || "Unknown token";
  const resolvedSymbol =
    typeof extractResult(symbolResult) === "string"
      ? extractResult(symbolResult)
      : asset.symbol || "TOKEN";
  const resolvedDecimalsValue = extractResult(decimalsResult);
  const resolvedDecimals =
    typeof resolvedDecimalsValue === "number"
      ? resolvedDecimalsValue
      : typeof resolvedDecimalsValue === "bigint"
        ? Number(resolvedDecimalsValue)
        : asset.decimals ?? 18;
  const safeRawBalance = rawBalance ?? 0n;
  const balance = Number(formatUnits(safeRawBalance, resolvedDecimals));
  const valueUsd =
    typeof asset.priceUsd === "number" ? balance * asset.priceUsd : null;

  return {
    ...asset,
    name: resolvedName,
    symbol: resolvedSymbol,
    decimals: resolvedDecimals,
    rawBalance: safeRawBalance,
    balance,
    balanceLabel: formatTokenBalance(balance),
    valueUsd,
    hasValue: typeof valueUsd === "number" && Number.isFinite(valueUsd),
    logoLabel: getAssetLogoLabel({
      ...asset,
      name: resolvedName,
      symbol: resolvedSymbol
    }),
    usesFallbackMetadata:
      nameResult?.status !== "success" || symbolResult?.status !== "success"
  };
}

function sortAssets(assets) {
  return [...assets].sort((left, right) => {
    const leftScore = left.hasValue ? left.valueUsd : left.balance;
    const rightScore = right.hasValue ? right.valueUsd : right.balance;

    return rightScore - leftScore;
  });
}

function deriveAllocation(assets, totalValueUsd) {
  return assets.map((asset) => {
    const allocation =
      typeof totalValueUsd === "number" &&
      totalValueUsd > 0 &&
      typeof asset.valueUsd === "number"
        ? (asset.valueUsd / totalValueUsd) * 100
        : 0;

    return {
      ...asset,
      allocation,
      allocationLabel:
        allocation > 0
          ? `${allocation.toFixed(allocation >= 10 ? 0 : 1)}% of portfolio`
          : asset.hasValue
            ? "Tracked allocation"
            : "Value unavailable"
    };
  });
}

async function loadPortfolioSnapshot(publicClient, address) {
  const tokenContracts = createTokenContracts(address);
  const [nativeResult, tokenBatchResult] = await Promise.allSettled([
    withRetry(() => publicClient.getBalance({ address }), "native-balance"),
    withRetry(
      () =>
        publicClient.multicall({
          allowFailure: true,
          contracts: tokenContracts,
          multicallAddress: ARC_MULTICALL3_ADDRESS
        }),
      "erc20-balances"
    )
  ]);

  const nativeSuccess =
    nativeResult.status === "fulfilled" &&
    typeof nativeResult.value === "bigint";
  const tokenBatchSuccess =
    tokenBatchResult.status === "fulfilled" &&
    Array.isArray(tokenBatchResult.value);
  const tokenResults = tokenBatchSuccess ? tokenBatchResult.value : [];

  let successfulBalanceReads = nativeSuccess ? 1 : 0;
  let failedBalanceReads = nativeSuccess ? 0 : 1;

  const mappedAssets = ARC_PORTFOLIO_ASSETS.map((asset, index) => {
    const offset = index * (ERC20_METADATA_FIELDS.length + 1);
    const builtAsset = buildTokenAsset(asset, tokenResults, offset);

    if (
      tokenBatchSuccess &&
      tokenResults[offset]?.status === "success" &&
      typeof tokenResults[offset].result === "bigint"
    ) {
      successfulBalanceReads += 1;
    } else {
      failedBalanceReads += 1;
    }

    return builtAsset;
  });

  const visibleAssets = sortAssets(
    mappedAssets.filter((asset) => asset.rawBalance > 0n)
  );
  const pricedAssets = visibleAssets.filter((asset) => asset.hasValue);
  const totalValueUsd =
    pricedAssets.length > 0
      ? pricedAssets.reduce((sum, asset) => sum + asset.valueUsd, 0)
      : null;
  const nativeAsset = nativeSuccess ? buildNativeAsset(nativeResult.value) : null;
  const allFetchesFailed = successfulBalanceReads === 0;

  if (IS_DEVELOPMENT) {
    debugPortfolioLog("snapshot", {
      address,
      nativeSuccess,
      tokenBatchSuccess,
      visibleAssets: visibleAssets.length,
      successfulBalanceReads,
      failedBalanceReads
    });
  }

  return {
    assets: deriveAllocation(visibleAssets, totalValueUsd),
    totalValueUsd,
    pricedAssetsCount: pricedAssets.length,
    nativeAsset,
    partialFailure:
      !allFetchesFailed &&
      (!nativeSuccess || failedBalanceReads > 0 || !tokenBatchSuccess),
    allFetchesFailed
  };
}

export function useArcPortfolio(address) {
  const publicClient = usePublicClient({ chainId: arcTestnet.id });
  const chainId = useChainId();
  const { data: blockNumber } = useBlockNumber({
    chainId: arcTestnet.id,
    watch: Boolean(address)
  });
  const [portfolio, setPortfolio] = useState(EMPTY_STATE);
  const lastRefreshAtRef = useRef(0);

  const normalizedAddress = useMemo(
    () => normalizeAddress(address),
    [address]
  );
  const hasLivePortfolio =
    portfolio.assets.length > 0 || Boolean(portfolio.nativeAsset);

  useEffect(() => {
    let cancelled = false;

    if (!normalizedAddress || !publicClient) {
      setPortfolio(EMPTY_STATE);
      return undefined;
    }

    const now = Date.now();
    const shouldThrottleRefresh =
      typeof blockNumber === "bigint" &&
      hasLivePortfolio &&
      now - lastRefreshAtRef.current < BLOCK_REFRESH_THROTTLE_MS;

    if (shouldThrottleRefresh) {
      return undefined;
    }

    const loadPortfolio = async () => {
      try {
        setPortfolio((current) => ({
          ...current,
          status:
            current.assets.length > 0 || current.nativeAsset
              ? "refreshing"
              : "loading",
          error: ""
        }));

        lastRefreshAtRef.current = Date.now();

        const snapshot = await loadPortfolioSnapshot(publicClient, normalizedAddress);

        if (cancelled) {
          return;
        }

        if (snapshot.allFetchesFailed) {
          setPortfolio((current) => ({
            ...current,
            status:
              current.assets.length > 0 || current.nativeAsset ? "ready" : "error",
            error:
              current.assets.length > 0 || current.nativeAsset
                ? ""
                : "Portfolio temporarily unavailable. Please try again later.",
            partialFailure: current.assets.length > 0 || current.nativeAsset
          }));
          return;
        }

        setPortfolio({
          assets: snapshot.assets,
          totalValueUsd: snapshot.totalValueUsd,
          pricedAssetsCount: snapshot.pricedAssetsCount,
          nativeAsset: snapshot.nativeAsset,
          status: "ready",
          error: "",
          partialFailure: snapshot.partialFailure,
          lastUpdatedAt: Date.now()
        });
      } catch (error) {
        if (!cancelled) {
          debugPortfolioLog("fatal-error", {
            address: normalizedAddress,
            message: error instanceof Error ? error.message : "Unknown error"
          });

          setPortfolio((current) => ({
            ...current,
            status:
              current.assets.length > 0 || current.nativeAsset ? "ready" : "error",
            error:
              current.assets.length > 0 || current.nativeAsset
                ? ""
                : "Portfolio temporarily unavailable. Please try again later.",
            partialFailure: current.assets.length > 0 || current.nativeAsset
          }));
        }
      }
    };

    loadPortfolio();

    return () => {
      cancelled = true;
    };
  }, [normalizedAddress, publicClient, chainId, blockNumber, hasLivePortfolio]);

  return portfolio;
}
