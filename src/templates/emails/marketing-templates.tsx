/**
 * Marketing Email Templates
 * Professional email templates for campaigns, promotions, and user engagement
 */

// Email template utilities
const emailStyles = {
  container: 'font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;',
  header: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;',
  logo: 'font-size: 32px; font-weight: bold; color: #ffffff; text-decoration: none;',
  body: 'padding: 40px 20px;',
  heading: 'font-size: 28px; font-weight: bold; color: #1a202c; margin-bottom: 16px;',
  text: 'font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 20px;',
  button: 'display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;',
  feature: 'background-color: #f7fafc; border-radius: 8px; padding: 20px; margin-bottom: 16px;',
  featureTitle: 'font-size: 18px; font-weight: bold; color: #2d3748; margin-bottom: 8px;',
  featureText: 'font-size: 14px; color: #718096; line-height: 1.5;',
  footer: 'background-color: #f7fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0;',
  footerText: 'font-size: 12px; color: #a0aec0; margin: 8px 0;'
};

/**
 * Welcome Email Template
 */
export const WelcomeEmailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to WhalePlus</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7fafc;">
  <div style="${emailStyles.container}">
    <!-- Header -->
    <div style="${emailStyles.header}">
      <a href="{{siteUrl}}" style="${emailStyles.logo}">🐋 WhalePlus</a>
    </div>

    <!-- Body -->
    <div style="${emailStyles.body}">
      <h1 style="${emailStyles.heading}">Welcome to WhalePlus, {{firstName}}! 👋</h1>
      
      <p style="${emailStyles.text}">
        Thanks for joining our community of 12,000+ traders who use WhalePlus to make smarter crypto investment decisions.
      </p>

      <p style="${emailStyles.text}">
        You now have access to professional-grade whale tracking and risk intelligence tools. Here's what you can do:
      </p>

      <!-- Features -->
      <div style="${emailStyles.feature}">
        <div style="${emailStyles.featureTitle}">📊 Track Whale Movements</div>
        <div style="${emailStyles.featureText}">
          Monitor large crypto holders in real-time and get instant alerts on significant transactions
        </div>
      </div>

      <div style="${emailStyles.feature}">
        <div style="${emailStyles.featureTitle}">🔔 Set Up Custom Alerts</div>
        <div style="${emailStyles.featureText}">
          Create personalized alerts for whale activities that matter to your portfolio
        </div>
      </div>

      <div style="${emailStyles.feature}">
        <div style="${emailStyles.featureTitle}">🛡️ Protect Your Portfolio</div>
        <div style="${emailStyles.featureText}">
          Use Guardian to analyze risks and detect threats before they impact your holdings
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="{{dashboardUrl}}" style="${emailStyles.button}">
          Get Started Now →
        </a>
      </div>

      <p style="${emailStyles.text}">
        Need help getting started? Check out our <a href="{{helpUrl}}" style="color: #667eea;">quick start guide</a> or reply to this email with any questions.
      </p>

      <p style="${emailStyles.text}">
        Happy whale watching! 🐋<br>
        The WhalePlus Team
      </p>
    </div>

    <!-- Footer -->
    <div style="${emailStyles.footer}">
      <p style="${emailStyles.footerText}">
        You're receiving this because you signed up for WhalePlus
      </p>
      <p style="${emailStyles.footerText}">
        <a href="{{unsubscribeUrl}}" style="color: #a0aec0; text-decoration: underline;">Unsubscribe</a> | 
        <a href="{{siteUrl}}" style="color: #a0aec0; text-decoration: underline;">Visit Website</a>
      </p>
      <p style="${emailStyles.footerText}">
        © {{year}} WhalePlus. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Feature Announcement Email Template
 */
export const FeatureAnnouncementTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Feature: {{featureName}}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7fafc;">
  <div style="${emailStyles.container}">
    <!-- Header -->
    <div style="${emailStyles.header}">
      <a href="{{siteUrl}}" style="${emailStyles.logo}">🐋 WhalePlus</a>
    </div>

    <!-- Body -->
    <div style="${emailStyles.body}">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="display: inline-block; padding: 8px 16px; background-color: #48bb78; color: white; border-radius: 20px; font-size: 14px; font-weight: bold;">
          ✨ NEW FEATURE
        </span>
      </div>

      <h1 style="${emailStyles.heading}">Introducing: {{featureName}}</h1>
      
      <p style="${emailStyles.text}">
        Hi {{firstName}},
      </p>

      <p style="${emailStyles.text}">
        We're excited to announce a powerful new feature that will help you {{featureDescription}}.
      </p>

      <!-- Feature highlight -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; color: white; margin: 30px 0; text-align: center;">
        <h2 style="font-size: 24px; margin-bottom: 12px;">{{featureTagline}}</h2>
        <p style="font-size: 16px; opacity: 0.9;">{{featureBenefit}}</p>
      </div>

      <!-- How it works -->
      <h2 style="font-size: 20px; font-weight: bold; color: #2d3748; margin: 30px 0 16px;">How It Works</h2>
      
      <div style="${emailStyles.feature}">
        <div style="${emailStyles.featureTitle}">1. {{step1Title}}</div>
        <div style="${emailStyles.featureText}">{{step1Description}}</div>
      </div>

      <div style="${emailStyles.feature}">
        <div style="${emailStyles.featureTitle}">2. {{step2Title}}</div>
        <div style="${emailStyles.featureText}">{{step2Description}}</div>
      </div>

      <div style="${emailStyles.feature}">
        <div style="${emailStyles.featureTitle}">3. {{step3Title}}</div>
        <div style="${emailStyles.featureText}">{{step3Description}}</div>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="{{featureUrl}}" style="${emailStyles.button}">
          Try It Now →
        </a>
      </div>

      <p style="${emailStyles.text}">
        This feature is available to all {{planType}} users. Questions? Just reply to this email!
      </p>
    </div>

    <!-- Footer -->
    <div style="${emailStyles.footer}">
      <p style="${emailStyles.footerText}">
        <a href="{{unsubscribeUrl}}" style="color: #a0aec0;">Unsubscribe</a> | 
        <a href="{{siteUrl}}" style="color: #a0aec0;">Visit Website</a>
      </p>
      <p style="${emailStyles.footerText}">© {{year}} WhalePlus</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Upgrade Promotion Email Template
 */
export const UpgradePromotionTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Upgrade to Pro</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7fafc;">
  <div style="${emailStyles.container}">
    <!-- Header -->
    <div style="${emailStyles.header}">
      <a href="{{siteUrl}}" style="${emailStyles.logo}">🐋 WhalePlus</a>
    </div>

    <!-- Body -->
    <div style="${emailStyles.body}">
      <h1 style="${emailStyles.heading}">Ready for More? Upgrade to Pro 🚀</h1>
      
      <p style="${emailStyles.text}">
        Hi {{firstName}},
      </p>

      <p style="${emailStyles.text}">
        You've been using WhalePlus Free for {{daysSinceSignup}} days. We hope you're enjoying tracking whale movements and protecting your portfolio!
      </p>

      <p style="${emailStyles.text}">
        Upgrade to <strong>WhalePlus Pro</strong> to unlock advanced features that professional traders rely on:
      </p>

      <!-- Pro features -->
      <div style="${emailStyles.feature}">
        <div style="${emailStyles.featureTitle}">🔥 Anomaly Detection</div>
        <div style="${emailStyles.featureText}">
          AI-powered algorithms detect unusual whale behavior and market anomalies before they happen
        </div>
      </div>

      <div style="${emailStyles.feature}">
        <div style="${emailStyles.featureTitle}">📊 Advanced Analytics</div>
        <div style="${emailStyles.featureText}">
          In-depth whale clustering analysis, trend detection, and predictive insights
        </div>
      </div>

      <div style="${emailStyles.feature}">
        <div style="${emailStyles.featureTitle}">📈 Unlimited Alerts</div>
        <div style="${emailStyles.featureText}">
          Create unlimited custom alerts for whale activities across multiple chains
        </div>
      </div>

      <div style="${emailStyles.feature}">
        <div style="${emailStyles.featureTitle}">📄 Export Reports</div>
        <div style="${emailStyles.featureText}">
          Generate professional PDF/CSV reports for your records and analysis
        </div>
      </div>

      <!-- Pricing -->
      <div style="background-color: #f7fafc; border: 2px solid #667eea; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
        <div style="font-size: 14px; color: #718096; margin-bottom: 8px;">SPECIAL OFFER</div>
        <div style="font-size: 48px; font-weight: bold; color: #667eea; margin-bottom: 8px;">
          $29<span style="font-size: 24px; color: #a0aec0;">/month</span>
        </div>
        <div style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
          <del>$49/month</del> Save 40% 
        </div>
        <a href="{{upgradeUrl}}" style="${emailStyles.button}">
          Upgrade to Pro →
        </a>
        <div style="font-size: 12px; color: #a0aec0; margin-top: 16px;">
          Cancel anytime • 14-day money-back guarantee
        </div>
      </div>

      <p style="${emailStyles.text}">
        Join 5,000+ Pro users who have upgraded their whale tracking game!
      </p>
    </div>

    <!-- Footer -->
    <div style="${emailStyles.footer}">
      <p style="${emailStyles.footerText}">
        <a href="{{unsubscribeUrl}}" style="color: #a0aec0;">Unsubscribe</a> | 
        <a href="{{siteUrl}}" style="color: #a0aec0;">Visit Website</a>
      </p>
      <p style="${emailStyles.footerText}">© {{year}} WhalePlus</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Weekly Digest Email Template
 */
export const WeeklyDigestTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Whale Digest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7fafc;">
  <div style="${emailStyles.container}">
    <!-- Header -->
    <div style="${emailStyles.header}">
      <a href="{{siteUrl}}" style="${emailStyles.logo}">🐋 WhalePlus</a>
      <div style="color: white; margin-top: 12px; opacity: 0.9;">
        Your Weekly Whale Digest
      </div>
    </div>

    <!-- Body -->
    <div style="${emailStyles.body}">
      <h1 style="${emailStyles.heading}">Week in Review: {{weekStart}} - {{weekEnd}}</h1>
      
      <p style="${emailStyles.text}">
        Hi {{firstName}}, here's what happened in the whale world this week:
      </p>

      <!-- Key metrics -->
      <div style="display: flex; margin: 30px 0; text-align: center;">
        <div style="flex: 1; padding: 20px;">
          <div style="font-size: 32px; font-weight: bold; color: #667eea;">{{totalWhaleTransactions}}</div>
          <div style="font-size: 14px; color: #718096;">Whale Transactions</div>
        </div>
        <div style="flex: 1; padding: 20px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
          <div style="font-size: 32px; font-weight: bold; color: #48bb78;">{{totalVolume}}</div>
          <div style="font-size: 14px; color: #718096;">Total Volume</div>
        </div>
        <div style="flex: 1; padding: 20px;">
          <div style="font-size: 32px; font-weight: bold; color: #f56565;">{{anomaliesDetected}}</div>
          <div style="font-size: 14px; color: #718096;">Anomalies Detected</div>
        </div>
      </div>

      <!-- Top alerts -->
      <h2 style="font-size: 20px; font-weight: bold; color: #2d3748; margin: 30px 0 16px;">🔔 Your Top Alerts</h2>
      
      {{#each topAlerts}}
      <div style="${emailStyles.feature}">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
          <div style="${emailStyles.featureTitle}">{{this.title}}</div>
          <span style="padding: 4px 8px; background-color: {{this.severityColor}}; color: white; border-radius: 4px; font-size: 12px; font-weight: bold;">
            {{this.severity}}
          </span>
        </div>
        <div style="${emailStyles.featureText}">{{this.description}}</div>
        <div style="font-size: 12px; color: #a0aec0; margin-top: 8px;">{{this.timestamp}}</div>
      </div>
      {{/each}}

      <!-- Trending whales -->
      <h2 style="font-size: 20px; font-weight: bold; color: #2d3748; margin: 30px 0 16px;">📈 Trending Whales</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f7fafc; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 12px; text-align: left; font-size: 14px; color: #718096;">Whale</th>
            <th style="padding: 12px; text-align: right; font-size: 14px; color: #718096;">Activity</th>
            <th style="padding: 12px; text-align: right; font-size: 14px; color: #718096;">Risk</th>
          </tr>
        </thead>
        <tbody>
          {{#each trendingWhales}}
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px; font-size: 14px;">{{this.address}}</td>
            <td style="padding: 12px; text-align: right; font-size: 14px;">{{this.activity}}</td>
            <td style="padding: 12px; text-align: right;">
              <span style="padding: 4px 8px; background-color: {{this.riskColor}}; color: white; border-radius: 4px; font-size: 12px;">
                {{this.risk}}
              </span>
            </td>
          </tr>
          {{/each}}
        </tbody>
      </table>

      <!-- CTA -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="{{dashboardUrl}}" style="${emailStyles.button}">
          View Full Dashboard →
        </a>
      </div>

      <p style="${emailStyles.text}">
        Stay ahead of the market. Keep tracking! 🐋
      </p>
    </div>

    <!-- Footer -->
    <div style="${emailStyles.footer}">
      <p style="${emailStyles.footerText}">
        <a href="{{unsubscribeUrl}}" style="color: #a0aec0;">Unsubscribe</a> | 
        <a href="{{settingsUrl}}" style="color: #a0aec0;">Email Settings</a>
      </p>
      <p style="${emailStyles.footerText}">© {{year}} WhalePlus</p>
    </div>
  </div>
</body>
</html>
`;

// TypeScript interfaces for template variables
export interface WelcomeEmailData {
  firstName: string;
  siteUrl: string;
  dashboardUrl: string;
  helpUrl: string;
  unsubscribeUrl: string;
  year: number;
}

export interface FeatureAnnouncementData {
  firstName: string;
  featureName: string;
  featureDescription: string;
  featureTagline: string;
  featureBenefit: string;
  step1Title: string;
  step1Description: string;
  step2Title: string;
  step2Description: string;
  step3Title: string;
  step3Description: string;
  featureUrl: string;
  planType: string;
  siteUrl: string;
  unsubscribeUrl: string;
  year: number;
}

export interface UpgradePromotionData {
  firstName: string;
  daysSinceSignup: number;
  upgradeUrl: string;
  siteUrl: string;
  unsubscribeUrl: string;
  year: number;
}

export interface WeeklyDigestData {
  firstName: string;
  weekStart: string;
  weekEnd: string;
  totalWhaleTransactions: number;
  totalVolume: string;
  anomaliesDetected: number;
  topAlerts: Array<{
    title: string;
    severity: string;
    severityColor: string;
    description: string;
    timestamp: string;
  }>;
  trendingWhales: Array<{
    address: string;
    activity: string;
    risk: string;
    riskColor: string;
  }>;
  dashboardUrl: string;
  settingsUrl: string;
  unsubscribeUrl: string;
  siteUrl: string;
  year: number;
}

