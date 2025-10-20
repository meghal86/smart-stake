import { useState } from 'react';
import { motion } from 'framer-motion';
import LegendaryLayout from '@/components/ui/LegendaryLayout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { useHunterFeed } from '@/hooks/useHunterFeed';
import type { Quest, ActionSummary } from '@/types/hunter';
import Hub2BottomNav from '@/components/hub2/Hub2BottomNav';
import '@/styles/hunter-theme.css';

export default function Hunter() {
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [actionSummary, setActionSummary] = useState<ActionSummary | null>(null);
  const [isActionModalOpen, setActionModalOpen] = useState(false);
  const [isExecuting, setExecuting] = useState(false);
  const [showAllOpportunities, setShowAllOpportunities] = useState(false);

  const { data: quests = [], isLoading } = useHunterFeed();

  const handleGetQuest = async (quest: Quest) => {
    setSelectedQuest(quest);
    
    const summary: ActionSummary = {
      questId: quest.id,
      steps: [
        'Bridge $10 to Base network',
        'Approve token spending',
        'Stake tokens in protocol'
      ],
      fees: 1.15,
      guardianVerified: true,
      estimatedTime: quest.estimatedTime
    };
    
    setActionSummary(summary);
    setActionModalOpen(true);
  };

  const handleExecuteQuest = async () => {
    if (!selectedQuest) return;
    
    setExecuting(true);
    
    setTimeout(() => {
      setExecuting(false);
      setActionModalOpen(false);
      setSelectedQuest(null);
      setActionSummary(null);
    }, 3000);
  };

  const activeQuests = [
    {
      id: 'gamma',
      name: 'GammaFi',
      description: 'Collect XGAM rewards',
      type: 'Staking platform',
      timeLeft: '5 days left'
    },
    {
      id: 'orcana',
      name: 'Orcana',
      description: 'Mint exclusive NFT',
      type: 'NFT collection',
      timeLeft: '10 days left'
    }
  ];

  return (
    <div className="hunter-screen">
      <main className="hunter-container">
        {/* Header */}
        <motion.header
          className="hunter-header"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="hunter-title">Hunter</h1>
          <p className="hunter-subtitle">Opportunity feed</p>
        </motion.header>

        {/* Featured Quest Card */}
        <motion.section
          className="featured-quest"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {!isLoading && quests.length > 0 && (
            <div className="quest-card-main">
              <div className="quest-header">
                <div className="quest-badge">
                  <div className="quest-dot"></div>
                  <span>Airdrop quest</span>
                </div>
                <Button
                  onClick={() => handleGetQuest(quests[0])}
                  className="claim-button"
                >
                  Claim quest
                </Button>
              </div>
              
              <div className="quest-title-row">
                <h2 className="quest-found">Quest FOUND</h2>
                <ChevronRight className="quest-arrow" />
              </div>
              
              <h3 className="protocol-name">"{quests[0].protocol}"</h3>
              
              <p className="quest-description">Secure the token</p>
              
              <div className="quest-meta">
                <span>7 min ago</span>
                <span>•</span>
                <span>Guardian gFi</span>
                <span>•</span>
              </div>
            </div>
          )}
        </motion.section>

        {/* Active Quests Section */}
        <motion.section
          className="active-quests-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="section-header">
            <h2 className="section-title">Active quests</h2>
            <Button
              variant="ghost"
              onClick={() => setShowAllOpportunities(true)}
              className="all-opportunities-btn"
            >
              ALL OPPORTUNITIES
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          <div className="active-quests-grid">
            {activeQuests.map((quest, index) => (
              <motion.div
                key={quest.id}
                className="active-quest-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <h3 className="active-quest-name">{quest.name}</h3>
                <p className="active-quest-desc">{quest.description}</p>
                <div className="active-quest-meta">
                  <span>{quest.type}</span>
                  <span>{quest.timeLeft}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </main>

      {/* Action Modal */}
      <Dialog open={isActionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="hunter-modal">
          <DialogHeader>
            <DialogTitle className="modal-title">Execute Quest</DialogTitle>
            <DialogDescription className="modal-desc">
              Review the quest execution plan before proceeding.
            </DialogDescription>
          </DialogHeader>

          {actionSummary && (
            <div className="modal-content">
              <div className="execution-steps">
                <h4 className="steps-title">Execution Steps:</h4>
                <div className="steps-list">
                  {actionSummary.steps.map((step, index) => (
                    <div key={index} className="step-item">
                      <div className="step-number">{index + 1}</div>
                      <span className="step-text">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleExecuteQuest}
                disabled={isExecuting}
                className="execute-button"
              >
                {isExecuting ? (
                  <>
                    <motion.div
                      className="loading-spinner"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    Executing Quest...
                  </>
                ) : (
                  <>
                    Execute Quest
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* All Opportunities Modal */}
      <Dialog open={showAllOpportunities} onOpenChange={setShowAllOpportunities}>
        <DialogContent className="opportunities-modal">
          <DialogHeader>
            <DialogTitle className="modal-title">All Opportunities</DialogTitle>
            <DialogDescription className="modal-desc">
              Browse all available quests and opportunities.
            </DialogDescription>
          </DialogHeader>

          <div className="opportunities-grid">
            {quests.map((quest) => (
              <div key={quest.id} className="opportunity-card">
                <div className="opportunity-badge">
                  <div className="quest-dot"></div>
                  <span>{quest.category}</span>
                </div>
                <h3 className="opportunity-title">{quest.protocol}</h3>
                <p className="opportunity-reward">Reward: ${quest.rewardUSD.toLocaleString()}</p>
                <Button
                  onClick={() => {
                    handleGetQuest(quest);
                    setShowAllOpportunities(false);
                  }}
                  className="opportunity-claim-btn"
                >
                  Claim Quest
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Hub2BottomNav />
    </div>
  );
}