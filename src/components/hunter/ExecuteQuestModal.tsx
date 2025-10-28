import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Shield,
  Zap,
  Sparkles
} from 'lucide-react';

interface Opportunity {
  id: string;
  type: 'Airdrop' | 'Staking' | 'NFT' | 'Quest';
  title: string;
  description: string;
  reward: string;
  confidence: number;
  duration: string;
  guardianScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  chain?: string;
  protocol?: string;
  estimatedAPY?: number;
}

interface ExecuteQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: Opportunity | null;
}

const steps = [
  { id: 'connect', label: 'Connect', icon: Shield },
  { id: 'review', label: 'Review', icon: Clock },
  { id: 'execute', label: 'Execute', icon: Zap },
  { id: 'claim', label: 'Claim', icon: Sparkles }
];

export function ExecuteQuestModal({ isOpen, onClose, opportunity }: ExecuteQuestModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  if (!opportunity) return null;

  const handleExecute = async () => {
    setIsExecuting(true);
    
    // Simulate execution steps
    for (let i = 0; i <= 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setCurrentStep(i);
    }
    
    setIsExecuting(false);
    setIsComplete(true);
    
    // Auto-close after success animation
    setTimeout(() => {
      onClose();
      setCurrentStep(0);
      setIsComplete(false);
    }, 3000);
  };

  const handleClose = () => {
    if (!isExecuting) {
      onClose();
      setCurrentStep(0);
      setIsComplete(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-white/5 backdrop-blur-[12px] rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.4)' }}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-display gradient-text">
                Execute Quest
              </h2>
              {!isExecuting && (
                <motion.button
                  onClick={handleClose}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5 text-gray-400" />
                </motion.button>
              )}
            </div>

            {/* Opportunity Info */}
            <div className="bg-white/10 rounded-2xl p-4 mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                {opportunity.title}
              </h3>
              <p className="text-sm text-gray-400 mb-3">
                {opportunity.description}
              </p>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#00F5A0]" />
                  <span className="text-white font-medium">{opportunity.reward}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">Guardian {opportunity.guardianScore}/10</span>
                </div>
              </div>
            </div>

            {/* Stepper */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep || isComplete;
                  
                  return (
                    <div key={step.id} className="flex flex-col items-center">
                      <motion.div
                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                          isCompleted
                            ? 'bg-gradient-to-r from-[#00F5A0] to-[#7B61FF]'
                            : isActive
                            ? 'bg-gradient-to-r from-[#00F5A0] to-[#7B61FF]'
                            : 'bg-white/10'
                        }`}
                        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 0.5, repeat: isActive ? Infinity : 0 }}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6 text-white" />
                        ) : (
                          <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                        )}
                      </motion.div>
                      
                      <span className={`text-xs font-medium ${
                        isCompleted || isActive ? 'text-white' : 'text-gray-500'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#00F5A0] to-[#7B61FF]"
                  initial={{ width: '0%' }}
                  animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Step Content */}
            <div className="mb-8">
              {currentStep === 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-center"
                >
                  <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Connect Wallet</h3>
                  <p className="text-sm text-gray-400">
                    Connect your wallet to participate in this quest
                  </p>
                </motion.div>
              )}

              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-center"
                >
                  <Clock className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Review Details</h3>
                  <p className="text-sm text-gray-400">
                    Reviewing quest requirements and estimated fees
                  </p>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-center"
                >
                  <Zap className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Executing Quest</h3>
                  <p className="text-sm text-gray-400">
                    Processing your quest participation...
                  </p>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-white mb-2">Quest Complete!</h3>
                  <p className="text-sm text-gray-400">
                    Your rewards will be available for claim soon
                  </p>
                </motion.div>
              )}
            </div>

            {/* Fee Summary */}
            {!isComplete && (
              <div className="bg-white/10 rounded-xl p-4 mb-6">
                <h4 className="text-sm font-medium text-white mb-3">Fee Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network Fee</span>
                    <span className="text-white">~$2.50</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Protocol Fee</span>
                    <span className="text-white">$0.00</span>
                  </div>
                  <div className="border-t border-white/10 pt-2 flex justify-between font-medium">
                    <span className="text-white">Total</span>
                    <span className="text-white">~$2.50</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Button */}
            {!isComplete && (
              <motion.button
                onClick={handleExecute}
                disabled={isExecuting}
                className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 ${
                  isExecuting
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] hover:shadow-lg'
                }`}
                whileHover={!isExecuting ? { scale: 1.02 } : {}}
                whileTap={!isExecuting ? { scale: 0.98 } : {}}
              >
                {isExecuting ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Executing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    Execute Quest
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </motion.button>
            )}

            {/* Success State */}
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                  className="w-16 h-16 bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">Quest Completed!</h3>
                <p className="text-sm text-gray-400">
                  Congratulations! Your quest has been successfully executed.
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}