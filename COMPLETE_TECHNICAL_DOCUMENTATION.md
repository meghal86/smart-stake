# 🐋 AlphaWhale Pro - Complete Technical Implementation Documentation

## Overview

AlphaWhale Pro is a comprehensive whale intelligence platform built with Next.js 14, Supabase, and Stripe. This document details every implemented feature, from authentication to subscription management.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Postgres + Auth + Edge Functions)
- **Payments**: Stripe (Subscriptions + Webhooks)
- **UI Components**: Radix UI, Shadcn UI
- **State Management**: React Context, Custom Hooks
- **Authentication**: Supabase Auth (Email + OAuth)

### Project Structure
```
src/
├── app/                    # Next.js App Router (not used - using pages)
├── components/            # React components
│   ├── ui/               # Reusable UI components (Shadcn)
│   ├── subscription/     # Subscription management components
│   └── layout/           # Layout components
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
├── pages/                # Main application pages
├── services/             # External service integrations
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

## 🔐 Authentication System

### Implementation Details

#### Login Page (`src/pages/Login.tsx`)
- **Email/Password Authentication**: Standard form with validation
- **OAuth Providers**: Google and Apple Sign-In
- **Password Reset**: Forgot password functionality
- **Form Validation**: Real-time validation with error handling
- **Loading States**: Proper loading indicators for all auth methods

**Key Features:**
```typescript
// Email login with error handling
const handleEmailLogin = async (e: React.FormEvent) => {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password
  });
  // Error handling and navigation
};

// OAuth login with redirect handling
const handleGoogleLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
    }
  });
};
```

#### Signup Pages
Two signup implementations:

1. **Basic Signup** (`src/pages/Signup.tsx`)
   - Plan selection (Free vs Premium)
   - Password strength validation
   - Terms acceptance
   - OAuth integration

2. **Enhanced Signup** (`src/pages/SignupNew.tsx`)
   - Stripe integration for premium plans
   - Real-time payment processing
   - Enhanced UX with better loading states

**Password Validation:**
```typescript
const validatePassword = (password: string) => {
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?\":{}|<>]/.test(password);
  
  return {
    minLength, hasUpperCase, hasLowerCase, 
    hasNumbers, hasSpecialChar,
    isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
  };
};
```

#### Authentication Context (`src/contexts/AuthContext.tsx`)
- Centralized auth state management
- Session persistence
- User profile management
- Loading states

## 💳 Stripe Integration

### Configuration (`src/utils/stripeConfig.ts`)
```typescript
export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  priceIds: {
    premium: 'price_1S0HBOJwuQyqUsksDCs7SbPB', // $19.99/month
    pro: 'price_1S0HB3JwuQyqUsks8bKNUt6M', // $9.99/month
  }
};
```

### Subscription Plans
- **Free Plan**: $0 - Basic features, 50 alerts/day
- **Pro Plan**: $9.99/month - Unlimited alerts, advanced features
- **Premium Plan**: $19.99/month - All features, API access
- **Enterprise Plan**: Custom pricing - White-label, SLA

### Stripe Edge Functions

#### 1. Create Subscription (`supabase/functions/create-subscription/index.ts`)
```typescript
// Creates Stripe customer and subscription
const customer = await stripe.customers.create({
  email,
  payment_method: paymentMethodId,
  invoice_settings: { default_payment_method: paymentMethodId },
  metadata: { user_id: userId }
});

const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{ price: priceId }],
  payment_behavior: 'default_incomplete',
  expand: ['latest_invoice.payment_intent'],
  metadata: { user_id: userId }
});
```

#### 2. Stripe Webhooks (`supabase/functions/stripe-webhook/index.ts`)
Handles all Stripe events:
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**Webhook Security:**
```typescript
const signature = req.headers.get('stripe-signature');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
```

#### 3. Subscription Management (`supabase/functions/manage-subscription/index.ts`)
- Cancel subscriptions
- Reactivate subscriptions
- Update subscription plans
- Get subscription details
- Manage billing portal

#### 4. Simple Subscription (`supabase/functions/simple-subscription/index.ts`)
- Create checkout sessions
- Verify payments
- Handle subscription updates

### Frontend Subscription Hooks

#### useSubscription (`src/hooks/useSubscription.ts`)
```typescript
export const useSubscription = () => {
  const fetchUserPlan = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('plan')
      .eq('user_id', user.id)
      .single();
  };

  const getPlanLimits = () => {
    const limits = {
      free: { whaleAlertsPerDay: 50, realTimeAlerts: false },
      pro: { whaleAlertsPerDay: 500, realTimeAlerts: true },
      premium: { whaleAlertsPerDay: -1, apiAccess: true }
    };
    return limits[plan];
  };
};
```

#### useSimpleSubscription (`src/hooks/useSimpleSubscription.ts`)
- Simplified subscription management
- Checkout creation
- Payment verification

### Subscription Pages

#### Subscription Plans (`src/pages/Subscription.tsx`)
- **Plan Comparison**: Cards and table view
- **Currency Support**: USD, EUR, JPY, KRW
- **Billing Toggle**: Monthly/Annual with 20% discount
- **Feature Comparison**: Detailed feature breakdown
- **Enterprise Contact**: Modal for enterprise inquiries

**Key Features:**
- Responsive design with mobile optimization
- Real-time currency conversion
- Plan upgrade/downgrade handling
- Coming soon badges for future features

#### Manage Subscription (`src/pages/ManageSubscription.tsx`)
- **Overview Tab**: Current subscription details
- **Plans Tab**: Change subscription plans
- **Settings Tab**: Billing and payment methods

#### Subscription Manager (`src/components/subscription/SubscriptionManager.tsx`)
- Current subscription overview
- Invoice management
- Cancel/reactivate subscriptions
- Billing portal integration

## 🗄️ Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  product_id TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Webhook Logs Table
```sql
CREATE TABLE webhook_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('processing', 'success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Feature Flags Table
```sql
CREATE TABLE feature_flags (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Database Triggers

#### Auto User Creation
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (user_id, email, plan, created_at, updated_at)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'plan', 'free'),
    NOW(),
    NOW()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Row Level Security (RLS)

#### Users Table Policies
```sql
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage users" ON users
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.uid() = user_id
  );
```

## 🔧 Environment Configuration

### Required Environment Variables

#### Frontend (.env.local)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_FF_LITE_HOME_DEFAULT=true
NEXT_PUBLIC_FF_SIGNALS_ON_HOME=true
NEXT_PUBLIC_FF_AI_COPILOT_CARD=true
NEXT_PUBLIC_FF_WATCHLIST_V2=true
```

#### Supabase Edge Functions
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🚀 Deployment

### Supabase Edge Functions Deployment
```bash
# Deploy all subscription-related functions
supabase functions deploy create-subscription
supabase functions deploy stripe-webhook
supabase functions deploy manage-subscription
supabase functions deploy simple-subscription
```

### Environment Variables Setup
```bash
# Set Stripe secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### Database Migrations
```bash
# Run all migrations
supabase db reset
supabase db push
```

## 🧪 Testing

### Stripe Testing
- Use Stripe test cards: `4242424242424242`
- Test webhook events with Stripe CLI
- Verify subscription flows in test mode

### Authentication Testing
- Test email/password signup and login
- Test OAuth flows (Google, Apple)
- Test password reset functionality

### Subscription Testing
- Test plan upgrades and downgrades
- Test subscription cancellation and reactivation
- Test webhook event handling

## 🔒 Security Features

### Authentication Security
- Password strength validation
- Email verification
- OAuth integration with secure redirects
- Session management with automatic refresh

### Payment Security
- Stripe PCI compliance
- Webhook signature verification
- Secure API key management
- RLS policies for data access

### Data Protection
- Row Level Security (RLS) on all tables
- Service role isolation for webhooks
- Encrypted environment variables
- CORS configuration for API endpoints

## 📊 Analytics & Monitoring

### Implemented Analytics
- Pricing page interactions
- Plan selection tracking
- Subscription conversion events
- Feature usage tracking

### Error Monitoring
- Webhook event logging
- Subscription error tracking
- Authentication failure logging
- Database operation monitoring

## 🎨 UI/UX Features

### Design System
- Consistent component library (Shadcn UI)
- Dark/light mode support
- Responsive design
- Accessibility compliance

### User Experience
- Loading states for all async operations
- Error handling with user-friendly messages
- Progressive enhancement
- Mobile-first design

### Subscription UX
- Clear plan comparison
- Transparent pricing
- Easy plan switching
- Billing portal integration

## 🔄 State Management

### Contexts
- **AuthContext**: User authentication state
- **SubscriptionContext**: Subscription management
- **ThemeContext**: UI theme management

### Custom Hooks
- **useSubscription**: Subscription data and operations
- **useSignupFlow**: Signup process management
- **useSimpleSubscription**: Simplified subscription handling

## 📱 Mobile Optimization

### Responsive Design
- Mobile-first CSS approach
- Touch-friendly interfaces
- Optimized form layouts
- Adaptive navigation

### Performance
- Code splitting
- Lazy loading
- Optimized images
- Minimal bundle size

## 🔮 Future Enhancements

### Planned Features
- Smart contract analysis (Q2 2025)
- Wallet security scoring (Q2 2025)
- Workflow automation (Q3 2025)
- Advanced forensics dashboard (Q3 2025)

### Technical Improvements
- Enhanced error handling
- Advanced caching strategies
- Real-time notifications
- API rate limiting

## 📚 Documentation

### API Documentation
- Stripe webhook endpoints
- Supabase edge functions
- Database schema documentation
- Authentication flow diagrams

### User Guides
- Subscription management guide
- Feature comparison charts
- Billing FAQ
- Support documentation

## 🛠️ Development Workflow

### Local Development
```bash
# Start development server
npm run dev

# Start Supabase locally
supabase start

# Run database migrations
supabase db reset
```

### Code Quality
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Pre-commit hooks

### Testing Strategy
- Unit tests for utilities
- Integration tests for API endpoints
- E2E tests for critical user flows
- Manual testing for subscription flows

## 📈 Performance Metrics

### Key Metrics
- Page load times
- Subscription conversion rates
- Authentication success rates
- Payment processing times

### Monitoring
- Real-time error tracking
- Performance monitoring
- User behavior analytics
- Subscription health metrics

---

This documentation covers the complete technical implementation of AlphaWhale Pro, including all authentication, subscription, and payment features. The system is production-ready with proper security, error handling, and user experience considerations.