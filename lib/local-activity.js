import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "arc-ai-wallet:activity:v2";
const UPDATE_EVENT = "arc-ai-wallet:activity-updated";

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeAddress(address) {
  return typeof address === "string" ? address.toLowerCase() : "";
}

function readStorage() {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(items) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

function formatTimestamp(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function shortHash(hash) {
  if (!hash || hash.length < 14) {
    return hash || "";
  }

  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

export function saveLocalActivity(item) {
  const current = readStorage();
  writeStorage([item, ...current].slice(0, 100));
}

export function createWalletActionRecord({
  walletAddress,
  type,
  amount,
  chain,
  recipient = "",
  status = "Confirmed",
  txHash = "",
  explorerUrl = "",
  summary = "",
  metadata = {}
}) {
  const createdAt = new Date().toISOString();

  return {
    id: `${type}-${txHash || createdAt}`,
    walletAddress: normalizeAddress(walletAddress),
    source: "app",
    type,
    amount,
    chain,
    recipient,
    status,
    txHash,
    txHashShort: shortHash(txHash),
    explorerUrl,
    summary,
    createdAt,
    timeLabel: formatTimestamp(createdAt),
    metadata
  };
}

export function mapLiveActivityToFeedItem(item) {
  return {
    id: `chain-${item.id}`,
    walletAddress: "",
    source: "chain",
    type: item.type,
    amount: item.amount || "",
    chain: "Arc Testnet",
    recipient: item.counterparty || "",
    status: item.status || "Confirmed",
    txHash: item.txHash || "",
    txHashShort: item.txHashShort || shortHash(item.txHash || ""),
    explorerUrl: item.explorerUrl || "",
    summary: item.summary || "",
    createdAt: item.timestampMs ? new Date(item.timestampMs).toISOString() : "",
    timeLabel: item.timeLabel || "Recently",
    blockNumber: item.blockNumber || null,
    token: item.token || "USDC"
  };
}

export function mergeActivityFeedItems(localItems, liveItems) {
  return [...localItems, ...liveItems].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt || "") || 0;
    const rightTime = Date.parse(right.createdAt || "") || 0;
    return rightTime - leftTime;
  });
}

export function useLocalActivityHistory(address) {
  const [items, setItems] = useState([]);

  const refresh = useCallback(() => {
    const walletAddress = normalizeAddress(address);
    const nextItems = readStorage().filter((item) => {
      if (!walletAddress) {
        return false;
      }

      return item.walletAddress === walletAddress;
    });

    setItems(nextItems);
  }, [address]);

  useEffect(() => {
    refresh();

    if (!isBrowser()) {
      return undefined;
    }

    const handleUpdate = () => refresh();
    const handleStorage = (event) => {
      if (!event.key || event.key === STORAGE_KEY) {
        refresh();
      }
    };

    window.addEventListener(UPDATE_EVENT, handleUpdate);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(UPDATE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refresh]);

  return useMemo(
    () => ({
      items,
      save: saveLocalActivity,
      refresh
    }),
    [items, refresh]
  );
}
