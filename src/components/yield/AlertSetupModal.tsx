import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Plus } from "lucide-react";
import { toast } from "sonner";

interface AlertSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  protocol?: unknown;
}

export const AlertSetupModal: React.FC<AlertSetupModalProps> = ({
  isOpen,
  onClose,
  protocol
}) => {
  const [alertType, setAlertType] = useState('apy');
  const [condition, setCondition] = useState('above');
  const [value, setValue] = useState('');

  const handleCreateAlert = () => {
    if (!value) {
      toast.error('Please enter a value for the alert');
      return;
    }

    const alertData = {
      protocol: protocol?.protocol || 'All Protocols',
      type: alertType,
      condition,
      value: parseFloat(value),
      created: new Date().toISOString()
    };

    // Store in localStorage for demo
    const existingAlerts = JSON.parse(localStorage.getItem('yieldAlerts') || '[]');
    existingAlerts.push(alertData);
    localStorage.setItem('yieldAlerts', JSON.stringify(existingAlerts));

    toast.success('Alert created successfully!');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Create Yield Alert
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Protocol</Label>
            <Input 
              value={protocol?.protocol || 'All Protocols'} 
              disabled 
              className="bg-muted"
            />
          </div>

          <div>
            <Label>Alert Type</Label>
            <Select value={alertType} onValueChange={setAlertType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apy">APY Change</SelectItem>
                <SelectItem value="risk">Risk Score Change</SelectItem>
                <SelectItem value="tvl">TVL Change</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Condition</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">Above</SelectItem>
                  <SelectItem value="below">Below</SelectItem>
                  <SelectItem value="changes">Changes by</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Value</Label>
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={alertType === 'apy' ? '15' : alertType === 'risk' ? '50' : '1000000'}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCreateAlert} className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Create Alert
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};