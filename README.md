# 🐋 Whale Tracker - Professional Crypto Whale Monitoring App

A modern, full-stack application for tracking large cryptocurrency transactions (whale movements) with real-time alerts, premium subscriptions, and advanced analytics.

## ✨ Features

### 🔐 **Authentication**
- **Email/Password** authentication with secure validation
- **Google OAuth** integration
- **Apple OAuth** integration
- **Professional UI** with modern design patterns
- **Password strength validation** and security requirements

### 💳 **Subscription Management**
- **Stripe Integration** with secure payment processing
- **Multiple Plans**: Free, Premium Monthly, Premium Annual
- **Webhook Processing** for real-time subscription updates
- **Professional checkout flow** with success/failure handling

### 🐋 **Whale Tracking**
- **Real-time whale alerts** for large transactions
- **Multi-chain support** (Ethereum, Polygon, BSC, etc.)
- **Advanced filtering** by amount, token, chain
- **Transaction details** with blockchain explorer links
- **Demo data** for unauthenticated users

### 👤 **User Management**
- **Personalized profiles** with user metadata
- **Preference management** (favorite chains, tokens, thresholds)
- **Subscription status** and billing management
- **Onboarding flow** for new users

### 🏗️ **Technical Stack**
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS + Radix UI
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth + OAuth
- **Payments**: Stripe + Webhooks
- **Testing**: Jest + React Testing Library + BDD Features

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account

### 1. Clone and Install
```bash
git clone <repository-url>
cd whale-tracker
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Update .env with your keys
```

### 3. Automated Setup
```bash
./setup.sh
```

### 4. Manual Setup (Alternative)
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Deploy Edge Functions
supabase functions deploy

# Set secrets
supabase secrets set STRIPE_SECRET_KEY="your-stripe-secret-key"
supabase secrets set STRIPE_WEBHOOK_SECRET="your-webhook-secret"

# Generate types
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

### 5. Development
```bash
npm run dev
```

## 📋 Configuration

### Environment Variables
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
STRIPE_SECRET_KEY=sk_test_your-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

### Stripe Configuration
1. Create products in Stripe Dashboard:
   - **Premium Monthly**: $9.99/month
   - **Premium Annual**: $99.99/year
2. Update price IDs in `src/pages/Subscription.tsx`
3. Configure webhook endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`

### OAuth Setup
1. **Google**: Configure in Google Cloud Console
2. **Apple**: Configure in Apple Developer Portal
3. Add redirect URIs to Supabase Auth settings

## 🧪 Testing

### Unit Tests
```bash
npm test                 # Run tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### Edge Function Tests
```bash
cd supabase/functions
deno test --allow-all
```

### BDD Features
Feature files are located in `/features` directory with comprehensive scenarios for:
- Authentication flows
- Subscription management
- Whale tracking functionality

## 🏗️ Architecture

### Database Schema
- **users**: User accounts and plans
- **users_metadata**: Extended user information
- **subscriptions**: Stripe subscription data
- **alerts**: Whale transaction alerts
- **user_preferences**: User customization
- **devices**: Push notification tokens
- **yields**: DeFi yield opportunities

### API Architecture
- **Supabase Edge Functions** for serverless API
- **Row Level Security** for data protection
- **Real-time subscriptions** for live updates
- **Webhook processing** for external integrations

### Security Features
- **JWT Authentication** with secure sessions
- **OAuth 2.0** for third-party login
- **Row Level Security** for database access
- **Input validation** and sanitization
- **HTTPS/TLS** encryption
- **PCI compliance** via Stripe

## 📱 User Experience

### Authentication Flow
1. **Landing Page**: Demo data with signup prompts
2. **Registration**: Email/OAuth with plan selection
3. **Onboarding**: Feature walkthrough
4. **Dashboard**: Personalized whale alerts

### Subscription Flow
1. **Plan Selection**: Free vs Premium comparison
2. **Stripe Checkout**: Secure payment processing
3. **Confirmation**: Success page with feature access
4. **Management**: Profile-based subscription control

### Whale Tracking
1. **Real-time Alerts**: Live transaction monitoring
2. **Filtering**: Chain, token, amount customization
3. **Details**: Transaction analysis and explorer links
4. **Personalization**: Favorite tokens and thresholds

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run build
vercel --prod
```

### Backend (Supabase)
```bash
supabase functions deploy
supabase db push
```

### Environment Variables
Set in deployment platform:
- Vercel: Project settings
- Netlify: Site settings
- Supabase: Edge Function secrets

## 📊 Monitoring

### Analytics
- User registration and conversion rates
- Subscription metrics and churn
- Feature usage and engagement
- Performance monitoring

### Error Tracking
- Supabase logs for Edge Functions
- Frontend error boundaries
- Stripe webhook delivery monitoring
- Database query performance

## 🔧 Development

### Code Structure
```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
├── pages/              # Route components
└── lib/                # Utility functions

supabase/
├── functions/          # Edge Functions
├── migrations/         # Database migrations
└── config.toml         # Supabase configuration
```

### Best Practices
- **TypeScript** for type safety
- **ESLint + Prettier** for code quality
- **Component composition** over inheritance
- **Custom hooks** for business logic
- **Error boundaries** for fault tolerance

## 📚 Documentation

- **[Architecture Diagram](docs/architecture-diagram.md)**: System overview
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)**: Production setup
- **[Stripe Setup](STRIPE_SETUP.md)**: Payment integration
- **[API Documentation](docs/api.md)**: Edge Function reference

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Development Workflow
1. **Issues**: Use GitHub issues for bugs/features
2. **Testing**: Ensure tests pass before PR
3. **Code Review**: All PRs require review
4. **Documentation**: Update docs for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check guides in `/docs`
- **Issues**: GitHub Issues for bugs
- **Discussions**: GitHub Discussions for questions
- **Email**: support@whaletracker.com

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Authentication system
- ✅ Stripe integration
- ✅ Basic whale tracking
- ✅ User profiles

### Phase 2 (Next)
- 🔄 Real-time notifications
- 🔄 Mobile app (React Native)
- 🔄 Advanced analytics
- 🔄 API access for premium users

### Phase 3 (Future)
- 📋 Portfolio tracking
- 📋 Social features
- 📋 AI-powered insights
- 📋 Multi-language support

---

**Built with ❤️ by the Whale Tracker team**