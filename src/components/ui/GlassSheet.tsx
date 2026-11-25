import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface GlassSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
}

export const GlassSheet: React.FC<GlassSheetProps> = ({
  open,
  onClose,
  title,
  subtitle,
  maxWidthClass = 'max-w-xl',
  children,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/35 backdrop-blur-sm md:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Dialog'}
    >
      <div
        className={`glass-panel-strong w-full ${maxWidthClass} max-h-[90dvh] rounded-t-3xl md:rounded-3xl flex flex-col overflow-hidden transition-transform duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="md:hidden w-10 h-1 rounded-full bg-current opacity-20 mx-auto mt-2.5 mb-1 shrink-0" />
        {(title || subtitle) && (
          <div className="flex items-start justify-between gap-4 px-5 pt-3 pb-3 md:px-6 md:pt-5 border-b border-[var(--nudge-glass-border)] shrink-0">
            <div className="min-w-0">
              {title && (
                <h2 className="font-display text-lg md:text-xl font-medium tracking-tight text-[var(--nudge-ink)] truncate">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-xs md:text-sm text-[var(--nudge-muted)] mt-0.5 leading-snug">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[var(--nudge-muted)] transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4 md:px-6 md:py-5 pb-safe">
          {children}
        </div>
      </div>
    </div>
  );
};
