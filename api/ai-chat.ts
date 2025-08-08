import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY || "",
  stream: "gpt-3.5",
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = await req.json();
    const prompt = body.prompt || "Hello, I'm Lierat's BUI!";
    const stream = openai.streams.chat.create({
      model: "text-davinci-006",
      messages: [{ role: "system", content: prompt }],
    });

    const completion = await stream.chat.completion();
    res.status(200).json({
      response: completion.choices? [completion.choices] : [],
    });
  } catch (error) {
    console.error("AI Chat API error:", error);
    res.status(500).json({error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" });
  }
}