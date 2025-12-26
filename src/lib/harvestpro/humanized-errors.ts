/**
 * HarvestPro Humanized Error Messages
 * 
 * Extends the base humanized error system with HarvestPro-specific
 * encouraging, empathetic error messages and recovery suggestions.
 * 
 * Requirements: Enhanced Req 16 AC1-3 (humanized errors, encouraging copy)
 * Design: Microcopy System → Error Humanization
 */

import { humanizedErrorHandler, HUMANIZED_ERROR_MESSAGES } from '@/lib/ux/HumanizedErrorHandler';

/**
 * HarvestPro-specific humanized error messages
 */
export const HARVESTPRO_ERROR_MESSAGES = {
  // Wallet Connection Errors
  WALLET_CONNECTION_FAILED: {
    title: 'Wallet connection hiccup! 🔗',
    message: 'Sometimes wallets need a little coaxing to connect. No worries - this happens to everyone!',
    encouragement: 'Your security-first approach is exactly what we love to see in DeFi.',
    action: 'Try connecting again or refresh the page. We believe in you!',
    recovery: 'Check that your wallet extension is unlocked and try again.'
  },

  WALLET_SIGNATURE_REJECTED: {
    title: 'No problem at all! 👍',
    message: 'You chose not to sign that transaction - smart move to double-check everything.',
    encouragement: 'Taking your time with signatures shows you understand DeFi security.',
    action: 'When you\'re ready, just try again. We\'ll be here waiting!',
    recovery: 'Review the transaction details and sign when you feel comfortable.'
  },

  // Harvest Opportunity Errors
  NO_OPPORTUNITIES_FOUND: {
    title: 'All clear on the harvest front! 🌾',
    message: 'No tax-loss harvesting opportunities detected right now.',
    encouragement: 'This actually means your portfolio is performing well - that\'s great news!',
    action: 'Check back later or connect more wallets to expand your opportunities.',
    recovery: 'Market conditions change constantly, so new opportunities may appear soon.'
  },

  OPPORTUNITY_CALCULATION_FAILED: {
    title: 'Calculation hiccup detected! 🧮',
    message: 'We hit a snag while crunching the numbers for your harvest opportunities.',
    encouragement: 'Don\'t worry - your data is safe and we\'re already working on this.',
    action: 'Try refreshing the page or check back in a few minutes.',
    recovery: 'Our calculation engine is usually very reliable, so this should resolve quickly.'
  },

  // Gas and Network Errors
  GAS_ESTIMATION_FAILED: {
    title: 'Gas prices are being shy! ⛽',
    message: 'We\'re having trouble getting current gas prices from the network.',
    encouragement: 'Network congestion happens - it\'s just part of the DeFi experience.',
    action: 'We\'ll keep trying in the background, or you can refresh to speed things up.',
    recovery: 'Gas prices update every few seconds, so this usually resolves quickly.'
  },

  HIGH_GAS_WARNING: {
    title: 'Gas prices are a bit spicy right now! 🌶️',
    message: 'Current network fees are higher than usual, which might impact your net benefit.',
    encouragement: 'You\'re smart to check costs before proceeding - that\'s pro-level DeFi thinking!',
    action: 'Consider waiting for lower gas prices or proceed if the benefit still makes sense.',
    recovery: 'Gas prices fluctuate throughout the day - try checking again in an hour.'
  },

  // Data Loading Errors
  PRICE_DATA_UNAVAILABLE: {
    title: 'Price data is taking a coffee break! ☕',
    message: 'We\'re having trouble fetching current market prices for accurate calculations.',
    encouragement: 'Even the best price oracles need a moment sometimes.',
    action: 'We\'ll keep trying automatically, or you can refresh to give it another shot.',
    recovery: 'Price feeds usually recover within a few minutes.'
  },

  GUARDIAN_SCORE_UNAVAILABLE: {
    title: 'Guardian is catching up! 🛡️',
    message: 'Our security scoring system is temporarily unavailable.',
    encouragement: 'We take security seriously, so we\'d rather wait than give you incomplete info.',
    action: 'Try again in a moment - Guardian scores update every few minutes.',
    recovery: 'Security analysis is complex, but our systems are very reliable.'
  },

  // Execution Errors
  EXECUTION_FAILED: {
    title: 'Execution hit a bump! 🚧',
    message: 'Something went wrong during the harvest execution, but don\'t panic.',
    encouragement: 'Your funds are safe - we never hold your assets, and nothing was lost.',
    action: 'Check your wallet for any pending transactions and try again if needed.',
    recovery: 'Review the transaction details and retry when you\'re ready.'
  },

  SLIPPAGE_TOO_HIGH: {
    title: 'Whoa there, slippage alert! 📈',
    message: 'The estimated slippage for this trade is higher than your comfort zone.',
    encouragement: 'You\'re being smart by paying attention to slippage - that\'s advanced DeFi!',
    action: 'Consider adjusting your slippage tolerance or waiting for better market conditions.',
    recovery: 'Market volatility affects slippage - try again when markets are calmer.'
  },

  // Form Validation Errors
  INVALID_TAX_RATE: {
    title: 'Tax rate needs a small tweak! 📊',
    message: 'The tax rate you entered seems a bit unusual.',
    encouragement: 'Getting this right is important for accurate calculations - good attention to detail!',
    action: 'Double-check your marginal tax rate and enter it as a decimal (e.g., 0.24 for 24%).',
    recovery: 'Most users have tax rates between 10% and 50% - consult your tax advisor if unsure.'
  },

  INVALID_WALLET_ADDRESS: {
    title: 'Wallet address format looks off! 📝',
    message: 'That wallet address doesn\'t quite match the expected format.',
    encouragement: 'Wallet addresses are tricky to type - even crypto pros make typos!',
    action: 'Double-check the address format (should start with 0x and be 42 characters long).',
    recovery: 'Copy and paste addresses when possible to avoid typos.'
  },

  // CEX Integration Errors
  CEX_CONNECTION_FAILED: {
    title: 'Exchange connection hiccup! 🏦',
    message: 'We\'re having trouble connecting to your centralized exchange account.',
    encouragement: 'Exchange APIs can be finicky - it\'s not your fault!',
    action: 'Check your API credentials and make sure they have the right permissions.',
    recovery: 'Try regenerating your API keys if the problem persists.'
  },

  CEX_API_RATE_LIMITED: {
    title: 'Exchange says "slow down!" 🐌',
    message: 'The exchange is asking us to make fewer requests right now.',
    encouragement: 'This is normal - exchanges protect their systems this way.',
    action: 'We\'ll automatically retry in a moment, or you can wait and try again.',
    recovery: 'Rate limits usually reset within a few minutes.'
  },

  // Generic Fallbacks with Encouragement
  UNKNOWN_ERROR: {
    title: 'Something unexpected happened! 🚀',
    message: 'We hit an unknown issue, but don\'t worry - these things happen in the fast-moving world of DeFi.',
    encouragement: 'Your patience helps us build a better product for everyone!',
    action: 'Try refreshing the page or contact our support team if this keeps happening.',
    recovery: 'Our team monitors these issues closely and fixes them quickly.'
  },

  TEMPORARY_ISSUE: {
    title: 'Quick technical timeout! ⏰',
    message: 'We\'re experiencing a temporary technical issue on our end.',
    encouragement: 'Thanks for your patience - we know your time is valuable.',
    action: 'This usually resolves itself within a few minutes. Try again shortly!',
    recovery: 'Our systems are designed to recover quickly from temporary issues.'
  }
} as const;

/**
 * Get humanized error message for HarvestPro context
 */
export function getHarvestProErrorMessage(
  error: Error | string,
  context?: string
): {
  title: string;
  message: string;
  encouragement: string;
  action: string;
  recovery: string;
} {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const lowerMessage = errorMessage.toLowerCase();

  // Map specific HarvestPro error patterns
  let messageKey: keyof typeof HARVESTPRO_ERROR_MESSAGES = 'UNKNOWN_ERROR';

  // Wallet-specific errors
  if (lowerMessage.includes('wallet')) {
    if (lowerMessage.includes('rejected') || lowerMessage.includes('denied')) {
      messageKey = 'WALLET_SIGNATURE_REJECTED';
    } else {
      messageKey = 'WALLET_CONNECTION_FAILED';
    }
  }
  // Gas-related errors
  else if (lowerMessage.includes('gas')) {
    if (lowerMessage.includes('high') || lowerMessage.includes('expensive')) {
      messageKey = 'HIGH_GAS_WARNING';
    } else {
      messageKey = 'GAS_ESTIMATION_FAILED';
    }
  }
  // Harvest-specific errors
  else if (lowerMessage.includes('opportunity') || lowerMessage.includes('harvest')) {
    if (lowerMessage.includes('not found') || lowerMessage.includes('no opportunities')) {
      messageKey = 'NO_OPPORTUNITIES_FOUND';
    } else {
      messageKey = 'OPPORTUNITY_CALCULATION_FAILED';
    }
  }
  // Execution errors
  else if (lowerMessage.includes('execution') || lowerMessage.includes('transaction')) {
    if (lowerMessage.includes('slippage')) {
      messageKey = 'SLIPPAGE_TOO_HIGH';
    } else {
      messageKey = 'EXECUTION_FAILED';
    }
  }
  // Price/data errors
  else if (lowerMessage.includes('price') || lowerMessage.includes('data')) {
    if (lowerMessage.includes('guardian')) {
      messageKey = 'GUARDIAN_SCORE_UNAVAILABLE';
    } else {
      messageKey = 'PRICE_DATA_UNAVAILABLE';
    }
  }
  // Form validation errors
  else if (lowerMessage.includes('tax rate') || lowerMessage.includes('validation')) {
    if (lowerMessage.includes('tax')) {
      messageKey = 'INVALID_TAX_RATE';
    } else if (lowerMessage.includes('address')) {
      messageKey = 'INVALID_WALLET_ADDRESS';
    }
  }
  // CEX errors
  else if (lowerMessage.includes('exchange') || lowerMessage.includes('cex') || lowerMessage.includes('api')) {
    if (lowerMessage.includes('rate limit')) {
      messageKey = 'CEX_API_RATE_LIMITED';
    } else {
      messageKey = 'CEX_CONNECTION_FAILED';
    }
  }
  // Network/timeout errors
  else if (lowerMessage.includes('timeout') || lowerMessage.includes('network')) {
    messageKey = 'TEMPORARY_ISSUE';
  }

  return HARVESTPRO_ERROR_MESSAGES[messageKey];
}

/**
 * Handle HarvestPro error with humanized messaging and toast
 */
export async function handleHarvestProError(
  error: Error | string,
  context?: string,
  showToast: boolean = true
): Promise<string> {
  const humanizedMessage = getHarvestProErrorMessage(error, context);

  if (showToast) {
    // Use the base humanized error handler for toast display
    await humanizedErrorHandler.handleHumanizedError(error, context, true);
  }

  return humanizedMessage.message;
}

/**
 * Show encouraging retry message for HarvestPro
 */
export function showHarvestProRetryEncouragement(attemptNumber: number, maxAttempts: number = 3): void {
  const encouragements = [
    'Don\'t give up! 💪 DeFi rewards persistence, and you\'re almost there.',
    'Second time\'s the charm! 🎯 Your patience is exactly what successful DeFi users have.',
    'Third attempt coming up! ✨ We believe in you - this usually works now.',
    'You\'re so close! 🚀 One more try should get you harvesting those tax benefits.',
    'Final push! 🌟 Success in DeFi often comes to those who persist.'
  ];

  const encouragement = encouragements[Math.min(attemptNumber - 1, encouragements.length - 1)];
  
  humanizedErrorHandler.showRetryEncouragement(attemptNumber, maxAttempts);
}

/**
 * Show success message after HarvestPro error recovery
 */
export function showHarvestProRecoverySuccess(context?: string): void {
  const successMessages = [
    'Back to harvesting! 🌾 Your tax-loss opportunities are ready for review.',
    'All systems go! 🚀 Your harvest dashboard is fully operational again.',
    'Problem solved! ✅ Thanks for your patience - let\'s find those tax savings!',
    'We\'re back online! 💫 Ready to help you optimize those tax benefits.',
    'Success! 🎉 Your HarvestPro experience is back to being smooth as silk.'
  ];

  const message = successMessages[Math.floor(Math.random() * successMessages.length)];
  
  humanizedErrorHandler.showRecoverySuccess(context);
}