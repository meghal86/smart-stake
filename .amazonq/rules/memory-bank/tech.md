# AlphaWhale Lite - Technology Stack

## Core Technologies

### Frontend Framework
- **React 18.2.0** - Modern React with hooks and concurrent features
- **TypeScript 5.0.2** - Type-safe JavaScript development
- **Vite** - Fast build tool and development server
- **React Router DOM 7.9.3** - Client-side routing

### UI & Styling
- **Tailwind CSS 3.3.5** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion 12.23.22** - Animation library
- **Lucide React 0.263.1** - Icon library
- **Next Themes 0.4.6** - Theme management

### State Management
- **TanStack Query 5.0.0** - Server state management and caching
- **Zustand 5.0.8** - Lightweight state management
- **React Hook Form 7.45.4** - Form state management

### Backend & Database
- **Supabase** - Backend-as-a-Service platform
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication system
  - Edge functions
- **Supabase JS 2.39.3** - JavaScript client library

### Payment Processing
- **Stripe** - Payment infrastructure
- **Stripe React 4.0.2** - React Stripe components

### Data Visualization
- **Recharts 2.15.4** - Chart library for React
- **React Virtuoso 4.14.1** - Virtualized list components

### Development Tools
- **ESLint 8.0.0** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

### Testing Framework
- **Vitest 1.0.0** - Unit testing framework
- **Playwright 1.40.0** - End-to-end testing
- **Cypress** - Additional E2E testing

## Development Commands

### Core Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Preview production build
npm run lint         # Run ESLint
```

### Testing
```bash
npm run test         # Run unit tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage
npm run test:e2e     # Run E2E tests
npm run test:all     # Run all tests
```

### Database Management
```bash
npm run db:reset     # Reset Supabase database
npm run db:seed      # Seed database with sample data
npm run db:migrate   # Run database migrations
```

## Build Configuration

### Vite Configuration
- **React Plugin**: Fast refresh and JSX support
- **Path Aliases**: `@/*` mapped to `./src/*`
- **Environment Variables**: Automatic .env loading
- **Build Optimization**: Tree shaking and code splitting

### TypeScript Configuration
- **Target**: ES5 for broad compatibility
- **Module**: ESNext with bundler resolution
- **Strict Mode**: Enabled for type safety
- **Path Mapping**: Absolute imports from src directory

### Tailwind Configuration
- **Custom Theme**: Extended color palette and spacing
- **Component Classes**: Utility combinations
- **Dark Mode**: Class-based theme switching
- **Responsive Design**: Mobile-first approach

## Environment Setup

### Required Environment Variables
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Optional API Keys
```env
ETHERSCAN_API_KEY=your_etherscan_key
COINGECKO_API_KEY=your_coingecko_key
TOKEN_UNLOCKS_API_KEY=your_token_unlocks_key
```

## Package Management
- **npm** - Primary package manager
- **package-lock.json** - Dependency lock file
- **Node.js 18+** - Runtime requirement

## Code Quality Tools

### Linting & Formatting
- **ESLint Config**: Next.js recommended rules
- **TypeScript ESLint**: Type-aware linting
- **Import Sorting**: Organized import statements

### Pre-commit Hooks
- **Husky**: Git hooks management
- **Lint Staged**: Run linters on staged files
- **Type Checking**: Pre-commit TypeScript validation

## Performance Optimizations

### Build Optimizations
- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Dead code elimination
- **Asset Optimization**: Image and font optimization
- **Bundle Analysis**: Size monitoring and optimization

### Runtime Optimizations
- **React Query**: Intelligent caching and background updates
- **Virtualization**: Large list performance
- **Lazy Loading**: Component and route lazy loading
- **Memoization**: React.memo and useMemo optimizations

## Deployment Configuration

### Vercel Deployment
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18.x
- **Environment Variables**: Configured in Vercel dashboard

### Supabase Configuration
- **Database**: PostgreSQL with Row Level Security
- **Edge Functions**: Deno runtime
- **Real-time**: WebSocket connections
- **Storage**: File uploads and CDN