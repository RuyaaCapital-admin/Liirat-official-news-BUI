import { eodFetch } from "../../src/server/eodhdClient";

export default async function handler(req: Request): Promise<Response> {
  try {
    // Test with a simple AAPL call to verify API key
    const testResponse = await eodFetch("/real-time/AAPL.US");
    const result = await testResponse.json();

    return new Response(
      JSON.stringify({
        ok: true,
        status: "EODHD API connection successful",
        test: result.ok ? "API key valid" : "API key test failed",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        code: "CONNECTION_ERROR",
        detail: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
