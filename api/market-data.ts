import type { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "node-fetch";

const EOD_API_URL = "https://eodhd.com/api";
const EOD_API_KEY = process.env.EODHD_API_KEY || "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const symbol = req.query.symbol;
    if (!EOD_API_KEY) {
      res.status(500).json({ error: "EODHD API key not set in env" });
      return;
    }

    const url = `${EOD_API_URL}/quote?symbol=${symbol}&apikey=${EOD_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) { throw new Error("Eodhd API call failed"); }
    const json = await response.json();
    res.status(200).json(json);

  } catch (error) {
    console.error("Market Data API error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
