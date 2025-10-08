# AlphaWhale Lite - Development Guidelines

## Code Quality Standards

### TypeScript Usage
- **Strict typing**: All files use TypeScript with strict mode enabled
- **Interface definitions**: Complex data structures defined with interfaces (e.g., `WhaleEvent`, `BiFilters`)
- **Type assertions**: Minimal use of `any`, prefer specific types or unions
- **Generic types**: Used for reusable components and API responses

### Import Organization
- **Absolute imports**: Use `@/` path mapping for all internal imports
- **External first**: External dependencies imported before internal modules
- **Grouped imports**: UI components, hooks, services, and utilities grouped separately
- **Named imports**: Prefer named imports over default imports for clarity

### Error Handling Patterns
- **Try-catch blocks**: Comprehensive error handling in async functions
- **Fallback data**: Always provide fallback/mock data when APIs fail
- **Error boundaries**: React error boundaries for component-level error handling
- **Graceful degradation**: UI continues to function even when data is unavailable

## Component Architecture

### Component Structure
- **Functional components**: All components use React functional components with hooks
- **Props interfaces**: Each component has a defined props interface
- **Default exports**: Components use default exports with descriptive names
- **Separation of concerns**: Logic separated from presentation using custom hooks

### State Management Patterns
- **Local state**: `useState` for component-specific state
- **Context providers**: Global state managed through React Context
- **Custom hooks**: Business logic extracted into reusable hooks (e.g., `useSubscription`, `useWhalePreferences`)
- **TanStack Query**: Server state management with automatic caching and refetching

### UI Component Standards
- **Radix UI base**: All interactive components built on Radix UI primitives
- **Tailwind classes**: Styling using Tailwind CSS utility classes
- **Responsive design**: Mobile-first approach with responsive breakpoints
- **Accessibility**: ARIA labels and keyboard navigation support

## API Integration Patterns

### Supabase Integration
- **Edge functions**: Business logic implemented as Supabase edge functions
- **Client initialization**: Single Supabase client instance imported from `@/integrations/supabase/client`
- **Function invocation**: Consistent pattern: `supabase.functions.invoke(functionName, { body: params })`
- **Error handling**: Always check for errors in Supabase responses

### Service Layer Architecture
- **Static methods**: API services use static methods for stateless operations
- **Promise handling**: Use `Promise.allSettled()` for parallel API calls
- **Response transformation**: Raw API responses transformed to match UI requirements
- **Caching strategy**: Implement appropriate caching for different data types

### Data Fetching Conventions
- **Loading states**: Always show loading indicators during data fetching
- **Empty states**: Professional empty state messages with actionable guidance
- **Retry mechanisms**: Provide retry functionality for failed requests
- **Real-time updates**: Use intervals for live data updates with appropriate frequencies

## Testing Standards

### Test Structure
- **Describe blocks**: Organized test suites with descriptive names
- **Setup/teardown**: Proper beforeEach setup for consistent test environments
- **Mock implementations**: Comprehensive mocking of external dependencies
- **Assertion patterns**: Clear, specific assertions with meaningful error messages

### Testing Patterns
- **Component testing**: React Testing Library for component interaction testing
- **API testing**: Mock Supabase functions with realistic response data
- **Integration testing**: End-to-end user flows with Playwright
- **Error scenarios**: Test both success and failure paths

### Mock Data Standards
- **Realistic data**: Mock data reflects actual API response structures
- **Edge cases**: Include edge cases like empty arrays and null values
- **Deterministic**: Consistent mock data for reliable test results
- **Type safety**: Mock data matches TypeScript interfaces

## Performance Optimization

### React Optimization
- **Memoization**: Use `React.memo`, `useMemo`, and `useCallback` appropriately
- **Lazy loading**: Code splitting for route-based components
- **Virtualization**: Large lists use virtualization libraries
- **Debouncing**: User input debounced to prevent excessive API calls

### Data Management
- **Query optimization**: Efficient database queries with proper indexing
- **Caching strategies**: Multiple cache layers (browser, query cache, CDN)
- **Pagination**: Large datasets paginated to improve performance
- **Background updates**: Non-critical data updated in background

### Bundle Optimization
- **Tree shaking**: Unused code eliminated through proper imports
- **Code splitting**: Route-based and component-based code splitting
- **Asset optimization**: Images and fonts optimized for web delivery
- **Bundle analysis**: Regular bundle size monitoring and optimization

## Security Practices

### Authentication & Authorization
- **Row Level Security**: Database access controlled through RLS policies
- **JWT tokens**: Secure token-based authentication
- **Plan-based gating**: Feature access controlled by subscription tier
- **Input validation**: All user inputs validated and sanitized

### Data Protection
- **Environment variables**: Sensitive data stored in environment variables
- **API key management**: External API keys properly secured
- **CORS configuration**: Appropriate CORS headers for API endpoints
- **Rate limiting**: API endpoints protected against abuse

## Code Style Conventions

### Naming Conventions
- **camelCase**: Variables and functions use camelCase
- **PascalCase**: Components and interfaces use PascalCase
- **UPPER_SNAKE_CASE**: Constants use upper snake case
- **Descriptive names**: Names clearly describe purpose and functionality

### File Organization
- **Feature-based**: Components organized by feature/domain
- **Index files**: Barrel exports for clean imports
- **Consistent structure**: Similar file structures across features
- **Separation**: Logic, styles, and tests in separate files

### Comment Standards
- **Minimal comments**: Code should be self-documenting
- **Complex logic**: Comments for non-obvious business logic
- **API documentation**: JSDoc comments for public APIs
- **TODO comments**: Temporary comments with context and timeline

## Development Workflow

### Git Practices
- **Feature branches**: All development on feature branches
- **Descriptive commits**: Clear, descriptive commit messages
- **Small commits**: Atomic commits for easier review and rollback
- **Pull requests**: All changes reviewed through pull requests

### Code Review Standards
- **Functionality**: Code works as intended and handles edge cases
- **Performance**: No obvious performance issues or bottlenecks
- **Security**: No security vulnerabilities or data leaks
- **Style**: Consistent with project conventions and standards

### Deployment Practices
- **Environment parity**: Development, staging, and production environments match
- **Database migrations**: Schema changes handled through migrations
- **Feature flags**: New features behind feature flags for safe rollouts
- **Monitoring**: Comprehensive logging and error tracking in production