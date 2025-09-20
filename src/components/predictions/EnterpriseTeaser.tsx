import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Shield, Search, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function EnterpriseTeaser() {
  return (
    <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-dashed border-2 border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="h-5 w-5 text-purple-600" />
        <h3 className="font-semibold text-purple-900 dark:text-purple-100">Enterprise-Only Features</h3>
        <Badge className="bg-gradient-to-r from-purple-500 to-blue-500">Coming Soon</Badge>
      </div>
      
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center gap-3 opacity-60">
          <Search className="h-4 w-4 text-purple-600" />
          <div>
            <div className="font-medium text-sm">Forensics Dashboard</div>
            <div className="text-xs text-muted-foreground">Wash trading detection</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 opacity-60">
          <Shield className="h-4 w-4 text-purple-600" />
          <div>
            <div className="font-medium text-sm">Collusion Analysis</div>
            <div className="text-xs text-muted-foreground">Multi-wallet patterns</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 opacity-60">
          <Zap className="h-4 w-4 text-purple-600" />
          <div>
            <div className="font-medium text-sm">Custom API Limits</div>
            <div className="text-xs text-muted-foreground">Unlimited requests</div>
          </div>
        </div>
      </div>
      
      <Button 
        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
        onClick={() => window.location.href = '/subscription'}
      >
        Upgrade to Enterprise
      </Button>
    </Card>
  );
}