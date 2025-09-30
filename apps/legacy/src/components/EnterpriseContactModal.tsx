import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { useEnterpriseLead } from '@/hooks/useEnterpriseLead';
import { analytics } from '@/lib/analytics';

interface EnterpriseContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EnterpriseContactModal: React.FC<EnterpriseContactModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
    company_size: '',
    use_case: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { saveEnterpriseLead } = useEnterpriseLead();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.company) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await saveEnterpriseLead(formData);
      analytics.track('enterprise_lead_submitted', {
        company_size: formData.company_size,
        use_case: formData.use_case
      });
      toast({
        title: "Thank you!",
        description: "We'll contact you within 24 hours to discuss your Enterprise needs.",
      });
      setFormData({ name: '', email: '', company: '', message: '', company_size: '', use_case: [] });
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit your request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUseCaseChange = (useCase: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      use_case: checked 
        ? [...prev.use_case, useCase]
        : prev.use_case.filter(uc => uc !== useCase)
    }));
  };

  const companySizes = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '200+', label: '200+ employees' }
  ];

  const useCases = [
    { value: 'trading', label: 'Trading' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'research', label: 'Research' },
    { value: 'reporting', label: 'Reporting' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact Enterprise Sales</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="your.email@company.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="company">Company *</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
              placeholder="Your company name"
              required
            />
          </div>
          <div>
            <Label htmlFor="company-size">Company Size *</Label>
            <Select value={formData.company_size} onValueChange={(value) => handleChange('company_size', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select company size" />
              </SelectTrigger>
              <SelectContent>
                {companySizes.map(size => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Use Case (select all that apply) *</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {useCases.map(useCase => (
                <div key={useCase.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={useCase.value}
                    checked={formData.use_case.includes(useCase.value)}
                    onCheckedChange={(checked) => handleUseCaseChange(useCase.value, checked as boolean)}
                  />
                  <Label htmlFor={useCase.value} className="text-sm">
                    {useCase.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Tell us about your requirements..."
              rows={3}
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Submitting...' : 'Contact Sales'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};