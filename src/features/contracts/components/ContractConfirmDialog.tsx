import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ContractConfirmDialog: React.FC<Props> = ({
  isOpen,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  variant = 'primary',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const btnClasses =
    variant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 text-white'
      : variant === 'warning'
      ? 'bg-[var(--accent-primary,#2563eb)] hover:opacity-90 text-white'
      : 'bg-[var(--accent-primary,#2563eb)] hover:opacity-90 text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--surface-card,#ffffff)] rounded-2xl w-full max-w-md shadow-2xl border border-[var(--border-primary,#e2e8f0)] overflow-hidden">
        <div className="px-6 py-4 bg-[var(--surface-secondary,#f8fafc)] border-b border-[var(--border-primary,#e2e8f0)] flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-[var(--text-primary,#0f172a)] text-base">
            <AlertCircle className="w-5 h-5 text-[var(--accent-primary,#2563eb)]" />
            {title}
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-[var(--text-muted,#64748b)] hover:text-[var(--text-primary,#0f172a)] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 text-sm text-[var(--text-primary,#0f172a)] leading-relaxed">
          {message}
        </div>

        <div className="px-6 py-4 bg-[var(--surface-secondary,#f8fafc)] border-t border-[var(--border-primary,#e2e8f0)] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-[var(--border-primary,#e2e8f0)] text-[var(--text-primary,#0f172a)] text-xs font-bold rounded-xl hover:bg-[var(--surface-secondary,#f8fafc)] transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer ${btnClasses}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
