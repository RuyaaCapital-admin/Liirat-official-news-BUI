#!/usr/bin/env node

/**
 * EODHD API ENDPOINT TESTING SCRIPT
 * Tests all official EODHD endpoints with proper API key
 */

const API_KEY = "6891e3b89ee5e1.29062933";
const BASE_URL = "https://eodhd.com/api";

// Test symbols as required by user
const TEST_SYMBOLS = {
  gold: "XAUUSD.FOREX",
  btc: "BTC-USD.CC", 
  eth: "ETH-USD.CC",
  eurusd: "EURUSD.FOREX",
  usdjpy: "USDJPY.FOREX",
  gbpusd: "GBPUSD.FOREX"
};

async function testEndpoint(name, url, expectedFields = []) {
  console.log(`\n🔍 Testing ${name}:`);
  console.log(`   URL: ${url}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Liirat-News/1.0'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ SUCCESS - Response received`);
      
      if (Array.isArray(data)) {
        console.log(`   📊 Data: Array with ${data.length} items`);
        if (data.length > 0) {
          console.log(`   📝 Sample item keys: ${Object.keys(data[0]).join(', ')}`);
        }
      } else if (typeof data === 'object') {
        console.log(`   📊 Data: Object with keys: ${Object.keys(data).join(', ')}`);
      }
      
      // Check for expected fields
      if (expectedFields.length > 0) {
        const sampleItem = Array.isArray(data) ? data[0] : data;
        const missingFields = expectedFields.filter(field => !(field in sampleItem));
        if (missingFields.length === 0) {
          console.log(`   ✅ All expected fields present`);
        } else {
          console.log(`   ⚠️  Missing fields: ${missingFields.join(', ')}`);
        }
      }
      
      return true;
    } else {
      const errorText = await response.text().catch(() => 'No error details');
      console.log(`   ❌ FAILED - ${response.status}: ${errorText.substring(0, 200)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ERROR - ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log("🚀 EODHD API ENDPOINT TESTING");
  console.log("==============================");
  console.log(`Using API Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(-4)}`);
  
  const results = {};
  
  // 1. Economic Calendar
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const toDate = nextWeek.toISOString().split('T')[0];
  
  results.calendar = await testEndpoint(
    "Economic Calendar",
    `${BASE_URL}/economic-events?api_token=${API_KEY}&fmt=json&from=${today}&to=${toDate}`,
    ['date', 'event', 'country']
  );
  
  // 2. Real-Time Prices - Test each symbol
  console.log("\n📈 TESTING REAL-TIME PRICES");
  console.log("===========================");
  
  for (const [name, symbol] of Object.entries(TEST_SYMBOLS)) {
    let apiUrl;
    if (symbol.includes('-USD.CC')) {
      // Crypto endpoint
      apiUrl = `${BASE_URL}/real-time/crypto?s=${symbol}&api_token=${API_KEY}&fmt=json`;
    } else if (symbol.includes('.FOREX')) {
      // Forex endpoint  
      apiUrl = `${BASE_URL}/real-time/forex?s=${symbol}&api_token=${API_KEY}&fmt=json`;
    } else {
      // Stocks endpoint
      apiUrl = `${BASE_URL}/real-time/stocks?s=${symbol}&api_token=${API_KEY}&fmt=json`;
    }
    
    results[`price_${name}`] = await testEndpoint(
      `${name.toUpperCase()} Price (${symbol})`,
      apiUrl,
      ['code', 'close', 'change']
    );
  }
  
  // 3. Financial News
  results.news = await testEndpoint(
    "Financial News",
    `${BASE_URL}/news?api_token=${API_KEY}&fmt=json&limit=10&offset=0`,
    ['title', 'content', 'date']
  );
  
  // 4. Test with specific symbol news
  results.news_btc = await testEndpoint(
    "BTC News",
    `${BASE_URL}/news?s=BTC-USD.CC&api_token=${API_KEY}&fmt=json&limit=5&offset=0`,
    ['title', 'content', 'date']
  );
  
  // Print Summary
  console.log("\n📊 TEST SUMMARY");
  console.log("===============");
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  console.log(`✅ Passed: ${passed}/${total} tests`);
  console.log(`❌ Failed: ${total - passed}/${total} tests`);
  
  if (passed === total) {
    console.log("\n🎉 ALL TESTS PASSED! EODHD API is working correctly.");
  } else {
    console.log("\n⚠️  Some tests failed. Check API key or endpoint configuration.");
  }
  
  console.log("\n🔗 WebSocket Endpoints (not tested in this script):");
  console.log(`   Forex: wss://ws.eodhistoricaldata.com/ws/forex?api_token=${API_KEY}`);
  console.log(`   Crypto: wss://ws.eodhistoricaldata.com/ws/crypto?api_token=${API_KEY}`);
  console.log(`   US Stocks: wss://ws.eodhistoricaldata.com/ws/us?api_token=${API_KEY}`);
  
  return results;
}

// Run the tests
runTests().catch(console.error);
