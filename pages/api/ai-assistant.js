import { generateLocalAssistantAnswer } from "../../lib/local-wallet-assistant";

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";

function formatConversation(messages) {
  return (messages || [])
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");
}

function extractOutputText(response) {
  const outputs = response?.output || [];
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { question, messages, context } = req.body || {};

  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "A question is required." });
  }

  const localAnswer = generateLocalAssistantAnswer({ question, context });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(200).json({
      answer: localAnswer,
      mode: "local",
      notice: "Using built-in wallet insights for this response."
    });
  }

  const instructions = [
    "You are an AI wallet assistant inside an Arc Testnet dashboard.",
    "Answer only from the provided wallet, portfolio, and recent activity context.",
    "Never invent balances, transactions, prices, approvals, or network activity.",
    "Keep responses short, useful, and easy to understand.",
    "If the dashboard context is missing something, say that it is not available in the current wallet snapshot."
  ].join(" ");

  const userInput = [
    "Wallet and portfolio context:",
    JSON.stringify(context || {}, null, 2),
    "",
    "Conversation so far:",
    formatConversation(messages),
    "",
    `Latest user question: ${question}`
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        instructions,
        input: userInput,
        max_output_tokens: 220,
        store: false
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        answer: localAnswer,
        mode: "local",
        notice: "Using built-in wallet insights for this response."
      });
    }

    const answer = extractOutputText(payload);

    if (!answer) {
      return res.status(200).json({
        answer: localAnswer,
        mode: "local",
        notice: "Using built-in wallet insights for this response."
      });
    }

    return res.status(200).json({
      answer,
      mode: "openai",
      notice: "OpenAI is active for this response."
    });
  } catch {
    return res.status(200).json({
      answer: localAnswer,
      mode: "local",
      notice: "Using built-in wallet insights for this response."
    });
  }
}
