import { formatUnits, erc20Abi, getAddress } from "viem";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useChainId, useDisconnect, usePublicClient } from "wagmi";
import { ARC_USDC_ERC20_ADDRESS, arcTestnet } from "./arc-chain";

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

function formatBalanceForDisplay(value) {
  const numeric = Number(value || 0);

  if (!Number.isFinite(numeric)) {
    return "0.00 USDC";
  }

  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: numeric >= 1000 ? 0 : 2,
    maximumFractionDigits: 4
  }).format(numeric)} USDC`;
}

export function useArcWalletSnapshot() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const publicClient = usePublicClient({ chainId: arcTestnet.id });
  const [usdcBalance, setUsdcBalance] = useState("");
  const [balanceStatus, setBalanceStatus] = useState("idle");
  const [balanceError, setBalanceError] = useState("");

  const displayAddress = useMemo(
    () => normalizeAddress(address || ""),
    [address]
  );

  useEffect(() => {
    let cancelled = false;

    if (!displayAddress || !publicClient) {
      setUsdcBalance("");
      setBalanceStatus("idle");
      setBalanceError("");
      return undefined;
    }

    const loadUsdcBalance = async () => {
      try {
        setBalanceStatus("loading");
        setBalanceError("");

        const balance = await publicClient.readContract({
          address: ARC_USDC_ERC20_ADDRESS,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [displayAddress]
        });

        if (!cancelled) {
          setUsdcBalance(formatBalanceForDisplay(formatUnits(balance, 6)));
          setBalanceStatus("ready");
        }
      } catch {
        if (!cancelled) {
          setUsdcBalance("");
          setBalanceStatus("error");
          setBalanceError("Portfolio temporarily unavailable. Please try again later.");
        }
      }
    };

    loadUsdcBalance();

    return () => {
      cancelled = true;
    };
  }, [displayAddress, publicClient]);

  return {
    address: displayAddress,
    rawAddress: address || "",
    isConnected,
    isSignedIn: isConnected && Boolean(displayAddress),
    onArc: chainId === arcTestnet.id,
    usdcBalance,
    balanceStatus,
    balanceError,
    disconnectWallet: disconnect
  };
}
