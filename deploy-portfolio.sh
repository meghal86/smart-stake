#!/bin/bash

# Deploy Portfolio Tracker Function
echo "Deploying portfolio-tracker function..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Installing Supabase CLI..."
    npm install -g supabase
fi

# Deploy the function
supabase functions deploy portfolio-tracker

echo "Portfolio tracker function deployed successfully!"
echo "The portfolio monitor should now work with real data."