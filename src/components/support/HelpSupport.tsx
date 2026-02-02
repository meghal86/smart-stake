import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, ChevronDown, ChevronUp, MessageCircle, Mail, ExternalLink, Search, Book, Phone } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    question: "How do I upgrade my subscription?",
    answer: "Go to Profile > Overview and click the 'Subscription' button. Choose your preferred plan (Pro or Premium) and complete the payment process through Stripe.",
    category: "Billing"
  },
  {
    question: "What's the difference between Free, Pro, and Premium plans?",
    answer: "Free: 50 whale alerts/day, 1 wallet scan/day, top 10 whales only. Pro: 500 alerts/day, unlimited scans & analytics, export data. Premium: Unlimited everything plus API access.",
    category: "Plans"
  },
  {
    question: "How accurate are the whale alerts?",
    answer: "Our whale alerts are sourced directly from blockchain data with 99.9% accuracy. Alerts are typically delivered within 30 seconds of transaction confirmation.",
    category: "Features"
  },
  {
    question: "Can I track wallets on multiple blockchains?",
    answer: "Yes! WhalePlus supports Ethereum, Polygon, BSC, Arbitrum, and Optimism. You can set preferences for specific chains in your profile settings.",
    category: "Features"
  },
  {
    question: "How is the wallet risk score calculated?",
    answer: "Risk scores consider wallet age, transaction patterns, connections to known risky addresses, compliance status, and volatility. Scores range from 1 (low risk) to 10 (high risk).",
    category: "Scanner"
  },
  {
    question: "Why can't I access the risk scanner?",
    answer: "The AI-powered risk scanner is available for Premium users only. Free users can view basic wallet information. Upgrade to Premium for full risk analysis.",
    category: "Scanner"
  },
  {
    question: "How do I cancel my subscription?",
    answer: "Go to Profile > More > Help & Support and contact our team, or manage your subscription directly through the billing portal in your profile.",
    category: "Billing"
  },
  {
    question: "Are my wallet addresses stored securely?",
    answer: "We only store wallet addresses you explicitly add to watchlists. All data is encrypted and we never store private keys or have access to your funds.",
    category: "Security"
  }
];

interface HelpSupportProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpSupport = ({ isOpen, onClose }: HelpSupportProps) => {
  const [activeTab, setActiveTab] = useState<'faq' | 'contact'>('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    email: ''
  });

  if (!isOpen) return null;

  const filteredFAQs = faqData.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [...new Set(faqData.map(faq => faq.category))];

  const handleSubmitContact = () => {
    console.log('Contact form submitted:', contactForm);
    alert('Thank you! We will get back to you within 24 hours.');
    setContactForm({ subject: '', message: '', email: '' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Help & Support</h2>
                <p className="text-sm text-muted-foreground">Get help with WhalePlus</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1 mb-6 border-b">
            <Button
              variant={activeTab === 'faq' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('faq')}
              className="flex-1"
            >
              <Book className="h-4 w-4 mr-2" />
              FAQ
            </Button>
            <Button
              variant={activeTab === 'contact' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('contact')}
              className="flex-1"
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Us
            </Button>
          </div>

          {activeTab === 'faq' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <Button
                    key={category}
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery(category)}
                    className="text-xs"
                  >
                    {category}
                  </Button>
                ))}
              </div>

              <div className="space-y-3">
                {filteredFAQs.map((faq, index) => (
                  <Card key={index} className="p-4">
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <div>
                        <h4 className="font-medium">{faq.question}</h4>
                        <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded mt-1 inline-block">
                          {faq.category}
                        </span>
                      </div>
                      {expandedFAQ === index ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    {expandedFAQ === index && (
                      <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                        {faq.answer}
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              {filteredFAQs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Book className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No FAQ items found matching your search.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <Mail className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium mb-1">Email Support</h4>
                  <p className="text-xs text-muted-foreground mb-3">Get help via email</p>
                  <Button size="sm" variant="outline" className="w-full">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    support@whaleplus.com
                  </Button>
                </Card>
                
                <Card className="p-4 text-center">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-secondary" />
                  <h4 className="font-medium mb-1">Live Chat</h4>
                  <p className="text-xs text-muted-foreground mb-3">Chat with our team</p>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => {
                    // @ts-expect-error - Tawk_API is loaded dynamically
                    if (window.Tawk_API) {
                      // @ts-expect-error - Tawk_API is loaded dynamically
                      window.Tawk_API.showWidget();
                      // @ts-expect-error - Tawk_API is loaded dynamically
                      window.Tawk_API.maximize();
                    } else {
                      alert('Live chat will be available soon!');
                    }
                  }}>
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Start Chat
                  </Button>
                </Card>
                
                <Card className="p-4 text-center">
                  <Phone className="h-8 w-8 mx-auto mb-2 text-accent" />
                  <h4 className="font-medium mb-1">Priority Support</h4>
                  <p className="text-xs text-muted-foreground mb-3">Pro & Premium only</p>
                  <Button size="sm" variant="outline" className="w-full">
                    <Phone className="h-3 w-3 mr-1" />
                    Schedule Call
                  </Button>
                </Card>
              </div>

              <Card className="p-4">
                <h4 className="font-medium mb-4">Send us a message</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email</label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subject</label>
                    <Input
                      placeholder="How can we help?"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message</label>
                    <Textarea
                      placeholder="Describe your issue or question..."
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                    />
                  </div>
                  <Button onClick={handleSubmitContact} className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};