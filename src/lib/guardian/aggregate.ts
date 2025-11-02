interface GuardianWallet {
  address: string;
  trust_score?: number;
  risk_count?: number;
}

export class GuardianAggregator {
  static calculatePortfolioTrustScore(wallets: GuardianWallet[]): number | null {
    const validScores = wallets
      .filter(w => w.trust_score !== undefined && w.trust_score !== null)
      .map(w => w.trust_score!);

    if (validScores.length === 0) return null;

    // Weighted average based on number of wallets
    const sum = validScores.reduce((acc, score) => acc + score, 0);
    return Math.round(sum / validScores.length);
  }

  static calculateTotalRisks(wallets: GuardianWallet[]): number {
    return wallets.reduce((total, wallet) => {
      return total + (wallet.risk_count || 0);
    }, 0);
  }

  static getPortfolioRiskLevel(avgScore: number | null): 'low' | 'medium' | 'high' {
    if (!avgScore) return 'high';
    if (avgScore >= 80) return 'low';
    if (avgScore >= 60) return 'medium';
    return 'high';
  }

  static getWalletDistribution(wallets: GuardianWallet[]): {
    high_trust: number;
    medium_trust: number;
    low_trust: number;
    unscanned: number;
  } {
    const distribution = {
      high_trust: 0,
      medium_trust: 0,
      low_trust: 0,
      unscanned: 0
    };

    wallets.forEach(wallet => {
      if (!wallet.trust_score) {
        distribution.unscanned++;
      } else if (wallet.trust_score >= 80) {
        distribution.high_trust++;
      } else if (wallet.trust_score >= 60) {
        distribution.medium_trust++;
      } else {
        distribution.low_trust++;
      }
    });

    return distribution;
  }

  static generatePortfolioInsights(wallets: GuardianWallet[]): string[] {
    const insights: string[] = [];
    const avgScore = this.calculatePortfolioTrustScore(wallets);
    const totalRisks = this.calculateTotalRisks(wallets);
    const distribution = this.getWalletDistribution(wallets);

    if (avgScore && avgScore >= 90) {
      insights.push("🛡️ Excellent portfolio security posture");
    } else if (avgScore && avgScore >= 70) {
      insights.push("⚠️ Good security with room for improvement");
    } else if (avgScore && avgScore < 70) {
      insights.push("🚨 Portfolio requires immediate attention");
    }

    if (totalRisks === 0) {
      insights.push("✅ No active security risks detected");
    } else if (totalRisks <= 5) {
      insights.push(`⚡ ${totalRisks} minor risks to address`);
    } else {
      insights.push(`🔥 ${totalRisks} risks require immediate action`);
    }

    if (distribution.unscanned > 0) {
      insights.push(`📊 ${distribution.unscanned} wallets need scanning`);
    }

    return insights;
  }
}