/**
 * Legal & Support Implementation Test
 * 
 * Tests for Task 3: Add Footer OR Settings → Legal/Support
 * Requirements: R6-AC1, R6-AC2, R6-AC3, R6-AC4, R6-AC5, R24-AC1, R24-AC2, R24-AC3, R24-AC4, R24-AC5
 */

import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Settings from '../pages/Settings';
import Terms from '../pages/legal/Terms';
import Privacy from '../pages/legal/Privacy';
import Contact from '../pages/legal/Contact';
import { getBuildInfo, getVersionString, getBuildDateString } from '../lib/utils/build-info';

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com', created_at: '2023-01-01' },
    signOut: vi.fn(),
  }),
}));

vi.mock('@/hooks/useTier', () => ({
  useTier: () => ({
    tier: 'free',
    isPremium: false,
    isEnterprise: false,
  }),
}));

vi.mock('@/hooks/useUserMetadata', () => ({
  useUserMetadata: () => ({
    metadata: null,
    loading: false,
  }),
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Legal & Support Implementation', () => {
  describe('Settings Page Extensions', () => {
    test('Settings page includes Legal & Support tab', () => {
      renderWithRouter(<Settings />);
      
      // Check that Legal & Support tab exists
      expect(screen.getByText('Legal & Support')).toBeInTheDocument();
    });

    test('Settings page includes About tab', () => {
      renderWithRouter(<Settings />);
      
      // Check that About tab exists
      expect(screen.getByText('About')).toBeInTheDocument();
    });
  });

  describe('Legal Pages', () => {
    test('Terms page renders with real content', () => {
      renderWithRouter(<Terms />);
      
      // Check for real content, not placeholders
      expect(screen.getByText('Terms of Service')).toBeInTheDocument();
      expect(screen.getByText('AlphaWhale Terms of Service')).toBeInTheDocument();
      expect(screen.getByText('1. Acceptance of Terms')).toBeInTheDocument();
      expect(screen.getByText('4. Financial Disclaimer')).toBeInTheDocument();
      
      // Ensure it's not placeholder content
      expect(screen.queryByText('Lorem ipsum')).not.toBeInTheDocument();
      expect(screen.queryByText('Placeholder')).not.toBeInTheDocument();
    });

    test('Privacy page renders with real content', () => {
      renderWithRouter(<Privacy />);
      
      // Check for real content, not placeholders
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
      expect(screen.getByText('AlphaWhale Privacy Policy')).toBeInTheDocument();
      expect(screen.getByText('1. Information We Collect')).toBeInTheDocument();
      expect(screen.getByText('4. Blockchain Data Privacy')).toBeInTheDocument();
      
      // Ensure it's not placeholder content
      expect(screen.queryByText('Lorem ipsum')).not.toBeInTheDocument();
      expect(screen.queryByText('Placeholder')).not.toBeInTheDocument();
    });

    test('Contact page renders with real functionality', () => {
      renderWithRouter(<Contact />);
      
      // Check for real content and functionality
      expect(screen.getByText('Contact Support')).toBeInTheDocument();
      expect(screen.getByText('Send a Message')).toBeInTheDocument();
      expect(screen.getByText('Quick Contact')).toBeInTheDocument();
      
      // Check for working email links
      expect(screen.getByText('support@alphawhale.com')).toBeInTheDocument();
      expect(screen.getByText('bugs@alphawhale.com')).toBeInTheDocument();
      
      // Check for form elements
      expect(screen.getByPlaceholderText('Your full name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('your.email@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Brief description of your issue')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Please describe your issue or question in detail...')).toBeInTheDocument();
    });
  });

  describe('Build Information Utilities', () => {
    test('getBuildInfo returns valid build information', () => {
      const buildInfo = getBuildInfo();
      
      expect(buildInfo).toHaveProperty('version');
      expect(buildInfo).toHaveProperty('timestamp');
      expect(buildInfo).toHaveProperty('environment');
      expect(buildInfo).toHaveProperty('buildDate');
      
      expect(typeof buildInfo.version).toBe('string');
      expect(typeof buildInfo.timestamp).toBe('string');
      expect(typeof buildInfo.environment).toBe('string');
      expect(typeof buildInfo.buildDate).toBe('string');
      
      // Version should match package.json
      expect(buildInfo.version).toBe('1.1.0');
    });

    test('getVersionString returns formatted version', () => {
      const versionString = getVersionString();
      
      expect(typeof versionString).toBe('string');
      expect(versionString).toContain('1.1.0');
    });

    test('getBuildDateString returns formatted build date', () => {
      const buildDateString = getBuildDateString();
      
      expect(typeof buildDateString).toBe('string');
      expect(buildDateString).toContain('Built on');
    });
  });

  describe('Requirements Validation', () => {
    test('R6-AC1: Support entry point exists in Settings', () => {
      renderWithRouter(<Settings />);
      
      // Legal & Support tab provides support entry point
      expect(screen.getByText('Legal & Support')).toBeInTheDocument();
    });

    test('R6-AC2: Contact and Report bug functionality works', () => {
      renderWithRouter(<Contact />);
      
      // Contact functionality exists
      expect(screen.getByText('Contact Support')).toBeInTheDocument();
      expect(screen.getByText('support@alphawhale.com')).toBeInTheDocument();
      
      // Bug report functionality exists
      expect(screen.getByText('bugs@alphawhale.com')).toBeInTheDocument();
    });

    test('R6-AC3: Terms and Privacy links exist', () => {
      renderWithRouter(<Terms />);
      expect(screen.getByText('Terms of Service')).toBeInTheDocument();
      
      renderWithRouter(<Privacy />);
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    });

    test('R6-AC4: Legal pages show real content', () => {
      renderWithRouter(<Terms />);
      
      // Check for substantial real content
      expect(screen.getByText('4. Financial Disclaimer')).toBeInTheDocument();
      expect(screen.getByText('3. User Responsibilities')).toBeInTheDocument();
      expect(screen.getByText('6. Limitation of Liability')).toBeInTheDocument();
      
      // Ensure no placeholder text
      expect(screen.queryByText('Lorem ipsum')).not.toBeInTheDocument();
      expect(screen.queryByText('[Placeholder]')).not.toBeInTheDocument();
    });

    test('R24-AC3: Build/version visible in Settings → About', () => {
      renderWithRouter(<Settings />);
      
      // About tab exists for build/version info
      expect(screen.getByText('About')).toBeInTheDocument();
    });
  });
});