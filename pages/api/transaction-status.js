import { getTransactionStatus } from "../../lib/wallet-activity";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const hashes = Array.isArray(req.body?.hashes)
    ? req.body.hashes.filter((hash) => typeof hash === "string" && hash.startsWith("0x"))
    : [];

  if (!hashes.length) {
    return res.status(200).json({ statuses: {} });
  }

  try {
    const entries = await Promise.all(
      hashes.slice(0, 25).map(async (hash) => [hash, await getTransactionStatus(hash)])
    );

    return res.status(200).json({
      statuses: Object.fromEntries(entries)
    });
  } catch {
    return res.status(503).json({
      error: "Failed to load transaction status."
    });
  }
}
