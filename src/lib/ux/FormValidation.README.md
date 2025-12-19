# Comprehensive Form Validation System

A complete form validation system built on React Hook Form and Zod that provides immediate feedback, character counters, and smart save state management.

## Features

- **Immediate Validation**: Real-time validation feedback on blur with re-validation on change
- **Character Counters**: Built-in character counting with visual feedback for limits
- **Smart Save States**: Automatic save button state management based on form validity and dirty state
- **Clear Error Messages**: User-friendly, actionable error messages
- **Toast Integration**: Automatic success/error toast notifications
- **Common Schemas**: Pre-built validation schemas for common field types
- **TypeScript Support**: Full type safety with Zod schema inference

## Requirements Satisfied

- **R6.VALIDATION.IMMEDIATE**: Validation feedback appears within 100ms on blur
- **R6.VALIDATION.CLEAR_MESSAGES**: Error messages are user-friendly and actionable
- **R6.VALIDATION.SAVE_STATES**: Save button is disabled until form is valid and modified

## Basic Usage

```typescript
import { z } from 'zod';
import { useFormValidation, commonValidationSchemas } from '@/lib/ux/FormValidation';

// Define your form schema
const formSchema = z.object({
  email: commonValidationSchemas.email,
  name: commonValidationSchemas.name,
  bio: z.string().max(200, 'Bio must be less than 200 characters').optional(),
});

type FormData = z.infer<typeof formSchema>;

function MyForm() {
  const form = useFormValidation<FormData>({
    schema: formSchema,
    mode: 'onBlur', // Validate on blur for immediate feedback
    defaultValues: {
      email: '',
      name: '',
      bio: '',
    },
  });

  const handleSave = async (data: FormData) => {
    // Your save logic here
    console.log('Saving:', data);
  };

  return (
    <form>
      <input
        {...form.register('email')}
        placeholder="Email"
      />
      {form.getFieldState('email').error && (
        <p className="error">{form.getFieldState('email').error}</p>
      )}
      
      <button
        type="button"
        onClick={() => form.handleSaveWithToast(handleSave)}
        disabled={!form.validationState.canSave}
      >
        {form.validationState.isSubmitting ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

## Advanced Usage

### Character Counters

```typescript
import { formatCharacterCounter } from '@/lib/ux/FormValidation';

function BioField() {
  const characterCount = form.getCharacterCount('bio');
  const counter = formatCharacterCounter(characterCount, 200);
  
  return (
    <div>
      <textarea {...form.register('bio')} />
      <span className={counter.className}>
        {counter.text}
      </span>
      {counter.isNearLimit && (
        <p className="warning">Approaching character limit</p>
      )}
    </div>
  );
}
```

### Custom Validation Schemas

```typescript
import { z } from 'zod';
import { createFieldValidation, createOptionalField } from '@/lib/ux/FormValidation';

const customSchema = z.object({
  username: createFieldValidation(
    z.string().min(3).regex(/^[a-zA-Z0-9_]+$/),
    30,
    'Username'
  ),
  description: createOptionalField(
    z.string().max(500)
  ),
});
```

### Form Utilities

```typescript
import { formValidationUtils } from '@/lib/ux/FormValidation';

// Check if save button should be enabled
const canSave = formValidationUtils.canSave({
  isValid: form.validationState.isValid,
  isDirty: form.validationState.isDirty,
  isSubmitting: form.validationState.isSubmitting,
});

// Get save button props
const saveButtonProps = formValidationUtils.getSaveButtonProps(form.validationState);

// Format error messages
const formattedError = formValidationUtils.formatError(fieldError);

// Check if error should be shown
const shouldShow = formValidationUtils.shouldShowError(fieldState);
```

## Common Validation Schemas

The system includes pre-built schemas for common field types:

```typescript
import { commonValidationSchemas } from '@/lib/ux/FormValidation';

const schemas = {
  email: commonValidationSchemas.email,
  password: commonValidationSchemas.password,
  walletAddress: commonValidationSchemas.walletAddress,
  url: commonValidationSchemas.url,
  phoneNumber: commonValidationSchemas.phoneNumber,
  name: commonValidationSchemas.name,
  username: commonValidationSchemas.username,
  positiveNumber: commonValidationSchemas.positiveNumber,
  percentage: commonValidationSchemas.percentage,
  date: commonValidationSchemas.date,
  pastDate: commonValidationSchemas.pastDate,
  futureDate: commonValidationSchemas.futureDate,
};
```

## Validation Messages

Consistent error messages are provided through the `validationMessages` object:

```typescript
import { validationMessages } from '@/lib/ux/FormValidation';

const messages = {
  required: validationMessages.required, // "This field is required"
  invalid: validationMessages.invalid,   // "Please enter a valid value"
  tooShort: validationMessages.tooShort(5), // "Must be at least 5 characters"
  tooLong: validationMessages.tooLong(100), // "Must be less than 100 characters"
};
```

## Configuration Options

### Form Validation Config

```typescript
interface FormValidationConfig<T> {
  schema: z.ZodSchema<T>;           // Zod validation schema
  defaultValues?: Partial<T>;      // Default form values
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
  shouldFocusError?: boolean;      // Focus first error field on submit
  delayError?: number;             // Delay error display (ms)
}
```

### Character Counter Config

```typescript
interface CharacterCounterConfig {
  maxLength: number;
  showCounter?: boolean;
  warningThreshold?: number; // Show warning at 80% by default
}
```

## Form State

The `validationState` object provides comprehensive form state information:

```typescript
interface FormValidationState {
  isValid: boolean;        // All fields are valid
  isDirty: boolean;        // Form has been modified
  isSubmitting: boolean;   // Form is currently submitting
  hasErrors: boolean;      // Form has validation errors
  canSave: boolean;        // Form can be saved (valid + dirty + not submitting)
  fieldStates: Record<string, FieldValidationState>; // Individual field states
}
```

### Field State

Each field provides detailed state information:

```typescript
interface FieldValidationState {
  isValid: boolean;        // Field is valid
  isDirty: boolean;        // Field has been modified
  isTouched: boolean;      // Field has been focused
  error?: string;          // Validation error message
  characterCount?: number; // Current character count
  maxLength?: number;      // Maximum allowed characters
  isNearLimit?: boolean;   // Approaching character limit
}
```

## Toast Integration

The system automatically handles toast notifications:

```typescript
// Success toast (automatic)
form.handleSaveWithToast(async (data) => {
  await saveData(data);
  // Shows: "Changes saved ✓"
});

// Error toast (automatic)
form.handleSaveWithToast(async (data) => {
  throw new Error('Network error');
  // Shows: "Save Failed - Network error"
});

// Validation error toast (automatic)
// If form is invalid, shows: "Cannot Save - Please fix validation errors before saving."
```

## Best Practices

### 1. Use Appropriate Validation Modes

```typescript
// For immediate feedback (recommended)
const form = useFormValidation({
  schema,
  mode: 'onBlur',        // Validate when user leaves field
  reValidateMode: 'onChange', // Re-validate on every change after first validation
});

// For less aggressive validation
const form = useFormValidation({
  schema,
  mode: 'onSubmit',      // Only validate on submit
});
```

### 2. Provide Clear Error Messages

```typescript
const schema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter'),
});
```

### 3. Use Character Counters for Long Fields

```typescript
// For any field with a character limit
const bioSchema = z.string().max(500, 'Bio must be less than 500 characters');

// In component
const counter = formatCharacterCounter(
  form.getCharacterCount('bio'),
  500,
  0.8 // Show warning at 80%
);
```

### 4. Handle Save States Properly

```typescript
// Always use the built-in save handler for consistent UX
const handleSave = async (data: FormData) => {
  // Your save logic
};

// This handles all the toast notifications and error states
form.handleSaveWithToast(handleSave);
```

## Testing

The form validation system includes comprehensive tests:

- **Property-based tests**: Verify universal properties across all inputs
- **Unit tests**: Test specific examples and edge cases
- **Integration tests**: Test form behavior in real scenarios

Run tests with:
```bash
npm test -- src/lib/ux/__tests__/FormValidation
```

## Examples

See `src/components/ux/FormValidationExample.tsx` for a complete working example that demonstrates all features of the form validation system.

## Integration with Existing Components

The form validation system works seamlessly with existing UI components:

```typescript
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// The system automatically integrates with your existing toast system
// and can be used with any input components
```

This form validation system provides a complete solution for handling form validation in the AlphaWhale application, ensuring immediate feedback, clear error messages, and proper save state management as required by the UX gap requirements.