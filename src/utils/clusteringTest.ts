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
  validateThresholds: (clusters: unknown[]) => {
    const validation = {
      cexInflow: clusters.find((c: unknown) => {
        const cluster = c as Record<string, unknown>;
        return cluster.type === 'CEX_INFLOW';
      }),
      defiActivity: clusters.find((c: unknown) => {
        const cluster = c as Record<string, unknown>;
        return cluster.type === 'DEFI_ACTIVITY';
      }),
      dormantWaking: clusters.find((c: unknown) => {
        const cluster = c as Record<string, unknown>;
        return cluster.type === 'DORMANT_WAKING';
      }),
      distribution: clusters.find((c: unknown) => {
        const cluster = c as Record<string, unknown>;
        return cluster.type === 'DISTRIBUTION';
      }),
      accumulation: clusters.find((c: unknown) => {
        const cluster = c as Record<string, unknown>;
        return cluster.type === 'ACCUMULATION';
      })
    };

    console.log('🧪 CLUSTER VALIDATION:', {
      cexInflowCount: (validation.cexInflow as Record<string, unknown> | undefined)?.membersCount || 0,
      defiActivityCount: (validation.defiActivity as Record<string, unknown> | undefined)?.membersCount || 0,
      dormantWakingCount: (validation.dormantWaking as Record<string, unknown> | undefined)?.membersCount || 0,
      distributionCount: (validation.distribution as Record<string, unknown> | undefined)?.membersCount || 0,
      accumulationCount: (validation.accumulation as Record<string, unknown> | undefined)?.membersCount || 0,
      totalClustered: Object.values(validation).reduce((sum, c) => sum + ((c as Record<string, unknown> | undefined)?.membersCount as number || 0), 0)
    });

    return validation;
  },

  // Test alert routing
  testAlertRouting: (alerts: unknown[]) => {
    const routingTest = alerts.map((alert: unknown) => {
      const a = alert as Record<string, unknown>;
      const to = a.to as Record<string, unknown> | undefined;
      const from = a.from as Record<string, unknown> | undefined;
      return {
        id: a.id,
        toEntity: to?.owner,
        fromEntity: from?.owner,
        tags: a.tags,
        predictedCluster: a.cluster_type,
        threadKey: a.thread_key
      };
    });

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
  validateTransactionData: (transactions: unknown[]) => {
    const checks = {
      hasTimestamps: transactions.every((tx: unknown) => {
        const t = tx as Record<string, unknown>;
        return t.ts || t.timestamp;
      }),
      hasAmounts: transactions.every((tx: unknown) => {
        const t = tx as Record<string, unknown>;
        return t.amount_usd || t.value_usd;
      }),
      hasAddresses: transactions.every((tx: unknown) => {
        const t = tx as Record<string, unknown>;
        return t.from_address && t.to_address;
      }),
      hasEntities: transactions.some((tx: unknown) => {
        const t = tx as Record<string, unknown>;
        const to = t.to as Record<string, unknown> | undefined;
        const from = t.from as Record<string, unknown> | undefined;
        return to?.owner || from?.owner;
      }),
      avgAmount: transactions.reduce((sum: number, tx: unknown) => {
        const t = tx as Record<string, unknown>;
        const amount = parseFloat(String(t.amount_usd || t.value_usd || 0));
        return sum + amount;
      }, 0) / transactions.length
    };

    console.log('📊 TRANSACTION DATA QUALITY:', checks);
    return checks;
  },

  validateWhaleData: (whales: unknown[]) => {
    const checks = {
      hasAddresses: whales.every((w: unknown) => {
        const whale = w as Record<string, unknown>;
        return whale.fullAddress;
      }),
      hasBalances: whales.every((w: unknown) => {
        const whale = w as Record<string, unknown>;
        return whale.balance;
      }),
      hasRiskScores: whales.every((w: unknown) => {
        const whale = w as Record<string, unknown>;
        return typeof whale.riskScore === 'number';
      }),
      hasReasons: whales.some((w: unknown) => {
        const whale = w as Record<string, unknown>;
        const reasons = whale.reasons as unknown[] | undefined;
        return reasons && reasons.length > 0;
      }),
      avgBalance: whales.reduce((sum: number, w: unknown) => {
        const whale = w as Record<string, unknown>;
        return sum + (typeof whale.balance === 'number' ? whale.balance : 0);
      }, 0) / whales.length,
      avgRisk: whales.reduce((sum: number, w: unknown) => {
        const whale = w as Record<string, unknown>;
        return sum + (typeof whale.riskScore === 'number' ? whale.riskScore : 0);
      }, 0) / whales.length
    };

    console.log('🐋 WHALE DATA QUALITY:', checks);
    return checks;
  }
};