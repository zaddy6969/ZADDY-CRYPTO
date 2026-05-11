import { getWalletActivity } from "../../lib/wallet-activity";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { address } = req.query || {};

  if (!address || typeof address !== "string") {
    return res.status(400).json({ error: "A wallet address is required." });
  }

  try {
    const activity = await getWalletActivity(address);

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=15, stale-while-revalidate=45"
    );

    return res.status(200).json({ activity });
  } catch (error) {
    return res.status(400).json({
      error: error?.message || "Unable to load Arc wallet activity."
    });
  }
}
