import { Interface, JsonRpcProvider, formatUnits, getAddress } from "ethers";
import { ARC_USDC_ERC20_ADDRESS, arcTestnet } from "./arc-chain";

const provider = new JsonRpcProvider(arcTestnet.rpcUrls.default.http[0]);

const usdcInterface = new Interface([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
]);

const DEFAULT_LOOKBACK_BLOCKS = 9000;
const DEFAULT_LIMIT = 25;
const LOG_CHUNK_SIZE = 9000;
const USDC_DECIMALS = 6;

function normalizeAddress(address) {
  return getAddress(address);
}

function addressToTopic(address) {
  return `0x000000000000000000000000${address.slice(2).toLowerCase()}`;
}

function shortAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function shortHash(hash) {
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

function formatAmount(value, decimals) {
  const [whole = "0", fractional = ""] = formatUnits(value, decimals).split(".");
  const wholeWithCommas = BigInt(whole || "0").toLocaleString();
  const trimmedFractional = fractional.replace(/0+$/, "").slice(0, 4);

  if (!trimmedFractional) {
    return `${wholeWithCommas}.00`;
  }

  return `${wholeWithCommas}.${trimmedFractional}`;
}

function formatRelativeTime(timestampMs) {
  if (!timestampMs) {
    return "Recently";
  }

  const diffMs = timestampMs - Date.now();
  const diffSeconds = Math.round(diffMs / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", {
    numeric: "auto"
  });
  const ranges = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60]
  ];

  for (const [unit, secondsPerUnit] of ranges) {
    if (Math.abs(diffSeconds) >= secondsPerUnit || unit === "minute") {
      return formatter.format(
        Math.round(diffSeconds / secondsPerUnit),
        unit
      );
    }
  }

  return "just now";
}

async function getLogsInChunks({ address, topics, fromBlock, toBlock }) {
  const logs = [];

  for (let start = fromBlock; start <= toBlock; start += LOG_CHUNK_SIZE) {
    const end = Math.min(start + LOG_CHUNK_SIZE - 1, toBlock);
    const batch = await provider.getLogs({
      address,
      topics,
      fromBlock: start,
      toBlock: end
    });

    logs.push(...batch);
  }

  return logs;
}

async function getTimestampMs(blockNumber, blockCache) {
  if (!blockCache.has(blockNumber)) {
    blockCache.set(
      blockNumber,
      provider
        .getBlock(blockNumber)
        .then((block) => Number(block?.timestamp || 0) * 1000)
        .catch(() => 0)
    );
  }

  return blockCache.get(blockNumber);
}

function buildExplorerUrl(txHash) {
  return `${arcTestnet.blockExplorers.default.url}/tx/${txHash}`;
}

async function mapTransferLog(log, walletAddress, blockCache) {
  const parsed = usdcInterface.parseLog(log);
  const from = normalizeAddress(parsed.args.from);
  const to = normalizeAddress(parsed.args.to);
  const blockNumber = Number(log.blockNumber);
  const timestampMs = await getTimestampMs(blockNumber, blockCache);
  const amount = `${formatAmount(parsed.args.value, USDC_DECIMALS)} USDC`;
  const sentByWallet = from === walletAddress;
  const receivedByWallet = to === walletAddress;

  let type = "Transfer";
  let summary = "USDC moved on Arc Testnet";

  if (sentByWallet && receivedByWallet) {
    type = "Internal transfer";
    summary = "Moved USDC within this wallet";
  } else if (receivedByWallet) {
    type = "Incoming transfer";
    summary = `Received from ${shortAddress(from)}`;
  } else if (sentByWallet) {
    type = "Outgoing transfer";
    summary = `Sent to ${shortAddress(to)}`;
  }

  return {
    id: `${log.transactionHash}:${log.index}`,
    type,
    token: "USDC",
    contract: ARC_USDC_ERC20_ADDRESS,
    amount,
    blockNumber,
    timeLabel: formatRelativeTime(timestampMs),
    txHash: log.transactionHash,
    txHashShort: shortHash(log.transactionHash),
    summary,
    explorerUrl: buildExplorerUrl(log.transactionHash),
    timestampMs,
    sortIndex: Number(log.index || 0)
  };
}

async function mapApprovalLog(log, blockCache) {
  const parsed = usdcInterface.parseLog(log);
  const blockNumber = Number(log.blockNumber);
  const timestampMs = await getTimestampMs(blockNumber, blockCache);
  const spender = normalizeAddress(parsed.args.spender);

  return {
    id: `${log.transactionHash}:${log.index}`,
    type: "Approval",
    token: "USDC",
    contract: ARC_USDC_ERC20_ADDRESS,
    amount: `${formatAmount(parsed.args.value, USDC_DECIMALS)} USDC`,
    blockNumber,
    timeLabel: formatRelativeTime(timestampMs),
    txHash: log.transactionHash,
    txHashShort: shortHash(log.transactionHash),
    summary: `Approved spender ${shortAddress(spender)}`,
    explorerUrl: buildExplorerUrl(log.transactionHash),
    timestampMs,
    sortIndex: Number(log.index || 0)
  };
}

export async function getWalletActivity(
  address,
  { lookbackBlocks = DEFAULT_LOOKBACK_BLOCKS, limit = DEFAULT_LIMIT } = {}
) {
  const walletAddress = normalizeAddress(address);
  const currentBlock = await provider.getBlockNumber();
  const boundedLookback = Math.min(
    Math.max(Number(lookbackBlocks) || DEFAULT_LOOKBACK_BLOCKS, 1),
    DEFAULT_LOOKBACK_BLOCKS
  );
  const fromBlock = Math.max(currentBlock - (boundedLookback - 1), 0);
  const userTopic = addressToTopic(walletAddress);
  const blockCache = new Map();

  const [incomingLogs, outgoingLogs, approvalLogs] = await Promise.all([
    getLogsInChunks({
      address: ARC_USDC_ERC20_ADDRESS,
      topics: [usdcInterface.getEvent("Transfer").topicHash, null, userTopic],
      fromBlock,
      toBlock: currentBlock
    }),
    getLogsInChunks({
      address: ARC_USDC_ERC20_ADDRESS,
      topics: [usdcInterface.getEvent("Transfer").topicHash, userTopic],
      fromBlock,
      toBlock: currentBlock
    }),
    getLogsInChunks({
      address: ARC_USDC_ERC20_ADDRESS,
      topics: [usdcInterface.getEvent("Approval").topicHash, userTopic],
      fromBlock,
      toBlock: currentBlock
    })
  ]);

  const dedupedTransferLogs = [...incomingLogs, ...outgoingLogs].reduce(
    (accumulator, log) => {
      accumulator.set(`${log.transactionHash}:${log.index}`, log);
      return accumulator;
    },
    new Map()
  );

  const activity = await Promise.all([
    ...[...dedupedTransferLogs.values()].map((log) =>
      mapTransferLog(log, walletAddress, blockCache)
    ),
    ...approvalLogs.map((log) => mapApprovalLog(log, blockCache))
  ]);

  return activity
    .sort((left, right) => {
      if (right.blockNumber !== left.blockNumber) {
        return right.blockNumber - left.blockNumber;
      }

      return right.sortIndex - left.sortIndex;
    })
    .slice(0, limit)
    .map(({ sortIndex, timestampMs, ...item }) => item);
}
