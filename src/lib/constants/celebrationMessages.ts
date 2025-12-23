/**
 * Celebration Messages Constants
 * 
 * Human-friendly celebration, success, and delight messages for the AlphaWhale platform.
 * All messages should be encouraging, personal, and create positive moments.
 * 
 * Requirements: R16.MICROCOPY.CELEBRATIONS, R16.MICROCOPY.ENCOURAGING
 */

/**
 * Celebration Messages for Key User Actions
 */
export const CELEBRATION_MESSAGES = {
  // Wallet Connection Celebrations
  WALLET_FIRST_CONNECTION: {
    title: '🔗 Wallet Connected!',
    description: 'Welcome to the DeFi universe! Your personalized journey begins now.',
    duration: 5000
  },
  WALLET_RECONNECTION: {
    title: '✓ Welcome back!',
    description: 'Ready to explore personalized DeFi opportunities!',
    duration: 3000
  },
  WALLET_MULTIPLE_CONNECTED: {
    title: '🔗 Another wallet connected!',
    description: 'More wallets mean better portfolio insights and opportunities.',
    duration: 4000
  },

  // Quest & Learning Celebrations
  QUEST_JOINED: {
    title: '🎯 Quest Joined!',
    description: 'Time to earn rewards and learn something new!',
    duration: 4000
  },
  QUEST_COMPLETED: {
    title: '🏆 Quest Complete!',
    description: 'Awesome work! You\'ve earned rewards and new knowledge.',
    duration: 5000
  },
  FIRST_QUEST: {
    title: '🎯 First Quest Started!',
    description: 'Your DeFi adventure begins! Complete quests to earn and learn.',
    duration: 5000
  },

  // Security & Guardian Celebrations
  SCAN_COMPLETED_CLEAN: {
    title: '🛡️ All Clear!',
    description: 'No risks detected - your wallet security looks great!',
    duration: 4000
  },
  SCAN_COMPLETED_RISKS: {
    title: '🛡️ Scan Complete!',
    description: 'We found some items to review. Knowledge is power!',
    duration: 4000
  },
  FIRST_SCAN: {
    title: '🛡️ First Security Scan!',
    description: 'Great job taking your first step toward DeFi security!',
    duration: 5000
  },
  RISK_RESOLVED: {
    title: '✅ Risk Resolved!',
    description: 'Excellent! You\'re becoming a security pro.',
    duration: 4000
  },

  // Opportunity & Hunter Celebrations
  OPPORTUNITY_FOUND: {
    title: '💎 Opportunity Discovered!',
    description: 'We found personalized DeFi opportunities just for you!',
    duration: 4000
  },
  OPPORTUNITY_SAVED: {
    title: '💾 Opportunity Saved!',
    description: 'We\'ll keep track of this opportunity for you.',
    duration: 3000
  },
  FIRST_OPPORTUNITY: {
    title: '💎 First Opportunity Found!',
    description: 'Exciting! Your personalized DeFi journey is taking shape.',
    duration: 5000
  },

  // Portfolio & HarvestPro Celebrations
  PORTFOLIO_MILESTONE: {
    title: '📈 Portfolio Milestone!',
    description: 'Your DeFi portfolio is growing! Keep up the great work.',
    duration: 4000
  },
  HARVEST_EXECUTED: {
    title: '🌾 Harvest Complete!',
    description: 'Tax-loss harvesting executed successfully. Smart move!',
    duration: 4000
  },
  FIRST_HARVEST: {
    title: '🌾 First Harvest!',
    description: 'Welcome to smart tax optimization! You\'re saving money.',
    duration: 5000
  },

  // Settings & Preferences Celebrations
  SETTINGS_SAVED: {
    title: '⚙️ Settings Saved!',
    description: 'Your preferences have been updated successfully.',
    duration: 3000
  },
  ALERT_CREATED: {
    title: '🔔 Alert Created!',
    description: 'You\'ll be notified when conditions are met.',
    duration: 3000
  },
  PREFERENCES_OPTIMIZED: {
    title: '🎯 Preferences Optimized!',
    description: 'Your experience is now personalized just for you.',
    duration: 4000
  },

  // Learning & Achievement Celebrations
  LEARNING_MILESTONE: {
    title: '🎓 Learning Milestone!',
    description: 'Knowledge is power! You\'re mastering DeFi concepts.',
    duration: 4000
  },
  ACHIEVEMENT_UNLOCKED: {
    title: '🏅 Achievement Unlocked!',
    description: 'You\'re becoming a DeFi expert! Keep exploring.',
    duration: 4000
  },
  STREAK_MILESTONE: {
    title: '🔥 Streak Milestone!',
    description: 'Consistency pays off! Your dedication is impressive.',
    duration: 4000
  },

  // Social & Community Celebrations
  COMMUNITY_JOINED: {
    title: '👥 Welcome to the Community!',
    description: 'You\'re now part of the AlphaWhale family!',
    duration: 4000
  },
  FEEDBACK_SUBMITTED: {
    title: '💬 Feedback Received!',
    description: 'Thank you! Your input helps make AlphaWhale better.',
    duration: 3000
  },

  // Data & Sync Celebrations
  DATA_SYNCED: {
    title: '🔄 Data Synced!',
    description: 'Your portfolio data is now up to date.',
    duration: 3000
  },
  BACKUP_CREATED: {
    title: '💾 Backup Created!',
    description: 'Your data is safe and secure.',
    duration: 3000
  }
} as const;

/**
 * Milestone Messages for Major Achievements
 */
export const MILESTONE_MESSAGES = {
  // User Journey Milestones
  ONBOARDING_COMPLETE: {
    title: '🚀 Onboarding Complete!',
    description: 'You\'re all set! Ready to explore the DeFi universe?',
    emoji: '🚀'
  },
  FIRST_WEEK: {
    title: '📅 One Week Strong!',
    description: 'You\'ve been exploring DeFi for a week. Great progress!',
    emoji: '📅'
  },
  FIRST_MONTH: {
    title: '🗓️ One Month Milestone!',
    description: 'A month of DeFi exploration! You\'re becoming an expert.',
    emoji: '🗓️'
  },

  // Portfolio Milestones
  PORTFOLIO_1K: {
    title: '💰 $1K Portfolio!',
    description: 'Your DeFi portfolio has reached $1,000! Well done!',
    emoji: '💰'
  },
  PORTFOLIO_10K: {
    title: '💎 $10K Portfolio!',
    description: 'Impressive! Your portfolio has grown to $10,000!',
    emoji: '💎'
  },
  PORTFOLIO_100K: {
    title: '🏆 $100K Portfolio!',
    description: 'Incredible achievement! You\'re a DeFi champion!',
    emoji: '🏆'
  },

  // Security Milestones
  SECURITY_EXPERT: {
    title: '🛡️ Security Expert!',
    description: 'You\'ve mastered wallet security! Your funds are safe.',
    emoji: '🛡️'
  },
  RISK_RESOLVER: {
    title: '🔧 Risk Resolver!',
    description: 'You\'ve resolved multiple security risks. Great job!',
    emoji: '🔧'
  },

  // Learning Milestones
  DEFI_SCHOLAR: {
    title: '🎓 DeFi Scholar!',
    description: 'You\'ve completed multiple learning quests. Impressive!',
    emoji: '🎓'
  },
  PROTOCOL_MASTER: {
    title: '⚡ Protocol Master!',
    description: 'You understand multiple DeFi protocols. You\'re an expert!',
    emoji: '⚡'
  }
} as const;

/**
 * Welcome Messages for Different User States
 */
export const WELCOME_MESSAGES = {
  // New User Welcome
  NEW_USER: {
    title: '🚀 Welcome to AlphaWhale!',
    description: 'Ready to discover amazing DeFi opportunities? Let\'s get started!'
  },
  
  // Returning User Welcome (by time away)
  SAME_DAY: {
    title: '👋 Welcome back!',
    description: 'Ready to continue where you left off?'
  },
  YESTERDAY: {
    title: '👋 Good to see you again!',
    description: 'Let\'s check what new opportunities await you today.'
  },
  THIS_WEEK: {
    title: '🎯 Welcome back, explorer!',
    description: 'Ready to discover what\'s new in DeFi?'
  },
  LONG_TIME: {
    title: '🌟 Long time no see!',
    description: 'Welcome back! The DeFi landscape has been busy while you were away.'
  },

  // Contextual Welcome Messages
  MORNING: {
    title: '🌅 Good morning!',
    description: 'Ready to start your DeFi day? Let\'s see what opportunities await.'
  },
  AFTERNOON: {
    title: '☀️ Good afternoon!',
    description: 'Perfect time to check your portfolio and explore new opportunities.'
  },
  EVENING: {
    title: '🌙 Good evening!',
    description: 'Winding down? Take a moment to review your DeFi progress.'
  },

  // Achievement-Based Welcome
  STREAK_WELCOME: {
    title: '🔥 Welcome back, consistent explorer!',
    description: 'Your daily DeFi journey continues. Keep up the great work!'
  },
  MILESTONE_WELCOME: {
    title: '🏆 Welcome back, achiever!',
    description: 'Ready to unlock your next milestone?'
  }
} as const;

/**
 * Encouraging Empty State Messages
 */
export const EMPTY_STATE_MESSAGES = {
  // Opportunities Empty States
  OPPORTUNITIES_FIRST_TIME: {
    title: 'Ready to find your first opportunity?',
    description: 'Connect your wallet and we\'ll scan for personalized DeFi opportunities just for you.',
    actionText: 'Connect Wallet',
    actionHint: 'This unlocks live, personalized results'
  },
  OPPORTUNITIES_NO_MATCHES: {
    title: 'No matches for those filters',
    description: 'Try adjusting your criteria or clearing filters to see more opportunities.',
    actionText: 'Clear Filters',
    actionHint: 'Broaden your search to find more options'
  },
  OPPORTUNITIES_ALL_CAUGHT_UP: {
    title: 'All caught up!',
    description: 'No new opportunities right now, but we\'re constantly scanning. Check back soon!',
    actionText: 'Refresh',
    actionHint: 'New opportunities appear regularly'
  },

  // Security Empty States
  RISKS_NONE_FOUND: {
    title: '✅ All clear!',
    description: 'No security risks found. Your wallets are looking good!',
    actionText: 'Run New Scan',
    actionHint: 'Stay protected with regular scans'
  },
  RISKS_FIRST_TIME: {
    title: 'No active risks detected',
    description: 'Great news! Your connected wallets look secure. We\'ll keep monitoring for you.',
    actionText: 'Learn More',
    actionHint: 'Discover how Guardian protects you'
  },

  // Quest Empty States
  QUESTS_FIRST_TIME: {
    title: 'Your DeFi adventure awaits!',
    description: 'Complete quests to earn rewards and learn about exciting protocols.',
    actionText: 'Explore Quests',
    actionHint: 'Start with beginner-friendly options'
  },
  QUESTS_ALL_COMPLETE: {
    title: 'Quest master in the making!',
    description: 'You\'ve completed all available quests. New adventures coming soon!',
    actionText: 'View Completed',
    actionHint: 'See your achievements and rewards'
  },

  // Portfolio Empty States
  PORTFOLIO_FIRST_TIME: {
    title: 'Ready to track your DeFi journey?',
    description: 'Connect your wallet to see your portfolio performance and insights.',
    actionText: 'Connect Wallet',
    actionHint: 'Get personalized portfolio analytics'
  },
  PORTFOLIO_EMPTY: {
    title: 'Portfolio is empty',
    description: 'Start your DeFi journey by exploring opportunities or connecting more wallets.',
    actionText: 'Find Opportunities',
    actionHint: 'Discover yield farming and staking options'
  },

  // Alerts Empty States
  ALERTS_FIRST_TIME: {
    title: 'Stay in the loop!',
    description: 'Set up alerts to never miss important portfolio changes or new opportunities.',
    actionText: 'Create Alert',
    actionHint: 'Get notified about price changes and risks'
  },
  ALERTS_ALL_QUIET: {
    title: 'All quiet on the DeFi front',
    description: 'No new alerts. Your portfolio is stable and secure.',
    actionText: 'Manage Alerts',
    actionHint: 'Adjust your notification preferences'
  },

  // History Empty States
  HISTORY_FIRST_TIME: {
    title: 'Your journey starts here',
    description: 'As you use AlphaWhale, your activity history will appear here.',
    actionText: 'Get Started',
    actionHint: 'Connect wallet or explore features'
  },
  HISTORY_NO_ACTIVITY: {
    title: 'History is in the making',
    description: 'No recent activity. Ready to explore new opportunities?',
    actionText: 'Explore Features',
    actionHint: 'Check Guardian, Hunter, or HarvestPro'
  }
} as const;

/**
 * Helper function to get celebration message by key
 */
export const getCelebrationMessage = (key: keyof typeof CELEBRATION_MESSAGES) => {
  return CELEBRATION_MESSAGES[key];
};

/**
 * Helper function to get milestone message by key
 */
export const getMilestoneMessage = (key: keyof typeof MILESTONE_MESSAGES) => {
  return MILESTONE_MESSAGES[key];
};

/**
 * Helper function to get welcome message by key
 */
export const getWelcomeMessage = (key: keyof typeof WELCOME_MESSAGES) => {
  return WELCOME_MESSAGES[key];
};

/**
 * Helper function to get empty state message by key
 */
export const getEmptyStateMessage = (key: keyof typeof EMPTY_STATE_MESSAGES) => {
  return EMPTY_STATE_MESSAGES[key];
};