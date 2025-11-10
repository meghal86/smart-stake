/**
 * Example Usage of CSP Nonces in Server Components
 * 
 * This file demonstrates how to use the nonce utilities
 * to add inline scripts and styles that comply with CSP.
 */

import { getNonce, getNonceAttr } from './nonce';

/**
 * Example 1: Inline Script with Nonce
 */
export function ExampleInlineScript() {
  const nonce = getNonce();
  
  return (
    <script nonce={nonce}>
      {`
        // This inline script is allowed by CSP because it has a nonce
        console.log('Hunter Screen loaded');
        
        // Track page view
        if (window.analytics) {
          window.analytics.track('page_view', {
            page: 'hunter',
            timestamp: Date.now()
          });
        }
      `}
    </script>
  );
}

/**
 * Example 2: Inline Style with Nonce
 */
export function ExampleInlineStyle() {
  const nonce = getNonce();
  
  return (
    <style nonce={nonce}>
      {`
        /* Critical CSS that needs to be inline */
        .hunter-screen {
          min-height: 100vh;
          background: var(--background);
        }
        
        .opportunity-card {
          transition: transform 0.2s ease;
        }
        
        .opportunity-card:hover {
          transform: translateY(-2px);
        }
      `}
    </style>
  );
}

/**
 * Example 3: Using Spread Operator
 */
export function ExampleSpreadOperator() {
  return (
    <>
      {/* Inline script with spread operator */}
      <script {...getNonceAttr()}>
        {`
          // Initialize feature flags
          window.__FEATURE_FLAGS__ = {
            rankingModelV2: true,
            eligibilityPreviewV2: false
          };
        `}
      </script>
      
      {/* Inline style with spread operator */}
      <style {...getNonceAttr()}>
        {`
          /* Loading animation */
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          .loading {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}
      </style>
    </>
  );
}

/**
 * Example 4: Conditional Nonce Usage
 */
export function ExampleConditionalNonce({ enableAnalytics }: { enableAnalytics: boolean }) {
  const nonce = getNonce();
  
  if (!enableAnalytics) {
    return null;
  }
  
  return (
    <script nonce={nonce}>
      {`
        // Only load analytics if enabled
        (function() {
          const script = document.createElement('script');
          script.src = 'https://analytics.alphawhale.com/tracker.js';
          script.async = true;
          document.head.appendChild(script);
        })();
      `}
    </script>
  );
}

/**
 * Example 5: Multiple Inline Elements
 */
export function ExampleMultipleInline() {
  const nonce = getNonce();
  
  return (
    <>
      {/* Critical CSS */}
      <style nonce={nonce}>
        {`
          .hunter-header {
            position: sticky;
            top: 0;
            z-index: 50;
          }
        `}
      </style>
      
      {/* Feature detection */}
      <script nonce={nonce}>
        {`
          // Detect WebP support
          const webpSupport = document.createElement('canvas')
            .toDataURL('image/webp')
            .indexOf('data:image/webp') === 0;
          
          document.documentElement.classList.add(
            webpSupport ? 'webp' : 'no-webp'
          );
        `}
      </script>
      
      {/* Performance monitoring */}
      <script nonce={nonce}>
        {`
          // Monitor FCP
          if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                  console.log('FCP:', entry.startTime);
                }
              }
            });
            observer.observe({ entryTypes: ['paint'] });
          }
        `}
      </script>
    </>
  );
}

/**
 * Example 6: Server Component with Layout
 */
export default function ExampleLayout({ children }: { children: React.ReactNode }) {
  const nonce = getNonce();
  
  return (
    <html lang="en">
      <head>
        {/* Critical CSS for above-the-fold content */}
        <style nonce={nonce}>
          {`
            /* Reset and base styles */
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              line-height: 1.5;
            }
          `}
        </style>
        
        {/* Feature flags initialization */}
        <script nonce={nonce}>
          {`
            window.__HUNTER_CONFIG__ = {
              apiVersion: '1.0.0',
              features: {
                ranking: true,
                eligibility: true,
                guardian: true
              }
            };
          `}
        </script>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

/**
 * IMPORTANT NOTES:
 * 
 * 1. Nonces only work in Server Components
 *    - Don't try to use getNonce() in Client Components
 *    - Client Components should use external CSS/JS files
 * 
 * 2. Prefer external files when possible
 *    - Inline scripts/styles should be minimal
 *    - Use for critical CSS and feature detection only
 * 
 * 3. Production CSP is strict
 *    - No unsafe-inline or unsafe-eval
 *    - All inline code must have a nonce
 *    - Test in production mode before deploying
 * 
 * 4. Development is more permissive
 *    - unsafe-inline and unsafe-eval are allowed
 *    - Nonces still work but aren't strictly required
 * 
 * 5. Security best practices
 *    - Never log nonces
 *    - Keep inline code minimal
 *    - Sanitize any user input
 *    - Use external files for large scripts
 */
