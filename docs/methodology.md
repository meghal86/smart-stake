# AlphaWhale Methodology

## Data Sources

### Primary Sources
- **Etherscan API**: On-chain transaction data for Ethereum mainnet
- **CoinGecko API**: Price data and market metrics
- **Internal Algorithms**: Whale identification and behavior analysis

### Update Cadence
- **Whale Spotlight**: Every 15 minutes
- **Fear & Whale Index**: Every 30 minutes  
- **Daily Digest**: Every 6 hours
- **Price Data**: Real-time (1-minute intervals)

## Simulated Data Policy

When live data sources are unavailable or rate-limited, AlphaWhale displays simulated data to demonstrate functionality. Simulated data is:

- Clearly marked with "Simulated" badges
- Based on historical patterns and realistic scenarios
- Updated regularly to maintain engagement
- Replaced with live data when sources become available

**Live data requires**: Wallet connection or Pro subscription for API access.

## Fear & Whale Index Formula

The Fear & Whale Index is calculated on a 0-100 scale using:

```
Index = (Whale Activity × 0.4) + (Market Sentiment × 0.3) + (Volume Patterns × 0.3)
```

### Components:
- **Whale Activity**: Large transaction frequency and size
- **Market Sentiment**: Social signals and news sentiment
- **Volume Patterns**: Unusual trading volume spikes

### Scale:
- **0-25**: Extreme Fear (Heavy selling pressure)
- **26-45**: Fear (Selling bias)
- **46-55**: Neutral (Balanced activity)
- **56-75**: Greed (Accumulation bias)
- **76-100**: Extreme Greed (Heavy buying pressure)

## Confidence Score Inputs

Confidence levels are determined by:

### High Confidence (Green)
- Transaction amount > $1M USD
- Wallet has >10 historical transactions
- Multiple confirmation sources
- Recent activity pattern

### Medium Confidence (Yellow)
- Transaction amount $100K - $1M USD
- Wallet has 5-10 historical transactions
- Single confirmation source
- Moderate activity pattern

### Low Confidence (Red)
- Transaction amount < $100K USD
- Wallet has <5 historical transactions
- Unconfirmed or delayed data
- Irregular activity pattern

## Limitations & Caveats

### Data Limitations
- **Chain Coverage**: Currently Ethereum mainnet only
- **Privacy Coins**: Cannot track privacy-focused transactions
- **DEX Activity**: Limited visibility into some decentralized exchanges
- **Cross-chain**: Multi-chain whale activity not fully captured

### Analysis Limitations
- **Whale Definition**: Based on transaction size, not total holdings
- **Intent**: Cannot determine actual intent behind transactions
- **Market Impact**: Correlation does not imply causation
- **Timing**: Historical data, not predictive

### Technical Limitations
- **API Limits**: Rate limiting may cause delays
- **Network Issues**: Blockchain congestion affects data freshness
- **False Positives**: Automated systems may misclassify transactions

## Disclaimer

AlphaWhale provides educational and informational content only. This is not financial advice. Cryptocurrency investments carry significant risk. Always conduct your own research and consult with qualified financial advisors before making investment decisions.

---

*Last updated: December 2024*