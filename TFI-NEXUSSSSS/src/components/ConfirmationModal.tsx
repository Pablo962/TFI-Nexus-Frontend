import React, { useEffect } from 'react';
import { useFocusTrap } from './useFocusTrap';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'primary' | 'warning' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Sí, confirmar',
  cancelLabel = 'Volver / Cancelar',
  type = 'primary',
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useFocusTrap<HTMLDivElement>(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const iconName =
    type === 'danger'
      ? 'warning'
      : type === 'warning'
      ? 'help_outline'
      : 'check_circle';

  const iconColor =
    type === 'danger'
      ? 'bg-rose-100 text-rose-700'
      : type === 'warning'
      ? 'bg-amber-100 text-amber-800'
      : 'bg-primary-fixed text-primary';

  const confirmBtnStyle =
    type === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 text-white'
      : 'bg-primary hover:bg-primary-container text-on-primary';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        className="bg-surface-container-lowest max-w-md w-full rounded-3xl p-6 shadow-2xl border border-outline-variant/40 flex flex-col gap-4 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-3.5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${iconColor}`}>
            <span className="material-symbols-outlined text-2xl">{iconName}</span>
          </div>
          <div className="flex-1">
            <h3 id="confirmation-title" className="text-base font-black text-on-surface leading-tight mb-1">
              {title}
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-outline-variant/20">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${confirmBtnStyle}`}
          >
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
