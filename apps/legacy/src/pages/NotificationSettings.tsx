import { NotificationSettings as NotificationSettingsComponent } from '@/components/NotificationSettings';
import { AlertChannels } from '@/components/AlertChannels';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function NotificationSettings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Notification Settings</h1>
        </div>
        
        <div className="space-y-6 max-w-2xl">
          <NotificationSettingsComponent />
          <AlertChannels />
        </div>
      </div>
    </div>
  );
}