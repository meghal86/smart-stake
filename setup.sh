#!/bin/bash

# Whale Tracker Setup Script
echo "🐋 Setting up Whale Tracker Application..."

# Check if required tools are installed
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "📥 Installing Supabase CLI..."
    npm install -g supabase
fi

echo "✅ Supabase CLI is ready"

# Check if user is logged in to Supabase
if ! supabase projects list &> /dev/null; then
    echo "🔐 Please login to Supabase..."
    supabase login
fi

# Link to Supabase project
echo "🔗 Linking to Supabase project..."
echo "Please enter your Supabase project reference ID:"
read -p "Project Ref: " PROJECT_REF

if [ ! -z "$PROJECT_REF" ]; then
    supabase link --project-ref $PROJECT_REF
    echo "✅ Linked to Supabase project: $PROJECT_REF"
else
    echo "⚠️  No project reference provided. You'll need to link manually later."
fi

# Run database migrations
echo "🗄️  Running database migrations..."
supabase db push

# Set up Edge Functions
echo "⚡ Deploying Edge Functions..."
supabase functions deploy create-checkout-session
supabase functions deploy verify-session
supabase functions deploy stripe-webhook

# Set Stripe secrets
echo "💳 Setting up Stripe integration..."
echo "Please enter your Stripe secret key:"
read -s -p "Stripe Secret Key: " STRIPE_SECRET_KEY
echo

if [ ! -z "$STRIPE_SECRET_KEY" ]; then
    supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
    echo "✅ Stripe secret key set"
fi

echo "Please enter your Stripe webhook secret:"
read -s -p "Stripe Webhook Secret: " STRIPE_WEBHOOK_SECRET
echo

if [ ! -z "$STRIPE_WEBHOOK_SECRET" ]; then
    supabase secrets set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"
    echo "✅ Stripe webhook secret set"
fi

# Generate types
echo "🔧 Generating TypeScript types..."
supabase gen types typescript --linked > src/integrations/supabase/types.ts

# Build the project
echo "🏗️  Building the project..."
npm run build

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update Stripe price IDs in src/pages/Subscription.tsx"
echo "2. Configure OAuth providers in Supabase dashboard"
echo "3. Set up Stripe webhooks pointing to your Edge Functions"
echo "4. Deploy to Vercel/Netlify: npm run deploy:prod"
echo ""
echo "🚀 Start development server: npm run dev"
echo "🧪 Run tests: npm test"
echo ""
echo "📚 Check DEPLOYMENT_GUIDE.md for detailed instructions"