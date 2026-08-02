import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface Props {
  missingFields: { key: string; label: string; step: number }[];
  onGoToStep?: (step: number) => void;
}

export const ContractMissingFieldsAlert: React.FC<Props> = ({ missingFields, onGoToStep }) => {
  if (missingFields.length === 0) return null;

  return (
    <div className="bg-[var(--accent-light,#eff6ff)] border border-[var(--accent-primary,#2563eb)]/30 rounded-xl p-4 mb-6 text-[var(--text-primary,#0f172a)] shadow-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-[var(--accent-primary,#2563eb)]/10 text-[var(--accent-primary,#2563eb)] rounded-lg shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-[var(--accent-primary,#2563eb)] text-sm uppercase tracking-wide">
            Нужно заполнить ({missingFields.length})
          </h4>
          <p className="text-xs text-[var(--text-muted,#64748b)] mt-1">
            Для отправки договора на согласование заполните следующие данные:
          </p>
          <ul className="mt-3 space-y-1.5 text-xs">
            {missingFields.map((field) => (
              <li key={field.key} className="flex items-center justify-between bg-[var(--surface-card,#ffffff)] px-3 py-1.5 rounded-lg border border-[var(--border-primary,#e2e8f0)]">
                <span className="font-medium text-[var(--text-primary,#0f172a)]">{field.label}</span>
                {onGoToStep && (
                  <button
                    onClick={() => onGoToStep(field.step)}
                    className="inline-flex items-center gap-1 text-[var(--accent-primary,#2563eb)] hover:opacity-80 font-semibold cursor-pointer"
                  >
                    Заполнить <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
