import React, { useState, useEffect } from 'react';
import PortfolioLayout from '@/components/layouts/PortfolioLayout';
import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader';
import { GuardianWidget } from '@/components/portfolio/GuardianWidget';
import { ExportProofModal } from '@/components/portfolio/ExportProofModal';
import { usePortfolioSummary } from '@/hooks/portfolio/usePortfolioSummary';
import { useGuardian } from '@/hooks/portfolio/useGuardian';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { Download, Share, Shield, CheckCircle } from 'lucide-react';
import { useUIMode } from '@/store/uiMode';
import Hub2Layout from '@/components/hub2/Hub2Layout';
import LegendaryLayout from '@/components/ui/LegendaryLayout';
import { motion, AnimatePresence } from 'framer-motion';

export default function Guardian() {
  const { data: summary } = usePortfolioSummary();
  const { data: guardian, refresh, isLoading } = useGuardian();
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const { mode } = useUIMode() || { mode: 'novice' };
  
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.classList.remove("dark", "pro");
    if (savedTheme === "dark") document.documentElement.classList.add("dark");
    if (savedTheme === "pro") document.documentElement.classList.add("dark", "pro");
  }, []);

  useEffect(() => {
    if (!isLoading && guardian) {
      setScanComplete(true);
      setTimeout(() => setScanComplete(false), 3000);
    }
  }, [isLoading, guardian]);

  const handleScan = async () => {
    setScanComplete(false);
    await refresh();
  };

  const handleShareProof = () => {
    setShowShareModal(true);
  };

  const copyProofLink = () => {
    const proofData = {
      trustScore: guardian?.trust || 0,
      flags: guardian?.flags?.length || 0,
      timestamp: new Date().toISOString()
    };
    navigator.clipboard.writeText(`AlphaWhale Guardian Proof: ${proofData.trustScore}% Trust Score - ${window.location.origin}/proof/${btoa(JSON.stringify(proofData))}`);
  };

  return (
    <LegendaryLayout mode={mode}>
      <Hub2Layout>
        <PortfolioLayout>
          <div style={{ 
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 24px'
          }}>
            {/* Ocean Scan Overlay */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="text-center space-y-4">
                    <motion.div
                      className="relative w-32 h-32 mx-auto"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                      <div className="absolute inset-2 border-4 border-primary/40 rounded-full" />
                      <div className="absolute inset-4 border-4 border-primary rounded-full" />
                      <Shield className="absolute inset-0 m-auto h-8 w-8 text-primary" />
                    </motion.div>
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <h3 className="text-lg font-semibold">Guardian Scanning...</h3>
                      <p className="text-sm text-muted-foreground">Analyzing portfolio security</p>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <PortfolioHeader summary={summary} />
              
              {/* Scan Complete Banner */}
              <AnimatePresence>
                {scanComplete && guardian && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className="p-4 bg-gradient-to-r from-green-500/10 to-primary/10 border border-green-500/20 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5 }}
                      >
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </motion.div>
                      <div>
                        <p className="font-medium text-green-700">
                          Your portfolio is {guardian.trust}% trusted after Guardian scan.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Security flags detected: {guardian.flags?.map(f => `${f.type.toUpperCase()} (${f.severity})`).join(', ') || 'None'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="grid gap-6 lg:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <GuardianWidget
                    trustScore={guardian?.trust || 0}
                    flags={guardian?.flags || []}
                    scanTimestamp={new Date(guardian?.lastScan || Date.now())}
                    isScanning={isLoading}
                    onRescan={handleScan}
                  />
                </motion.div>
                
                <motion.div 
                  className="space-y-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="p-6 bg-gradient-to-br from-background to-muted/20">
                    <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                      Export & Share Proof
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Generate cryptographic proofs and share your portfolio's security status.
                    </p>
                    
                    <div className="space-y-3">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button 
                          onClick={() => setShowExportModal(true)}
                          className="w-full bg-gradient-to-r from-primary to-primary/80"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export Compliance Proof
                        </Button>
                      </motion.div>
                      
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button 
                          onClick={handleShareProof}
                          variant="outline"
                          className="w-full border-primary/20 hover:bg-primary/5"
                        >
                          <Share className="h-4 w-4 mr-2" />
                          Share Proof
                        </Button>
                      </motion.div>
                    </div>
                    
                    <motion.div 
                      className="mt-6 p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        Last Scan Results
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Trust Score:</span>
                          <motion.span 
                            className="font-medium text-primary"
                            animate={{ scale: scanComplete ? [1, 1.1, 1] : 1 }}
                          >
                            {guardian?.trust || 0}%
                          </motion.span>
                        </div>
                        <div className="flex justify-between">
                          <span>Security Flags:</span>
                          <span className="font-medium">{guardian?.flags?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Updated:</span>
                          <span className="font-medium">
                            {guardian?.lastScan ? new Date(guardian.lastScan).toLocaleTimeString() : 'Never'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </Card>
                </motion.div>
              </div>

              {/* Dynamic Flagged Events */}
              {guardian?.flags && guardian.flags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Security Flags Detected</h3>
                    <div className="space-y-3">
                      {guardian.flags.map((flag, index) => (
                        <motion.div
                          key={flag.type}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 + index * 0.1 }}
                          className="border border-muted rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <motion.div
                                animate={{ 
                                  scale: [1, 1.2, 1],
                                  opacity: [0.7, 1, 0.7]
                                }}
                                transition={{ 
                                  duration: 2, 
                                  repeat: Infinity,
                                  delay: index * 0.5
                                }}
                              >
                                <div className={`w-3 h-3 rounded-full ${
                                  flag.severity === 'high' ? 'bg-red-500' :
                                  flag.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                }`} />
                              </motion.div>
                              <div>
                                <p className="font-medium">{flag.type.toUpperCase()}</p>
                                <p className="text-sm text-muted-foreground">
                                  {flag.count} occurrence{flag.count > 1 ? 's' : ''} • {flag.severity} severity
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

            </motion.div>

            {/* Export Proof Modal */}
            <ExportProofModal
              isOpen={showExportModal}
              onClose={() => setShowExportModal(false)}
              portfolioData={{
                totalValue: summary?.totalValue || 0,
                riskScore: summary?.riskScore || 0,
                trustScore: guardian?.trust || 0,
                timestamp: new Date(),
                guardianFlags: guardian?.flags || [],
                dataLineage: []
              }}
            />

            {/* Share Proof Modal */}
            <AnimatePresence>
              {showShareModal && (
                <motion.div
                  className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowShareModal(false)}
                >
                  <motion.div
                    className="bg-background border border-border rounded-lg p-6 max-w-md w-full"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-center space-y-4">
                      <motion.div
                        className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <Shield className="h-8 w-8 text-primary" />
                      </motion.div>
                      
                      <div>
                        <h3 className="text-lg font-semibold">Guardian Proof</h3>
                        <p className="text-sm text-muted-foreground">
                          Trust Score: {guardian?.trust || 0}% • {guardian?.flags?.length || 0} Flags
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button onClick={copyProofLink} className="flex-1">
                          Copy Link
                        </Button>
                        <Button variant="outline" onClick={() => setShowShareModal(false)} className="flex-1">
                          Close
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </PortfolioLayout>
      </Hub2Layout>
    </LegendaryLayout>
  );
}