/**
 * Microcopy Integration Example
 * 
 * Demonstrates how to integrate the Human Microcopy & Delight Moments system
 * into existing components for wallet connections, quest joining, and scan completion.
 * 
 * This example shows the proper usage patterns for Task 16 implementation.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  celebrateWalletConnection,
  celebrateQuestJoined,
  celebrateScanComplete,
  showWelcomeMessage,
  getEmptyStateMessage,
  humanizeError
} from '@/lib/ux';

interface WalletConnectionExampleProps {
  onConnect?: () => void;
}

export const WalletConnectionExample: React.FC<WalletConnectionExampleProps> = ({ 
  onConnect 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsConnected(true);
      setIsConnecting(false);
      
      // 🎉 Celebrate wallet connection with appropriate message
      celebrateWalletConnection(isFirstTime);
      
      // Show welcome message for returning users
      if (!isFirstTime) {
        showWelcomeMessage({
          isReturningUser: true,
          lastVisit: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
        });
      }
      
      setIsFirstTime(false);
      onConnect?.();
      
    } catch (error) {
      setIsConnecting(false);
      
      // 🤝 Show humanized error message
      const friendlyError = humanizeError(error as Error, 'wallet connection');
      console.error('Connection failed:', friendlyError);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  return (
    <div className="p-6 border rounded-lg space-y-4">
      <h3 className="text-lg font-semibold">Wallet Connection with Celebrations</h3>
      
      <div className="flex items-center gap-4">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
        <span className="text-sm">
          {isConnected ? 'Wallet Connected' : 'Not Connected'}
        </span>
      </div>
      
      <div className="flex gap-2">
        {!isConnected ? (
          <Button 
            onClick={handleConnect}
            disabled={isConnecting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        ) : (
          <Button 
            onClick={handleDisconnect}
            variant="outline"
          >
            Disconnect
          </Button>
        )}
      </div>
    </div>
  );
};

interface QuestJoiningExampleProps {
  questName?: string;
}

export const QuestJoiningExample: React.FC<QuestJoiningExampleProps> = ({ 
  questName = "DeFi Explorer Quest" 
}) => {
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinQuest = async () => {
    setIsJoining(true);
    
    try {
      // Simulate quest joining
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsJoined(true);
      setIsJoining(false);
      
      // 🎯 Celebrate quest joining
      celebrateQuestJoined(questName);
      
    } catch (error) {
      setIsJoining(false);
      
      // Show humanized error
      const friendlyError = humanizeError(error as Error, 'quest joining');
      console.error('Quest join failed:', friendlyError);
    }
  };

  return (
    <div className="p-6 border rounded-lg space-y-4">
      <h3 className="text-lg font-semibold">Quest Joining with Celebrations</h3>
      
      <div className="space-y-2">
        <div className="font-medium">{questName}</div>
        <div className="text-sm text-gray-600">
          Complete this quest to earn rewards and learn about DeFi protocols.
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className={`w-3 h-3 rounded-full ${isJoined ? 'bg-green-500' : 'bg-gray-300'}`} />
        <span className="text-sm">
          {isJoined ? 'Quest Joined' : 'Not Joined'}
        </span>
      </div>
      
      {!isJoined && (
        <Button 
          onClick={handleJoinQuest}
          disabled={isJoining}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isJoining ? 'Joining...' : 'Join Quest'}
        </Button>
      )}
    </div>
  );
};

interface ScanCompletionExampleProps {
  onScan?: () => void;
}

export const ScanCompletionExample: React.FC<ScanCompletionExampleProps> = ({ 
  onScan 
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResults, setLastScanResults] = useState<number | null>(null);

  const handleScan = async () => {
    setIsScanning(true);
    
    try {
      // Simulate security scan
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Random number of risks found (0-3)
      const risksFound = Math.floor(Math.random() * 4);
      setLastScanResults(risksFound);
      setIsScanning(false);
      
      // 🛡️ Celebrate scan completion
      celebrateScanComplete(risksFound);
      
      onScan?.();
      
    } catch (error) {
      setIsScanning(false);
      
      // Show humanized error
      const friendlyError = humanizeError(error as Error, 'security scan');
      console.error('Scan failed:', friendlyError);
    }
  };

  return (
    <div className="p-6 border rounded-lg space-y-4">
      <h3 className="text-lg font-semibold">Security Scan with Celebrations</h3>
      
      <div className="space-y-2">
        <div className="text-sm text-gray-600">
          Run a comprehensive security scan on your wallet to detect potential risks.
        </div>
        
        {lastScanResults !== null && (
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              lastScanResults === 0 ? 'bg-green-500' : 
              lastScanResults <= 2 ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-sm">
              Last scan: {lastScanResults === 0 ? 'No risks detected' : `${lastScanResults} risk${lastScanResults > 1 ? 's' : ''} found`}
            </span>
          </div>
        )}
      </div>
      
      <Button 
        onClick={handleScan}
        disabled={isScanning}
        className="bg-green-600 hover:bg-green-700"
      >
        {isScanning ? 'Scanning...' : 'Run Security Scan'}
      </Button>
    </div>
  );
};

interface EmptyStateExampleProps {
  context: 'opportunities' | 'risks' | 'quests' | 'portfolio' | 'alerts' | 'history';
  isFirstTime?: boolean;
  hasFilters?: boolean;
}

export const EmptyStateExample: React.FC<EmptyStateExampleProps> = ({ 
  context,
  isFirstTime = false,
  hasFilters = false 
}) => {
  const emptyStateMessage = getEmptyStateMessage({
    context,
    isFirstTime,
    hasFilters
  });

  return (
    <div className="p-8 text-center border rounded-lg space-y-4">
      <div className="text-6xl mb-4">
        {context === 'opportunities' && '💎'}
        {context === 'risks' && '🛡️'}
        {context === 'quests' && '🎯'}
        {context === 'portfolio' && '📊'}
        {context === 'alerts' && '🔔'}
        {context === 'history' && '📜'}
      </div>
      
      <h3 className="text-xl font-semibold">{emptyStateMessage.title}</h3>
      <p className="text-gray-600 max-w-md mx-auto">{emptyStateMessage.description}</p>
      
      {emptyStateMessage.actionText && (
        <div className="space-y-2">
          <Button className="bg-blue-600 hover:bg-blue-700">
            {emptyStateMessage.actionText}
          </Button>
          {emptyStateMessage.actionHint && (
            <p className="text-sm text-gray-500">{emptyStateMessage.actionHint}</p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Complete integration example showing all microcopy features
 */
export const MicrocopyIntegrationExample: React.FC = () => {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Human Microcopy & Delight Moments</h2>
        <p className="text-gray-600 mb-8">
          Examples of how to integrate celebration states, humanized errors, and encouraging copy.
        </p>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2">
        <WalletConnectionExample />
        <QuestJoiningExample />
        <ScanCompletionExample />
        <EmptyStateExample context="opportunities" isFirstTime={true} />
      </div>
      
      <div className="grid gap-8 md:grid-cols-3">
        <EmptyStateExample context="risks" />
        <EmptyStateExample context="quests" hasFilters={true} />
        <EmptyStateExample context="history" isFirstTime={true} />
      </div>
    </div>
  );
};

export default MicrocopyIntegrationExample;