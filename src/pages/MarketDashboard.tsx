import { TrendingUp, Fish, Briefcase } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WhaleAnalytics from './WhaleAnalytics';
import MultiCoinSentiment from './MultiCoinSentiment';
import Portfolio from './Portfolio';

export default function MarketDashboard() {
  return (
    <div className="flex-1 bg-gradient-to-br from-background to-background/80 pb-20">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-xl">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Market Dashboard</h1>
            <p className="text-sm text-muted-foreground">Comprehensive market intelligence and analytics</p>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="whales" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="whales" className="flex items-center gap-2">
              <Fish className="h-4 w-4" />
              Whale Analytics
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Sentiment
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Portfolio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="whales" className="mt-6">
            <WhaleAnalytics />
          </TabsContent>

          <TabsContent value="sentiment" className="mt-6">
            <MultiCoinSentiment />
          </TabsContent>

          <TabsContent value="portfolio" className="mt-6">
            <Portfolio />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}