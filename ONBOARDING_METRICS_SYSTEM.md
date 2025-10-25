# 📊 Onboarding Metrics & Success Tracking - Phase 2 Implementation

## Overview
A comprehensive analytics system to track user onboarding journey, measure conversion rates, identify drop-off points, and optimize the user acquisition funnel.

## 🎯 Key Features

### 1. **Event-Level Tracking**
Captures detailed user actions throughout the onboarding process:
- Signup flow (started, completed)
- Email verification
- First login
- Tour progression (started, steps viewed, completed, skipped)
- Feature discovery
- First actions (alert created, dashboard view, whale view, scan completed)
- Onboarding completion
- Subscription upgrades

### 2. **Session Management**
- Tracks individual onboarding sessions
- Records session duration and completion status
- Monitors steps completed per session
- Detects abandoned sessions

### 3. **Funnel Analysis**
- Multi-stage conversion funnel
- Conversion rates at each stage
- Time-to-completion metrics
- Drop-off identification

### 4. **Drop-off Detection**
- Automatic detection of abandoned onboarding
- Identifies specific drop-off points
- Tracks recovery rates
- Provides insights for optimization

### 5. **Admin Dashboard**
- Real-time funnel visualization
- Daily metrics and trends
- Drop-off analysis with actionable insights
- Time-to-completion breakdown

## 📊 Funnel Stages

```
1. Signup Started → Signup Completed
2. Email Verified
3. First Login
4. Tour Started → Tour Completed
5. First Alert Created
6. Onboarding Completed
7. Subscription Upgraded (Conversion)
```

## 🗄️ Database Schema

### Tables

#### `onboarding_events`
Event-level tracking for all onboarding actions
```sql
- id: UUID
- user_id: UUID (references auth.users)
- event_type: TEXT (enum of event types)
- event_metadata: JSONB
- session_id: TEXT
- user_agent: TEXT
- referrer: TEXT
- timestamp: TIMESTAMPTZ
```

#### `onboarding_sessions`
Session-level aggregation
```sql
- id: UUID
- session_id: TEXT (unique)
- user_id: UUID
- started_at: TIMESTAMPTZ
- completed_at: TIMESTAMPTZ
- current_step: TEXT
- steps_completed: TEXT[]
- total_events: INTEGER
- time_to_complete_seconds: INTEGER
- abandoned: BOOLEAN
- conversion_type: TEXT
```

#### `onboarding_funnel_metrics`
Per-user aggregated metrics
```sql
- user_id: UUID (unique)
- signup_date: TIMESTAMPTZ
- email_verified_date: TIMESTAMPTZ
- first_login_date: TIMESTAMPTZ
- tour_completed_date: TIMESTAMPTZ
- first_alert_date: TIMESTAMPTZ
- onboarding_completed_date: TIMESTAMPTZ
- subscription_upgraded_date: TIMESTAMPTZ
- time_to_* metrics (in seconds)
- funnel_stage: TEXT
- completion_percentage: INTEGER
```

#### `onboarding_dropoffs`
Drop-off detection and analysis
```sql
- user_id: UUID
- session_id: TEXT
- drop_off_step: TEXT
- last_completed_step: TEXT
- time_spent_seconds: INTEGER
- events_before_dropoff: INTEGER
- detected_at: TIMESTAMPTZ
- recovered: BOOLEAN
```

### Views

#### `v_onboarding_funnel_stats`
Aggregated conversion rates and averages (30-day window)
- Total counts per stage
- Conversion rates
- Average time-to-completion

#### `v_onboarding_dropoff_analysis`
Drop-off analysis by step
- Drop-off counts per step
- Average time spent before drop-off
- Recovery rates

#### `v_onboarding_daily_metrics`
Daily performance metrics
- Signups per day
- Completions per day
- Completion rates
- Average events per user

## 🔧 Technical Implementation

### Service Layer
**File**: `src/services/onboardingAnalytics.ts`

Key functions:
- `logOnboardingEvent()`: Log individual events
- `completeOnboarding()`: Mark onboarding as complete
- `logTourStep()`: Track tour progression
- `logFeatureDiscovery()`: Track feature engagement
- `getFunnelMetrics()`: Retrieve aggregated metrics
- `getDropoffAnalysis()`: Analyze drop-off points
- `getDailyMetrics()`: Get time-series data
- `detectDropoffs()`: Run drop-off detection algorithm

#### Event Tracking Helpers
```typescript
import { onboardingTracking } from '@/services/onboardingAnalytics';

// Pre-configured event loggers
onboardingTracking.signupStarted();
onboardingTracking.signupCompleted(userId);
onboardingTracking.emailVerified(userId);
onboardingTracking.firstLogin(userId);
onboardingTracking.tourStarted();
onboardingTracking.tourCompleted();
onboardingTracking.firstAlertCreated();
// ... and more
```

### UI Components

#### Admin Dashboard
**File**: `src/components/admin/OnboardingAnalyticsDashboard.tsx`

Features:
- **Key Metrics Cards**: Total signups, completion rates, conversion rates, avg. time
- **Funnel Visualization**: Progress bars showing conversion at each stage
- **Drop-off Analysis**: Detailed breakdown of abandonment points
- **Time Series Charts**: Daily trends
- **Interactive Filtering**: By date range and funnel stage

#### Integration with Existing Onboarding
**File**: `src/components/discovery/useDiscoveryTelemetry.ts`

The existing discovery telemetry now automatically logs events to both:
1. `discovery_events` table (existing)
2. `onboarding_events` table (new)

This ensures backward compatibility while adding comprehensive analytics.

### Database Triggers

#### Auto-update Funnel Metrics
```sql
CREATE TRIGGER trigger_update_funnel_metrics
  AFTER INSERT ON onboarding_events
  FOR EACH ROW
  EXECUTE FUNCTION update_funnel_metrics();
```

Automatically updates `onboarding_funnel_metrics` when events are logged.

#### Drop-off Detection
```sql
SELECT detect_dropoffs();
```

Run periodically (via cron) to identify abandoned sessions (30-minute inactivity threshold).

## 📈 Key Metrics Tracked

### Conversion Rates
- **Email Verification Rate**: % of signups who verify email
- **First Login Rate**: % of verified users who login
- **Tour Completion Rate**: % of tour starters who complete
- **Onboarding Completion Rate**: % of signups who complete full onboarding
- **Subscription Conversion Rate**: % of signups who upgrade to paid

### Time-to-Completion
- Average time to verify email
- Average time to complete tour
- Average time to complete full onboarding
- Average time to first paid subscription

### Engagement Metrics
- Total sessions per user
- Total events per user
- Features discovered
- Tour steps completed

### Drop-off Analysis
- Drop-off count by step
- Average time spent before drop-off
- Average events before drop-off
- Recovery rates (users who return after dropping off)

## 🚀 Usage Examples

### Tracking Events in Components

```typescript
import { onboardingTracking } from '@/services/onboardingAnalytics';

// In signup component
await onboardingTracking.signupCompleted(user.id);

// In welcome page
useEffect(() => {
  onboardingTracking.welcomeViewed();
}, []);

// In tour component
const handleTourComplete = async () => {
  await onboardingTracking.tourCompleted();
  // ... rest of logic
};

// In alert creation
const handleAlertCreated = async () => {
  await onboardingTracking.firstAlertCreated();
  // ... rest of logic
};
```

### Fetching Analytics Data

```typescript
import { 
  getFunnelMetrics, 
  getDropoffAnalysis,
  getUserProgress 
} from '@/services/onboardingAnalytics';

// Get overall funnel metrics
const metrics = await getFunnelMetrics();
console.log(`Conversion rate: ${metrics.conversionRate}%`);

// Get drop-off analysis
const dropoffs = await getDropoffAnalysis();
dropoffs.forEach(d => {
  console.log(`${d.dropoffCount} users dropped off at: ${d.dropOffStep}`);
});

// Get specific user's progress
const progress = await getUserProgress(userId);
console.log(`Current stage: ${progress.funnel_stage}`);
console.log(`Completion: ${progress.completion_percentage}%`);
```

## 📊 Admin Dashboard

### Access
Navigate to `/admin/onboarding` (requires admin role)

### Features

1. **Key Metrics Overview**
   - Total signups (30-day)
   - Onboarding completion rate
   - Subscription conversion rate
   - Average time to complete

2. **Funnel Visualization**
   - Progress bars for each stage
   - Conversion rates displayed
   - Visual drop-off indicators

3. **Drop-off Analysis Tab**
   - Cards for each drop-off point
   - Average time spent
   - Average events before drop-off
   - Recovery rates

4. **Daily Metrics Tab**
   - Line chart showing signups, completions, and rates over time
   - Identify trends and patterns
   - Spot anomalies

5. **Detailed Breakdown Tab**
   - Bar charts of conversion funnel
   - Time-to-completion metrics
   - Comparative analysis

### Drop-off Detection

Click "Run Drop-off Detection" to manually trigger analysis:
- Identifies sessions inactive for 30+ minutes
- Marks sessions as abandoned
- Creates drop-off records
- Refreshes dashboard data

## 🎯 Optimization Insights

### How to Use the Data

1. **Identify Bottlenecks**
   - Look for stages with low conversion rates
   - Focus optimization efforts on high-drop-off points

2. **Reduce Time-to-Completion**
   - If email verification takes too long, improve email delivery
   - If tour takes too long, consider shortening or making optional

3. **Improve Recovery**
   - For drop-offs with low recovery rates, implement targeted re-engagement
   - Send automated emails at specific drop-off points

4. **A/B Testing**
   - Track metrics before/after changes
   - Compare cohorts with different onboarding flows

5. **Feature Discovery**
   - See which features users discover during onboarding
   - Highlight under-discovered features

## 🔄 Automated Processes

### Cron Jobs (Recommended)

```bash
# Run drop-off detection every hour
0 * * * * curl -X POST https://your-project.supabase.co/rest/v1/rpc/detect_dropoffs

# Or set up in Supabase cron:
SELECT cron.schedule(
  'detect-dropoffs',
  '0 * * * *', -- Every hour
  $$SELECT detect_dropoffs()$$
);
```

### Real-time Updates

The dashboard subscribes to real-time updates:
```typescript
// Automatically refreshes when new data arrives
const subscription = supabase
  .channel('onboarding_updates')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'onboarding_events' },
    () => loadData()
  )
  .subscribe();
```

## 🔒 Security & Privacy

- **RLS Policies**: Users can only view their own data
- **Admin Access**: Only admins can view aggregated analytics
- **Service Role**: Background processes use elevated permissions
- **Data Retention**: Consider implementing data purging after 90 days (GDPR compliance)

### Row Level Security

```sql
-- Users can view their own data
CREATE POLICY "Users can view their own onboarding events"
  ON onboarding_events FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all data
CREATE POLICY "Admins can view all onboarding events"
  ON onboarding_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );
```

## 🚀 Deployment

### 1. Apply Database Migration
```bash
cd /Users/meghalparikh/Downloads/Whalepulse/smart-stake
supabase db push
```

### 2. Verify Tables Created
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'onboarding_%';
```

### 3. Test Event Logging
```typescript
import { onboardingTracking } from '@/services/onboardingAnalytics';

// Test in browser console
await onboardingTracking.welcomeViewed();
```

### 4. Access Admin Dashboard
Navigate to: `/admin/onboarding`

### 5. Set Up Cron Job
Configure in Supabase Dashboard or via SQL

## 📈 Success Metrics

### Target Benchmarks
- **Email Verification Rate**: >80%
- **Tour Completion Rate**: >60%
- **Onboarding Completion Rate**: >50%
- **Conversion Rate (Free → Paid)**: >5%
- **Average Time to Onboard**: <24 hours

### Monitoring
- Check dashboard weekly
- Run drop-off detection daily
- Review trends monthly
- Conduct quarterly optimization reviews

## 🔧 Troubleshooting

### Events Not Logging
1. Check browser console for errors
2. Verify user is authenticated
3. Check RLS policies
4. Ensure session ID is generated

### Dashboard Not Loading
1. Verify admin role
2. Check database views exist
3. Verify RPC functions deployed
4. Check network tab for API errors

### Drop-offs Not Detected
1. Run manual detection: `SELECT detect_dropoffs();`
2. Verify 30-minute threshold appropriate
3. Check session timestamps

## 🎓 Best Practices

1. **Track Meaningful Events**: Don't over-track; focus on key milestones
2. **Regular Reviews**: Check metrics weekly, not just monthly
3. **Act on Insights**: Use data to drive product decisions
4. **Test Changes**: Measure impact of onboarding improvements
5. **User Privacy**: Be transparent about tracking in privacy policy
6. **Data Cleanup**: Archive old sessions periodically

## 📚 Related Documentation

- `ONBOARDING_EXPERIENCE.md`: User-facing onboarding design
- `PHASE2_STATUS_ANALYSIS.md`: Phase 2 completion status
- `DISCOVERY_PHASE_E_README.md`: Discovery tour implementation

---

## 📞 Support

For issues or questions:
- Dashboard: `/admin/onboarding`
- Documentation: This file
- Support: support@whalepulse.com

**Status**: ✅ Phase 2 - Complete and Production Ready

**Last Updated**: January 2025

