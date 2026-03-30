import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  duration = 1800,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [logoSrc, setLogoSrc] = useState('/header.png');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsExiting(true);
    }, duration);

    const completeTimer = window.setTimeout(() => {
      onComplete();
    }, duration + 320);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <div
      className={[
        'fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#04070d] transition-opacity duration-300',
        isExiting ? 'opacity-0' : 'opacity-100',
      ].join(' ')}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(117,153,255,0.16),transparent_28%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.05),transparent_32%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_35%,rgba(255,255,255,0.01))]" />

      <div
        className={[
          'relative flex w-[min(360px,calc(100vw-32px))] flex-col items-center rounded-[32px] border border-white/10 bg-white/[0.03] px-8 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition-all duration-500',
          isExiting ? 'translate-y-3 scale-[0.985]' : 'translate-y-0 scale-100',
        ].join(' ')}
      >
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <img
            src={logoSrc}
            alt="WhalePulse"
            className="h-9 w-9 object-contain"
            onError={() => {
              if (logoSrc !== '/hero_logo_512.png') {
                setLogoSrc('/hero_logo_512.png');
              }
            }}
          />
        </div>

        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.36em] text-white/55">
            WhalePulse
          </p>
          <h1 className="text-[32px] font-semibold tracking-[-0.04em] text-stone-100">
            Overview
          </h1>
          <p className="text-sm text-slate-400">
            Loading your workspace
          </p>
        </div>

        <div className="mt-8 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full w-full origin-left animate-[splash-load_1.55s_cubic-bezier(0.22,1,0.36,1)_forwards] rounded-full bg-gradient-to-r from-[#7ea3f2] via-[#b7c9ff] to-[#f4efe6]" />
        </div>
      </div>

      <style>{`
        @keyframes splash-load {
          0% { transform: scaleX(0.12); opacity: 0.6; }
          100% { transform: scaleX(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
