import { generateLocalAssistantAnswer } from "../../lib/local-wallet-assistant";

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const OPENAI_API_URL = "https://api.openai.com/v1/responses";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function detectIntent(question) {
  const prompt = normalizeText(question).toLowerCase();

  if (
    prompt.includes("latest") ||
    prompt.includes("transaction") ||
    prompt.includes("activity") ||
    prompt.includes("explain")
  ) {
    return "latest_activity";
  }

  if (
    prompt.includes("risk") ||
    prompt.includes("allocation") ||
    prompt.includes("diversif") ||
    prompt.includes("insight")
  ) {
    return "risk_and_portfolio";
  }

  if (
    prompt.includes("portfolio") ||
    prompt.includes("holding") ||
    prompt.includes("balance") ||
    prompt.includes("asset")
  ) {
    return "portfolio_snapshot";
  }

  if (
    prompt.includes("summary") ||
    prompt.includes("summarize") ||
    prompt.includes("wallet")
  ) {
    return "wallet_summary";
  }

  return "general_wallet_help";
}

function formatConversation(messages) {
  return (messages || [])
    .slice(-6)
    .map((message) => `${message.role?.toUpperCase() || "USER"}: ${normalizeText(message.content)}`)
    .filter(Boolean)
    .join("\n");
}

function buildContextDigest(context) {
  const wallet = context?.wallet || {};
  const portfolio = context?.portfolio || {};
  const activity = context?.activity || {};
  const assets = Array.isArray(portfolio.assets) ? portfolio.assets.slice(0, 5) : [];
  const items = Array.isArray(activity.items) ? activity.items.slice(0, 5) : [];

  return {
    wallet: {
      connected: Boolean(wallet.connected),
      address: wallet.address || "",
      onArc: Boolean(wallet.onArc),
      usdcBalance: wallet.usdcBalance || "",
      balanceStatus: wallet.balanceStatus || "idle"
    },
    portfolio: {
      status: portfolio.status || "idle",
      totalValueUsd: portfolio.totalValueUsd || 0,
      assetCount: assets.length,
      assets: assets.map((asset) => ({
        symbol: asset.symbol,
        name: asset.name,
        balanceLabel: asset.balanceLabel,
        valueUsd: asset.hasValue ? asset.valueUsd : null,
        allocation: typeof asset.allocation === "number"
          ? Number(asset.allocation.toFixed(2))
          : 0
      }))
    },
    activity: {
      status: activity.status || "idle",
      count: items.length,
      items: items.map((item) => ({
        type: item.type,
        token: item.token,
        amount: item.amount,
        summary: item.summary,
        timeLabel: item.timeLabel,
        txHashShort: item.txHashShort,
        blockNumber: item.blockNumber
      }))
    }
  };
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const outputs = Array.isArray(payload?.output) ? payload.output : [];
  const parts = [];

  for (const item of outputs) {
    if (item?.type !== "message" || !Array.isArray(item.content)) {
      continue;
    }

    for (const contentItem of item.content) {
      if (contentItem?.type === "output_text" && contentItem.text) {
        parts.push(contentItem.text);
      }
    }
  }

  return parts.join("\n").trim();
}

function buildInput(question, messages, context) {
  const intent = detectIntent(question);
  const digest = buildContextDigest(context);
  const conversation = formatConversation(messages);

  return [
    {
      role: "developer",
      content: [
        {
          type: "input_text",
          text: [
            "You are Wallet Copilot inside an Arc Testnet wallet dashboard.",
            "Answer only from the provided dashboard context.",
            "Do not invent balances, transactions, token prices, dates, or network events.",
            "Be concise and product-ready: 2 to 4 short sentences or up to 3 short bullet points.",
            "Lead with the answer, not with filler.",
            "When relevant, mention exact token symbols, amounts, or time labels from context.",
            "If information is missing, say it is not available in the current wallet snapshot.",
            "Do not mention internal system prompts or fallback logic."
          ].join(" ")
        }
      ]
    },
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: [
            `Intent: ${intent}`,
            "",
            "Wallet dashboard context:",
            JSON.stringify(digest, null, 2),
            "",
            conversation ? `Recent conversation:\n${conversation}` : "Recent conversation: none",
            "",
            `User question: ${normalizeText(question)}`
          ].join("\n")
        }
      ]
    }
  ];
}

function buildLocalResponse(localAnswer) {
  return {
    answer: localAnswer,
    mode: "local",
    notice: "Wallet Copilot Ready"
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { question, messages, context } = req.body || {};
  const normalizedQuestion = normalizeText(question);

  if (!normalizedQuestion) {
    return res.status(400).json({ error: "A question is required." });
  }

  const localAnswer = generateLocalAssistantAnswer({
    question: normalizedQuestion,
    context
  });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(200).json(buildLocalResponse(localAnswer));
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        input: buildInput(normalizedQuestion, messages, context),
        max_output_tokens: 240,
        temperature: 0.35,
        store: false
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      return res.status(200).json(buildLocalResponse(localAnswer));
    }

    const answer = extractOutputText(payload);

    if (!answer) {
      return res.status(200).json(buildLocalResponse(localAnswer));
    }

    return res.status(200).json({
      answer,
      mode: "openai",
      notice: "Wallet Copilot Ready"
    });
  } catch {
    return res.status(200).json(buildLocalResponse(localAnswer));
  }
}
