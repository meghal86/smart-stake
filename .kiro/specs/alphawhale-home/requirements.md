# Requirements Document

## Introduction

The AlphaWhale Home screen serves as the primary landing page and navigation hub for the platform. It introduces users to the three core features (Guardian, Hunter, and HarvestPro) through an engaging, cohesive interface that combines hero messaging, feature previews with live metrics, trust indicators, onboarding guidance, and persistent navigation.

## Glossary

- **Home Screen**: The primary landing page of the AlphaWhale platform
- **Hero Section**: The top section containing the main value proposition and primary call-to-action
- **Feature Card**: An interactive card component representing one of the three core features (Guardian, Hunter, HarvestPro)
- **Trust Builders**: Visual indicators and statistics that establish platform credibility
- **Onboarding Flow**: A guided multi-step process for new users
- **Footer Navigation**: A persistent navigation bar providing access to main features
- **Live Preview**: Real-time metric displayed within a feature card
- **Glassmorphism**: A design style using translucent backgrounds with blur effects

## Requirements

### Requirement 1

**User Story:** As a new visitor, I want to immediately understand the platform's value proposition, so that I can decide if AlphaWhale meets my needs.

#### Acceptance Criteria

1. WHEN the Home Screen loads THEN the system SHALL display a hero section with the headline "Master Your DeFi Risk & Yield – In Real Time"
2. WHEN the Home Screen loads THEN the system SHALL display a subheading "Secure your wallet. Hunt alpha. Harvest taxes."
3. WHEN the Home Screen loads THEN the system SHALL render a subtle animated background with geometric or whale-themed visuals
4. WHEN the hero section is displayed THEN the system SHALL ensure text contrast meets WCAG AA standards against the animated background
5. WHEN a user views the hero section on mobile THEN the system SHALL display content in a stacked layout with responsive font sizes

### Requirement 2

**User Story:** As a user, I want to see live previews of each feature's capabilities, so that I can understand what value each feature provides.

#### Acceptance Criteria

1. WHEN the Home Screen loads THEN the system SHALL display three feature cards for Guardian, Hunter, and HarvestPro
2. WHEN a feature card is displayed THEN the system SHALL show an icon, title, tagline, live preview metric, and action buttons
3. WHEN the Guardian card is displayed THEN the system SHALL fetch and display the current Guardian Score from the guardianScore API endpoint
4. WHEN the Hunter card is displayed THEN the system SHALL fetch and display the current number of opportunities from the hunterOpportunities API endpoint
5. WHEN the HarvestPro card is displayed THEN the system SHALL fetch and display the estimated tax benefit in USD from the harvestEstimateUsd API endpoint

### Requirement 3

**User Story:** As a user, I want to interact with feature cards, so that I can navigate to features or view demonstrations.

#### Acceptance Criteria

1. WHEN a user hovers over a feature card THEN the system SHALL scale the card to 1.02 with a 150ms ease transition
2. WHEN a user clicks the primary button on a feature card THEN the system SHALL navigate to that feature's main page
3. WHEN a user clicks the secondary button on a feature card THEN the system SHALL display a demo or preview of that feature
4. WHEN a user interacts with buttons THEN the system SHALL ensure all buttons are keyboard-focusable with visible focus states
5. WHEN feature cards are displayed on mobile THEN the system SHALL stack cards vertically at full width

### Requirement 4

**User Story:** As a user, I want to see trust indicators, so that I can feel confident about using the platform.

#### Acceptance Criteria

1. WHEN the Trust Builders section loads THEN the system SHALL display badges indicating "Non-custodial", "No KYC", "On-chain", and "Guardian-vetted"
2. WHEN the Trust Builders section loads THEN the system SHALL fetch and display statistics for totalWalletsProtected from the API
3. WHEN the Trust Builders section loads THEN the system SHALL fetch and display statistics for totalYieldOptimizedUsd from the API
4. WHEN the Trust Builders section loads THEN the system SHALL fetch and display the average guardianScore from the API
5. WHEN trust statistics are unavailable THEN the system SHALL display fallback placeholder values

### Requirement 5

**User Story:** As a new user, I want clear onboarding guidance, so that I can quickly start using the platform.

#### Acceptance Criteria

1. WHEN the Onboarding Section loads THEN the system SHALL display three sequential steps: "Connect Wallet", "Run Guardian Scan", "Browse Hunter"
2. WHEN a user clicks the primary onboarding CTA THEN the system SHALL navigate to the /onboarding route
3. WHEN a user clicks the secondary "Skip" button THEN the system SHALL navigate to the /hunter route
4. WHEN onboarding steps are displayed THEN the system SHALL present them in a clear, numbered sequence
5. WHEN the onboarding section is viewed on mobile THEN the system SHALL stack steps vertically

### Requirement 6

**User Story:** As a user, I want persistent navigation to core features, so that I can quickly access any feature from the home screen.

#### Acceptance Criteria

1. WHEN the Footer Navigation loads THEN the system SHALL display icons for Guardian, Hunter, HarvestPro, and Settings
2. WHEN a user clicks a footer navigation icon THEN the system SHALL navigate to the corresponding route (/guardian, /hunter, /harvestpro, /settings)
3. WHEN a footer navigation item corresponds to the current route THEN the system SHALL highlight that item with cyan color
4. WHEN the footer navigation is displayed on mobile THEN the system SHALL render as a fixed bottom navigation bar
5. WHEN a user interacts with footer icons THEN the system SHALL ensure touch targets are at least 44px in height

### Requirement 7

**User Story:** As a user, I want the home screen to load quickly with fresh data, so that I have an optimal browsing experience.

#### Acceptance Criteria

1. WHEN the Home Screen requests metrics THEN the system SHALL fetch data from the /api/home-metrics endpoint
2. WHEN metrics are fetched THEN the system SHALL ensure data freshness is less than 5 minutes old
3. WHEN the Home Screen loads THEN the system SHALL achieve Time to Interactive (TTI) under 3 seconds on broadband connections
4. WHEN API requests fail THEN the system SHALL display fallback values without breaking the layout
5. WHEN all page resources load THEN the system SHALL ensure zero broken links exist on the page

### Requirement 8

**User Story:** As a user with accessibility needs, I want the home screen to be fully accessible, so that I can navigate and use all features.

#### Acceptance Criteria

1. WHEN the Home Screen renders THEN the system SHALL ensure all interactive elements have proper ARIA labels
2. WHEN a user navigates via keyboard THEN the system SHALL maintain logical focus order through all interactive elements
3. WHEN the Home Screen displays text THEN the system SHALL ensure all text meets WCAG AA contrast requirements
4. WHEN animations are present THEN the system SHALL respect the prefers-reduced-motion user preference
5. WHEN the Home Screen is audited THEN the system SHALL achieve a Lighthouse accessibility score of at least 90

### Requirement 9

**User Story:** As a user on any device, I want the home screen to adapt to my screen size, so that I have a consistent experience.

#### Acceptance Criteria

1. WHEN the Home Screen is viewed on desktop THEN the system SHALL display the hero section in a 2-column layout with feature cards in a row
2. WHEN the Home Screen is viewed on tablet THEN the system SHALL display feature cards in a 2x2 grid or stacked layout
3. WHEN the Home Screen is viewed on mobile THEN the system SHALL stack all elements vertically with full-width buttons
4. WHEN the Home Screen is viewed on screens 375px or narrower THEN the system SHALL maintain readable text and functional interactions
5. WHEN layout changes occur THEN the system SHALL apply responsive breakpoints smoothly without content jumping

### Requirement 10

**User Story:** As a user, I want consistent visual styling, so that the home screen feels cohesive with the rest of the platform.

#### Acceptance Criteria

1. WHEN feature cards are rendered THEN the system SHALL apply glassmorphism styling with 1px border, 8px radius, and 0.1 white overlay
2. WHEN primary buttons are displayed THEN the system SHALL use cyan fill with white text, lightening on hover and darkening on active state
3. WHEN secondary buttons are displayed THEN the system SHALL use outline style with background tint on hover
4. WHEN the Home Screen renders in dark theme THEN the system SHALL use background color #0A0F1F with text at white/70% gray
5. WHEN any interactive element is displayed THEN the system SHALL ensure hover and focus states are visually distinct

### Requirement 11

**User Story:** As a search engine or social media platform, I want proper metadata, so that I can display rich previews of the AlphaWhale home page.

#### Acceptance Criteria

1. WHEN the Home Screen HTML is generated THEN the system SHALL include a descriptive page title
2. WHEN the Home Screen HTML is generated THEN the system SHALL include a meta description summarizing the platform
3. WHEN the Home Screen HTML is generated THEN the system SHALL include Open Graph tags for social media sharing
4. WHEN the Home Screen is crawled THEN the system SHALL ensure all content is indexable by search engines
5. WHEN social media platforms fetch metadata THEN the system SHALL provide appropriate og:image, og:title, and og:description tags

## Dependencies

This Home Screen specification depends on the following system-wide requirements (documented separately):

- **Demo Mode System** (affects all pages): Defines how unauthenticated users experience the platform
- **Authentication & Wallet Connection** (affects all protected pages): Defines WalletConnect integration and JWT handling
- **Error Handling & API Resilience** (affects all data-fetching pages): Defines error states and retry logic
- **Loading States & Skeletons** (affects all data-fetching pages): Defines loading UX patterns
- **Auth State Persistence** (affects all pages): Defines session management and multi-tab sync
- **Error Messages** (affects all pages): Defines user-facing error messaging
- **Data Freshness** (affects all metric pages): Defines stale data handling and refresh behavior
- **Performance SLOs** (affects all pages): Defines Core Web Vitals targets

These system-wide concerns are documented in separate architecture specifications and apply to the entire AlphaWhale platform, not just the Home screen.
