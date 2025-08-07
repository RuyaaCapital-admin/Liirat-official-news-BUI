// Test script to verify EODHD API is working and returning real data
async function testEODHDAPI() {
  console.log("🧪 Testing EODHD API endpoints...");

  try {
    // Test Economic Calendar
    console.log("\n📅 Testing Economic Calendar API...");
    const calendarResponse = await fetch(
      "/api/eodhd-calendar?limit=10&importance=3,2",
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
      console.log("✅ Calendar API Success!");
      console.log(
        "Number of events received:",
        calendarData.events?.length || 0,
      );
      console.log(
        "Sample event data:",
        calendarData.events?.[0] || "No events",
      );
      console.log("Full response structure:", {
        total: calendarData.total,
        filters: calendarData.filters,
        eventsCount: calendarData.events?.length,
        firstEvent: calendarData.events?.[0],
      });

      // Verify data fields
      if (calendarData.events?.length > 0) {
        const sampleEvent = calendarData.events[0];
        console.log("\n🔍 Data validation:");
        console.log("- Has date:", !!sampleEvent.date);
        console.log("- Has country:", !!sampleEvent.country);
        console.log("- Has event name:", !!sampleEvent.event);
        console.log("- Has importance:", !!sampleEvent.importance);
        console.log("- Sample event:", {
          date: sampleEvent.date,
          country: sampleEvent.country,
          event: sampleEvent.event,
          importance: sampleEvent.importance,
          actual: sampleEvent.actual,
          forecast: sampleEvent.forecast,
          previous: sampleEvent.previous,
        });
      }
    } else {
      console.log(
        "❌ Calendar API failed with status:",
        calendarResponse.status,
      );
      const errorText = await calendarResponse.text();
      console.log("Error response:", errorText);
    }

    // Test Price API
    console.log("\n💹 Testing Price API...");
    const priceResponse = await fetch("/api/eodhd-price?symbol=EURUSD", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    console.log("Price Response Status:", priceResponse.status);

    if (priceResponse.ok) {
      const priceData = await priceResponse.json();
      console.log("✅ Price API Success!");
      console.log("Price data received:", priceData);

      if (priceData.prices?.length > 0) {
        const sample = priceData.prices[0];
        console.log("Sample price data:", {
          symbol: sample.symbol,
          price: sample.price,
          change: sample.change,
          change_percent: sample.change_percent,
        });
      }
    } else {
      console.log("❌ Price API failed with status:", priceResponse.status);
      const errorText = await priceResponse.text();
      console.log("Error response:", errorText);
    }
  } catch (error) {
    console.error("❌ Network error during EODHD API test:", error);
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
  }
}

// Auto-run when loaded in browser
if (typeof window !== "undefined") {
  window.testEODHDAPI = testEODHDAPI;
  console.log(
    "🔧 EODHD API test function loaded. Run window.testEODHDAPI() in console to test.",
  );

  // Auto-run test after a short delay
  setTimeout(() => {
    console.log("🚀 Auto-running EODHD API test...");
    testEODHDAPI();
  }, 2000);
}

export { testEODHDAPI };
