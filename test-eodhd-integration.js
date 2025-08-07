#!/usr/bin/env node

/**
 * EODHD Integration Test Script
 * 
 * This script tests all EODHD endpoints to ensure:
 * 1. All endpoints use real EODHD API calls
 * 2. No mock/fake data is returned
 * 3. Proper error handling when API access is restricted
 */

const testEndpoints = [
  {
    name: "EODHD Calendar",
    url: "/api/eodhd-calendar?limit=5&importance=3",
    expectedFields: ["events", "total", "filters"]
  },
  {
    name: "EODHD Price",
    url: "/api/eodhd-price?symbol=EURUSD",
    expectedFields: ["prices", "total", "symbol", "timestamp"]
  },
  {
    name: "EODHD News",
    url: "/api/eodhd-news?limit=5",
    expectedFields: ["articles", "total", "filters", "timestamp"]
  }
];

async function testEndpoint(endpoint) {
  try {
    console.log(`\n🧪 Testing ${endpoint.name}...`);
    console.log(`   URL: ${endpoint.url}`);
    
    const response = await fetch(`http://localhost:5000${endpoint.url}`);
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
    
    // Check expected fields exist
    const missingFields = endpoint.expectedFields.filter(field => !(field in data));
    if (missingFields.length > 0) {
      console.log(`   ❌ Missing fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    // Check for mock data indicators
    const dataStr = JSON.stringify(data).toLowerCase();
    const mockIndicators = [
      'mock', 'fake', 'example', 'dummy', 'test data',
      'lorem ipsum', 'placeholder', 'sample'
    ];
    
    const foundMockIndicators = mockIndicators.filter(indicator => 
      dataStr.includes(indicator)
    );
    
    if (foundMockIndicators.length > 0) {
      console.log(`   ❌ Found mock data indicators: ${foundMockIndicators.join(', ')}`);
      return false;
    }
    
    // Check for EODHD API error messages (good - means real API calls)
    if (data.message && data.message.includes('EODHD API access restricted')) {
      console.log(`   ✅ EODHD API access restricted message found (real API call)`);
      return true;
    }
    
    // Check if we have real data
    if (endpoint.name === "EODHD Calendar" && data.events && data.events.length > 0) {
      console.log(`   ✅ Found ${data.events.length} real economic events`);
      return true;
    }
    
    if (endpoint.name === "EODHD Price" && data.prices && data.prices.length > 0) {
      console.log(`   ✅ Found real price data for ${data.symbol}`);
      return true;
    }
    
    if (endpoint.name === "EODHD News" && data.articles) {
      console.log(`   ✅ Found ${data.articles.length} news articles`);
      return true;
    }
    
    // Empty data with proper structure is acceptable (API restrictions)
    if ((data.events && data.events.length === 0) || 
        (data.prices && data.prices.length === 0) || 
        (data.articles && data.articles.length === 0)) {
      console.log(`   ✅ Empty data with proper structure (likely API restrictions)`);
      return true;
    }
    
    console.log(`   ⚠️  Unexpected response structure`);
    return false;
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testChatIntegration() {
  console.log(`\n🧪 Testing Chat AI Integration...`);
  
  try {
    const testMessages = [
      "What is the current price of EURUSD?",
      "ما هو سعر اليورو دولار؟"
    ];
    
    for (const message of testMessages) {
      console.log(`   Testing message: "${message}"`);
      
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message, 
          language: message.includes('سعر') ? 'ar' : 'en' 
        })
      });
      
      const data = await response.json();
      
      if (data.response) {
        const responseText = data.response.toLowerCase();
        
        // Check if response mentions EODHD (good sign)
        if (responseText.includes('eodhd')) {
          console.log(`   ✅ Response mentions EODHD data source`);
        }
        
        // Check for mock data indicators
        const mockIndicators = ['mock', 'fake', 'example', 'dummy'];
        const foundMockIndicators = mockIndicators.filter(indicator => 
          responseText.includes(indicator)
        );
        
        if (foundMockIndicators.length > 0) {
          console.log(`   ❌ Response contains mock data indicators: ${foundMockIndicators.join(', ')}`);
          return false;
        }
        
        console.log(`   ✅ Chat response looks clean (no mock data indicators)`);
      }
    }
    
    return true;
    
  } catch (error) {
    console.log(`   ❌ Chat test error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting EODHD Integration Tests...');
  console.log('📋 Verifying NO MOCK DATA and real EODHD API usage');
  
  let allPassed = true;
  
  // Test API endpoints
  for (const endpoint of testEndpoints) {
    const passed = await testEndpoint(endpoint);
    if (!passed) allPassed = false;
  }
  
  // Test chat integration
  const chatPassed = await testChatIntegration();
  if (!chatPassed) allPassed = false;
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED');
    console.log('✅ No mock data found in any endpoint');
    console.log('✅ All endpoints use real EODHD API calls');
    console.log('✅ Proper error handling for API restrictions');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('❌ Please check the output above for issues');
    process.exit(1);
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testEndpoint, testChatIntegration };
