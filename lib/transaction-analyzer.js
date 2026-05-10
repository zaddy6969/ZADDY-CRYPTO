import {
  Contract,
  formatUnits,
  getAddress,
  Interface,
  isHexString,
  JsonRpcProvider
} from "ethers";
import { arcTestnet } from "./arc-chain";

const provider = new JsonRpcProvider(arcTestnet.rpcUrls.default.http[0]);

const erc20Interface = new Interface([
  "function transfer(address to, uint256 value)",
  "function approve(address spender, uint256 value)",
  "function transferFrom(address from, address to, uint256 value)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
]);

function shortAddress(address) {
  if (!address) return "unknown address";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function normalizeAddress(address) {
  if (!address) return "";

  try {
    return getAddress(address);
  } catch {
    return address;
  }
}

function formatAmount(amount, decimals) {
  const [whole = "0", fractional = ""] = formatUnits(amount, decimals).split(".");
  const wholeWithCommas = BigInt(whole || "0").toLocaleString();
  const trimmedFractional = fractional.replace(/0+$/, "").slice(0, 6);

  if (!trimmedFractional) return `${wholeWithCommas}.00`;
  return `${wholeWithCommas}.${trimmedFractional}`;
}

async function getTokenMetadata(tokenAddress, cache) {
  const normalized = normalizeAddress(tokenAddress);
  if (cache.has(normalized)) return cache.get(normalized);

  const contract = new Contract(normalized, erc20Interface, provider);

  const metadataPromise = Promise.allSettled([
    contract.symbol(),
    contract.decimals()
  ]).then((results) => {
    const symbol =
      results[0].status === "fulfilled" ? results[0].value : "token";
    const decimals =
      results[1].status === "fulfilled" ? Number(results[1].value) : 18;

    return {
      address: normalized,
      symbol,
      decimals
    };
  });

  cache.set(normalized, metadataPromise);
  return metadataPromise;
}

function decodeMethod(tx) {
  if (!tx?.data || tx.data === "0x") return null;

  try {
    return erc20Interface.parseTransaction({
      data: tx.data,
      value: tx.value
    });
  } catch {
    return null;
  }
}

async function decodeLogs(receipt, cache) {
  const decoded = [];

  for (const log of receipt.logs || []) {
    try {
      const parsed = erc20Interface.parseLog(log);
      const token = await getTokenMetadata(log.address, cache);

      if (parsed.name === "Transfer") {
        decoded.push({
          type: "transfer",
          token,
          from: normalizeAddress(parsed.args.from),
          to: normalizeAddress(parsed.args.to),
          amount: formatAmount(parsed.args.value, token.decimals)
        });
      }

      if (parsed.name === "Approval") {
        decoded.push({
          type: "approval",
          token,
          owner: normalizeAddress(parsed.args.owner),
          spender: normalizeAddress(parsed.args.spender),
          amount: formatAmount(parsed.args.value, token.decimals)
        });
      }
    } catch {}
  }

  return decoded;
}

function explainDecodedMethod(decodedMethod, token, tx) {
  if (!decodedMethod) return null;

  switch (decodedMethod.name) {
    case "transfer":
      return `This transaction asked the ${token.symbol} contract to send ${formatAmount(
        decodedMethod.args.value,
        token.decimals
      )} ${token.symbol} from ${shortAddress(
        tx.from
      )} to ${shortAddress(decodedMethod.args.to)}.`;
    case "approve":
      return `This transaction approved ${shortAddress(
        decodedMethod.args.spender
      )} to spend up to ${formatAmount(
        decodedMethod.args.value,
        token.decimals
      )} ${token.symbol} from ${shortAddress(tx.from)}.`;
    case "transferFrom":
      return `This transaction attempted to move ${formatAmount(
        decodedMethod.args.value,
        token.decimals
      )} ${token.symbol} from ${shortAddress(
        decodedMethod.args.from
      )} to ${shortAddress(decodedMethod.args.to)} using an allowance.`;
    default:
      return null;
  }
}

function buildFallbackExplanation(tx, receipt, fee, timestamp) {
  const lines = [];

  if (!tx.to) {
    lines.push(
      `This transaction created a new smart contract from ${shortAddress(
        tx.from
      )}.`
    );
  } else if (tx.data === "0x") {
    const amount = formatAmount(tx.value, arcTestnet.nativeCurrency.decimals);
    lines.push(
      `This was a direct transfer of ${amount} ${arcTestnet.nativeCurrency.symbol} from ${shortAddress(
        tx.from
      )} to ${shortAddress(tx.to)}.`
    );
  } else {
    lines.push(
      `This transaction called the contract at ${shortAddress(
        tx.to
      )} with custom data that was not decoded by the built-in analyzer.`
    );
  }

  lines.push(
    receipt.status === 1
      ? "The transaction succeeded onchain."
      : "The transaction failed onchain, so state changes may not have been applied."
  );

  lines.push(
    `It paid about ${fee} ${arcTestnet.nativeCurrency.symbol} in network fees and was included on ${timestamp}.`
  );

  return lines.join(" ");
}

export async function analyzeTransaction(txHash) {
  const normalizedHash = typeof txHash === "string" ? txHash.trim() : "";

  if (!normalizedHash || !isHexString(normalizedHash, 32)) {
    throw new Error("Enter a valid 66-character transaction hash.");
  }

  const tx = await provider.getTransaction(normalizedHash);

  if (!tx) {
    throw new Error("Transaction not found on Arc Testnet.");
  }

  const receipt = await provider.getTransactionReceipt(normalizedHash);

  if (!receipt) {
    throw new Error("Transaction receipt is not available yet.");
  }

  const block = receipt.blockNumber
    ? await provider.getBlock(receipt.blockNumber)
    : null;
  const timestamp = block
    ? new Date(Number(block.timestamp) * 1000).toLocaleString()
    : "an unknown time";
  const feeWei =
    receipt.fee ??
    (receipt.gasPrice ? receipt.gasUsed * receipt.gasPrice : 0n);
  const fee = formatAmount(
    feeWei,
    arcTestnet.nativeCurrency.decimals
  );

  const cache = new Map();
  const decodedMethod = decodeMethod(tx);
  const decodedLogs = await decodeLogs(receipt, cache);
  const methodToken = tx.to ? await getTokenMetadata(tx.to, cache) : null;
  const methodExplanation = decodedMethod
    ? explainDecodedMethod(decodedMethod, methodToken, tx)
    : null;

  const transferHighlights = decodedLogs
    .filter((item) => item.type === "transfer")
    .map(
      (item) =>
        `${item.amount} ${item.token.symbol} moved from ${shortAddress(
          item.from
        )} to ${shortAddress(item.to)}.`
    );

  const approvalHighlights = decodedLogs
    .filter((item) => item.type === "approval")
    .map(
      (item) =>
        `${shortAddress(item.spender)} was approved to spend up to ${item.amount} ${item.token.symbol}.`
    );

  const explanation = methodExplanation
    ? `${methodExplanation} ${receipt.status === 1 ? "It succeeded onchain." : "It failed onchain."} It used about ${fee} ${arcTestnet.nativeCurrency.symbol} in fees and landed on ${timestamp}.`
    : buildFallbackExplanation(tx, receipt, fee, timestamp);

  return {
    hash: normalizedHash,
    status: receipt.status === 1 ? "success" : "failed",
    explanation,
    summary: {
      from: normalizeAddress(tx.from),
      to: normalizeAddress(tx.to || ""),
      blockNumber: receipt.blockNumber,
      timestamp,
      fee: `${fee} ${arcTestnet.nativeCurrency.symbol}`,
      gasUsed: receipt.gasUsed.toString()
    },
    decodedMethod: decodedMethod
      ? {
          name: decodedMethod.name,
          contract: normalizeAddress(tx.to || "")
        }
      : null,
    highlights: [
      ...transferHighlights,
      ...approvalHighlights,
      receipt.status === 1
        ? "Execution status: succeeded."
        : "Execution status: failed."
    ],
    explorerUrl: `${arcTestnet.blockExplorers.default.url}/tx/${normalizedHash}`
  };
}
