// Real-time clustering validation utilities
export const validateClustering = {
  // Test specific whale addresses against known behavior
  testKnownWhales: () => {
    const knownCases = [
      {
        address: '0x742d35Cc6634C0532925a3b8D4C9db96',
        expectedCluster: 'CEX_INFLOW',
        reason: 'Known Binance depositor'
      },
      {
        address: '0x8315177aB297bA92A06054cE80a67Ed4',
        expectedCluster: 'DEFI_ACTIVITY', 
        reason: 'Active Uniswap LP'
      }
    ];
    
    return knownCases;
  },

  // Validate cluster thresholds
  validateThresholds: (clusters: any[]) => {
    const validation = {
      cexInflow: clusters.find(c => c.type === 'CEX_INFLOW'),
      defiActivity: clusters.find(c => c.type === 'DEFI_ACTIVITY'),
      dormantWaking: clusters.find(c => c.type === 'DORMANT_WAKING'),
      distribution: clusters.find(c => c.type === 'DISTRIBUTION'),
      accumulation: clusters.find(c => c.type === 'ACCUMULATION')
    };

    console.log('🧪 CLUSTER VALIDATION:', {
      cexInflowCount: validation.cexInflow?.membersCount || 0,
      defiActivityCount: validation.defiActivity?.membersCount || 0,
      dormantWakingCount: validation.dormantWaking?.membersCount || 0,
      distributionCount: validation.distribution?.membersCount || 0,
      accumulationCount: validation.accumulation?.membersCount || 0,
      totalClustered: Object.values(validation).reduce((sum, c) => sum + (c?.membersCount || 0), 0)
    });

    return validation;
  },

  // Test alert routing
  testAlertRouting: (alerts: any[]) => {
    const routingTest = alerts.map(alert => ({
      id: alert.id,
      toEntity: alert.to?.owner,
      fromEntity: alert.from?.owner,
      tags: alert.tags,
      predictedCluster: alert.cluster_type,
      threadKey: alert.thread_key
    }));

    console.log('🎯 ALERT ROUTING TEST:', routingTest.slice(0, 5));
    return routingTest;
  },

  // Performance metrics
  measurePerformance: (startTime: number, whaleCount: number, txCount: number) => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const metrics = {
      duration: `${duration}ms`,
      whalesPerSecond: Math.round((whaleCount / duration) * 1000),
      transactionsPerSecond: Math.round((txCount / duration) * 1000),
      efficiency: duration < 100 ? 'Excellent' : duration < 500 ? 'Good' : 'Needs optimization'
    };

    console.log('⚡ CLUSTERING PERFORMANCE:', metrics);
    return metrics;
  }
};

// Real-time data quality checks
export const dataQualityChecks = {
  validateTransactionData: (transactions: any[]) => {
    const checks = {
      hasTimestamps: transactions.every(tx => tx.ts || tx.timestamp),
      hasAmounts: transactions.every(tx => tx.amount_usd || tx.value_usd),
      hasAddresses: transactions.every(tx => tx.from_address && tx.to_address),
      hasEntities: transactions.some(tx => tx.to?.owner || tx.from?.owner),
      avgAmount: transactions.reduce((sum, tx) => sum + parseFloat(tx.amount_usd || tx.value_usd || 0), 0) / transactions.length
    };

    console.log('📊 TRANSACTION DATA QUALITY:', checks);
    return checks;
  },

  validateWhaleData: (whales: any[]) => {
    const checks = {
      hasAddresses: whales.every(w => w.fullAddress),
      hasBalances: whales.every(w => w.balance),
      hasRiskScores: whales.every(w => typeof w.riskScore === 'number'),
      hasReasons: whales.some(w => w.reasons?.length > 0),
      avgBalance: whales.reduce((sum, w) => sum + w.balance, 0) / whales.length,
      avgRisk: whales.reduce((sum, w) => sum + w.riskScore, 0) / whales.length
    };

    console.log('🐋 WHALE DATA QUALITY:', checks);
    return checks;
  }
};