import { analyzeTransaction } from "../../lib/transaction-analyzer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { hash } = req.body || {};

  try {
    const analysis = await analyzeTransaction(hash);
    return res.status(200).json({ analysis });
  } catch (error) {
    return res.status(400).json({
      error: error.message || "Unable to analyze the transaction."
    });
  }
}
