# Settings & Form Quality Specification

## Overview

This specification details the implementation of Tasks 5 & 6: Settings & Form Quality Fixes and Comprehensive Form Validation System from the UX Gap Requirements. These tasks work together to create a professional, user-friendly settings experience.

## Scope

### In Scope
- ✅ Create or enhance Settings page to fix "Invalid Date" placeholders and disabled email fields
- ✅ Add clear explanations for disabled form fields with tooltips or help text
- ✅ Implement immediate save confirmation and error feedback using existing Toast system
- ✅ Ensure all form fields have proper default values or "Not set" indicators
- ✅ Use React Hook Form + Zod validation as per harvestpro-stack.md standards
- ✅ Create real-time validation using Zod schemas with immediate feedback on blur
- ✅ Add character counters and helpful error messages for all form fields
- ✅ Create disabled button states until forms are valid and modified

### Out of Scope
- ❌ Creating new user data models or backend APIs
- ❌ Adding new settings categories or features
- ❌ Modifying existing user authentication system
- ❌ Creating new form component libraries

## Requirements Mapping

This spec implements:
- **R5.SETTINGS.NO_INVALID_PLACEHOLDERS**: No "Invalid Date" or similar placeholder errors
- **R5.SETTINGS.CLEAR_EXPLANATIONS**: Clear explanations for disabled form fields
- **R6.VALIDATION.IMMEDIATE**: Validation on blur with clear messages
- **R6.VALIDATION.CLEAR_MESSAGES**: Helpful, specific error messages
- **R6.VALIDATION.SAVE_STATES**: Disabled save button until valid + modified

## Technical Implementation

### 1. Settings Page Structure

**Location**: `src/pages/Settings.tsx` (create or enhance existing)

```typescript
interface SettingsPageProps {
  // Page-level props if needed
}

interface UserSettings {
  // Profile settings
  displayName: string
  email: string
  avatar?: string
  
  // Notification preferences
  emailNotifications: boolean
  pushNotifications: boolean
  weeklyDigest: boolean
  
  // Privacy settings
  profileVisibility: 'public' | 'private'
  dataSharing: boolean
  
  // Platform preferences
  defaultCurrency: string
  timezone: string
  language: string
  
  // Dates that might show "Invalid Date"
  lastLoginDate?: Date
  accountCreatedDate?: Date
  subscriptionExpiryDate?: Date
}
```

**Settings Page Layout**:
```tsx
export const SettingsPage: React.FC = () => {
  return (
    <div className="settings-page">
      <SettingsHeader />
      <SettingsTabs>
        <TabPanel value="profile">
          <ProfileSettingsForm />
        </TabPanel>
        <TabPanel value="notifications">
          <NotificationSettingsForm />
        </TabPanel>
        <TabPanel value="privacy">
          <PrivacySettingsForm />
        </TabPanel>
        <TabPanel value="preferences">
          <PreferenceSettingsForm />
        </TabPanel>
      </SettingsTabs>
    </div>
  )
}
```

### 2. Form Validation System

**Location**: `src/lib/ux/FormValidation.ts`

```typescript
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// Validation schemas
const profileSettingsSchema = z.object({
  displayName: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters'),
  email: z.string()
    .email('Please enter a valid email address')
    .optional(),
  avatar: z.string().url().optional()
})

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  weeklyDigest: z.boolean()
})

// Form hook with validation
export const useSettingsForm = <T extends z.ZodSchema>(
  schema: T,
  defaultValues: z.infer<T>,
  onSubmit: (data: z.infer<T>) => Promise<void>
) => {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur' // Validate on blur for immediate feedback
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  // Track form changes
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === 'change') {
        setHasChanges(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])
  
  const handleSubmit = async (data: z.infer<T>) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      setHasChanges(false)
      toast.success('Changes saved ✓')
    } catch (error) {
      toast.error(error.message || 'Failed to save changes')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return {
    ...form,
    isSubmitting,
    hasChanges,
    canSave: form.formState.isValid && hasChanges && !isSubmitting,
    handleSubmit: form.handleSubmit(handleSubmit)
  }
}
```

### 3. Form Field Components

**Location**: `src/components/ux/FormFields.tsx`

```typescript
interface FormFieldProps {
  label: string
  name: string
  error?: string
  disabled?: boolean
  disabledReason?: string
  required?: boolean
  maxLength?: number
  placeholder?: string
  helpText?: string
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  error,
  disabled,
  disabledReason,
  required,
  maxLength,
  placeholder,
  helpText,
  children
}) => {
  const [showTooltip, setShowTooltip] = useState(false)
  
  return (
    <div className="form-field">
      <label htmlFor={name} className="form-label">
        {label}
        {required && <span className="text-red-500">*</span>}
        {disabled && disabledReason && (
          <Tooltip content={disabledReason}>
            <InfoIcon className="ml-1 h-4 w-4 text-gray-400" />
          </Tooltip>
        )}
      </label>
      
      <div className="form-input-wrapper">
        {children}
        {maxLength && (
          <CharacterCounter current={value?.length || 0} max={maxLength} />
        )}
      </div>
      
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      
      {helpText && !error && (
        <div className="form-help-text">
          {helpText}
        </div>
      )}
    </div>
  )
}

// Character counter component
const CharacterCounter: React.FC<{ current: number; max: number }> = ({
  current,
  max
}) => {
  const isNearLimit = current > max * 0.8
  const isOverLimit = current > max
  
  return (
    <div className={cn(
      'character-counter text-sm',
      isOverLimit && 'text-red-500',
      isNearLimit && !isOverLimit && 'text-yellow-500'
    )}>
      {current}/{max}
    </div>
  )
}
```

### 4. Date Field Handling

**Location**: `src/components/ux/DateField.tsx`

```typescript
interface DateFieldProps extends FormFieldProps {
  value?: Date | null
  onChange: (date: Date | null) => void
  showTime?: boolean
}

export const DateField: React.FC<DateFieldProps> = ({
  value,
  onChange,
  showTime = false,
  disabled,
  disabledReason,
  ...props
}) => {
  const formatDisplayValue = (date: Date | null | undefined): string => {
    if (!date || isNaN(date.getTime())) {
      return 'Not set'
    }
    
    return showTime 
      ? date.toLocaleString()
      : date.toLocaleDateString()
  }
  
  const handleDateChange = (dateString: string) => {
    if (!dateString) {
      onChange(null)
      return
    }
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      // Invalid date - don't update
      return
    }
    
    onChange(date)
  }
  
  return (
    <FormField {...props} disabled={disabled} disabledReason={disabledReason}>
      {disabled ? (
        <div className="form-input-disabled">
          {formatDisplayValue(value)}
        </div>
      ) : (
        <input
          type={showTime ? 'datetime-local' : 'date'}
          value={value ? value.toISOString().split('T')[0] : ''}
          onChange={(e) => handleDateChange(e.target.value)}
          className="form-input"
        />
      )}
    </FormField>
  )
}
```

### 5. Settings Form Components

**Location**: `src/components/settings/ProfileSettingsForm.tsx`

```typescript
export const ProfileSettingsForm: React.FC = () => {
  const { user, updateProfile } = useAuth()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    canSave,
    isSubmitting
  } = useSettingsForm(
    profileSettingsSchema,
    {
      displayName: user?.displayName || '',
      email: user?.email || '',
      avatar: user?.avatar || ''
    },
    updateProfile
  )
  
  return (
    <form onSubmit={handleSubmit} className="settings-form">
      <FormField
        label="Display Name"
        name="displayName"
        error={errors.displayName?.message}
        required
        maxLength={50}
      >
        <input
          {...register('displayName')}
          className="form-input"
          placeholder="Enter your display name"
        />
      </FormField>
      
      <FormField
        label="Email Address"
        name="email"
        error={errors.email?.message}
        disabled={!user?.emailVerified}
        disabledReason="Verify your email address to enable editing"
        helpText="Used for notifications and account recovery"
      >
        <input
          {...register('email')}
          type="email"
          className="form-input"
          placeholder="Enter your email address"
        />
      </FormField>
      
      <DateField
        label="Account Created"
        name="accountCreated"
        value={user?.createdAt}
        onChange={() => {}} // Read-only
        disabled
        disabledReason="Account creation date cannot be modified"
      />
      
      <DateField
        label="Last Login"
        name="lastLogin"
        value={user?.lastLoginAt}
        onChange={() => {}} // Read-only
        disabled
        disabledReason="Last login date is automatically updated"
        showTime
      />
      
      <div className="form-actions">
        <Button
          type="submit"
          disabled={!canSave}
          loading={isSubmitting}
          loadingText="Saving..."
        >
          Save Changes
        </Button>
        
        {!canSave && (
          <p className="text-sm text-gray-500">
            Make changes to enable saving
          </p>
        )}
      </div>
    </form>
  )
}
```

## Implementation Plan

### Phase 1: Form Infrastructure (Week 1)
1. **Day 1-2**: Create FormValidation system with Zod + React Hook Form
2. **Day 3-4**: Build FormField components with error handling
3. **Day 5**: Create DateField component with "Not set" handling

### Phase 2: Settings Page (Week 2)
1. **Day 1-2**: Create Settings page structure with tabs
2. **Day 3-4**: Implement ProfileSettingsForm with validation
3. **Day 5**: Add NotificationSettingsForm and PrivacySettingsForm

### Phase 3: Validation & Feedback (Week 3)
1. **Day 1-2**: Implement immediate validation on blur
2. **Day 3-4**: Add character counters and helpful error messages
3. **Day 5**: Create disabled button states with explanations

### Phase 4: Testing & Polish (Week 4)
1. **Day 1-2**: Write property-based tests for form validation
2. **Day 3-4**: Write integration tests for settings forms
3. **Day 5**: Accessibility testing and performance optimization

## Testing Strategy

### Property-Based Tests

**Property 5: Form Validation Immediacy**
```typescript
// Feature: ux-gap-requirements, Property 5: Form Validation Immediacy
describe('Form validation immediacy', () => {
  test('validation appears immediately on blur', () => {
    fc.assert(
      fc.property(
        fc.record({
          fieldValue: fc.string(),
          fieldType: fc.oneof(fc.constant('email'), fc.constant('displayName')),
          isValid: fc.boolean()
        }),
        ({ fieldValue, fieldType, isValid }) => {
          render(<ProfileSettingsForm />)
          
          const field = screen.getByLabelText(new RegExp(fieldType, 'i'))
          
          // Enter value and blur
          fireEvent.change(field, { target: { value: fieldValue } })
          fireEvent.blur(field)
          
          // Validation should appear immediately
          if (!isValid) {
            expect(screen.getByRole('alert')).toBeInTheDocument()
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Integration Tests

**Settings Form Integration**:
```typescript
describe('Settings form integration', () => {
  test('save button disabled until valid and modified', async () => {
    render(<ProfileSettingsForm />)
    
    const saveButton = screen.getByRole('button', { name: /save changes/i })
    const displayNameField = screen.getByLabelText(/display name/i)
    
    // Initially disabled (no changes)
    expect(saveButton).toBeDisabled()
    
    // Make invalid change
    fireEvent.change(displayNameField, { target: { value: 'a' } })
    fireEvent.blur(displayNameField)
    
    // Still disabled (invalid)
    expect(saveButton).toBeDisabled()
    expect(screen.getByText(/must be at least 2 characters/i)).toBeInTheDocument()
    
    // Make valid change
    fireEvent.change(displayNameField, { target: { value: 'Valid Name' } })
    fireEvent.blur(displayNameField)
    
    // Now enabled (valid and modified)
    await waitFor(() => {
      expect(saveButton).toBeEnabled()
    })
  })
  
  test('date fields show "Not set" instead of "Invalid Date"', () => {
    const userWithNullDates = {
      ...mockUser,
      lastLoginAt: null,
      subscriptionExpiryDate: undefined
    }
    
    render(<ProfileSettingsForm />, {
      wrapper: ({ children }) => (
        <AuthProvider value={{ user: userWithNullDates }}>
          {children}
        </AuthProvider>
      )
    })
    
    expect(screen.getByText('Not set')).toBeInTheDocument()
    expect(screen.queryByText(/invalid date/i)).not.toBeInTheDocument()
  })
})
```

### Accessibility Tests

**Form Accessibility**:
```typescript
describe('Settings form accessibility', () => {
  test('disabled fields have explanatory tooltips', async () => {
    render(<ProfileSettingsForm />)
    
    const emailField = screen.getByLabelText(/email address/i)
    expect(emailField).toBeDisabled()
    
    // Info icon should be present
    const infoIcon = screen.getByRole('button', { name: /more information/i })
    
    // Hover to show tooltip
    fireEvent.mouseEnter(infoIcon)
    await waitFor(() => {
      expect(screen.getByText(/verify your email address/i)).toBeInTheDocument()
    })
  })
  
  test('error messages have proper ARIA attributes', () => {
    render(<ProfileSettingsForm />)
    
    const displayNameField = screen.getByLabelText(/display name/i)
    
    // Trigger validation error
    fireEvent.change(displayNameField, { target: { value: 'a' } })
    fireEvent.blur(displayNameField)
    
    const errorMessage = screen.getByRole('alert')
    expect(errorMessage).toHaveAttribute('id')
    expect(displayNameField).toHaveAttribute('aria-describedby', errorMessage.id)
  })
})
```

## Success Criteria

### Functional Requirements
- [ ] No "Invalid Date" placeholders anywhere in settings
- [ ] Disabled fields have explanations (tooltip/help text)
- [ ] Save success toast: "Changes saved ✓" / error toast with specific message
- [ ] Validation on blur with clear messages
- [ ] Save button disabled until valid + modified

### Performance Requirements
- [ ] Form validation responds within 100ms of blur event
- [ ] Settings page loads within 2 seconds
- [ ] Character counters update smoothly without lag

### Quality Requirements
- [ ] Property-based tests pass with 100+ iterations
- [ ] Integration tests cover all form scenarios
- [ ] Accessibility tests pass WCAG AA compliance
- [ ] All form fields have proper labels and error handling

## Evidence Requirements

### Screenshots
- [ ] Settings page showing "Not set" instead of invalid placeholder
- [ ] Disabled field with explanatory tooltip
- [ ] Form validation error messages on blur
- [ ] Save button disabled state with explanation
- [ ] Success toast after saving changes

### Test Results
- [ ] Property-based test results for form validation immediacy
- [ ] Integration test results for settings form behavior
- [ ] Accessibility test results for form compliance
- [ ] Performance test results for validation timing

## Risk Mitigation

### Data Loss
- **Risk**: Form changes lost on navigation or errors
- **Mitigation**: Auto-save drafts, confirmation dialogs for unsaved changes

### Validation Performance
- **Risk**: Complex validation slows down form interaction
- **Mitigation**: Debounced validation, efficient Zod schemas

### User Confusion
- **Risk**: Users don't understand why fields are disabled
- **Mitigation**: Clear tooltips and help text for all disabled fields

## Dependencies

### Internal Dependencies
- Existing Toast system for success/error feedback
- Existing Button component for save actions
- User authentication system for profile data

### External Dependencies
- React Hook Form for form state management
- Zod for validation schemas
- Tooltip component for disabled field explanations

## Definition of Done

This task is complete when:

1. **Settings Page**: Complete settings page with proper form handling
2. **No Invalid Placeholders**: All date fields show "Not set" instead of errors
3. **Clear Explanations**: All disabled fields have tooltips explaining why
4. **Immediate Validation**: Form validation appears on blur with helpful messages
5. **Smart Save Button**: Disabled until form is valid and modified
6. **Tests Passing**: Property-based + integration + accessibility tests
7. **Evidence Gathered**: Screenshots of all form states and interactions
8. **Performance Validated**: Form validation <100ms, page load <2s

This specification provides the detailed roadmap for implementing professional settings and form validation while maintaining excellent user experience.