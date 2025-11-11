/**
 * FilterDrawer Component
 * 
 * Comprehensive filter drawer for Hunter Screen with all filter options:
 * - Type filter (multi-select)
 * - Chain filter (multi-select)
 * - Trust level filter (Green/Amber/Red)
 * - Reward range filter (min/max sliders)
 * - Urgency filter (Ending Soon, New, Hot)
 * - Eligibility toggle
 * - Difficulty filter (Easy, Medium, Advanced)
 * - Sort selector
 * - Red consent modal
 * 
 * Requirements: 4.1-4.19
 */

import React, { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { X, AlertTriangle } from 'lucide-react';
import {
  FilterState,
  OpportunityType,
  Chain,
  UrgencyType,
  DifficultyLevel,
  SortOption,
} from '@/types/hunter';

export interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onReset: () => void;
}

// Filter option configurations
const OPPORTUNITY_TYPES: { value: OpportunityType; label: string }[] = [
  { value: 'airdrop', label: 'Airdrops' },
  { value: 'quest', label: 'Quests' },
  { value: 'staking', label: 'Staking' },
  { value: 'yield', label: 'Yield' },
  { value: 'points', label: 'Points' },
  { value: 'loyalty', label: 'Loyalty' },
  { value: 'testnet', label: 'Testnet' },
];

const CHAINS: { value: Chain; label: string }[] = [
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'base', label: 'Base' },
  { value: 'arbitrum', label: 'Arbitrum' },
  { value: 'optimism', label: 'Optimism' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'solana', label: 'Solana' },
  { value: 'avalanche', label: 'Avalanche' },
];

const URGENCY_OPTIONS: { value: UrgencyType; label: string }[] = [
  { value: 'ending_soon', label: 'Ending Soon (<48h)' },
  { value: 'new', label: 'New (<24h)' },
  { value: 'hot', label: 'Hot' },
];

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'advanced', label: 'Advanced' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'ends_soon', label: 'Ends Soon' },
  { value: 'highest_reward', label: 'Highest Reward' },
  { value: 'newest', label: 'Newest' },
  { value: 'trust', label: 'Trust Score' },
];

const TRUST_LEVELS = [
  { value: 80, label: 'Green (≥80)', color: 'text-green-600' },
  { value: 60, label: 'Amber (60-79)', color: 'text-amber-600' },
  { value: 0, label: 'Red (<60)', color: 'text-red-600' },
];

/**
 * FilterDrawer Component
 * 
 * Provides comprehensive filtering UI for Hunter Screen
 * Requirement 4.1-4.19: All filter types with Red consent modal
 * Memoized for performance (Requirement 1.1-1.6)
 */
export const FilterDrawer = React.memo(function FilterDrawer({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onReset,
}: FilterDrawerProps) {
  const [showRedConsent, setShowRedConsent] = useState(false);
  const [redConsentGiven, setRedConsentGiven] = useState(false);

  // Check if Red trust is being enabled
  useEffect(() => {
    // Requirement 4.17: Red consent modal when Red trust is enabled
    if (filters.trustMin < 60 && !redConsentGiven && !sessionStorage.getItem('red_consent')) {
      setShowRedConsent(true);
    }
  }, [filters.trustMin, redConsentGiven]);

  const handleTypeToggle = (type: OpportunityType) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    onFilterChange({ types: newTypes });
  };

  const handleChainToggle = (chain: Chain) => {
    const newChains = filters.chains.includes(chain)
      ? filters.chains.filter(c => c !== chain)
      : [...filters.chains, chain];
    onFilterChange({ chains: newChains });
  };

  const handleUrgencyToggle = (urgency: UrgencyType) => {
    const newUrgency = filters.urgency.includes(urgency)
      ? filters.urgency.filter(u => u !== urgency)
      : [...filters.urgency, urgency];
    onFilterChange({ urgency: newUrgency });
  };

  const handleDifficultyToggle = (difficulty: DifficultyLevel) => {
    const newDifficulty = filters.difficulty.includes(difficulty)
      ? filters.difficulty.filter(d => d !== difficulty)
      : [...filters.difficulty, difficulty];
    onFilterChange({ difficulty: newDifficulty });
  };

  const handleTrustMinChange = (value: number) => {
    // Requirement 4.17: Show consent modal when enabling Red trust
    if (value < 60 && !redConsentGiven && !sessionStorage.getItem('red_consent')) {
      setShowRedConsent(true);
      return;
    }
    onFilterChange({ trustMin: value, showRisky: value < 60 });
  };

  const handleRedConsent = () => {
    // Requirement 4.18: Persist consent for session
    sessionStorage.setItem('red_consent', 'true');
    setRedConsentGiven(true);
    setShowRedConsent(false);
    onFilterChange({ trustMin: 0, showRisky: true });
  };

  const handleRedConsentCancel = () => {
    setShowRedConsent(false);
    // Reset trust min to safe value
    onFilterChange({ trustMin: 80, showRisky: false });
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[90vh] overflow-y-auto">
          <DrawerHeader>
            <DrawerTitle>Filter Opportunities</DrawerTitle>
            <DrawerDescription>
              Customize your feed with filters and sorting options
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4 space-y-6">
            {/* Type Filter - Requirement 4.3 */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Opportunity Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {OPPORTUNITY_TYPES.map(({ value, label }) => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${value}`}
                      checked={filters.types.includes(value)}
                      onCheckedChange={() => handleTypeToggle(value)}
                      aria-label={`Filter by ${label}`}
                    />
                    <label
                      htmlFor={`type-${value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Chain Filter - Requirement 4.4 */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Chains</Label>
              <div className="grid grid-cols-2 gap-2">
                {CHAINS.map(({ value, label }) => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`chain-${value}`}
                      checked={filters.chains.includes(value)}
                      onCheckedChange={() => handleChainToggle(value)}
                      aria-label={`Filter by ${label} chain`}
                    />
                    <label
                      htmlFor={`chain-${value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Level Filter - Requirement 4.5 */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Minimum Trust Level</Label>
              <div className="space-y-2">
                {TRUST_LEVELS.map(({ value, label, color }) => (
                  <div key={value} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`trust-${value}`}
                      name="trust-level"
                      checked={filters.trustMin === value}
                      onChange={() => handleTrustMinChange(value)}
                      className="h-4 w-4 cursor-pointer"
                      aria-label={label}
                    />
                    <label
                      htmlFor={`trust-${value}`}
                      className={`text-sm font-medium cursor-pointer ${color}`}
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Reward Range Filter - Requirement 4.6 */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Reward Range (USD)
              </Label>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Min: ${filters.rewardMin}</span>
                    <span>Max: ${filters.rewardMax === 100000 ? '100k+' : filters.rewardMax}</span>
                  </div>
                  <Slider
                    min={0}
                    max={100000}
                    step={100}
                    value={[filters.rewardMin]}
                    onValueChange={([value]) => onFilterChange({ rewardMin: value })}
                    aria-label="Minimum reward amount"
                  />
                </div>
                <div className="space-y-2">
                  <Slider
                    min={0}
                    max={100000}
                    step={100}
                    value={[filters.rewardMax]}
                    onValueChange={([value]) => onFilterChange({ rewardMax: value })}
                    aria-label="Maximum reward amount"
                  />
                </div>
              </div>
            </div>

            {/* Urgency Filter - Requirement 4.7 */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Urgency</Label>
              <div className="space-y-2">
                {URGENCY_OPTIONS.map(({ value, label }) => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`urgency-${value}`}
                      checked={filters.urgency.includes(value)}
                      onCheckedChange={() => handleUrgencyToggle(value)}
                      aria-label={`Filter by ${label}`}
                    />
                    <label
                      htmlFor={`urgency-${value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Eligibility Toggle - Requirement 4.8 */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="eligible-only"
                  checked={filters.eligibleOnly}
                  onCheckedChange={(checked) => 
                    onFilterChange({ eligibleOnly: checked as boolean })
                  }
                  aria-label="Show only likely eligible opportunities"
                />
                <label
                  htmlFor="eligible-only"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Show only "Likely Eligible" opportunities
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Filters opportunities based on your connected wallet's eligibility
              </p>
            </div>

            {/* Difficulty Filter - Requirement 4.9 */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Difficulty</Label>
              <div className="space-y-2">
                {DIFFICULTY_OPTIONS.map(({ value, label }) => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`difficulty-${value}`}
                      checked={filters.difficulty.includes(value)}
                      onCheckedChange={() => handleDifficultyToggle(value)}
                      aria-label={`Filter by ${label} difficulty`}
                    />
                    <label
                      htmlFor={`difficulty-${value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Sort Selector - Requirement 4.10 */}
            <div className="space-y-3">
              <Label htmlFor="sort-select" className="text-base font-semibold">
                Sort By
              </Label>
              <Select
                value={filters.sort}
                onValueChange={(value) => onFilterChange({ sort: value as SortOption })}
              >
                <SelectTrigger id="sort-select" aria-label="Sort opportunities">
                  <SelectValue placeholder="Select sort option" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DrawerFooter className="flex-row gap-2">
            <Button
              variant="outline"
              onClick={onReset}
              className="flex-1"
              aria-label="Reset all filters"
            >
              Reset
            </Button>
            <DrawerClose asChild>
              <Button className="flex-1" aria-label="Apply filters">
                Apply Filters
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Red Consent Modal - Requirement 4.17, 4.18 */}
      <Dialog open={showRedConsent} onOpenChange={setShowRedConsent}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <DialogTitle>View Risky Opportunities?</DialogTitle>
            </div>
            <DialogDescription className="space-y-2 pt-2">
              <p>
                You're about to enable viewing of opportunities with Red trust scores (below 60).
              </p>
              <p className="font-semibold text-red-600">
                These opportunities have failed security checks and may be:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Phishing attempts or scams</li>
                <li>Unverified or suspicious contracts</li>
                <li>High risk of loss of funds</li>
              </ul>
              <p className="text-sm font-medium pt-2">
                Only proceed if you understand the risks and will conduct your own research.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleRedConsentCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRedConsent}
              className="flex-1"
            >
              I Understand, Show Risky
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
