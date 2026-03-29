/**
 * IosSubscriptionRedirect — Shown on iOS native app instead of Stripe checkout.
 *
 * Apple App Store rules (Guideline 3.1.1) prohibit linking directly to web
 * payment pages. This component shows a message directing users to subscribe
 * via the website, which is the approved "Reader App" workaround used by
 * Spotify, Netflix, etc.
 *
 * ONLY shown when running as a native Capacitor app (not in web browser).
 */
import { ExternalLink, Shield } from 'lucide-react';

interface IosSubscriptionRedirectProps {
  planName?: string;
  price?: string;
}

export function IosSubscriptionRedirect({
  planName = 'Pro',
  price = '$19/month',
}: IosSubscriptionRedirectProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
        <Shield className="w-8 h-8 text-primary" />
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-3">
        Upgrade to AlphaWhale {planName}
      </h2>

      <p className="text-muted-foreground mb-2 max-w-sm">
        {price} · Cancel anytime
      </p>

      <p className="text-sm text-muted-foreground mb-8 max-w-sm leading-relaxed">
        To subscribe, visit <span className="font-semibold text-foreground">alphawhale.app</span> in
        your browser. Subscriptions purchased there are automatically applied to your account here.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-xl px-4 py-3">
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
          <span>Open Safari → alphawhale.app/subscription</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-8 max-w-sm">
        Already subscribed on the web? Sign out and back in to refresh your plan status.
      </p>
    </div>
  );
}
