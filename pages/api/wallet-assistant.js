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
    if (item?.type !== "message" || !Array.isArray(item.content)) continue;

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

  const { question, messages, wallet, dashboard } = req.body || {};

  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "A question is required." });
  }

  const localAnswer = generateLocalAssistantAnswer({
    question,
    wallet,
    dashboard
  });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(200).json({
      answer: localAnswer,
      model: "local-dashboard-analysis",
      mode: "local",
      notice:
        "Responses are grounded in the current wallet snapshot and visible Arc dashboard activity."
    });
  }

  const instructions = [
    "You are a wallet activity assistant inside a crypto dashboard.",
    "Answer only from the provided wallet snapshot, recent activity summaries, and dashboard metrics.",
    "Do not invent transactions, token transfers, approvals, balances, or wallet history that are not in the provided data.",
    "If the user asks for information not present in the dashboard context, say that the current dashboard snapshot does not include it.",
    "Keep answers concise, practical, and easy to understand."
  ].join(" ");

  const userInput = [
    "Wallet snapshot:",
    JSON.stringify(wallet || {}, null, 2),
    "",
    "Dashboard metrics:",
    JSON.stringify(
      {
        statCards: dashboard?.statCards || [],
        chainMetrics: dashboard?.chainMetrics || [],
        activity: dashboard?.activity || [],
        activityStatus: dashboard?.activityStatus || "unknown",
        activityError: dashboard?.activityError || ""
      },
      null,
      2
    ),
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
        max_output_tokens: 400,
        temperature: 0.5,
        store: false
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        answer: localAnswer,
        model: "local-dashboard-analysis",
        mode: "local",
        notice:
          "Responses are grounded in the current wallet snapshot and visible Arc dashboard activity."
      });
    }

    const answer = extractOutputText(payload);

    if (!answer) {
      return res.status(200).json({
        answer: localAnswer,
        model: "local-dashboard-analysis",
        mode: "local",
        notice:
          "Responses are grounded in the current wallet snapshot and visible Arc dashboard activity."
      });
    }

    return res.status(200).json({
      answer,
      model: payload.model || DEFAULT_MODEL,
      mode: "openai"
    });
  } catch {
    return res.status(200).json({
      answer: localAnswer,
      model: "local-dashboard-analysis",
      mode: "local",
      notice:
        "Responses are grounded in the current wallet snapshot and visible Arc dashboard activity."
    });
  }
}
