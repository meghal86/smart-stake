/**
 * Test script for notification endpoints
 * 
 * Tests the notification subscription and sending functionality
 * to ensure the implementation is working correctly.
 */

const BASE_URL = 'http://localhost:3000';

// Mock subscription data
const mockSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-123',
  keys: {
    p256dh: 'test-p256dh-key-123',
    auth: 'test-auth-key-123',
  },
  user_agent: 'Mozilla/5.0 (Test Browser)',
  timezone: 'America/New_York',
};

// Mock notification data
const mockNotification = {
  category: 'critical',
  message: 'Test critical notification from API test',
  data: {
    url: '/cockpit',
    test: true,
  },
};

async function testNotificationEndpoints() {
  console.log('🧪 Testing Notification Endpoints...\n');

  try {
    // Test 1: Subscribe to notifications (without auth - should fail)
    console.log('1. Testing subscription without auth (should fail)...');
    const subscribeResponse1 = await fetch(`${BASE_URL}/api/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockSubscription),
    });

    const subscribeResult1 = await subscribeResponse1.json();
    console.log('   Status:', subscribeResponse1.status);
    console.log('   Response:', subscribeResult1);
    
    if (subscribeResponse1.status === 401) {
      console.log('   ✅ Correctly rejected unauthenticated request\n');
    } else {
      console.log('   ❌ Should have rejected unauthenticated request\n');
    }

    // Test 2: Test endpoint with dev auth
    console.log('2. Testing dev-only test endpoint...');
    const testResponse = await fetch(`${BASE_URL}/api/notifications/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Dev test-dev-key-123', // This will fail without proper env var
      },
      body: JSON.stringify({
        category: 'daily_pulse',
      }),
    });

    const testResult = await testResponse.json();
    console.log('   Status:', testResponse.status);
    console.log('   Response:', testResult);
    
    if (testResponse.status === 403) {
      console.log('   ✅ Correctly rejected request without valid dev key\n');
    } else {
      console.log('   ❌ Should have rejected request without valid dev key\n');
    }

    // Test 3: Unsubscribe without auth (should fail)
    console.log('3. Testing unsubscribe without auth (should fail)...');
    const unsubscribeResponse = await fetch(`${BASE_URL}/api/notifications/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: mockSubscription.endpoint,
      }),
    });

    const unsubscribeResult = await unsubscribeResponse.json();
    console.log('   Status:', unsubscribeResponse.status);
    console.log('   Response:', unsubscribeResult);
    
    if (unsubscribeResponse.status === 401) {
      console.log('   ✅ Correctly rejected unauthenticated request\n');
    } else {
      console.log('   ❌ Should have rejected unauthenticated request\n');
    }

    // Test 4: Send notification without auth (should fail)
    console.log('4. Testing send notification without auth (should fail)...');
    const sendResponse = await fetch(`${BASE_URL}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockNotification),
    });

    const sendResult = await sendResponse.json();
    console.log('   Status:', sendResponse.status);
    console.log('   Response:', sendResult);
    
    if (sendResponse.status === 401) {
      console.log('   ✅ Correctly rejected unauthenticated request\n');
    } else {
      console.log('   ❌ Should have rejected unauthenticated request\n');
    }

    // Test 5: Validate request schemas
    console.log('5. Testing invalid request schemas...');
    
    // Test invalid subscription data
    const invalidSubscribeResponse = await fetch(`${BASE_URL}/api/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: 'invalid-url',
        keys: {
          p256dh: '', // Empty key
        },
      }),
    });

    const invalidSubscribeResult = await invalidSubscribeResponse.json();
    console.log('   Invalid subscribe status:', invalidSubscribeResponse.status);
    console.log('   Invalid subscribe response:', invalidSubscribeResult);
    
    if (invalidSubscribeResponse.status === 400) {
      console.log('   ✅ Correctly rejected invalid subscription data\n');
    } else {
      console.log('   ❌ Should have rejected invalid subscription data\n');
    }

    console.log('🎉 Notification endpoint tests completed!');
    console.log('\nNote: To test with authentication, you need to:');
    console.log('1. Set up Supabase authentication');
    console.log('2. Get a valid JWT token');
    console.log('3. Include it in the Authorization header');
    console.log('4. Set DEV_NOTIFICATIONS_KEY environment variable for test endpoint');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
testNotificationEndpoints();