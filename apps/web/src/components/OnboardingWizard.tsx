'use client';

import { useState, useEffect } from 'react';
import { useGate } from '../hooks/useGate';
import { useTelemetry } from '../hooks/useTelemetry';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
}

const STEPS: OnboardingStep[] = [
  { id: 1, title: 'Make it yours.', description: 'Pick assets to track' },
  { id: 2, title: 'Track the smart money.', description: 'Follow 2 whales' },
  { id: 3, title: 'Never miss a move.', description: 'Enable alerts' }
];

export function OnboardingWizard() {
  const { hasFlag } = useGate();
  const { track } = useTelemetry();
  const [currentStep, setCurrentStep] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [followedWhales, setFollowedWhales] = useState<string[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('onboardingCompleted');
    if (!completed && hasFlag('onboarding.enabled')) {
      setIsOpen(true);
      track({ event: 'nux_start' });
    }
  }, [hasFlag, track]);

  const completeOnboarding = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    track({ event: 'nux_complete', properties: { 
      assets: selectedAssets.length,
      whales: followedWhales.length,
      alerts: alertsEnabled 
    }});
    setIsOpen(false);
  };

  const nextStep = () => {
    track({ event: `nux_step${currentStep}_complete` });
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  if (!isOpen || !hasFlag('onboarding.enabled')) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex space-x-2">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full ${
                    step.id <= currentStep ? 'bg-teal-500' : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
            <button 
              onClick={completeOnboarding}
              className="text-slate-400 hover:text-white text-sm"
            >
              Skip
            </button>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            {STEPS[currentStep - 1].title}
          </h2>
          <p className="text-slate-400 mb-6">
            {STEPS[currentStep - 1].description}
          </p>

          {currentStep === 1 && (
            <div className="space-y-3">
              {['BTC', 'ETH', 'USDT', 'BNB', 'SOL'].map((asset) => (
                <label key={asset} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAssets.includes(asset)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAssets([...selectedAssets, asset]);
                      } else {
                        setSelectedAssets(selectedAssets.filter(a => a !== asset));
                      }
                    }}
                    className="rounded border-slate-600 bg-slate-700 text-teal-600"
                  />
                  <span className="text-white">{asset}</span>
                </label>
              ))}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-3">
              {['Whale #1234', 'DeFi Whale', 'BTC Maxi'].map((whale) => (
                <div key={whale} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <span className="text-white">{whale}</span>
                  <button
                    onClick={() => {
                      if (followedWhales.includes(whale)) {
                        setFollowedWhales(followedWhales.filter(w => w !== whale));
                      } else {
                        setFollowedWhales([...followedWhales, whale]);
                      }
                    }}
                    className={`px-3 py-1 rounded text-sm ${
                      followedWhales.includes(whale)
                        ? 'bg-teal-600 text-white'
                        : 'border border-slate-600 text-slate-300'
                    }`}
                  >
                    {followedWhales.includes(whale) ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertsEnabled}
                  onChange={(e) => setAlertsEnabled(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-700 text-teal-600"
                />
                <span className="text-white">Send me push notifications</span>
              </label>
              <p className="text-sm text-slate-400">
                Get notified when your followed whales make moves
              </p>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="btn-tertiary disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={nextStep}
              disabled={
                (currentStep === 1 && selectedAssets.length === 0) ||
                (currentStep === 2 && followedWhales.length < 2)
              }
              className="btn-primary disabled:opacity-50"
            >
              {currentStep === 3 ? 'Complete' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}