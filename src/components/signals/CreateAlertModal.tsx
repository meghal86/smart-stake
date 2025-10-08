/**
 * CreateAlertModal - Frictionless alert creation with Tesla × Airbnb × Robinhood × Perplexity DNA
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertPreview } from './AlertPreview';
import { AlertHistory } from './AlertHistory';
import { Bell, Check, Smartphone, Mail, Settings, Sparkles } from 'lucide-react';
import { PhaseDTelemetry } from '@/lib/phase-d-telemetry';
import type { Signal } from '@/types/signal';

interface CreateAlertModalProps {
  signal: Signal | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateAlertModal({ signal, isOpen, onClose, onSuccess }: CreateAlertModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    asset: '',
    direction: 'inflow' as 'inflow' | 'outflow',
    threshold: '',
    timeframe: '24h',
    pushEnabled: true,
    emailEnabled: false,
    customMessage: ''
  });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (isOpen && signal) {
      // Pre-fill from signal
      setFormData({
        asset: signal.asset,
        direction: signal.direction,
        threshold: (signal.amountUsd * 0.8 / 1e6).toFixed(0),
        timeframe: '24h',
        pushEnabled: true,
        emailEnabled: false,
        customMessage: `Alert when > $${(signal.amountUsd * 0.8 / 1e6).toFixed(0)}M ${signal.direction} for ${signal.asset}`
      });
      setIsSuccess(false);
      
      PhaseDTelemetry.trackQuickAction({
        action: 'create_alert',
        asset: signal.asset,
        context: 'alert_modal'
      });
    }
  }, [isOpen, signal]);

  const handleCreate = async () => {
    setIsCreating(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    setIsCreating(false);
    setIsSuccess(true);
    
    // Auto-close after success animation
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 2000);
  };

  if (!signal) return null;

  const formatAmount = (amount: number) => {
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}B`;
    return `$${amount.toFixed(0)}M`;
  };

  const recommendations = [
    'Users who set similar alerts also track portfolio changes',
    'Consider setting up email backup for critical alerts',
    'Most effective alerts use 80% of original signal threshold'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[var(--brand-teal,#14B8A6)]" />
            Create Smart Alert
            {isSuccess && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 text-emerald-600"
              >
                <Check className="h-4 w-4" />
                <span className="text-sm">Created!</span>
              </motion.div>
            )}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={!reducedMotion ? { opacity: 0, scale: 0.9 } : { opacity: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={!reducedMotion ? { opacity: 0, scale: 0.9 } : {}}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <motion.div
                initial={!reducedMotion ? { scale: 0 } : { scale: 1 }}
                animate={{ scale: 1 }}
                transition={!reducedMotion ? { delay: 0.2, type: "spring", stiffness: 200 } : { duration: 0 }}
                className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4"
              >
                <Check className="h-8 w-8 text-emerald-600" />
              </motion.div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Alert Created Successfully!
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                You'll be notified when similar {signal.asset} movements occur
              </p>
              <Badge className="bg-[var(--brand-teal,#14B8A6)]/10 text-[var(--brand-teal,#14B8A6)]">
                Active in ~30 seconds
              </Badge>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={!reducedMotion ? { opacity: 0, y: 20 } : { opacity: 1 }}
              animate={{ opacity: 1, y: 0 }}
              exit={!reducedMotion ? { opacity: 0, y: -20 } : {}}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Section */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Alert Configuration */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4 text-slate-900 dark:text-slate-100">
                        Alert Configuration
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label htmlFor="asset">Asset</Label>
                          <Select value={formData.asset} onValueChange={(v) => setFormData({...formData, asset: v})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                              <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                              <SelectItem value="USDT">Tether (USDT)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="direction">Direction</Label>
                          <Select value={formData.direction} onValueChange={(v) => setFormData({...formData, direction: v as any})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="inflow">Inflow (Accumulation)</SelectItem>
                              <SelectItem value="outflow">Outflow (Distribution)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label htmlFor="threshold">Threshold (Million USD)</Label>
                          <Input
                            id="threshold"
                            type="number"
                            value={formData.threshold}
                            onChange={(e) => setFormData({...formData, threshold: e.target.value})}
                            placeholder="100"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="timeframe">Time Window</Label>
                          <Select value={formData.timeframe} onValueChange={(v) => setFormData({...formData, timeframe: v})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1h">1 Hour</SelectItem>
                              <SelectItem value="24h">24 Hours</SelectItem>
                              <SelectItem value="7d">7 Days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="message">Custom Message (Optional)</Label>
                        <Input
                          id="message"
                          value={formData.customMessage}
                          onChange={(e) => setFormData({...formData, customMessage: e.target.value})}
                          placeholder="Custom alert message..."
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notification Settings */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4 text-slate-900 dark:text-slate-100">
                        Notification Channels
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Smartphone className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            <div>
                              <div className="font-medium text-slate-900 dark:text-slate-100">Push Notifications</div>
                              <div className="text-xs text-slate-600 dark:text-slate-400">Instant mobile alerts</div>
                            </div>
                          </div>
                          <Switch
                            checked={formData.pushEnabled}
                            onCheckedChange={(checked) => setFormData({...formData, pushEnabled: checked})}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            <div>
                              <div className="font-medium text-slate-900 dark:text-slate-100">Email Backup</div>
                              <div className="text-xs text-slate-600 dark:text-slate-400">Reliable email delivery</div>
                            </div>
                          </div>
                          <Switch
                            checked={formData.emailEnabled}
                            onCheckedChange={(checked) => setFormData({...formData, emailEnabled: checked})}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Smart Recommendations */}
                  <Card className="bg-gradient-to-r from-[var(--brand-teal,#14B8A6)]/5 to-transparent border-l-4 border-l-[var(--brand-teal,#14B8A6)]">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-[var(--brand-teal,#14B8A6)] mt-0.5" />
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                            Smart Recommendations
                          </h4>
                          <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                            {recommendations.map((rec, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <div className="w-1 h-1 bg-[var(--brand-teal,#14B8A6)] rounded-full mt-2 flex-shrink-0"></div>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Preview & History */}
                <div className="space-y-4">
                  <AlertPreview 
                    formData={formData}
                    signal={signal}
                  />
                  
                  <AlertHistory 
                    asset={formData.asset}
                    threshold={Number(formData.threshold)}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !formData.threshold}
                  className="flex-1 bg-[var(--brand-teal,#14B8A6)] hover:bg-[var(--brand-teal,#14B8A6)]/90 text-white"
                >
                  {isCreating ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                  ) : (
                    <Bell className="h-4 w-4 mr-2" />
                  )}
                  {isCreating ? 'Creating Alert...' : 'Create Alert'}
                </Button>
                
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  My Alerts
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}