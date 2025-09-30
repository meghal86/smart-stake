import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Shield, Zap } from 'lucide-react';

export function EnterpriseCTAStrip() {
  return (
    <Card className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-orange-600" />
            <span className="font-semibold text-orange-900">Enterprise Features</span>
          </div>
          
          <div className="hidden md:flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-orange-600" />
              <span className="text-orange-800">Forensic Analysis</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-orange-600" />
              <span className="text-orange-800">Collusion Detection</span>
            </div>
            <div className="flex items-center gap-1">
              <Crown className="h-4 w-4 text-orange-600" />
              <span className="text-orange-800">Custom API</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-orange-300 text-orange-700">
            30-day accuracy: 94.2%
          </Badge>
          <Button 
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
            onClick={() => window.location.href = '/subscription'}
          >
            Upgrade to Enterprise
          </Button>
        </div>
      </div>
    </Card>
  );
}