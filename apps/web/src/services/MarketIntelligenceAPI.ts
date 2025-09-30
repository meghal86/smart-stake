import { supabase } from '@/integrations/supabase/client';

// Comprehensive Market Intelligence API Service
// Uses ALL existing Market APIs and Edge Functions

export class MarketIntelligenceAPI {
  // Core Market Data APIs
  static async getMarketSummary(window: string = '24h') {
    const { data, error } = await supabase.functions.invoke('market-summary', {
      body: { window }
    });
    if (error) throw error;
    return data;
  }

  static async getWhaleClusters(window: string = '24h', clusterId?: string) {
    const { data, error } = await supabase.functions.invoke('whale-clusters', {
      body: { window, clusterId }
    });
    if (error) throw error;
    return data;
  }

  static async getChainRisk(window: string = '24h') {
    const { data, error } = await supabase.functions.invoke('chain-risk', {
      body: { window }
    });
    if (error) throw error;
    return data;
  }

  // Alerts & Streaming APIs
  static async getAlertsStream(filters: any = {}) {
    const { data, error } = await supabase.functions.invoke('alerts-stream', {
      body: { filters }
    });
    if (error) throw error;
    return data;
  }

  static async getRealWhaleAlerts(window: string = '24h') {
    const { data, error } = await supabase.functions.invoke('real-whale-alerts', {
      body: { window }
    });
    if (error) throw error;
    return data;
  }

  static async getWhaleAlerts(filters: any = {}) {
    const { data, error } = await supabase.functions.invoke('whale-alerts', {
      body: { filters }
    });
    if (error) throw error;
    return data;
  }

  // Whale Analytics APIs
  static async getWhaleAnalytics(clusterId?: string) {
    const { data, error } = await supabase.functions.invoke('whale-analytics', {
      body: { clusterId }
    });
    if (error) throw error;
    return data;
  }

  static async getWhaleProfile(whaleId: string) {
    const { data, error } = await supabase.functions.invoke('whale-profile', {
      body: { whaleId }
    });
    if (error) throw error;
    return data;
  }

  static async getLiveWhaleTracker() {
    const { data, error } = await supabase.functions.invoke('live-whale-tracker');
    if (error) throw error;
    return data;
  }

  static async getWhaleBehaviorEngine(address: string) {
    const { data, error } = await supabase.functions.invoke('whale-behavior-engine', {
      body: { address }
    });
    if (error) throw error;
    return data;
  }

  static async getWhalePredictions(address: string) {
    const { data, error } = await supabase.functions.invoke('whale-predictions', {
      body: { address }
    });
    if (error) throw error;
    return data;
  }

  static async getAdvancedWhalePredictions(filters: any = {}) {
    const { data, error } = await supabase.functions.invoke('advanced-whale-predictions', {
      body: { filters }
    });
    if (error) throw error;
    return data;
  }

  // Sentiment & Market APIs
  static async getMultiCoinSentiment() {
    const { data, error } = await supabase.functions.invoke('multi-coin-sentiment');
    if (error) throw error;
    return data;
  }

  static async getAISentiment(assets: string[]) {
    const { data, error } = await supabase.functions.invoke('ai-sentiment', {
      body: { assets }
    });
    if (error) throw error;
    return data;
  }

  static async getFetchSentiment() {
    const { data, error } = await supabase.functions.invoke('fetch-sentiment');
    if (error) throw error;
    return data;
  }

  static async getSentimentCorrelation() {
    const { data, error } = await supabase.functions.invoke('sentiment-correlation');
    if (error) throw error;
    return data;
  }

  // Price & Market Data APIs
  static async getPrices() {
    const { data, error } = await supabase.functions.invoke('prices');
    if (error) throw error;
    return data;
  }

  static async getPricesSummary() {
    const { data, error } = await supabase.functions.invoke('prices-summary');
    if (error) throw error;
    return data;
  }

  // Multi-Chain & Tracking APIs
  static async getMultiChainTracker() {
    const { data, error } = await supabase.functions.invoke('multi-chain-tracker');
    if (error) throw error;
    return data;
  }

  static async getBlockchainMonitor() {
    const { data, error } = await supabase.functions.invoke('blockchain-monitor');
    if (error) throw error;
    return data;
  }

  static async getNFTWhaleTracker() {
    const { data, error } = await supabase.functions.invoke('nft-whale-tracker');
    if (error) throw error;
    return data;
  }

  // Risk & Security APIs
  static async getRiskScan(address: string) {
    const { data, error } = await supabase.functions.invoke('riskScan', {
      body: { address }
    });
    if (error) throw error;
    return data;
  }

  static async getAutoRiskScanner() {
    const { data, error } = await supabase.functions.invoke('auto-risk-scanner');
    if (error) throw error;
    return data;
  }

  static async getChainalysisSanctions(address: string) {
    const { data, error } = await supabase.functions.invoke('chainalysis-sanctions', {
      body: { address }
    });
    if (error) throw error;
    return data;
  }

  // AI & ML APIs
  static async getAIWalletAnalyzer(address: string) {
    const { data, error } = await supabase.functions.invoke('ai-wallet-analyzer', {
      body: { address }
    });
    if (error) throw error;
    return data;
  }

  static async getMLPredictions(filters: any = {}) {
    const { data, error } = await supabase.functions.invoke('ml-predictions', {
      body: { filters }
    });
    if (error) throw error;
    return data;
  }

  static async getFeatureEngineering(data: any) {
    const { data: result, error } = await supabase.functions.invoke('feature-engineering', {
      body: { data }
    });
    if (error) throw error;
    return result;
  }

  // Market Intelligence Hub API
  static async getMarketIntelligenceHub(filters: any = {}) {
    const { data, error } = await supabase.functions.invoke('market-intelligence-hub', {
      body: { filters }
    });
    if (error) throw error;
    return data;
  }

  static async getMarketMakerSentinel() {
    const { data, error } = await supabase.functions.invoke('market-maker-sentinel');
    if (error) throw error;
    return data;
  }

  // Notification & Alert APIs
  static async getAlertNotifications(userId: string) {
    const { data, error } = await supabase.functions.invoke('alert-notifications', {
      body: { userId }
    });
    if (error) throw error;
    return data;
  }

  static async getWhaleNotifications(userId: string) {
    const { data, error } = await supabase.functions.invoke('whale-notifications', {
      body: { userId }
    });
    if (error) throw error;
    return data;
  }

  static async getMultiChannelAlerts(filters: any = {}) {
    const { data, error } = await supabase.functions.invoke('multi-channel-alerts', {
      body: { filters }
    });
    if (error) throw error;
    return data;
  }

  static async getNotificationDelivery(notificationId: string) {
    const { data, error } = await supabase.functions.invoke('notification-delivery', {
      body: { notificationId }
    });
    if (error) throw error;
    return data;
  }

  // Custom Alert Processing
  static async getCustomAlertProcessor(rules: any) {
    const { data, error } = await supabase.functions.invoke('custom-alert-processor', {
      body: { rules }
    });
    if (error) throw error;
    return data;
  }

  // Portfolio & Tracking APIs
  static async getPortfolioTracker(userId: string) {
    const { data, error } = await supabase.functions.invoke('portfolio-tracker', {
      body: { userId }
    });
    if (error) throw error;
    return data;
  }

  static async getPortfolioTrackerLive(userId: string) {
    const { data, error } = await supabase.functions.invoke('portfolio-tracker-live', {
      body: { userId }
    });
    if (error) throw error;
    return data;
  }

  // News & External Data
  static async getCryptoNews(filters: any = {}) {
    const { data, error } = await supabase.functions.invoke('crypto-news', {
      body: { filters }
    });
    if (error) throw error;
    return data;
  }

  // Health & Monitoring APIs
  static async getHealth() {
    const { data, error } = await supabase.functions.invoke('health');
    if (error) throw error;
    return data;
  }

  static async getHealthCheck() {
    const { data, error } = await supabase.functions.invoke('health-check');
    if (error) throw error;
    return data;
  }

  static async getOpsHealth() {
    const { data, error } = await supabase.functions.invoke('ops-health');
    if (error) throw error;
    return data;
  }

  static async getAPIMonitor() {
    const { data, error } = await supabase.functions.invoke('api-monitor');
    if (error) throw error;
    return data;
  }

  // BI & Analytics APIs
  static async getBISummary(filters: any = {}) {
    const { data, error } = await supabase.functions.invoke('bi-summary', {
      body: { filters }
    });
    if (error) throw error;
    return data;
  }

  static async getAccuracyTracker() {
    const { data, error } = await supabase.functions.invoke('accuracy-tracker');
    if (error) throw error;
    return data;
  }

  // Data Ingestion & Processing
  static async getDataIngestion(source: string) {
    const { data, error } = await supabase.functions.invoke('data-ingestion', {
      body: { source }
    });
    if (error) throw error;
    return data;
  }

  static async getFetchWhales() {
    const { data, error } = await supabase.functions.invoke('fetchWhales');
    if (error) throw error;
    return data;
  }

  static async getFetchYields() {
    const { data, error } = await supabase.functions.invoke('fetchYields');
    if (error) throw error;
    return data;
  }

  // AI Digest Generation
  static async generateAIDigest(window: string = '24h') {
    // Use multiple APIs to generate comprehensive AI digest
    const [
      marketSummary,
      whaleClusters,
      chainRisk,
      sentiment,
      alerts
    ] = await Promise.allSettled([
      this.getMarketSummary(window),
      this.getWhaleClusters(window),
      this.getChainRisk(window),
      this.getMultiCoinSentiment(),
      this.getAlertsStream()
    ]);

    // Process results and generate digest bullets
    const bullets = [];

    // Market summary bullet
    if (marketSummary.status === 'fulfilled') {
      const data = marketSummary.value;
      bullets.push(`Market mood at ${data.marketMood}/100 with ${data.activeWhales} active whales`);
    }

    // Whale clusters bullet
    if (whaleClusters.status === 'fulfilled') {
      const clusters = whaleClusters.value;
      const topCluster = clusters?.sort((a: any, b: any) => b.sumBalanceUsd - a.sumBalanceUsd)[0];
      if (topCluster) {
        bullets.push(`${topCluster.name} cluster leads with $${(topCluster.sumBalanceUsd / 1e9).toFixed(1)}B`);
      }
    }

    // Chain risk bullet
    if (chainRisk.status === 'fulfilled') {
      const risk = chainRisk.value;
      const highRiskChains = risk?.chains?.filter((c: any) => c.risk >= 70);
      if (highRiskChains?.length) {
        bullets.push(`${highRiskChains.length} chains showing elevated risk levels`);
      }
    }

    return { bullets: bullets.slice(0, 3) }; // Top 3 bullets
  }

  // Comprehensive Market Intelligence Query
  static async getComprehensiveIntelligence(window: string = '24h') {
    const [
      marketSummary,
      whaleClusters,
      chainRisk,
      alertsStream,
      sentiment,
      prices,
      whaleAnalytics,
      aiDigest
    ] = await Promise.allSettled([
      this.getMarketSummary(window),
      this.getWhaleClusters(window),
      this.getChainRisk(window),
      this.getAlertsStream(),
      this.getMultiCoinSentiment(),
      this.getPricesSummary(),
      this.getWhaleAnalytics(),
      this.generateAIDigest(window)
    ]);

    return {
      marketSummary: marketSummary.status === 'fulfilled' ? marketSummary.value : null,
      whaleClusters: whaleClusters.status === 'fulfilled' ? whaleClusters.value : null,
      chainRisk: chainRisk.status === 'fulfilled' ? chainRisk.value : null,
      alertsStream: alertsStream.status === 'fulfilled' ? alertsStream.value : null,
      sentiment: sentiment.status === 'fulfilled' ? sentiment.value : null,
      prices: prices.status === 'fulfilled' ? prices.value : null,
      whaleAnalytics: whaleAnalytics.status === 'fulfilled' ? whaleAnalytics.value : null,
      aiDigest: aiDigest.status === 'fulfilled' ? aiDigest.value : null,
      refreshedAt: new Date().toISOString()
    };
  }
}