export const isPortfolioV2 = () =>
  process.env.NEXT_PUBLIC_PORTFOLIO_V2 === 'true' || 
  import.meta.env.VITE_PORTFOLIO_V2 === 'true';

export const isFeatureEnabled = (feature: string) => {
  switch (feature) {
    case 'portfolioV2':
      return isPortfolioV2();
    default:
      return false;
  }
};