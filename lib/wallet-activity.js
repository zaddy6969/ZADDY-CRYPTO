import { Interface, JsonRpcProvider, formatUnits, getAddress } from "ethers";
import {
  ARC_AI_WALLET_ASSISTANT_CONTRACT_ADDRESS,
  isAssistantContractConfigured
} from "./arc-assistant-contract";
import { ARC_USDC_ERC20_ADDRESS, arcTestnet } from "./arc-chain";

const provider = new JsonRpcProvider(arcTestnet.rpcUrls.default.http[0]);

const usdcInterface = new Interface([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
]);

const assistantInterface = new Interface([
  "event InteractionLogged(uint256 indexed interactionId, address indexed user, string prompt, string response)"
]);

const USDC_DECIMALS = 6;
const DEFAULT_LOOKBACK_BLOCKS = 150000;
const DEFAULT_LIMIT = 8;
const LOG_CHUNK_SIZE = 25000;

function normalizeAddress(address) {
  return getAddress(address);
}

function addressToTopic(address) {
  return `0x000000000000000000000000${address.slice(2).toLowerCase()}`;
}

function shortAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
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

function trimPreview(value, maxLength = 84) {
  const normalized = (value || "").replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
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
    );
  }

  return blockCache.get(blockNumber);
}

function buildMeta(timestampMs, blockNumber) {
  const relative = formatRelativeTime(timestampMs);
  return `${relative} | Block ${blockNumber}`;
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

  let title = "Moved USDC on Arc";
  let detail = "Wallet moved USDC on Arc.";

  if (sentByWallet && receivedByWallet) {
    title = "Moved USDC within this wallet";
  } else if (receivedByWallet) {
    title = "Received USDC on Arc";
    detail = `From ${shortAddress(from)}`;
  } else if (sentByWallet) {
    title = "Sent USDC on Arc";
    detail = `To ${shortAddress(to)}`;
  }

  return {
    id: `${log.transactionHash}:${log.index}`,
    kind: "transfer",
    title,
    meta: buildMeta(timestampMs, blockNumber),
    value: amount,
    detail,
    txHash: log.transactionHash,
    explorerUrl: buildExplorerUrl(log.transactionHash),
    timestampMs,
    blockNumber,
    sortIndex: Number(log.index || 0)
  };
}

async function mapApprovalLog(log, blockCache) {
  const parsed = usdcInterface.parseLog(log);
  const spender = normalizeAddress(parsed.args.spender);
  const blockNumber = Number(log.blockNumber);
  const timestampMs = await getTimestampMs(blockNumber, blockCache);

  return {
    id: `${log.transactionHash}:${log.index}`,
    kind: "approval",
    title: "Approved USDC spending",
    meta: buildMeta(timestampMs, blockNumber),
    value: `${formatAmount(parsed.args.value, USDC_DECIMALS)} USDC`,
    detail: `Spender ${shortAddress(spender)}`,
    txHash: log.transactionHash,
    explorerUrl: buildExplorerUrl(log.transactionHash),
    timestampMs,
    blockNumber,
    sortIndex: Number(log.index || 0)
  };
}

async function mapAssistantLog(log, blockCache) {
  const parsed = assistantInterface.parseLog(log);
  const blockNumber = Number(log.blockNumber);
  const timestampMs = await getTimestampMs(blockNumber, blockCache);
  const interactionId = Number(parsed.args.interactionId);
  const promptPreview = trimPreview(parsed.args.prompt);

  return {
    id: `${log.transactionHash}:${log.index}`,
    kind: "assistant",
    title: "Saved assistant memory on Arc",
    meta: buildMeta(timestampMs, blockNumber),
    value: `Prompt #${interactionId}`,
    detail: promptPreview
      ? `Prompt: "${promptPreview}"`
      : "Assistant note saved onchain.",
    txHash: log.transactionHash,
    explorerUrl: buildExplorerUrl(log.transactionHash),
    timestampMs,
    blockNumber,
    sortIndex: Number(log.index || 0)
  };
}

export async function getWalletActivity(
  address,
  { lookbackBlocks = DEFAULT_LOOKBACK_BLOCKS, limit = DEFAULT_LIMIT } = {}
) {
  const walletAddress = normalizeAddress(address);
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(currentBlock - lookbackBlocks, 0);
  const userTopic = addressToTopic(walletAddress);
  const blockCache = new Map();

  const [incomingLogs, outgoingLogs, approvalLogs, assistantLogs] =
    await Promise.all([
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
      }),
      isAssistantContractConfigured()
        ? getLogsInChunks({
            address: ARC_AI_WALLET_ASSISTANT_CONTRACT_ADDRESS,
            topics: [
              assistantInterface.getEvent("InteractionLogged").topicHash,
              null,
              userTopic
            ],
            fromBlock,
            toBlock: currentBlock
          })
        : Promise.resolve([])
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
    ...approvalLogs.map((log) => mapApprovalLog(log, blockCache)),
    ...assistantLogs.map((log) => mapAssistantLog(log, blockCache))
  ]);

  return activity
    .sort((left, right) => {
      if (right.blockNumber !== left.blockNumber) {
        return right.blockNumber - left.blockNumber;
      }

      return right.sortIndex - left.sortIndex;
    })
    .slice(0, limit)
    .map(({ sortIndex, ...item }) => item);
}
