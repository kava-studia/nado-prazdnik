import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'success' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  type = 'info',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-400" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      default:
        return <Info className="w-6 h-6 text-primary" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="confirm-dialog-overlay">
      {/* Blurred background overlay */}
      <div
        className="absolute inset-0 bg-surface/80 backdrop-blur-md transition-opacity"
        onClick={onCancel}
      />

      {/* Modal Box */}
      <div className="glass-card rounded-2xl max-w-sm w-full p-6 relative z-10 border border-white/10 animate-in fade-in zoom-in-95 duration-250">
        <div className="flex gap-4 items-start mb-4">
          <div className="p-2 rounded-full bg-white/5 shrink-0">
            {getIcon()}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-outline leading-relaxed font-sans">
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6 pt-3 border-t border-white/5">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-all"
            id="dialog-cancel-button"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-gold text-surface-dim text-xs font-bold transition-all shadow-md shadow-primary/20"
            id="dialog-confirm-button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
