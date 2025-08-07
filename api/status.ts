import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * API Status and Health Check Endpoint
 * 
 * This endpoint helps debug network connectivity issues by:
 * 1. Testing basic API functionality
 * 2. Checking EODHD API connectivity
 * 3. Providing diagnostic information
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
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

  const status = {
    timestamp: new Date().toISOString(),
    service: "Liirat News API",
    version: "1.0.0",
    deployment: process.env.VERCEL_URL || "local",
    environment: process.env.NODE_ENV || "development",
    checks: {} as Record<string, any>,
  };

  try {
    // Test 1: Basic API functionality
    status.checks.api = {
      status: "ok",
      message: "API endpoint is responding",
    };

    // Test 2: Environment variables
    status.checks.environment = {
      status: process.env.EODHD_API_KEY || process.env.API_KEY ? "ok" : "warning",
      message: process.env.EODHD_API_KEY || process.env.API_KEY 
        ? "API key configured" 
        : "Using fallback API key",
      hasApiKey: !!(process.env.EODHD_API_KEY || process.env.API_KEY),
    };

    // Test 3: EODHD API connectivity (test with a simple symbol)
    try {
      const testSymbol = "EURUSD.FOREX";
      const apiKey = process.env.EODHD_API_KEY || process.env.API_KEY || "6891e3b89ee5e1.29062933";
      const testUrl = `https://eodhd.com/api/real-time/${testSymbol}?api_token=${apiKey}&fmt=json`;

      console.log(`[STATUS] Testing EODHD connectivity: ${testUrl}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const eodhResponse = await fetch(testUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "Liirat-News/1.0",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      status.checks.eodhd = {
        status: eodhResponse.ok ? "ok" : "error",
        statusCode: eodhResponse.status,
        message: eodhResponse.ok 
          ? "EODHD API is accessible" 
          : `EODHD API error: ${eodhResponse.status}`,
        testSymbol,
        testUrl: testUrl.replace(apiKey, "***"),
      };

      if (eodhResponse.ok) {
        try {
          const testData = await eodhResponse.json();
          status.checks.eodhd.sampleData = {
            hasData: !!testData,
            dataType: typeof testData,
            keys: testData && typeof testData === 'object' ? Object.keys(testData) : [],
          };
        } catch (e) {
          status.checks.eodhd.parseError = "Failed to parse response as JSON";
        }
      }

    } catch (eodhError) {
      status.checks.eodhd = {
        status: "error",
        message: `EODHD connectivity failed: ${eodhError instanceof Error ? eodhError.message : String(eodhError)}`,
        error: eodhError instanceof Error ? eodhError.name : "Unknown error",
      };
    }

    // Test 4: Network configuration
    status.checks.network = {
      status: "ok",
      userAgent: req.headers["user-agent"] || "unknown",
      origin: req.headers.origin || "unknown",
      host: req.headers.host || "unknown",
      forwarded: req.headers["x-forwarded-for"] || "none",
    };

    // Overall status
    const hasErrors = Object.values(status.checks).some(check => check.status === "error");
    const hasWarnings = Object.values(status.checks).some(check => check.status === "warning");

    res.status(200).json({
      ...status,
      overall: hasErrors ? "error" : hasWarnings ? "warning" : "ok",
      summary: hasErrors 
        ? "Some services are experiencing issues" 
        : hasWarnings 
        ? "All services operational with minor warnings"
        : "All services operational",
    });

  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({
      ...status,
      overall: "error",
      error: error instanceof Error ? error.message : String(error),
      checks: {
        api: {
          status: "error",
          message: "Status check failed",
        },
      },
    });
  }
}
