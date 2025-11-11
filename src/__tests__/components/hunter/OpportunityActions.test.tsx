/**
 * Tests for OpportunityActions Component
 * 
 * Requirements:
 * - 5.8: Action buttons (save, share, report)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OpportunityActions } from '@/components/hunter/OpportunityActions';

// Mock dependencies
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-123', access_token: 'token-123' },
    isAuthenticated: true,
  })),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('OpportunityActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    opportunityId: '123e4567-e89b-12d3-a456-426614174000',
    opportunityTitle: 'Test Opportunity',
    opportunitySlug: 'test-opportunity',
  };

  describe('Save functionality', () => {
    it('should render save button', () => {
      render(<OpportunityActions {...defaultProps} />);
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should show saved state when isSaved is true', () => {
      render(<OpportunityActions {...defaultProps} isSaved={true} />);
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('should call save API when save button is clicked', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const onSaveToggle = vi.fn();
      render(<OpportunityActions {...defaultProps} onSaveToggle={onSaveToggle} />);

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/hunter/save',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'Authorization': 'Bearer token-123',
            }),
            body: JSON.stringify({ opportunity_id: defaultProps.opportunityId }),
          })
        );
      });

      await waitFor(() => {
        expect(onSaveToggle).toHaveBeenCalledWith(true);
      });
    });

    it('should call unsave API when unsave button is clicked', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const onSaveToggle = vi.fn();
      render(<OpportunityActions {...defaultProps} isSaved={true} onSaveToggle={onSaveToggle} />);

      const savedButton = screen.getByText('Saved');
      fireEvent.click(savedButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/hunter/save?opportunity_id='),
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });

      await waitFor(() => {
        expect(onSaveToggle).toHaveBeenCalledWith(false);
      });
    });

    it('should show error toast on save failure', async () => {
      const { toast } = await import('sonner');
      
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Failed to save' } }),
      } as Response);

      render(<OpportunityActions {...defaultProps} />);

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('should require authentication for save', async () => {
      const { useAuth } = await import('@/hooks/useAuth');
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
      } as any);

      const { toast } = await import('sonner');

      render(<OpportunityActions {...defaultProps} />);

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please sign in to save opportunities');
      });
    });
  });

  describe('Share functionality', () => {
    it('should render share button', () => {
      render(<OpportunityActions {...defaultProps} />);
      expect(screen.getByText('Share')).toBeInTheDocument();
    });

    it('should fetch share data and copy to clipboard', async () => {
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      };
      Object.assign(navigator, { clipboard: mockClipboard });

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          url: 'https://alphawhale.com/hunter/test-opportunity',
          text: 'Check out this opportunity',
        }),
      } as Response);

      const { toast } = await import('sonner');

      render(<OpportunityActions {...defaultProps} />);

      const shareButton = screen.getByText('Share');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/hunter/share?opportunity_id=')
        );
      });

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith('https://alphawhale.com/hunter/test-opportunity');
        expect(toast.success).toHaveBeenCalledWith('Link copied to clipboard');
      });
    });
  });

  describe('Report functionality', () => {
    it('should render report button', () => {
      render(<OpportunityActions {...defaultProps} />);
      expect(screen.getByText('Report')).toBeInTheDocument();
    });

    it('should open report modal when report button is clicked', async () => {
      render(<OpportunityActions {...defaultProps} />);

      const reportButton = screen.getByText('Report');
      fireEvent.click(reportButton);

      await waitFor(() => {
        expect(screen.getByText('Report Opportunity')).toBeInTheDocument();
      });
    });
  });

  describe('Compact mode', () => {
    it('should render icon-only buttons in compact mode', () => {
      render(<OpportunityActions {...defaultProps} compact={true} />);
      
      // Should have icon buttons without text
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3); // save, share, report
      
      // Check aria-labels
      expect(screen.getByLabelText('Save opportunity')).toBeInTheDocument();
      expect(screen.getByLabelText('Share opportunity')).toBeInTheDocument();
      expect(screen.getByLabelText('Report opportunity')).toBeInTheDocument();
    });
  });
});
