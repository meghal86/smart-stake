import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'alphawhale_legal_accepted';

export function LegalDisclosureModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      // Small delay so it doesn't flash on first paint
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h2 className="text-lg font-semibold text-foreground mb-2">Before you continue</h2>
        <p className="text-sm text-muted-foreground mb-4">
          AlphaWhale provides DeFi portfolio data and security tools for informational purposes only.
          <strong className="text-foreground"> This is not financial advice.</strong> Crypto assets are highly volatile.
          Never invest more than you can afford to lose.
        </p>
        <p className="text-xs text-muted-foreground mb-5">
          By continuing you agree to our{' '}
          <Link to="/legal/terms" className="text-primary underline" onClick={handleAccept}>Terms of Service</Link>
          {' '}and{' '}
          <Link to="/legal/privacy" className="text-primary underline" onClick={handleAccept}>Privacy Policy</Link>.
        </p>
        <button
          onClick={handleAccept}
          className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium hover:bg-primary/90 transition-colors"
        >
          I understand — Continue
        </button>
      </div>
    </div>
  );
}
