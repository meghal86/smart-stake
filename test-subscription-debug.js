const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rebeznxivaxgserswhbn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYmV6bnhpdmF4Z3NlcnN3aGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDc0NDIsImV4cCI6MjA3MDk4MzQ0Mn0.u2t2SEmm3rTpseRRdgym3jnaOq7lRLHW531PxPmu6xo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVerifyPayment() {
  const sessionId = 'cs_test_a1rKFfmcOJURVTbtUCmL0OgDF51iga6PEVOiwvF95X8F43QV2n1L97SUaH';
  const userId = 'test-user-id';

  console.log('Testing verify payment with:', { sessionId, userId });

  try {
    const { data, error } = await supabase.functions.invoke('simple-subscription', {
      body: {
        action: 'verify-payment',
        sessionId,
        userId
      }
    });

    console.log('Response data:', data);
    console.log('Response error:', error);
  } catch (err) {
    console.error('Catch error:', err);
  }
}

testVerifyPayment();