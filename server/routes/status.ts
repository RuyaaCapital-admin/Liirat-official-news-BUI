import { RequestHandler } from "express";

export const handleStatus: RequestHandler = async (req, res) => {
  try {
    // Basic health check
    const status = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {
        server: { status: "ok", message: "Server is running" },
        database: { status: "ok", message: "No database checks needed" },
        api: { status: "ok", message: "API endpoints available" }
      }
    };

    res.json(status);
  } catch (error) {
    console.error("Status check failed:", error);
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
