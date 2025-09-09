# AlertQuickActions Component Documentation

## Overview
The `AlertQuickActions` component provides a compact sidebar widget for managing custom whale alert rules directly from the main whale tracking interface.

## Features

### 📊 Alert Summary
- **Active Rules Count**: Shows number of currently active alert rules
- **Triggered Today Count**: Displays alerts triggered in the last 24 hours
- **Visual Badges**: Green badges for active rules, blue pulsing badges for recent triggers

### 🎯 Quick Actions
- **Create Custom Alert**: Opens the full alert rule builder
- **Save as Template**: Converts existing rules into reusable templates (appears when rules exist)
- **Templates**: Browse preset alert configurations
- **History**: View alert trigger history
- **Manage**: Opens full alert management dashboard

### 🔔 Smart Notifications
- **Badge Indicators**: Shows alert counts on the Manage button
- **User Tips**: Helpful guidance for new users
- **Rule Preview**: Shows up to 2 most recent active rules with trigger counts

## Component Structure

```tsx
interface AlertQuickActionsProps {
  // No props required - uses useCustomAlerts hook internally
}
```

## Usage

```tsx
import { AlertQuickActions } from '@/components/alerts/AlertQuickActions';

// In your component
<AlertQuickActions />
```

## Dependencies

### Hooks
- `useCustomAlerts`: Manages alert rules state and operations
- `useState`: Local state for modal visibility

### UI Components
- `Button`: Action buttons
- `Card`: Container layout
- `Badge`: Status indicators
- `AlertsManager`: Full alert management modal

### Icons
- `Bell`: Alert notifications
- `Zap`: Create alerts
- `Plus`: Add templates
- `Settings`: Manage rules
- `Star`: Save templates

## State Management

### Local State
```tsx
const [showAlertsManager, setShowAlertsManager] = useState(false);
```

### Derived State
```tsx
const { rules = [] } = useCustomAlerts();
const activeRules = rules.filter(r => r.isActive);
const recentlyTriggered = rules.filter(r => 
  r.lastTriggeredAt && 
  new Date(r.lastTriggeredAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
);
```

## Visual States

### Empty State
- Shows "No custom rules yet"
- Displays helpful tip about using templates
- Only shows basic action buttons

### Active State
- Shows rule counts and statistics
- Displays "Save as Template" button
- Lists up to 2 recent rules with trigger counts

### Badge States
- **Green Badge**: Active rules count (static)
- **Blue Badge**: Recent triggers count (pulsing animation)
- **No Badges**: When no rules exist or no recent activity

## Integration Points

### Parent Components
- Integrated into `Home.tsx` whale tracking page
- Positioned in the main content area after plan alerts

### Child Components
- Opens `AlertsManager` modal for full functionality
- Connects to `AlertDashboard` and `AlertTemplates` via manager

## Responsive Design
- Compact layout optimized for sidebar placement
- Grid layout for template/history buttons
- Responsive text sizing and spacing

## Error Handling
- Graceful fallback when `useCustomAlerts` returns undefined
- Default empty array for rules to prevent crashes
- Safe date parsing for trigger calculations

## Performance Considerations
- Minimal re-renders with proper state management
- Efficient filtering operations
- Lazy loading of full alert management interface

## Accessibility
- Semantic HTML structure
- Proper button labels and roles
- Color contrast compliant badges
- Keyboard navigation support

## Future Enhancements
- Real-time rule trigger notifications
- Drag-and-drop rule reordering
- Quick rule enable/disable toggles
- Inline rule editing capabilities