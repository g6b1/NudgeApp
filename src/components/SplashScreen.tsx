import React, { useEffect, useState } from 'react';
import { Sprout } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setFading(true), 950);
    const doneTimer = window.setTimeout(() => onFinish(), 1350);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onFinish]);

  return (
    <div
      onClick={onFinish}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--nudge-canvas)] transition-opacity duration-400 cursor-pointer select-none ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="Nudge splash screen"
    >
      <div className="relative flex flex-col items-center text-center px-6">
        <div
          className="w-16 h-16 rounded-3xl glass-panel-strong flex items-center justify-center mb-5 transition-transform duration-700 scale-100"
          style={{ backgroundColor: 'var(--nudge-accent-soft)' }}
        >
          <Sprout className="w-8 h-8" style={{ color: 'var(--nudge-accent)' }} strokeWidth={1.75} />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight text-[var(--nudge-ink)]">
          Nudge
        </h1>
        <p className="text-sm text-[var(--nudge-muted)] mt-2 tracking-wide">
          A little push toward a better day.
        </p>
      </div>
    </div>
  );
};
