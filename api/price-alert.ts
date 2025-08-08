import type { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "node-fetch";

const EOD_API_URL = "https://eodhd.com/api/real-time";
const apiKey = process.env.EODHD_API_KEY || "";

async function getRealPrice(symbol: string) {
  if (!apiKey) return null;

  try {
    const url = `${EOD_API_URL}/${encodeURI(symbol)}?api_token=${apiKey}&fmt=json`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`EODHD API returned ${resp.status}`);

    let data = await resp.json();
    if (Array.isArray(data)) data = data[0];

    return {
      symbol: (data.code || symbol).toUpperCase(),
      price: Number(data.close || data.price || data.last || 0),
      change: Number(data.change || 0),
      changePercent: Number(data.change_percent || 0),
      timestamp: Date.now(),
      source: "eodhd_api",
      realTime: true,
    };
  } catch (err) {
    console.error(`Error fetching real price for ${symbol}:`, err);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const symbol = req.query.symbol;
  if (!symbol || typeof symbol !== "string") {
    return res.status(400).json({ error: "Symbol parameter is required" });
  }

  const priceData = await getRealPrice(symbol);
  if (!priceData) {
    return res.status(404).json({ error: `No data found for symbol ${symbol}` });
  }

  res.status(200).json(priceData);
}