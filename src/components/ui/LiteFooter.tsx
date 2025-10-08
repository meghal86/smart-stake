/**
 * Lite Footer - Consistent AlphaWhale Branding
 */

import { useNavigate } from 'react-router-dom';

export function LiteFooter() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200/40 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur">
      <div className="px-4 py-3">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-700 dark:text-slate-300">AlphaWhale</span>
          <span>•</span>
          <button 
            onClick={() => navigate('/terms')} 
            className="hover:text-cyan-500 transition-colors"
          >
            Terms
          </button>
          <span>•</span>
          <button 
            onClick={() => navigate('/privacy')} 
            className="hover:text-cyan-500 transition-colors"
          >
            Privacy
          </button>
        </div>
      </div>
    </footer>
  );
}