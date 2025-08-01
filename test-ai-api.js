// Simple test script to verify AI API works
// Run with: node test-ai-api.js

const testAIAPI = async () => {
  console.log('🧪 Testing AI API...');
  
  const testPayload = {
    message: "Hello, test message",
    conversationHistory: [],
    context: {
      selectedSymbol: "EURUSD",
      recentNews: []
    }
  };

  try {
    // Test locally (you can change this to your deployed URL)
    const response = await fetch('http://localhost:3000/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ AI API Test PASSED');
      console.log('📝 Response:', data.response?.substring(0, 100) + '...');
      console.log('💰 Usage:', data.usage);
      return true;
    } else {
      const errorData = await response.text();
      console.log('❌ AI API Test FAILED');
      console.log('🚨 Error:', errorData);
      return false;
    }
  } catch (error) {
    console.log('❌ AI API Test FAILED');
    console.log('🚨 Network Error:', error.message);
    return false;
  }
};

// Test Alerts API
const testAlertsAPI = async () => {
  console.log('🔔 Testing Alerts API...');
  
  const alertPayload = {
    symbol: "EURUSD",
    type: "price",
    condition: "Test alert condition",
    notificationMethod: "email",
    contactInfo: "test@example.com"
  };

  try {
    const response = await fetch('http://localhost:3000/api/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alertPayload),
    });

    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Alerts API Test PASSED');
      console.log('📝 Response:', data.message);
      return true;
    } else {
      const errorData = await response.text();
      console.log('❌ Alerts API Test FAILED');
      console.log('🚨 Error:', errorData);
      return false;
    }
  } catch (error) {
    console.log('❌ Alerts API Test FAILED');
    console.log('🚨 Network Error:', error.message);
    return false;
  }
};

// Run tests
const runTests = async () => {
  console.log('🚀 Starting API Tests...\n');
  
  const aiTest = await testAIAPI();
  console.log('');
  const alertsTest = await testAlertsAPI();
  
  console.log('\n📋 Test Results:');
  console.log(`AI API: ${aiTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Alerts API: ${alertsTest ? '✅ PASS' : '❌ FAIL'}`);
  
  if (aiTest && alertsTest) {
    console.log('\n🎉 ALL TESTS PASSED - Ready for deployment!');
  } else {
    console.log('\n⚠️  Some tests failed - Check configuration');
  }
};

// For Node.js environments that don't have fetch
if (typeof fetch === 'undefined') {
  console.log('⚠️  This test requires Node.js 18+ or install node-fetch');
  console.log('💡 Alternative: Test manually in browser dev tools or Postman');
  console.log('\n📝 Manual Test URLs:');
  console.log('POST http://localhost:3000/api/ai-chat');
  console.log('POST http://localhost:3000/api/alerts');
} else {
  runTests();
}

module.exports = { testAIAPI, testAlertsAPI };