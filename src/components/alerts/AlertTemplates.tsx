import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  Search, 
  Star, 
  Crown, 
  TrendingUp, 
  Shield, 
  DollarSign,
  Activity,
  Filter
} from 'lucide-react';

interface AlertTemplate {
  id: string;
  name: string;
  description: string;
  category: 'whale' | 'defi' | 'security' | 'trading';
  templateConditions: any[];
  defaultLogicOperator: 'AND' | 'OR' | 'NOR';
  suggestedDeliveryChannels: {
    push: boolean;
    email: boolean;
    sms: boolean;
    webhook: boolean;
  };
  isPremium: boolean;
  popularityScore: number;
  estimatedTriggers: string;
}

interface AlertTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (template: AlertTemplate) => void;
}

export const AlertTemplates = ({ isOpen, onClose, onUseTemplate }: AlertTemplatesProps) => {
  const [templates, setTemplates] = useState<AlertTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      // Mock templates - replace with API call
      setTemplates([
        {
          id: '1',
          name: 'Large Whale Buy',
          description: 'Detect large purchases by known whale wallets',
          category: 'whale',
          templateConditions: [
            { type: 'amount', operator: 'gte', value: 1000000, currency: 'USD' },
            { type: 'direction', operator: 'eq', value: 'buy' },
            { type: 'whale_tag', operator: 'eq', value: true }
          ],
          defaultLogicOperator: 'AND',
          suggestedDeliveryChannels: { push: true, email: true, sms: false, webhook: false },
          isPremium: false,
          popularityScore: 95,
          estimatedTriggers: '2-5 per day'
        },
        {
          id: '2',
          name: 'Multi-chain Transfer Spike',
          description: 'Alert when same wallet transfers across multiple chains within timeframe',
          category: 'whale',
          templateConditions: [
            { type: 'amount', operator: 'gte', value: 500000, currency: 'USD' },
            { type: 'multi_chain', operator: 'eq', value: true },
            { type: 'time_window', operator: 'lte', value: 24, unit: 'hours' }
          ],
          defaultLogicOperator: 'AND',
          suggestedDeliveryChannels: { push: true, email: true, sms: true, webhook: false },
          isPremium: true,
          popularityScore: 87,
          estimatedTriggers: '1-3 per day'
        },
        {
          id: '3',
          name: 'Stablecoin Large Movement',
          description: 'Track large stablecoin transfers that might indicate market movements',
          category: 'trading',
          templateConditions: [
            { type: 'token_type', operator: 'eq', value: 'stablecoin' },
            { type: 'amount', operator: 'gte', value: 10000000, currency: 'USD' }
          ],
          defaultLogicOperator: 'AND',
          suggestedDeliveryChannels: { push: true, email: false, sms: false, webhook: true },
          isPremium: false,
          popularityScore: 92,
          estimatedTriggers: '5-10 per day'
        },
        {
          id: '4',
          name: 'Exchange Outflow Alert',
          description: 'Monitor large withdrawals from major exchanges',
          category: 'whale',
          templateConditions: [
            { type: 'from_type', operator: 'eq', value: 'exchange' },
            { type: 'amount', operator: 'gte', value: 2000000, currency: 'USD' },
            { type: 'direction', operator: 'eq', value: 'withdrawal' }
          ],
          defaultLogicOperator: 'AND',
          suggestedDeliveryChannels: { push: true, email: true, sms: false, webhook: true },
          isPremium: true,
          popularityScore: 89,
          estimatedTriggers: '3-7 per day'
        },
        {
          id: '5',
          name: 'DeFi Protocol Interaction',
          description: 'Alert on large interactions with specific DeFi protocols',
          category: 'defi',
          templateConditions: [
            { type: 'to_type', operator: 'eq', value: 'defi_protocol' },
            { type: 'amount', operator: 'gte', value: 1000000, currency: 'USD' },
            { type: 'protocol', operator: 'in', value: ['uniswap', 'aave', 'compound'] }
          ],
          defaultLogicOperator: 'AND',
          suggestedDeliveryChannels: { push: true, email: false, sms: false, webhook: false },
          isPremium: true,
          popularityScore: 78,
          estimatedTriggers: '4-8 per day'
        },
        {
          id: '6',
          name: 'Suspicious Activity Pattern',
          description: 'Detect potentially suspicious wallet behavior patterns',
          category: 'security',
          templateConditions: [
            { type: 'rapid_transactions', operator: 'gte', value: 5 },
            { type: 'time_window', operator: 'lte', value: 1, unit: 'hours' },
            { type: 'amount', operator: 'gte', value: 100000, currency: 'USD' }
          ],
          defaultLogicOperator: 'AND',
          suggestedDeliveryChannels: { push: true, email: true, sms: true, webhook: true },
          isPremium: true,
          popularityScore: 85,
          estimatedTriggers: '1-2 per day'
        },
        {
          id: '7',
          name: 'Yield Farming Opportunity',
          description: 'Alert when new high-yield farming opportunities appear',
          category: 'defi',
          templateConditions: [
            { type: 'apy', operator: 'gte', value: 20 },
            { type: 'tvl', operator: 'gte', value: 1000000, currency: 'USD' },
            { type: 'risk_score', operator: 'lte', value: 5 }
          ],
          defaultLogicOperator: 'AND',
          suggestedDeliveryChannels: { push: true, email: true, sms: false, webhook: false },
          isPremium: false,
          popularityScore: 73,
          estimatedTriggers: '2-4 per week'
        },
        {
          id: '8',
          name: 'Flash Loan Attack Detection',
          description: 'Detect potential flash loan attacks or arbitrage',
          category: 'security',
          templateConditions: [
            { type: 'transaction_type', operator: 'eq', value: 'flash_loan' },
            { type: 'amount', operator: 'gte', value: 1000000, currency: 'USD' },
            { type: 'profit_margin', operator: 'gte', value: 50000, currency: 'USD' }
          ],
          defaultLogicOperator: 'AND',
          suggestedDeliveryChannels: { push: true, email: true, sms: true, webhook: true },
          isPremium: true,
          popularityScore: 91,
          estimatedTriggers: '1-3 per day'
        }
      ]);
    }
  }, [isOpen]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'whale': return <TrendingUp className="h-4 w-4" />;
      case 'defi': return <DollarSign className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'trading': return <Activity className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'whale': return 'bg-blue-100 text-blue-800';
      case 'defi': return 'bg-green-100 text-green-800';
      case 'security': return 'bg-red-100 text-red-800';
      case 'trading': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const popularTemplates = filteredTemplates
    .filter(t => t.popularityScore >= 85)
    .sort((a, b) => b.popularityScore - a.popularityScore);

  const freeTemplates = filteredTemplates.filter(t => !t.isPremium);
  const premiumTemplates = filteredTemplates.filter(t => t.isPremium);

  const renderTemplate = (template: AlertTemplate) => (
    <Card key={template.id} className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded ${getCategoryColor(template.category)}`}>
            {getCategoryIcon(template.category)}
          </div>
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              {template.name}
              {template.isPremium && <Crown className="h-4 w-4 text-yellow-500" />}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={getCategoryColor(template.category)}>
                {template.category}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-current text-yellow-500" />
                {template.popularityScore}%
              </div>
            </div>
          </div>
        </div>
        <Button
          onClick={() => onUseTemplate(template)}
          size="sm"
          variant={template.isPremium ? "default" : "outline"}
        >
          Use Template
        </Button>
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
      
      <div className="space-y-2">
        <div className="text-xs">
          <span className="font-medium">Conditions:</span>
          <div className="mt-1 space-y-1">
            {template.templateConditions.slice(0, 2).map((condition, i) => (
              <div key={i} className="bg-muted/50 rounded px-2 py-1 text-xs font-mono">
                {condition.type} {condition.operator} {Array.isArray(condition.value) ? condition.value.join(', ') : condition.value}
                {condition.currency && ` ${condition.currency}`}
                {condition.unit && ` ${condition.unit}`}
              </div>
            ))}
            {template.templateConditions.length > 2 && (
              <div className="text-xs text-muted-foreground">
                +{template.templateConditions.length - 2} more conditions
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Est. triggers: {template.estimatedTriggers}</span>
          <div className="flex items-center gap-1">
            Delivery:
            {template.suggestedDeliveryChannels.push && <Badge variant="outline" className="text-xs">Push</Badge>}
            {template.suggestedDeliveryChannels.email && <Badge variant="outline" className="text-xs">Email</Badge>}
            {template.suggestedDeliveryChannels.sms && <Badge variant="outline" className="text-xs">SMS</Badge>}
            {template.suggestedDeliveryChannels.webhook && <Badge variant="outline" className="text-xs">Webhook</Badge>}
          </div>
        </div>
      </div>
    </Card>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Alert Templates</h2>
              <p className="text-muted-foreground">Choose from preset alert configurations</p>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All
              </Button>
              <Button
                variant={selectedCategory === 'whale' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('whale')}
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Whale
              </Button>
              <Button
                variant={selectedCategory === 'defi' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('defi')}
              >
                <DollarSign className="h-4 w-4 mr-1" />
                DeFi
              </Button>
              <Button
                variant={selectedCategory === 'security' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('security')}
              >
                <Shield className="h-4 w-4 mr-1" />
                Security
              </Button>
              <Button
                variant={selectedCategory === 'trading' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('trading')}
              >
                <Activity className="h-4 w-4 mr-1" />
                Trading
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <Tabs defaultValue="popular">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="popular">
                <Star className="h-4 w-4 mr-2" />
                Popular ({popularTemplates.length})
              </TabsTrigger>
              <TabsTrigger value="free">
                Free ({freeTemplates.length})
              </TabsTrigger>
              <TabsTrigger value="premium">
                <Crown className="h-4 w-4 mr-2" />
                Premium ({premiumTemplates.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="popular" className="space-y-4">
              {popularTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Popular Templates Found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or category filter</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {popularTemplates.map(renderTemplate)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="free" className="space-y-4">
              {freeTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Free Templates Found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or category filter</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {freeTemplates.map(renderTemplate)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="premium" className="space-y-4">
              {premiumTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Premium Templates Found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or category filter</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {premiumTemplates.map(renderTemplate)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
};