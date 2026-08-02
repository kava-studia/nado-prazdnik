import React, { useState } from 'react';
import { GeneratedContract, ContractTemplateVersion } from '../types';
import { ContractShortView } from './ContractShortView';
import { ContractFullView } from './ContractFullView';
import { X, LayoutList, FileText } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  contract: GeneratedContract;
  templateVersion?: ContractTemplateVersion | null;
}

export const ContractPreviewModal: React.FC<Props> = ({ isOpen, onClose, contract, templateVersion }) => {
  const [viewMode, setViewMode] = useState<'short' | 'full'>('short');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--surface-secondary,#f8fafc)] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-[var(--border-primary,#e2e8f0)] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[var(--surface-card,#ffffff)] border-b border-[var(--border-primary,#e2e8f0)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="font-black text-[var(--text-primary,#0f172a)] text-lg">
              Предпросмотр договора
            </h3>
            <span className="text-xs font-mono bg-[var(--surface-secondary,#f8fafc)] text-[var(--text-muted,#64748b)] px-2 py-0.5 rounded border border-[var(--border-primary,#e2e8f0)]">
              {contract.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View switcher */}
            <div className="flex bg-[var(--surface-secondary,#f8fafc)] p-1 rounded-xl border border-[var(--border-primary,#e2e8f0)]">
              <button
                type="button"
                onClick={() => setViewMode('short')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'short'
                    ? 'bg-[var(--accent-primary,#2563eb)] text-white shadow-sm'
                    : 'text-[var(--text-muted,#64748b)] hover:text-[var(--text-primary,#0f172a)]'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                Коротко и понятно
              </button>

              <button
                type="button"
                onClick={() => setViewMode('full')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'full'
                    ? 'bg-[var(--accent-primary,#2563eb)] text-white shadow-sm'
                    : 'text-[var(--text-muted,#64748b)] hover:text-[var(--text-primary,#0f172a)]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Полный документ
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[var(--text-muted,#64748b)] hover:text-[var(--text-primary,#0f172a)] rounded-lg hover:bg-[var(--surface-secondary,#f8fafc)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {viewMode === 'short' ? (
            <ContractShortView contract={contract} />
          ) : (
            <ContractFullView contract={contract} templateVersion={templateVersion} />
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[var(--surface-card,#ffffff)] border-t border-[var(--border-primary,#e2e8f0)] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--accent-primary,#2563eb)] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-colors cursor-pointer"
          >
            Закрыть предпросмотр
          </button>
        </div>
      </div>
    </div>
  );
};
