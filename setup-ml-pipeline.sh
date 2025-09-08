#!/bin/bash

echo "🤖 Setting up ML Pipeline..."

# Deploy Edge Functions
echo "Deploying ML training function..."
supabase functions deploy ml-training

echo "Deploying ML cron job..."
supabase functions deploy ml-cron

echo "Deploying ML predictions function..."
supabase functions deploy ml-predictions

# Set secrets
echo "Setting up secrets..."
supabase secrets set CRON_SECRET="$(openssl rand -base64 32)"

# Run migrations
echo "Running ML migrations..."
supabase db push

# Set up cron job (GitHub Actions example)
echo "Setting up periodic training..."
cat > .github/workflows/ml-training.yml << EOF
name: ML Training Pipeline
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  train:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger ML Training
        run: |
          curl -X POST \\
            -H "Authorization: Bearer \${{ secrets.CRON_SECRET }}" \\
            "\${{ secrets.SUPABASE_URL }}/functions/v1/ml-cron"
EOF

echo "✅ ML Pipeline setup complete!"
echo ""
echo "Next steps:"
echo "1. Set CRON_SECRET in GitHub Actions secrets"
echo "2. Set SUPABASE_URL in GitHub Actions secrets"
echo "3. Manual training: supabase functions invoke ml-training"