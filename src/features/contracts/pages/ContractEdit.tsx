import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ContractService } from '../services/ContractService';
import { useContractRepository } from '../hooks/useContractRepository';
import { useAuth } from '../../../context/AuthContext';
import { ContractAccessService } from '../services/ContractAccessService';
import { GeneratedContract, ContractTemplateVersion } from '../types';
import { ContractVariableRenderer } from '../components/ContractVariableRenderer';
import { ContractMissingFieldsAlert } from '../components/ContractMissingFieldsAlert';
import { ArrowLeft, Save, Send, AlertTriangle } from 'lucide-react';

export const ContractEdit: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const repo = useContractRepository();
  const contractService = useMemo(() => new ContractService(repo), [repo]);

  const [contract, setContract] = useState<GeneratedContract | null>(null);
  const [templateVersion, setTemplateVersion] = useState<ContractTemplateVersion | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (contractId) loadData();
  }, [contractId]);

  const loadData = async () => {
    if (!contractId) return;
    const c = await repo.getContract(contractId);
    if (c) {
      setContract(c);
      setValues(c.variableValues || {});
      if (c.templateVersionId) {
        const tplVer = await repo.getTemplateVersion(c.templateVersionId);
        setTemplateVersion(tplVer);
      }
    }
  };

  if (!contract) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-[var(--text-muted,#64748b)] text-sm">
        Загрузка данных договора...
      </div>
    );
  }

  const canEdit = ContractAccessService.canEditDraft(contract, currentUser?.id || '', currentUser?.permissions);
  if (!canEdit) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="text-lg font-bold text-rose-600">
          Редактирование недоступно
        </div>
        <p className="text-xs text-[var(--text-muted,#64748b)]">
          Договор находится в зафиксированной редакции или у вас нет прав на редактирование.
        </p>
        <button
          onClick={() => navigate(`/contracts/${contract.id}`)}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
        >
          Вернуться к договору
        </button>
      </div>
    );
  }

  const isLocked = ['sent', 'partially_confirmed', 'confirmed', 'superseded', 'cancelled', 'completed'].includes(contract.status);

  const handleVariableChange = async (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
    if (!isLocked && contractId && currentUser) {
      try {
        await contractService.updateDraftVariable(contractId, key, val, currentUser.id);
      } catch (e: unknown) {
        setErrorMessage(e instanceof Error ? e.message : 'Ошибка обновления переменной');
      }
    }
  };

  const handleSaveWorkingDraft = async () => {
    if (!currentUser) {
      setErrorMessage('Необходим вход в аккаунт');
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      if (isLocked) {
        throw new Error('Зафиксированная версия договора недоступна для редактирования. Создайте новую редакцию.');
      }
      setSuccessMessage('Рабочий черновик успешно сохранен');
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Ошибка при сохранении черновика');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendForReview = async () => {
    if (!contractId) return;
    if (!currentUser) {
      setErrorMessage('Необходим вход в аккаунт');
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await contractService.sendForReview(contractId, currentUser.id);
      navigate(`/contracts/${contractId}`);
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Не удалось отправить договор на согласование');
    } finally {
      setIsSaving(false);
    }
  };

  const validation = contractService.validateContract(contract, templateVersion || undefined);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-[var(--text-primary,#0f172a)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--border-primary,#e2e8f0)] pb-4 gap-4">
        <div>
          <button
            onClick={() => navigate(`/contracts/${contract.id}`)}
            className="inline-flex items-center gap-1 text-xs text-[var(--text-muted,#64748b)] hover:text-[var(--text-primary,#0f172a)] font-medium mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> К договору
          </button>
          <h1 className="text-xl font-bold tracking-tight">
            Редактирование параметров договора №{contract.id.substring(0, 8)}
          </h1>
          <p className="text-xs text-[var(--text-muted,#64748b)] mt-0.5">
            {contract.templateName} • Редакция №{contract.currentVersion}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isLocked && (
            <>
              <button
                type="button"
                onClick={handleSaveWorkingDraft}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-[var(--border-primary,#e2e8f0)] text-xs font-semibold rounded-xl hover:bg-[var(--surface-secondary,#f1f5f9)] transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4 text-amber-600" /> Сохранить черновик
              </button>

              <button
                type="button"
                onClick={handleSendForReview}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--accent-primary,#3b82f6)] text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-90 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" /> Направить на согласование
              </button>
            </>
          )}
        </div>
      </div>

      {isLocked && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Текущая версия зафиксирована (статус: {contract.status})</div>
            <div className="text-[11px] mt-0.5">
              Прямое редактирование зафиксированных версий ограничено. Чтобы внести изменения, создайте новую редакцию на странице договора.
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
          {successMessage}
        </div>
      )}

      {!validation.isValid && (
        <ContractMissingFieldsAlert missingFields={validation.missingFields} />
      )}

      {/* Variables Editor */}
      <div className="bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-2xl p-6 shadow-sm">
        <ContractVariableRenderer
          variables={templateVersion?.variables || []}
          values={values}
          onChange={handleVariableChange}
          disabled={isLocked}
        />
      </div>
    </div>
  );
};
