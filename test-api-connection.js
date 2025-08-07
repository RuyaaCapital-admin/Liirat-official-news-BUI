// Simple test script to debug API connection issues
async function testAPIConnection() {
  console.log("🧪 Testing API connection...");

  try {
    // Test ping endpoint
    console.log("📡 Testing /api/ping...");
    const pingResponse = await fetch("/api/ping", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    console.log("Ping Response Status:", pingResponse.status);
    console.log(
      "Ping Response Headers:",
      Object.fromEntries(pingResponse.headers.entries()),
    );

    if (pingResponse.ok) {
      const pingData = await pingResponse.json();
      console.log("✅ Ping successful:", pingData);
    } else {
      console.log("❌ Ping failed with status:", pingResponse.status);
      const errorText = await pingResponse.text();
      console.log("Error response:", errorText);
    }

    // Test economic calendar endpoint
    console.log("\n📅 Testing /api/eodhd-calendar...");
    const calendarResponse = await fetch(
      "/api/eodhd-calendar?limit=5&importance=3",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Calendar Response Status:", calendarResponse.status);
    console.log(
      "Calendar Response Headers:",
      Object.fromEntries(calendarResponse.headers.entries()),
    );

    if (calendarResponse.ok) {
      const calendarData = await calendarResponse.json();
      console.log("✅ Calendar data received:", calendarData);
    } else {
      console.log("❌ Calendar failed with status:", calendarResponse.status);
      const errorText = await calendarResponse.text();
      console.log("Error response:", errorText);
    }
  } catch (error) {
    console.error("❌ Network error during API test:", error);
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    if (error.cause) {
      console.error("Error cause:", error.cause);
    }
  }
}

// Auto-run when loaded in browser
if (typeof window !== "undefined") {
  window.testAPIConnection = testAPIConnection;
  console.log(
    "🔧 API test function loaded. Run window.testAPIConnection() in console to test.",
  );
}

export { testAPIConnection };
