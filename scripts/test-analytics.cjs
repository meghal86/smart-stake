#!/usr/bin/env node

/**
 * Test Analytics Setup
 * 
 * Quick script to verify PostHog configuration is working
 */

// Load .env file
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

console.log('🔍 Testing Analytics Configuration...\n');

// Check environment variables
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

console.log('Environment Variables:');
console.log('✓ NEXT_PUBLIC_POSTHOG_KEY:', posthogKey ? `${posthogKey.substring(0, 10)}...` : '❌ NOT SET');
console.log('✓ NEXT_PUBLIC_POSTHOG_HOST:', posthogHost || '❌ NOT SET');
console.log('');

if (!posthogKey) {
  console.error('❌ PostHog API key not found!');
  console.log('Add to your .env file:');
  console.log('NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here');
  process.exit(1);
}

if (!posthogHost) {
  console.error('❌ PostHog host not found!');
  console.log('Add to your .env file:');
  console.log('NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com');
  process.exit(1);
}

console.log('✅ Analytics configuration looks good!');
console.log('');
console.log('Next steps:');
console.log('1. Start your dev server: npm run dev');
console.log('2. Open your app in the browser');
console.log('3. Check browser console for: "PostHog loaded successfully"');
console.log('4. Check PostHog dashboard for incoming events');
console.log('');
console.log('📊 PostHog Dashboard: https://app.posthog.com');
