/**
 * Opportunity Actions Component
 * 
 * Action buttons for save, share, and report functionality.
 * 
 * Requirements:
 * - 5.8: Action buttons (save, share, report)
 */

import React, { useState } from 'react';
import { Star, Share2, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ReportModal } from './ReportModal';
import { useAuth } from '@/hooks/useAuth';

interface OpportunityActionsProps {
  opportunityId: string;
  opportunityTitle: string;
  opportunitySlug: string;
  isSaved?: boolean;
  onSaveToggle?: (saved: boolean) => void;
  compact?: boolean;
}

export function OpportunityActions({
  opportunityId,
  opportunityTitle,
  opportunitySlug,
  isSaved = false,
  onSaveToggle,
  compact = false,
}: OpportunityActionsProps) {
  const { user, isAuthenticated } = useAuth();
  const [saved, setSaved] = useState(isSaved);
  const [isSaving, setIsSaving] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save opportunities');
      return;
    }

    setIsSaving(true);

    try {
      if (saved) {
        // Unsave
        const response = await fetch(`/api/hunter/save?opportunity_id=${opportunityId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user?.access_token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || 'Failed to unsave');
        }

        setSaved(false);
        onSaveToggle?.(false);
        toast.success('Removed from saved opportunities');
      } else {
        // Save
        const response = await fetch('/api/hunter/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.access_token}`,
          },
          body: JSON.stringify({ opportunity_id: opportunityId }),
        });

        if (!response.ok) {
          const data = await response.json();
          if (response.status === 429) {
            toast.error(`Rate limit exceeded. Please try again later.`);
          } else {
            throw new Error(data.error?.message || 'Failed to save');
          }
          return;
        }

        setSaved(true);
        onSaveToggle?.(true);
        toast.success('Saved to your collection');
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save opportunity');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      // Fetch share data
      const response = await fetch(`/api/hunter/share?opportunity_id=${opportunityId}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate share link');
      }

      const data = await response.json();
      const shareUrl = data.url;
      const shareText = data.text;

      // Try native share API first (mobile)
      if (navigator.share) {
        try {
          await navigator.share({
            title: opportunityTitle,
            text: shareText,
            url: shareUrl,
          });
          toast.success('Shared successfully');
          return;
        } catch (err: any) {
          // User cancelled or share failed, fall back to clipboard
          if (err.name !== 'AbortError') {
            console.error('Share error:', err);
          }
        }
      }

      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard');

    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share opportunity');
    }
  };

  const handleReport = () => {
    setIsReportModalOpen(true);
  };

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`
              p-2 rounded-lg transition-all disabled:opacity-50
              ${saved
                ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            `}
            aria-label={saved ? 'Unsave opportunity' : 'Save opportunity'}
            title={saved ? 'Unsave' : 'Save'}
          >
            <Star className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleShare}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
            aria-label="Share opportunity"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleReport}
            className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
            aria-label="Report opportunity"
            title="Report"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>

        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          opportunityId={opportunityId}
          opportunityTitle={opportunityTitle}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className={saved ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400' : ''}
        >
          <Star className={`w-4 h-4 mr-2 ${saved ? 'fill-current' : ''}`} />
          {saved ? 'Saved' : 'Save'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleReport}
          className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
        >
          <Flag className="w-4 h-4 mr-2" />
          Report
        </Button>
      </div>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        opportunityId={opportunityId}
        opportunityTitle={opportunityTitle}
      />
    </>
  );
}
