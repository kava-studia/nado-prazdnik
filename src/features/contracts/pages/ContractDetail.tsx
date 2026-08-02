import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ContractService } from '../services/ContractService';
import { useContractRepository } from '../hooks/useContractRepository';
import { useAuth } from '../../../context/AuthContext';
import { ContractAccessService } from '../services/ContractAccessService';
import { GeneratedContract, ContractTemplateVersion } from '../types';
import { ContractStatusBadge } from '../components/ContractStatusBadge';
import { ContractShortView } from '../components/ContractShortView';
import { ContractFullView } from '../components/ContractFullView';
import { ContractPreviewModal } from '../components/ContractPreviewModal';
import { ContractMissingFieldsAlert } from '../components/ContractMissingFieldsAlert';
import { ContractConfirmDialog } from '../components/ContractConfirmDialog';
import { 
  DEMO_CONFIRMATION_NOTICE, 
  DEMO_ELECTRONIC_SIGNATURE_NOTICE 
} from '../templates/defaultTemplates';
import { 
  ArrowLeft, 
  Eye, 
  Edit3, 
  Send, 
  CheckCircle2, 
  GitCommit, 
  Paperclip, 
  History, 
  ShieldAlert, 
  FileCheck,
  LayoutList,
  FileText,
  RotateCcw
} from 'lucide-react';

export const ContractDetail: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const repo = useContractRepository();
  const contractService = useMemo(() => new ContractService(repo), [repo]);

  const [contract, setContract] = useState<GeneratedContract | null>(null);
  const [templateVersion, setTemplateVersion] = useState<ContractTemplateVersion | null>(null);
  const [viewMode, setViewMode] = useState<'short' | 'full'>('short');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showConfirmDlg, setShowConfirmDlg] = useState(false);
  const [showCancelDlg, setShowCancelDlg] = useState(false);
  const [showRevisionDlg, setShowRevisionDlg] = useState(false);
  const [showNewRevisionDlg, setShowNewRevisionDlg] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [revisionReason, setRevisionReason] = useState('');
  const [newRevisionReason, setNewRevisionReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (contractId) loadContract();
  }, [contractId]);

  const loadContract = async () => {
    if (!contractId) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const c = await repo.getContract(contractId);
      if (c) {
        setContract(c);
        if (c.templateVersionId) {
          const tplVer = await repo.getTemplateVersion(c.templateVersionId);
          setTemplateVersion(tplVer);
        }
      } else {
        setContract(null);
      }
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Ошибка при загрузке договора');
      setContract(null);
    } finally {
      setIsLoading(false);
    }
  };

  const isClient = Boolean(currentUser && contract && currentUser.id === contract.clientId);
  const isContractor = Boolean(currentUser && contract && currentUser.id === contract.contractorId);
  const isVenue = Boolean(currentUser && contract && currentUser.id === contract.venueId);
  const isOrganizer = Boolean(currentUser && contract && currentUser.id === contract.organizerId);
  const hasViewAllPermission = Boolean(currentUser?.permissions?.includes('contracts.view_all'));

  const isParty = isClient || isContractor || isVenue || isOrganizer;

  const partyRole = isClient ? 'client' : isContractor ? 'contractor' : isVenue ? 'venue' : isOrganizer ? 'organizer' : null;
  const partyRoleLabel = isClient ? 'заказчик' : isContractor ? 'исполнитель' : isVenue ? 'площадка' : isOrganizer ? 'организатор' : '';

  const isAlreadyConfirmedByParty = Boolean(
    contract?.confirmations?.some(
      c => c.contractVersionId === contract.currentVersionId && c.partyId === currentUser?.id
    )
  );

  const validationResult = contract
    ? contractService.validateContract(contract, templateVersion || undefined)
    : { isValid: true, missingFields: [] };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-[var(--text-muted,#64748b)] text-sm">
        Загрузка данных договора...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-rose-600 text-sm font-semibold">
        {loadError}
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="text-lg font-bold text-[var(--text-primary,#0f172a)]">
          Договор не найден
        </div>
        <p className="text-xs text-[var(--text-muted,#64748b)]">
          Запрошенный договор не существует или был удален
        </p>
        <button
          onClick={() => navigate('/contracts')}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
        >
          Вернуться к списку
        </button>
      </div>
    );
  }

  const canView = ContractAccessService.canViewContract(contract, currentUser?.id || '', currentUser?.permissions);
  if (!canView) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="text-lg font-bold text-rose-600">
          Доступ запрещен
        </div>
        <p className="text-xs text-[var(--text-muted,#64748b)]">
          У вас нет прав для просмотра данного договора
        </p>
        <button
          onClick={() => navigate('/contracts')}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
        >
          Вернуться к списку
        </button>
      </div>
    );
  }

  const actions = ContractAccessService.getAvailableActions(contract, currentUser?.id || '', currentUser?.permissions);

  const handleSendForReview = async () => {
    if (!currentUser) {
      setErrorMessage('Необходим вход в аккаунт');
      return;
    }
    setErrorMessage(null);
    try {
      await contractService.sendForReview(contract.id, currentUser.id);
      await loadContract();
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Не удалось отправить на согласование');
    }
  };

  const handleConfirmAction = async () => {
    if (!currentUser || !partyRole) {
      setErrorMessage('У вас нет прав на подтверждение данного договора');
      return;
    }
    setErrorMessage(null);
    try {
      if (isClient) {
        await contractService.confirmByClient(contract.id, currentUser.id);
      } else if (isContractor) {
        await contractService.confirmByContractor(contract.id, currentUser.id);
      } else if (isVenue) {
        await contractService.confirmByVenue(contract.id, currentUser.id);
      } else if (isOrganizer) {
        await contractService.confirmByOrganizer(contract.id, currentUser.id);
      }
      setShowConfirmDlg(false);
      await loadContract();
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Ошибка подтверждения');
    }
  };

  const handleRequestRevision = async () => {
    if (!currentUser || !isParty) {
      setErrorMessage('Только участник договора может запросить доработку');
      return;
    }
    if (!revisionReason.trim()) {
      setErrorMessage('Укажите причину доработки');
      return;
    }
    setErrorMessage(null);
    try {
      await contractService.requestRevision(contract.id, currentUser.id, revisionReason);
      setShowRevisionDlg(false);
      await loadContract();
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Не удалось запросить доработку');
    }
  };

  const handleCreateNewRevision = async () => {
    if (!currentUser || !isParty) {
      setErrorMessage('Только участник договора может создать новую редакцию');
      return;
    }
    if (!newRevisionReason.trim()) {
      setErrorMessage('Укажите причину создания новой редакции');
      return;
    }
    setErrorMessage(null);
    try {
      await contractService.createNewRevision(
        contract.id,
        currentUser.id,
        newRevisionReason.trim()
      );
      setShowNewRevisionDlg(false);
      setNewRevisionReason('');
      await loadContract();
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Не удалось создать новую версию');
    }
  };

  const handleCancelContract = async () => {
    if (!currentUser || !isParty) {
      setErrorMessage('У вас нет прав отменять данный договор');
      return;
    }
    if (!cancelReason.trim()) {
      setErrorMessage('Укажите причину отмены договора');
      return;
    }
    setErrorMessage(null);
    try {
      await contractService.cancelContract(contract.id, currentUser.id, cancelReason);
      setShowCancelDlg(false);
      await loadContract();
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Ошибка отмены договора');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 text-[var(--text-primary,#0f172a)]">
      {/* Demo Notice Banner */}
      <div className="p-3.5 bg-slate-100 border border-slate-300 rounded-2xl flex items-start gap-3 text-xs text-slate-800 shadow-xs">
        <ShieldAlert className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-bold">{DEMO_CONFIRMATION_NOTICE}</div>
          <div className="text-[var(--text-muted,#64748b)]">{DEMO_ELECTRONIC_SIGNATURE_NOTICE}</div>
        </div>
      </div>

      {!currentUser && (
        <div className="p-3.5 bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold">
          Необходим вход в аккаунт
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-bold">
          {errorMessage}
        </div>
      )}

      {/* Missing Fields Alert */}
      {!validationResult.isValid && (
        <ContractMissingFieldsAlert missingFields={validationResult.missingFields} />
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-primary,#e2e8f0)] pb-4">
        <div>
          <button
            onClick={() => navigate('/contracts')}
            className="inline-flex items-center gap-1 text-xs text-[var(--text-muted,#64748b)] hover:text-[var(--text-primary,#0f172a)] font-medium mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> К списку договоров
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">
              {contract.templateName}
            </h1>
            <ContractStatusBadge status={contract.status} size="lg" />
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-300">
              Редакция №{contract.currentVersion}
            </span>
          </div>
          <div className="text-xs text-[var(--text-muted,#64748b)] mt-1 flex items-center gap-3 flex-wrap">
            <span>ID: {contract.id}</span>
            <span>•</span>
            <span>Заказчик: {contract.clientName}</span>
            <span>•</span>
            <span>Исполнитель: {contract.contractorName}</span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="px-3.5 py-2 bg-[var(--surface-secondary,#f1f5f9)] hover:bg-[var(--border-primary,#e2e8f0)] text-xs font-semibold rounded-xl border border-[var(--border-primary,#e2e8f0)] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-indigo-600" />Предпросмотр
          </button>

          {actions.canEdit && (
            <button
              onClick={() => navigate(`/contracts/${contract.id}/edit`)}
              className="px-3.5 py-2 bg-[var(--surface-secondary,#f1f5f9)] hover:bg-[var(--border-primary,#e2e8f0)] text-xs font-semibold rounded-xl border border-[var(--border-primary,#e2e8f0)] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-indigo-600" />Редактировать
            </button>
          )}

          {actions.canSend && (
            <button
              onClick={handleSendForReview}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />Отправить на согласование
            </button>
          )}

          {actions.canConfirm && !isAlreadyConfirmedByParty && (
            <button
              onClick={() => setShowConfirmDlg(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Подтвердить как {partyRoleLabel}
            </button>
          )}

          {actions.canRequestRevision && (
            <button
              onClick={() => setShowRevisionDlg(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-slate-600" />Запросить доработку
            </button>
          )}

          {actions.canCreateNewVersion && (
            <button
              onClick={() => setShowNewRevisionDlg(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <GitCommit className="w-4 h-4" />Создать новую редакцию
            </button>
          )}

          {actions.canCancel && (
            <button
              onClick={() => setShowCancelDlg(true)}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Отменить
            </button>
          )}
        </div>
      </div>

      {/* Navigation sub-bar */}
      <div className="flex flex-wrap items-center justify-between bg-[var(--surface-secondary,#f1f5f9)] p-2 rounded-2xl border border-[var(--border-primary,#e2e8f0)] gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('short')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'short'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-[var(--text-muted,#64748b)] hover:text-[var(--text-primary,#0f172a)]'
            }`}
          >
            <LayoutList className="w-4 h-4" />
            Кратко и понятно
          </button>

          <button
            onClick={() => setViewMode('full')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'full'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-[var(--text-muted,#64748b)] hover:text-[var(--text-primary,#0f172a)]'
            }`}
          >
            <FileText className="w-4 h-4" />
            Полный текст договора
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/contracts/${contract.id}/confirmations`)}
            className="px-3 py-1.5 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] hover:bg-[var(--surface-secondary,#f1f5f9)] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
            Подтверждения ({contract.confirmations?.length || 0})
          </button>

          <button
            onClick={() => navigate(`/contracts/${contract.id}/attachments`)}
            className="px-3 py-1.5 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] hover:bg-[var(--surface-secondary,#f1f5f9)] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
            Приложения ({contract.attachments?.length || 0})
          </button>

          <button
            onClick={() => navigate(`/contracts/${contract.id}/versions`)}
            className="px-3 py-1.5 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] hover:bg-[var(--surface-secondary,#f1f5f9)] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-blue-600" />
            История версий
          </button>
        </div>
      </div>

      {/* Body View */}
      {viewMode === 'short' ? (
        <ContractShortView contract={contract} />
      ) : (
        <ContractFullView contract={contract} templateVersion={templateVersion} />
      )}

      {/* Single Confirm Dialog */}
      <ContractConfirmDialog
        isOpen={showConfirmDlg}
        title={`Подтверждение условий (${partyRoleLabel})`}
        message={`Вы подтверждаете согласие с условиями договора со стороны ${partyRoleLabel}? Нажимая кнопку, вы фиксируете демо-согласование.`}
        confirmText="Да, подтверждаю"
        cancelText="Отмена"
        variant="primary"
        onConfirm={handleConfirmAction}
        onCancel={() => setShowConfirmDlg(false)}
      />

      {/* Request Revision Dialog */}
      {showRevisionDlg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--bg-primary,#ffffff)] rounded-2xl w-full max-w-md shadow-xl border border-[var(--border-primary,#e2e8f0)] p-6 space-y-4">
            <h3 className="font-bold text-lg">
              Запрос доработки договора
            </h3>
            <p className="text-xs text-[var(--text-muted,#64748b)]">
              Укажите замечания или причину отправки договора на доработку:
            </p>
            <textarea
              rows={3}
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              placeholder="Необходимо уточнить время оборудования площадки..."
              className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRevisionDlg(false)}
                className="px-4 py-2 border border-[var(--border-primary,#e2e8f0)] text-xs font-semibold rounded-xl cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={handleRequestRevision}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Запросить доработку
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Revision Dialog */}
      {showNewRevisionDlg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--bg-primary,#ffffff)] rounded-2xl w-full max-w-md shadow-xl border border-[var(--border-primary,#e2e8f0)] p-6 space-y-4">
            <h3 className="font-bold text-lg">
              Причина создания новой редакции
            </h3>
            <p className="text-xs text-[var(--text-muted,#64748b)]">
              Укажите причину создания новой редакции договора:
            </p>
            <textarea
              rows={3}
              value={newRevisionReason}
              onChange={(e) => setNewRevisionReason(e.target.value)}
              placeholder="Корректировка условий оплаты или состава услуг..."
              className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewRevisionDlg(false)}
                className="px-4 py-2 border border-[var(--border-primary,#e2e8f0)] text-xs font-semibold rounded-xl cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateNewRevision}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Создать новую редакцию
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Dialog */}
      {showCancelDlg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--bg-primary,#ffffff)] rounded-2xl w-full max-w-md shadow-xl border border-[var(--border-primary,#e2e8f0)] p-6 space-y-4">
            <h3 className="font-bold text-lg">
              Отмена договора
            </h3>
            <p className="text-xs text-[var(--text-muted,#64748b)]">
              Укажите официальную причину отмены договора:
            </p>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Изменение планов или замена подрядчика..."
              className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCancelDlg(false)}
                className="px-4 py-2 border border-[var(--border-primary,#e2e8f0)] text-xs font-semibold rounded-xl cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={handleCancelContract}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Подтвердить отмену
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <ContractPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        contract={contract}
        templateVersion={templateVersion}
      />
    </div>
  );
};
