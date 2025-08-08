import type { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "node-fetch";

const EOD_API_URL = "https://eodhd.com/api/search";
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {q: query, limit } = req.query;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Query parameter (q) is mandatory" });
  }

  try {
    const apiKey = process.env.EODHD_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Eodhd API key not set" });
    }

    const url = `${EOD_API_URL}/${query}?api_token=${apiKey}&fmt=json`;
    const response = await fetch(url);
    if (!response.ok) { throw new Error("Eodhd search call failed"); }
    const json = await response.json();

    res.status(200).json(json);
  } catch (error) {
    console.error("Symbol search API error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}