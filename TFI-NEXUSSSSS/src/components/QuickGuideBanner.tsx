import React, { useState } from 'react';

interface QuickGuideBannerProps {
  title: string;
  description: string;
  tips: string[];
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const QuickGuideBanner: React.FC<QuickGuideBannerProps> = ({
  title,
  description,
  tips,
  dismissible = true,
  onDismiss,
}) => {
  const storageKey = `nexus_guide_dismissed_${title.replace(/\s+/g, '_').toLowerCase()}`;
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch {
      return false;
    }
  });

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(storageKey, 'true');
    } catch {}
    onDismiss?.();
  };

  return (
    <>
      {/* Slim inline helper bar */}
      <div className="bg-surface-container-low/80 border border-outline-variant/50 rounded-lg px-3 py-1.5 transition-all flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-outline text-[16px] shrink-0">lightbulb</span>
          <span className="font-semibold text-on-surface truncate">{title}</span>
          <span className="hidden md:inline-block text-[11px] text-outline truncate">&bull; {description}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="text-xs font-semibold text-primary hover:underline px-2 py-0.5 rounded transition-colors flex items-center gap-0.5 cursor-pointer"
          >
            <span>Ver guía</span>
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </button>
          {dismissible && (
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              title="Ocultar guía"
              aria-label="Ocultar guía"
            >
              <span className="material-symbols-outlined text-[15px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal Dialog for Guide Tips */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-surface-container-lowest max-w-lg w-full rounded-xl p-5 shadow-xl border border-outline-variant/40 flex flex-col gap-4 animate-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-lg">lightbulb</span>
                </span>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">{title}</h3>
                  <p className="text-xs text-outline mt-0.5">{description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="space-y-2 pt-1">
              {tips.map((tip, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-on-surface bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/30"
                >
                  <span className="w-4 h-4 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
