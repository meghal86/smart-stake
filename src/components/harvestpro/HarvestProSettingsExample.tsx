/**
 * HarvestPro Settings Form Example
 * 
 * Demonstrates real-time validation features for HarvestPro settings
 * Requirements: Enhanced Req 6 AC1-3 (immediate validation, clear messages)
 */

import React, { useState } from 'react';
import { HarvestProSettingsForm } from './HarvestProSettingsForm';
import { HarvestUserSettings } from '@/types/harvestpro';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';

const EXAMPLE_SCENARIOS = {
  valid: {
    name: 'Valid Settings',
    description: 'All fields have valid values',
    settings: {
      userId: 'user-123',
      taxRate: 0.24,
      notificationsEnabled: true,
      notificationThreshold: 250,
      preferredWallets: ['0x742d35Cc6634C0532925a3b8D4C9db96590b5b8c'],
      riskTolerance: 'moderate' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },
  invalid: {
    name: 'Invalid Settings',
    description: 'Contains validation errors to demonstrate real-time feedback',
    settings: {
      userId: 'user-123',
      taxRate: 1.5, // Invalid: > 100%
      notificationsEnabled: true,
      notificationThreshold: 25, // Invalid: < $50 minimum
      preferredWallets: ['invalid-address', '0x742d35Cc6634C0532925a3b8D4C9db96590b5b8c'],
      riskTolerance: 'moderate' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },
  empty: {
    name: 'Empty Form',
    description: 'Start with default values',
    settings: undefined
  }
};

export function HarvestProSettingsExample() {
  const [currentScenario, setCurrentScenario] = useState<keyof typeof EXAMPLE_SCENARIOS>('valid');
  const [saveCount, setSaveCount] = useState(0);
  const [lastSavedData, setLastSavedData] = useState<any>(null);

  const handleSave = async (data: any) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSaveCount(prev => prev + 1);
    setLastSavedData(data);
    
    console.log('Settings saved:', data);
  };

  const currentSettings = EXAMPLE_SCENARIOS[currentScenario].settings;

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Settings className="w-8 h-8" />
          HarvestPro Settings Form
        </h1>
        <p className="text-muted-foreground">
          Real-time validation demonstration with immediate feedback and character counters
        </p>
      </div>

      {/* Scenario Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Test Scenarios
          </CardTitle>
          <CardDescription>
            Try different scenarios to see real-time validation in action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(EXAMPLE_SCENARIOS).map(([key, scenario]) => (
              <Button
                key={key}
                variant={currentScenario === key ? 'default' : 'outline'}
                onClick={() => setCurrentScenario(key as keyof typeof EXAMPLE_SCENARIOS)}
                className="flex items-center gap-2"
              >
                {key === 'valid' && <CheckCircle2 className="w-4 h-4" />}
                {key === 'invalid' && <AlertCircle className="w-4 h-4" />}
                {key === 'empty' && <RotateCcw className="w-4 h-4" />}
                {scenario.name}
              </Button>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 text-blue-500" />
              <div>
                <p className="font-medium">{EXAMPLE_SCENARIOS[currentScenario].name}</p>
                <p className="text-sm text-muted-foreground">
                  {EXAMPLE_SCENARIOS[currentScenario].description}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Features Info */}
      <Card>
        <CardHeader>
          <CardTitle>Real-Time Validation Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Immediate Feedback</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Validation on blur (when field loses focus)</li>
                <li>• Re-validation on every change</li>
                <li>• Visual indicators (green/red borders)</li>
                <li>• Success/error icons</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Character Counters</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Real-time character counting</li>
                <li>• Warning when approaching limits</li>
                <li>• Color-coded feedback</li>
                <li>• Wallet address validation</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Clear Messages</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Descriptive error messages</li>
                <li>• Helpful tooltips and hints</li>
                <li>• Form status indicators</li>
                <li>• Success confirmations</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Smart Validation</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Range validation (tax rate 10-50%)</li>
                <li>• Format validation (wallet addresses)</li>
                <li>• Business logic validation</li>
                <li>• Contextual help text</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Form */}
      <HarvestProSettingsForm
        key={currentScenario} // Force re-render when scenario changes
        initialSettings={currentSettings}
        onSave={handleSave}
      />

      {/* Save Status */}
      {saveCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Save Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600">
                  Saved {saveCount} time{saveCount !== 1 ? 's' : ''}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Last saved: {new Date().toLocaleTimeString()}
                </span>
              </div>
              
              {lastSavedData && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium">
                    View Last Saved Data
                  </summary>
                  <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto">
                    {JSON.stringify(lastSavedData, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Try These Validation Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Tax Rate Field:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Enter a value over 1.0 (100%) to see error</li>
                <li>• Enter a negative value to see validation</li>
                <li>• Try values outside 10-50% range for warnings</li>
                <li>• Watch the percentage display update in real-time</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Notification Threshold:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Enter a value below $50 to see minimum validation</li>
                <li>• Enter a very large value (&gt;$100,000) to see maximum</li>
                <li>• Watch the currency formatting update</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Preferred Wallets:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Enter invalid wallet addresses to see format validation</li>
                <li>• Add more than 10 addresses to see limit validation</li>
                <li>• Watch the wallet counter update</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}