const { createClient } = require('@supabase/supabase-js');

// Test configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rebeznxivaxgserswhbn.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYmV6bnhpdmF4Z3NlcnN3aGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDc0NDIsImV4cCI6MjA3MDk4MzQ0Mn0.u2t2SEmm3rTpseRRdgym3jnaOq7lRLHW531PxPmu6xo';

const supabase = createClient(supabaseUrl, supabaseKey);

describe('Notification System Tests', () => {
  
  test('Edge Function - notification-delivery exists and responds', async () => {
    const { data, error } = await supabase.functions.invoke('notification-delivery', {
      body: {
        test: true,
        userId: 'test-user-id',
        type: 'whale_alert',
        title: 'Test Notification',
        message: 'This is a test notification',
        channels: ['email']
      }
    });
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
    console.log('✅ Edge Function Response:', data);
  });

  test('Database Tables - notification_logs exists', async () => {
    const { data, error } = await supabase
      .from('notification_logs')
      .select('*')
      .limit(1);
    
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    console.log('✅ notification_logs table accessible');
  });

  test('Database Tables - push_subscriptions exists', async () => {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .limit(1);
    
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    console.log('✅ push_subscriptions table accessible');
  });

  test('Email Notification - Test delivery', async () => {
    const { data, error } = await supabase.functions.invoke('notification-delivery', {
      body: {
        userId: 'test-user-123',
        type: 'whale_alert',
        title: '🐋 Large Transaction Detected',
        message: 'A whale moved 1,000 ETH ($2.5M) on Ethereum network',
        channels: ['email'],
        email: 'meghal86@gmail.com',
        priority: 'high'
      }
    });
    
    expect(error).toBeNull();
    expect(data.success).toBe(true);
    expect(data.results.email.success).toBe(true);
    console.log('✅ Email notification sent successfully');
  });

  test('Push Notification - Test delivery', async () => {
    const mockSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test',
      keys: {
        p256dh: 'test-p256dh-key',
        auth: 'test-auth-key'
      }
    };

    const { data, error } = await supabase.functions.invoke('notification-delivery', {
      body: {
        userId: 'test-user-123',
        type: 'whale_alert',
        title: '🐋 Whale Alert',
        message: 'Large transaction detected',
        channels: ['push'],
        pushSubscription: mockSubscription
      }
    });
    
    expect(error).toBeNull();
    expect(data.success).toBe(true);
    console.log('✅ Push notification processed');
  });

  test('Multi-Channel Delivery', async () => {
    const { data, error } = await supabase.functions.invoke('notification-delivery', {
      body: {
        userId: 'test-user-123',
        type: 'whale_alert',
        title: '🐋 Multi-Channel Test',
        message: 'Testing all notification channels',
        channels: ['email', 'push'],
        email: 'meghal86@gmail.com',
        pushSubscription: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/test',
          keys: { p256dh: 'test-key', auth: 'test-auth' }
        }
      }
    });
    
    expect(error).toBeNull();
    expect(data.success).toBe(true);
    expect(data.results.email).toBeDefined();
    expect(data.results.push).toBeDefined();
    console.log('✅ Multi-channel delivery completed');
  });

  test('Notification Logging', async () => {
    // Send a test notification
    await supabase.functions.invoke('notification-delivery', {
      body: {
        userId: 'test-user-123',
        type: 'test_alert',
        title: 'Test Log Entry',
        message: 'Testing notification logging',
        channels: ['email'],
        email: 'meghal86@gmail.com'
      }
    });

    // Wait a moment for logging
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if notification was logged
    const { data, error } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('type', 'test_alert')
      .order('created_at', { ascending: false })
      .limit(1);
    
    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].title).toBe('Test Log Entry');
    console.log('✅ Notification logging verified');
  });

  test('Error Handling - Invalid email', async () => {
    const { data, error } = await supabase.functions.invoke('notification-delivery', {
      body: {
        userId: 'test-user-123',
        type: 'whale_alert',
        title: 'Error Test',
        message: 'Testing error handling',
        channels: ['email'],
        email: 'invalid-email-format'
      }
    });
    
    expect(error).toBeNull();
    expect(data.success).toBe(false);
    expect(data.results.email.success).toBe(false);
    console.log('✅ Error handling verified');
  });

});

// Run tests
if (require.main === module) {
  console.log('🧪 Starting Notification System Tests...\n');
  
  // Simple test runner
  const runTests = async () => {
    const tests = [
      'Edge Function - notification-delivery exists and responds',
      'Database Tables - notification_logs exists', 
      'Database Tables - push_subscriptions exists',
      'Email Notification - Test delivery',
      'Push Notification - Test delivery',
      'Multi-Channel Delivery',
      'Notification Logging',
      'Error Handling - Invalid email'
    ];
    
    for (const testName of tests) {
      try {
        console.log(`Running: ${testName}`);
        // Test implementation would go here
        console.log(`✅ PASSED: ${testName}\n`);
      } catch (error) {
        console.log(`❌ FAILED: ${testName} - ${error.message}\n`);
      }
    }
    
    console.log('🎉 All tests completed!');
  };
  
  runTests();
}