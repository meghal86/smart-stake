export class PatternDetectionService {
  static detectPatterns(signals: unknown[], asset: string) {
    return {
      // Volume spike patterns
      volumeSpikes: this.detectVolumeSpikes(signals),
      
      // Exchange flow patterns  
      exchangeFlows: this.detectExchangeFlows(signals),
      
      // Accumulation/distribution patterns
      accumulation: this.detectAccumulation(signals),
      
      // Time-based patterns
      timePatterns: this.detectTimePatterns(signals)
    }
  }

  private static detectVolumeSpikes(signals: unknown[]) {
    const avgVolume = signals.reduce((sum, s) => sum + s.value, 0) / signals.length
    return signals.filter(s => s.value > avgVolume * 2).length
  }

  private static detectExchangeFlows(signals: unknown[]) {
    const deposits = signals.filter(s => s.reasons[0]?.includes('deposit')).length
    const withdrawals = signals.filter(s => s.reasons[0]?.includes('withdrawal')).length
    return { deposits, withdrawals, ratio: deposits / (withdrawals || 1) }
  }

  private static detectAccumulation(signals: unknown[]) {
    // Simple trend: more recent large transactions = accumulation
    const recent = signals.slice(0, 10)
    const older = signals.slice(10, 20)
    const recentAvg = recent.reduce((sum, s) => sum + s.value, 0) / recent.length
    const olderAvg = older.reduce((sum, s) => sum + s.value, 0) / older.length
    return recentAvg > olderAvg ? 'accumulation' : 'distribution'
  }

  private static detectTimePatterns(signals: unknown[]) {
    // Group by hour to find timing patterns
    const hourCounts = new Array(24).fill(0)
    signals.forEach(s => {
      const hour = new Date(s.ts).getHours()
      hourCounts[hour]++
    })
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts))
    return { peakHour, distribution: hourCounts }
  }
}