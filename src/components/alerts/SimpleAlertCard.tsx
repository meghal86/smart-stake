import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, Zap } from 'lucide-react';

export const SimpleAlertCard = () => {
  const [showAlert, setShowAlert] = useState(false);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Alert Center</h3>
        </div>
      </div>

      <div className="space-y-3">
        <Button 
          onClick={() => alert('Custom Alert System Coming Soon!')} 
          className="w-full" 
          size="sm"
        >
          <Zap className="h-4 w-4 mr-2" />
          Create Custom Alert
        </Button>
      </div>
    </Card>
  );
};