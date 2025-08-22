# Whale Tracker Application Architecture

## System Overview

```mermaid
graph TB
    subgraph "Client Layer"
        A[React Frontend<br/>Vite + TypeScript]
        B[Mobile App<br/>React Native]
    end
    
    subgraph "Authentication Layer"
        C[Supabase Auth]
        D[Google OAuth]
        E[Apple OAuth]
    end
    
    subgraph "API Layer"
        F[Supabase Edge Functions]
        G[REST API Endpoints]
    end
    
    subgraph "Payment Processing"
        H[Stripe Checkout]
        I[Stripe Webhooks]
        J[Subscription Management]
    end
    
    subgraph "Database Layer"
        K[(Supabase PostgreSQL)]
        L[Real-time Subscriptions]
        M[Row Level Security]
    end
    
    subgraph "External Services"
        N[Blockchain APIs]
        O[Whale Detection Service]
        P[Push Notifications]
    end
    
    subgraph "Infrastructure"
        Q[Vercel/Netlify<br/>Frontend Hosting]
        R[Supabase Cloud<br/>Backend Services]
        S[CDN<br/>Static Assets]
    end

    A --> C
    A --> F
    A --> H
    B --> C
    B --> F
    
    C --> D
    C --> E
    
    F --> K
    F --> H
    
    H --> I
    I --> F
    I --> K
    
    K --> L
    K --> M
    
    F --> N
    F --> O
    F --> P
    
    A --> Q
    B --> Q
    F --> R
    K --> R
    
    style A fill:#e1f5fe
    style B fill:#e1f5fe
    style C fill:#f3e5f5
    style F fill:#e8f5e8
    style K fill:#fff3e0
    style H fill:#fce4ec
```

## Component Architecture

```mermaid
graph LR
    subgraph "Frontend Components"
        A1[App.tsx<br/>Main Router]
        A2[Login/Signup<br/>Authentication]
        A3[Home<br/>Whale Alerts]
        A4[Subscription<br/>Payment Flow]
        A5[Profile<br/>User Management]
    end
    
    subgraph "Shared Components"
        B1[UI Components<br/>shadcn/ui]
        B2[Whale Cards<br/>Transaction Display]
        B3[Navigation<br/>Bottom Nav]
        B4[Forms<br/>Validation]
    end
    
    subgraph "State Management"
        C1[React Query<br/>Server State]
        C2[React Hooks<br/>Local State]
        C3[Supabase Client<br/>Auth State]
    end
    
    A1 --> A2
    A1 --> A3
    A1 --> A4
    A1 --> A5
    
    A2 --> B1
    A3 --> B2
    A3 --> B3
    A2 --> B4
    A4 --> B4
    
    A3 --> C1
    A2 --> C2
    A3 --> C2
    A2 --> C3
    
    style A1 fill:#e3f2fd
    style B1 fill:#f1f8e9
    style C1 fill:#fef7ff
```

## Database Schema

```mermaid
erDiagram
    users {
        uuid id PK
        uuid user_id FK
        text email
        text plan
        boolean onboarding_completed
        timestamp created_at
        timestamp updated_at
    }
    
    subscriptions {
        uuid user_id PK,FK
        text product_id
        text status
        timestamp current_period_end
        text rc_entitlement
        timestamp created_at
        timestamp updated_at
    }
    
    alerts {
        uuid id PK
        text from_addr
        text to_addr
        numeric amount_usd
        text token
        text chain
        text tx_hash
        timestamp detected_at
        timestamp created_at
    }
    
    user_preferences {
        uuid id PK
        uuid user_id FK
        text[] favorite_chains
        text[] favorite_tokens
        numeric min_whale_threshold
        json notification_settings
        timestamp created_at
        timestamp updated_at
    }
    
    devices {
        uuid id PK
        uuid user_id FK
        text expo_push_token
        text platform
        timestamp created_at
        timestamp updated_at
    }
    
    risk_scans {
        uuid id PK
        uuid user_id FK
        text wallet
        json result_json
        timestamp created_at
    }
    
    yields {
        uuid id PK
        text protocol
        text chain
        numeric apy
        numeric tvl_usd
        numeric risk_score
        timestamp created_at
        timestamp updated_at
    }
    
    yield_history {
        uuid id PK
        text protocol
        text chain
        numeric apy
        numeric tvl_usd
        timestamp recorded_at
        timestamp created_at
    }

    users ||--o{ subscriptions : has
    users ||--o{ user_preferences : has
    users ||--o{ devices : has
    users ||--o{ risk_scans : performs
```

## API Architecture

```mermaid
graph TB
    subgraph "Edge Functions"
        E1[create-checkout-session<br/>Stripe Integration]
        E2[verify-session<br/>Payment Verification]
        E3[stripe-webhook<br/>Event Processing]
        E4[whale-alerts<br/>Data Processing]
        E5[push-notifications<br/>Alert Delivery]
    end
    
    subgraph "External APIs"
        X1[Stripe API<br/>Payment Processing]
        X2[Blockchain APIs<br/>Transaction Data]
        X3[Expo Push API<br/>Notifications]
        X4[OAuth Providers<br/>Google, Apple]
    end
    
    subgraph "Database Operations"
        D1[User Management<br/>CRUD Operations]
        D2[Subscription Sync<br/>Status Updates]
        D3[Alert Storage<br/>Transaction Data]
        D4[Analytics<br/>Usage Tracking]
    end
    
    E1 --> X1
    E2 --> X1
    E3 --> X1
    E4 --> X2
    E5 --> X3
    
    E1 --> D1
    E2 --> D2
    E3 --> D2
    E4 --> D3
    E5 --> D4
    
    style E1 fill:#e8f5e8
    style X1 fill:#fff3e0
    style D1 fill:#f3e5f5
```

## Security Architecture

```mermaid
graph TB
    subgraph "Authentication Security"
        S1[JWT Tokens<br/>Secure Sessions]
        S2[OAuth 2.0<br/>Third-party Auth]
        S3[Row Level Security<br/>Database Access]
        S4[API Key Management<br/>Service Access]
    end
    
    subgraph "Data Protection"
        P1[HTTPS/TLS<br/>Transport Security]
        P2[Environment Variables<br/>Secret Management]
        P3[Input Validation<br/>XSS Prevention]
        P4[CORS Headers<br/>Cross-origin Security]
    end
    
    subgraph "Payment Security"
        PS1[Stripe Security<br/>PCI Compliance]
        PS2[Webhook Signatures<br/>Event Verification]
        PS3[Secure Redirects<br/>Payment Flow]
    end
    
    S1 --> S3
    S2 --> S1
    S4 --> P2
    
    P1 --> P4
    P3 --> P1
    
    PS1 --> PS2
    PS2 --> PS3
    
    style S1 fill:#ffebee
    style P1 fill:#e8f5e8
    style PS1 fill:#fff3e0
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        PROD1[Vercel<br/>Frontend Hosting]
        PROD2[Supabase Cloud<br/>Backend Services]
        PROD3[Stripe Live<br/>Payment Processing]
        PROD4[CDN<br/>Global Distribution]
    end
    
    subgraph "Development Environment"
        DEV1[Local Development<br/>Vite Dev Server]
        DEV2[Supabase Local<br/>Docker Container]
        DEV3[Stripe Test<br/>Test Mode]
        DEV4[Local Database<br/>PostgreSQL]
    end
    
    subgraph "CI/CD Pipeline"
        CI1[GitHub Actions<br/>Automated Testing]
        CI2[Build Process<br/>Type Checking]
        CI3[Deployment<br/>Auto Deploy]
        CI4[Monitoring<br/>Error Tracking]
    end
    
    DEV1 --> CI1
    CI1 --> CI2
    CI2 --> CI3
    CI3 --> PROD1
    
    DEV2 --> PROD2
    DEV3 --> PROD3
    
    PROD1 --> CI4
    PROD2 --> CI4
    
    style PROD1 fill:#e8f5e8
    style DEV1 fill:#fff3e0
    style CI1 fill:#f3e5f5
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth
    participant E as Edge Functions
    participant S as Stripe
    participant D as Database
    participant B as Blockchain APIs

    Note over U,B: User Registration Flow
    U->>F: Sign up with email/OAuth
    F->>A: Create user account
    A->>D: Store user data
    A-->>F: Return auth token
    F-->>U: Registration success

    Note over U,B: Subscription Flow
    U->>F: Select premium plan
    F->>E: Create checkout session
    E->>S: Initialize payment
    S-->>E: Return checkout URL
    E-->>F: Checkout session created
    F->>S: Redirect to Stripe
    S->>E: Webhook: payment success
    E->>D: Update subscription
    E-->>S: Webhook processed

    Note over U,B: Whale Alert Flow
    B->>E: New whale transaction
    E->>D: Store alert data
    E->>F: Real-time update
    F-->>U: Display new alert
    
    Note over U,B: Data Fetching Flow
    U->>F: Load home page
    F->>E: Fetch whale alerts
    E->>D: Query alerts table
    D-->>E: Return alert data
    E-->>F: Formatted alerts
    F-->>U: Display alerts
```

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
- **State Management**: React Query + React Hooks
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

### Backend
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **API**: Supabase Edge Functions (Deno)
- **Real-time**: Supabase Realtime
- **File Storage**: Supabase Storage

### External Services
- **Payments**: Stripe
- **OAuth**: Google, Apple
- **Push Notifications**: Expo Push API
- **Blockchain Data**: Various APIs

### Development & Deployment
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions
- **Frontend Hosting**: Vercel/Netlify
- **Backend Hosting**: Supabase Cloud
- **Testing**: Jest + React Testing Library
- **Type Checking**: TypeScript
- **Linting**: ESLint + Prettier

### Security & Monitoring
- **Authentication**: JWT + OAuth 2.0
- **Database Security**: Row Level Security (RLS)
- **API Security**: CORS + Rate Limiting
- **Payment Security**: Stripe PCI Compliance
- **Monitoring**: Supabase Analytics + Sentry

This architecture provides a scalable, secure, and maintainable foundation for the whale tracking application with proper separation of concerns and modern development practices.