import { getLiveMarketPrices } from "../../lib/market-prices";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const marketData = await getLiveMarketPrices();
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=120"
    );

    return res.status(200).json({ marketData });
  } catch {
    return res.status(500).json({
      error: "Unable to load live market prices right now."
    });
  }
}
