import React from 'react';
import { VersionDiffItem } from '../types';
import { formatDate } from '../utils/contractFormatters';
import { ArrowRight, User, Calendar, FileCode } from 'lucide-react';

interface Props {
  diffs: VersionDiffItem[];
  versionNumA: number;
  versionNumB: number;
}

export const ContractVersionCompareTable: React.FC<Props> = ({ diffs, versionNumA, versionNumB }) => {
  if (diffs.length === 0) {
    return (
      <div className="bg-[var(--surface-secondary,#f8fafc)] border border-[var(--border-primary,#e2e8f0)] rounded-xl p-8 text-center text-[var(--text-muted,#64748b)] text-sm">
        Различий между редакцией №{versionNumA} и редакцией №{versionNumB} не обнаружено. Все значения идентичны.
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface-card,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-[var(--surface-secondary,#f8fafc)] px-6 py-4 border-b border-[var(--border-primary,#e2e8f0)] flex items-center justify-between">
        <div className="font-bold text-[var(--text-primary,#0f172a)] text-sm flex items-center gap-2">
          <FileCode className="w-4 h-4 text-[var(--accent-primary,#2563eb)]" />
          Сравнение редакции №{versionNumA} и редакции №{versionNumB} ({diffs.length} изменений)
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[var(--surface-secondary,#f8fafc)] border-b border-[var(--border-primary,#e2e8f0)] text-[var(--text-muted,#64748b)] font-bold uppercase tracking-wider">
              <th className="p-3.5">Поле / Параметр</th>
              <th className="p-3.5 bg-rose-50/40 text-rose-900">Редакция №{versionNumA} (Старое)</th>
              <th className="p-3.5 bg-emerald-50/40 text-emerald-900">Редакция №{versionNumB} (Новое)</th>
              <th className="p-3.5">Кто и когда изменил</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-primary,#e2e8f0)]">
            {diffs.map((item) => (
              <tr key={item.key} className="hover:bg-[var(--surface-secondary,#f8fafc)]/60 transition-colors">
                <td className="p-3.5 font-bold text-[var(--text-primary,#0f172a)]">
                  {item.label}
                  <div className="text-[10px] font-mono text-[var(--text-muted,#64748b)] mt-0.5">{item.key}</div>
                </td>

                <td className="p-3.5 bg-rose-50/20 text-rose-800 font-mono break-all max-w-xs">
                  {item.oldValue || <span className="italic text-[var(--text-muted,#64748b)]">Пусто</span>}
                </td>

                <td className="p-3.5 bg-emerald-50/20 text-emerald-800 font-mono font-bold break-all max-w-xs">
                  {item.newValue || <span className="italic text-[var(--text-muted,#64748b)]">Пусто</span>}
                </td>

                <td className="p-3.5 text-[var(--text-muted,#64748b)] space-y-1">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-[var(--text-muted,#64748b)]" />
                    <span className="font-semibold text-[var(--text-primary,#0f172a)]">{item.changedBy}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted,#64748b)]">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(item.changedAt)}</span>
                  </div>
                  {item.reason && (
                    <div className="text-[11px] bg-[var(--surface-secondary,#f8fafc)] p-1.5 rounded border border-[var(--border-primary,#e2e8f0)] text-[var(--text-primary,#0f172a)] italic">
                      «{item.reason}»
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
