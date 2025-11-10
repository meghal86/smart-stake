/**
 * Report Modal Component
 * 
 * Modal for reporting opportunities with abuse categories.
 * Implements rate limiting and idempotency.
 * 
 * Requirements:
 * - 5.8: Report functionality
 * - 11.9: Report categories (phishing, impersonation, reward not paid)
 * - 11.10: Auto-quarantine (≥5 unique reporters in 1h)
 */

import React, { useState } from 'react';
import { X, AlertTriangle, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityId: string;
  opportunityTitle: string;
}

type ReportCategory = 'phishing' | 'impersonation' | 'reward_not_paid' | 'scam' | 'other';

interface ReportOption {
  value: ReportCategory;
  label: string;
  description: string;
}

const REPORT_OPTIONS: ReportOption[] = [
  {
    value: 'phishing',
    label: 'Phishing / Malicious Link',
    description: 'This opportunity contains suspicious or malicious links',
  },
  {
    value: 'impersonation',
    label: 'Impersonation',
    description: 'This opportunity is impersonating a legitimate protocol',
  },
  {
    value: 'reward_not_paid',
    label: 'Reward Not Paid',
    description: 'I completed this opportunity but did not receive the promised reward',
  },
  {
    value: 'scam',
    label: 'Scam / Fraud',
    description: 'This opportunity appears to be a scam or fraudulent',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other issue not listed above',
  },
];

export function ReportModal({ isOpen, onClose, opportunityId, opportunityTitle }: ReportModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedCategory) {
      toast.error('Please select a report category');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate idempotency key
      const idempotencyKey = `report-${opportunityId}-${Date.now()}-${Math.random()}`;

      const response = await fetch('/api/hunter/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          opportunity_id: opportunityId,
          category: selectedCategory,
          description: description.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast.error(`Rate limit exceeded. Please try again in ${data.error.retry_after_sec || 60} seconds.`);
        } else if (response.status === 409) {
          toast.info('You have already reported this opportunity.');
        } else {
          toast.error(data.error?.message || 'Failed to submit report');
        }
        return;
      }

      toast.success('Report submitted successfully. Thank you for helping keep the community safe!');
      onClose();
      
      // Reset form
      setSelectedCategory(null);
      setDescription('');

    } catch (error) {
      console.error('Report submission error:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      // Reset form after animation
      setTimeout(() => {
        setSelectedCategory(null);
        setDescription('');
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-900 rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <Flag className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Report Opportunity
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                {opportunityTitle}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Warning */}
          <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">Report Responsibly</p>
              <p className="text-amber-700 dark:text-amber-300">
                False reports may result in account restrictions. Reports are reviewed by our team.
              </p>
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              What's the issue? <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {REPORT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`
                    flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all
                    ${selectedCategory === option.value
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="category"
                    value={option.value}
                    checked={selectedCategory === option.value}
                    onChange={(e) => setSelectedCategory(e.target.value as ReportCategory)}
                    className="mt-1 text-red-600 focus:ring-red-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Additional Details (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any additional context that might help us review this report..."
              rows={4}
              maxLength={1000}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
              {description.length}/1000
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedCategory || isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </div>
      </div>
    </div>
  );
}
