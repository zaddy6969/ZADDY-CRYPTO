import {
  BrowserProvider,
  Contract,
  formatUnits,
  getAddress,
  JsonRpcProvider
} from "ethers";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { ARC_USDC_ERC20_ADDRESS, arcTestnet } from "./arc-chain";

const usdcAbi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const arcRpcProvider = new JsonRpcProvider(arcTestnet.rpcUrls.default.http[0]);

function normalizeAddress(address) {
  if (!address) return "";

  try {
    return getAddress(address);
  } catch {
    return address;
  }
}

function formatBalanceForDisplay(value) {
  const [whole = "0", fractional = ""] = value.split(".");
  const wholeWithCommas = BigInt(whole || "0").toLocaleString();
  const trimmedFractional = fractional.replace(/0+$/, "").slice(0, 6);

  if (!trimmedFractional) {
    return `${wholeWithCommas}.00`;
  }

  return `${wholeWithCommas}.${trimmedFractional}`;
}

export function useArcWalletSnapshot() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [ethersAddress, setEthersAddress] = useState("");
  const [usdcBalance, setUsdcBalance] = useState("");
  const [balanceStatus, setBalanceStatus] = useState("idle");
  const [balanceError, setBalanceError] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!isConnected || !address) {
      setEthersAddress("");
      return;
    }

    const syncEthersAddress = async () => {
      try {
        if (typeof window === "undefined" || !window.ethereum) {
          if (!cancelled) setEthersAddress(normalizeAddress(address));
          return;
        }

        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const signerAddress = await signer.getAddress();

        if (!cancelled) {
          setEthersAddress(normalizeAddress(signerAddress));
        }
      } catch {
        if (!cancelled) {
          setEthersAddress(normalizeAddress(address));
        }
      }
    };

    syncEthersAddress();

    return () => {
      cancelled = true;
    };
  }, [address, isConnected]);

  const displayAddress = useMemo(
    () => normalizeAddress(ethersAddress || address || ""),
    [address, ethersAddress]
  );

  useEffect(() => {
    let cancelled = false;

    if (!displayAddress) {
      setUsdcBalance("");
      setBalanceStatus("idle");
      setBalanceError("");
      return;
    }

    const loadUsdcBalance = async () => {
      try {
        setBalanceStatus("loading");
        setBalanceError("");

        const contract = new Contract(
          ARC_USDC_ERC20_ADDRESS,
          usdcAbi,
          arcRpcProvider
        );

        const [balance, decimals] = await Promise.all([
          contract.balanceOf(displayAddress),
          contract.decimals()
        ]);

        if (!cancelled) {
          const formatted = formatBalanceForDisplay(
            formatUnits(balance, Number(decimals))
          );

          setUsdcBalance(`${formatted} USDC`);
          setBalanceStatus("ready");
        }
      } catch {
        if (!cancelled) {
          setUsdcBalance("");
          setBalanceStatus("error");
          setBalanceError("Unable to fetch Arc USDC balance right now.");
        }
      }
    };

    loadUsdcBalance();

    return () => {
      cancelled = true;
    };
  }, [displayAddress]);

  return {
    address: displayAddress,
    rawAddress: address || "",
    isConnected,
    onArc: chainId === arcTestnet.id,
    usdcBalance,
    balanceStatus,
    balanceError
  };
}
