import {
  buildAssistantInput,
  generateLocalAssistantResponse
} from "./wallet-copilot";

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const OPENAI_API_URL = "https://api.openai.com/v1/responses";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function setSseHeaders(res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });
}

function writeSse(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function sleep(delayMs) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, delayMs);
  });
}

async function streamLocalResponse(res, payload) {
  setSseHeaders(res);
  const words = String(payload.answer || "").split(/(\s+)/).filter(Boolean);

  for (const part of words) {
    writeSse(res, {
      type: "delta",
      delta: part
    });
    await sleep(10);
  }

  writeSse(res, {
    type: "meta",
    mode: payload.mode || "local",
    notice: payload.notice || "Wallet Copilot Ready",
    insights: payload.insights || [],
    actions: payload.actions || []
  });
  writeSse(res, { type: "done" });
  res.end();
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

async function streamOpenAIResponse(res, requestBody, fallbackPayload) {
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      input: requestBody.input,
      max_output_tokens: 320,
      temperature: 0.35,
      stream: true,
      store: false
    })
  });

  if (!response.ok || !response.body) {
    return streamLocalResponse(res, fallbackPayload);
  }

  setSseHeaders(res);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finished = false;

  while (!finished) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() || "";

    for (const frame of frames) {
      const lines = frame.split("\n");
      const dataLines = [];

      for (const line of lines) {
        if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trim());
        }
      }

      if (!dataLines.length) {
        continue;
      }

      const data = dataLines.join("\n");

      if (!data || data === "[DONE]") {
        continue;
      }

      let event;

      try {
        event = JSON.parse(data);
      } catch {
        continue;
      }

      if (event.type === "response.output_text.delta" && event.delta) {
        writeSse(res, {
          type: "delta",
          delta: event.delta
        });
      }

      if (event.type === "response.completed") {
        writeSse(res, {
          type: "meta",
          mode: "openai",
          notice: "Wallet Copilot Ready",
          insights: fallbackPayload.insights || [],
          actions: fallbackPayload.actions || []
        });
        writeSse(res, { type: "done" });
        finished = true;
        break;
      }

      if (event.type === "error") {
        finished = true;
        break;
      }
    }
  }

  if (!finished) {
    writeSse(res, {
      type: "meta",
      mode: "openai",
      notice: "Wallet Copilot Ready",
      insights: fallbackPayload.insights || [],
      actions: fallbackPayload.actions || []
    });
    writeSse(res, { type: "done" });
  }

  res.end();
}

export async function handleWalletChat(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { question, messages, context, stream } = req.body || {};
  const normalizedQuestion = normalizeText(question);

  if (!normalizedQuestion) {
    return res.status(400).json({ error: "A question is required." });
  }

  const fallbackPayload = generateLocalAssistantResponse({
    question: normalizedQuestion,
    context
  });

  if (stream === false) {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json(fallbackPayload);
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
          input: buildAssistantInput(normalizedQuestion, messages, context),
          max_output_tokens: 320,
          temperature: 0.35,
          store: false
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        return res.status(200).json(fallbackPayload);
      }

      const answer = extractOutputText(payload);

      if (!answer) {
        return res.status(200).json(fallbackPayload);
      }

      return res.status(200).json({
        answer,
        insights: fallbackPayload.insights,
        actions: fallbackPayload.actions,
        notice: "Wallet Copilot Ready",
        mode: "openai"
      });
    } catch {
      return res.status(200).json(fallbackPayload);
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    await streamLocalResponse(res, fallbackPayload);
    return undefined;
  }

  try {
    await streamOpenAIResponse(
      res,
      {
        input: buildAssistantInput(normalizedQuestion, messages, context)
      },
      fallbackPayload
    );
    return undefined;
  } catch {
    await streamLocalResponse(res, fallbackPayload);
    return undefined;
  }
}
