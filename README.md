# 🐋 AlphaWhale Lite

A comprehensive whale intelligence platform built with Next.js 14, Supabase, and modern web technologies.

## Features

- **Whale Intelligence**: Real-time tracking of large whale movements
- **Token Unlock Calendar**: Upcoming token unlocks and vesting schedules
- **Market Intelligence**: Comprehensive market analysis powered by whale behavior
- **Guardian Smart Automation**: Gasless, automated token approval revocations
- **Responsive Design**: Mobile-first design with desktop sidebar navigation
- **Authentication**: Supabase Auth with email and Google OAuth
- **Plan-based Features**: Lite, Pro, and Enterprise tiers with feature gating

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (Postgres + Auth + Edge Functions)
- **UI Components**: Radix UI, Shadcn UI
- **State Management**: TanStack Query, Zustand
- **Testing**: Vitest (unit), Playwright (E2E)
- **Deployment**: Vercel (frontend), Supabase (database)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Upstash Redis (for Guardian automation)
- Ethereum RPC endpoint (for Guardian automation)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd smart-stake
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in your environment variables:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. Set up Supabase:
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase
supabase init

# Start local Supabase
supabase start

# Run migrations
supabase db reset

# Seed the database
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

6. (Optional) Set up Guardian Smart Automation:
```bash
# Copy Guardian automation environment template
cp .env.guardian-automation .env.local

# Fill in Guardian-specific variables
# Then run the deployment script
./scripts/deploy-guardian-automation.sh
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Guardian Smart Automation

For detailed Guardian automation setup, see [Guardian Automation Quick Start](docs/GUARDIAN_AUTOMATION_QUICKSTART.md).

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (app)/             # Protected app routes
│   │   ├── hub/           # Main dashboard
│   │   ├── portfolio/     # Portfolio tracking
│   │   ├── reports/       # Report generation
│   │   └── settings/      # User settings
│   ├── (auth)/            # Authentication routes
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── hub/              # Hub-specific components
│   └── navigation/        # Navigation components
├── lib/                   # Utilities and configurations
├── hooks/                 # Custom React hooks
└── __tests__/            # Test files
```

## Database Schema

The application uses Supabase with the following main tables:

- `user_profiles`: User account information and plan tiers
- `whale_digest`: Whale movement events and alerts
- `whale_index`: Daily whale activity scores
- `token_unlocks`: Upcoming token unlock events

## API Routes

- `GET /api/digest` - Fetch whale digest events
- `GET /api/whale-index` - Get current whale index score
- `GET /api/unlocks` - Fetch upcoming token unlocks
- `GET /api/streak` - Get user streak information
- `POST /api/streak` - Update user streak

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### All Tests
```bash
npm run test:all
```

## Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Supabase Deployment

1. Deploy edge functions:
```bash
supabase functions deploy ingest_whale_index
supabase functions deploy ingest_unlocks
supabase functions deploy notify_streak
```

2. Set up cron jobs for edge functions in Supabase dashboard

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SITE_URL` | Your site URL | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `ETHERSCAN_API_KEY` | Etherscan API key (optional) | No |
| `COINGECKO_API_KEY` | CoinGecko API key (optional) | No |
| `TOKEN_UNLOCKS_API_KEY` | TokenUnlocks API key (optional) | No |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@alphawhale.com or join our Discord community.