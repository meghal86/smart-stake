/**
 * AlphaWhale Format Helpers - P0 Implementation
 * Consistent amount formatting across all components
 */

export const formatAmount = (amount: number): string => {
  if (amount >= 1e9) {
    const val = amount / 1e9;
    return `$${Math.round(val)}B`;
  }
  if (amount >= 1e6) {
    const val = amount / 1e6;
    return `$${Math.round(val)}M`;
  }
  if (amount >= 1e3) {
    const val = amount / 1e3;
    return `$${Math.round(val)}K`;
  }
  return `$${Math.round(amount)}`;
};

export const formatAmountWithAverage = (amount: number, average?: number) => ({
  primary: formatAmount(amount),
  average: average ? `avg ${formatAmount(average)}` : null
});

export const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${Math.round(value * 10) / 10}%`;
};