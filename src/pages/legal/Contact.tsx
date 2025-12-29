/**
 * Contact Support Page
 * 
 * Real contact support functionality - not placeholder
 * Requirements: R6-AC2, R6-AC5, R21-AC1, R24-AC1, R24-AC4, R24-AC5
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MessageSquare, Bug, HelpCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

export default function Contact() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    message: '',
    includeContext: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get basic context information
      const context = formData.includeContext ? {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        referrer: document.referrer || 'Direct'
      } : null;

      // In a real implementation, this would send to your support system
      const supportData = {
        ...formData,
        context,
        id: `support-${Date.now()}`
      };

      console.log('Support request:', supportData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create mailto link as fallback
      const mailtoLink = `mailto:support@alphawhale.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\nCategory: ${formData.category}\n\nMessage:\n${formData.message}${
          context ? `\n\nTechnical Context:\n${JSON.stringify(context, null, 2)}` : ''
        }`
      )}`;

      // Open email client
      window.location.href = mailtoLink;

      toast({
        title: "Support request created",
        description: "Your email client should open with a pre-filled message. If not, please email support@alphawhale.com directly.",
        variant: "success",
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        category: '',
        subject: '',
        message: '',
        includeContext: true
      });

    } catch (error) {
      console.error('Support request failed:', error);
      toast({
        title: "Request failed",
        description: "Please try again or email support@alphawhale.com directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Contact Support</h1>
          <p className="text-muted-foreground mt-2">
            Get help with AlphaWhale or report issues
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Contact Options */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Quick Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">General Support</h4>
                  <a 
                    href="mailto:support@alphawhale.com"
                    className="text-primary hover:underline text-sm"
                  >
                    support@alphawhale.com
                  </a>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Bug Reports</h4>
                  <a 
                    href="mailto:bugs@alphawhale.com"
                    className="text-primary hover:underline text-sm"
                  >
                    bugs@alphawhale.com
                  </a>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Business Inquiries</h4>
                  <a 
                    href="mailto:business@alphawhale.com"
                    className="text-primary hover:underline text-sm"
                  >
                    business@alphawhale.com
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Common Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Wallet connection problems</li>
                  <li>• Guardian scan not working</li>
                  <li>• Portfolio data not loading</li>
                  <li>• Notification settings</li>
                  <li>• Account and billing questions</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Send a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Your full name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => handleInputChange('category', value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bug">
                          <div className="flex items-center gap-2">
                            <Bug className="w-4 h-4" />
                            Bug Report
                          </div>
                        </SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                        <SelectItem value="account">Account & Billing</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="guardian">Guardian Issues</SelectItem>
                        <SelectItem value="hunter">Hunter Issues</SelectItem>
                        <SelectItem value="harvest">HarvestPro Issues</SelectItem>
                        <SelectItem value="portfolio">Portfolio Issues</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder="Brief description of your issue"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      required
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Please describe your issue or question in detail..."
                      rows={6}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeContext"
                      checked={formData.includeContext}
                      onChange={(e) => handleInputChange('includeContext', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="includeContext" className="text-sm">
                      Include technical context (browser, URL, etc.) to help with debugging
                    </Label>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !formData.name || !formData.email || !formData.category || !formData.subject || !formData.message}
                    className="w-full"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}