# Theme System Documentation

## Overview
The whale tracking app includes a comprehensive dark/light theme system that provides users with three theme options:
- **Light Mode**: Traditional light theme with bright backgrounds
- **Dark Mode**: Dark theme optimized for low-light environments
- **System**: Automatically follows the user's system preference

## Implementation

### Theme Context
The theme system is built around a React context (`ThemeContext`) that manages:
- Current theme preference (light/dark/system)
- Actual resolved theme (light/dark)
- Theme persistence in localStorage
- System preference detection

### Components

#### ThemeProvider
Wraps the entire application and provides theme state management.

```tsx
<ThemeProvider>
  <App />
</ThemeProvider>
```

#### ThemeToggle
A dropdown component that allows users to switch between theme modes.

```tsx
import { ThemeToggle } from '@/components/ui/theme-toggle';

<ThemeToggle />
```

### CSS Variables
The theme system uses CSS custom properties defined in `src/index.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... other light theme variables */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... other dark theme variables */
}
```

### Tailwind Configuration
Dark mode is configured in `tailwind.config.js`:

```js
module.exports = {
  darkMode: ["class"],
  // ... rest of config
}
```

## Usage

### Using the Theme Hook
```tsx
import { useTheme } from '@/contexts/ThemeContext';

const MyComponent = () => {
  const { theme, setTheme, actualTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Resolved theme: {actualTheme}</p>
      <button onClick={() => setTheme('dark')}>
        Switch to Dark
      </button>
    </div>
  );
};
```

### Styling Components
Use Tailwind's dark mode classes:

```tsx
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  Content that adapts to theme
</div>
```

Or use the CSS custom properties:

```tsx
<div className="bg-background text-foreground">
  Content using theme variables
</div>
```

## Features

### Automatic System Detection
The theme system automatically detects the user's system preference and updates when it changes.

### Persistence
Theme preferences are saved to localStorage and restored on app reload.

### Smooth Transitions
Theme changes are applied smoothly with CSS transitions.

### Integration Points
- **UserHeader**: Includes theme toggle for authenticated users
- **PersonalizationSection**: Theme preference in user profile
- **All UI Components**: Properly styled for both themes

## Testing
Theme functionality is tested in `src/__tests__/components/ThemeToggle.test.tsx`.

## Browser Support
The theme system works in all modern browsers that support:
- CSS custom properties
- `prefers-color-scheme` media query
- localStorage API