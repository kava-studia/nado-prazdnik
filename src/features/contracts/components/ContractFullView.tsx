import React from 'react';
import { GeneratedContract, ContractTemplateVersion } from '../types';
import { LEGAL_REVIEW_NOTICE } from '../templates/defaultTemplates';
import { ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

interface Props {
  contract: GeneratedContract;
  templateVersion?: ContractTemplateVersion | null;
}

export const ContractFullView: React.FC<Props> = ({ contract, templateVersion }) => {
  const text = contract.fullText;

  return (
    <div className="bg-[var(--surface-card,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-2xl p-6 md:p-8 space-y-6 shadow-sm text-[var(--text-primary,#0f172a)]">
      {/* Notice Banner */}
      <div className="p-3.5 bg-[var(--accent-light,#eff6ff)] border border-[var(--accent-primary,#2563eb)]/30 rounded-xl flex items-start gap-3 text-xs text-[var(--text-primary,#0f172a)]">
        <ShieldAlert className="w-5 h-5 text-[var(--accent-primary,#2563eb)] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Юридическое примечание:</span> {LEGAL_REVIEW_NOTICE}. Документ сгенерирован платформой NADO CONTRACTS.
        </div>
      </div>

      <div className="border-b border-[var(--border-primary,#e2e8f0)] pb-4">
        <h2 className="text-2xl font-black text-[var(--text-primary,#0f172a)] tracking-tight">
          {contract.templateName}
        </h2>
        <div className="text-xs text-[var(--text-muted,#64748b)] mt-1 flex items-center gap-3">
          <span>Номер документа: {contract.id}</span>
          <span>•</span>
          <span>Редакция: №{contract.currentVersion}</span>
          <span>•</span>
          <span>Дата создания: {new Date(contract.createdAt).toLocaleDateString('ru-RU')}</span>
        </div>
      </div>

      {/* Render text or clauses */}
      {templateVersion && templateVersion.clauses && templateVersion.clauses.length > 0 ? (
        <div className="space-y-6 text-sm leading-relaxed text-[var(--text-primary,#0f172a)]">
          {templateVersion.clauses.map((clause) => {
            let body = clause.body;
            for (const [k, v] of Object.entries(contract.variableValues || {})) {
              body = body.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v || '___');
            }
            return (
              <div key={clause.id} className="space-y-1.5 border-b border-[var(--border-primary,#e2e8f0)] pb-4 last:border-0">
                <h4 className="font-bold text-[var(--text-primary,#0f172a)] text-sm">
                  {clause.order}. {clause.title}
                </h4>
                <p className="text-[var(--text-primary,#0f172a)]/80 whitespace-pre-wrap text-xs md:text-sm font-normal">
                  {body}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="whitespace-pre-wrap text-xs md:text-sm text-[var(--text-primary,#0f172a)] font-mono bg-[var(--surface-secondary,#f8fafc)] p-4 rounded-xl border border-[var(--border-primary,#e2e8f0)] leading-relaxed">
          {text || 'Текст документа генерируется...'}
        </div>
      )}

      {/* Attachments list */}
      {contract.attachments && contract.attachments.length > 0 && (
        <div className="pt-6 border-t border-[var(--border-primary,#e2e8f0)] space-y-3">
          <h4 className="font-bold text-[var(--text-primary,#0f172a)] text-sm uppercase tracking-wide flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--accent-primary,#2563eb)]" />
            Приложения к договору ({contract.attachments.length})
          </h4>
          <div className="space-y-2">
            {contract.attachments.map((att, idx) => (
              <div key={att.id} className="p-3 bg-[var(--surface-secondary,#f8fafc)] rounded-xl border border-[var(--border-primary,#e2e8f0)] text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-[var(--text-primary,#0f172a)]">Приложение №{idx + 1}: {att.name}</span>
                </div>
                <span className="text-[var(--text-muted,#64748b)] font-mono">{att.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
