import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContractRepository } from '../hooks/useContractRepository';
import { useAuth } from '../../../context/AuthContext';
import { ContractTemplate, ContractTemplateVersion } from '../types';
import { LEGAL_REVIEW_NOTICE } from '../templates/defaultTemplates';
import { ContractConfirmDialog } from '../components/ContractConfirmDialog';
import { TemplateReviewService } from '../services/TemplateReviewService';
import { ArrowLeft, ShieldAlert, CheckCircle2, RotateCcw, Archive, Send, PlusCircle } from 'lucide-react';

export const ContractTemplateDetail: React.FC = () => {
  const repository = useContractRepository();
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [version, setVersion] = useState<ContractTemplateVersion | null>(null);
  const [showPublishDlg, setShowPublishDlg] = useState(false);
  const [showSubmitReviewDlg, setShowSubmitReviewDlg] = useState(false);
  const [showRevisionDlg, setShowRevisionDlg] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canManage = Boolean(currentUser?.permissions?.includes('contracts.manage_templates'));

  useEffect(() => {
    if (templateId) {
      repository.getTemplate(templateId).then(async (tpl) => {
        setTemplate(tpl);
        if (tpl && tpl.currentVersionId) {
          const ver = await repository.getTemplateVersion(tpl.currentVersionId);
          setVersion(ver);
        } else {
          setVersion(null);
        }
      });
    }
  }, [templateId, repository]);

  if (!template) return <div className="p-8 text-center text-[var(--text-muted,#64748b)] text-xs">Загрузка шаблона...</div>;

  const reviewService = new TemplateReviewService(repository);
  const actorId = currentUser?.id || 'demo-client-user';

  const reloadData = async () => {
    if (!templateId) return;
    const tpl = await repository.getTemplate(templateId);
    setTemplate(tpl);
    if (tpl?.currentVersionId) {
      const ver = await repository.getTemplateVersion(tpl.currentVersionId);
      setVersion(ver);
    }
  };

  const handlePublish = async () => {
    if (!version) return;
    setErrorMessage(null);
    try {
      const updated = await reviewService.publishApprovedVersion({
        templateId: template.id,
        versionId: version.id,
        actorId
      });
      setTemplate({ ...updated });
      setShowPublishDlg(false);
      await reloadData();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Ошибка публикации шаблона');
      setShowPublishDlg(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!version) return;
    setErrorMessage(null);
    try {
      const updated = await reviewService.submitForLegalReview({
        templateId: template.id,
        versionId: version.id,
        actorId,
        note: 'Отправлено на юридическую проверку'
      });
      setTemplate({ ...updated });
      setShowSubmitReviewDlg(false);
      await reloadData();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Ошибка отправки на проверку');
      setShowSubmitReviewDlg(false);
    }
  };

  const handleApprove = async () => {
    if (!version) return;
    setErrorMessage(null);
    try {
      await reviewService.approveVersion({
        templateId: template.id,
        versionId: version.id,
        reviewerId: actorId,
        reviewerRole: 'contracts.manage_templates',
        reviewComment: 'Демонстрационное одобрание шаблона'
      });
      await reloadData();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Ошибка одобрения шаблона');
    }
  };

  const handleRequestRevision = async () => {
    if (!version || !revisionReason.trim()) return;
    setErrorMessage(null);
    try {
      await reviewService.requestRevision({
        templateId: template.id,
        versionId: version.id,
        reviewerId: actorId,
        reviewerRole: 'contracts.manage_templates',
        reason: revisionReason
      });
      setShowRevisionDlg(false);
      setRevisionReason('');
      await reloadData();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Ошибка возврата на доработку');
    }
  };

  const handleCreateNewVersion = async () => {
    setErrorMessage(null);
    try {
      const newVer = await reviewService.createNewTemplateVersion(
        template.id,
        actorId,
        'Новая редакция шаблона'
      );
      setVersion(newVer);
      await reloadData();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Ошибка создания новой версии');
    }
  };

  const handleArchive = async () => {
    if (!version) return;
    setErrorMessage(null);
    try {
      await reviewService.archiveVersion({
        templateId: template.id,
        versionId: version.id,
        actorId,
        reason: 'Архивация устаревшего шаблона'
      });
      await reloadData();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Ошибка архивации шаблона');
    }
  };

  const isDesynced = Boolean(template && version && template.status !== version.status);

  const handleRepairSync = async () => {
    if (!template || !version) return;
    const reason = prompt('Укажите причину восстановления статуса шаблона (требуется для аудит-лога):');
    if (!reason || !reason.trim()) return;
    setErrorMessage(null);
    try {
      const reviewService = new TemplateReviewService(repository);
      await reviewService.repairTemplateVersionState({
        templateId: template.id,
        versionId: version.id,
        targetStatus: version.status,
        actorId: currentUser?.id || 'admin',
        actorPermissions: currentUser?.permissions || ['contracts.manage_templates'],
        reason
      });
      await reloadData();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Ошибка при исправлении статуса шаблона');
    }
  };

  const isDraft = !isDesynced && template.status === 'draft' && version?.status === 'draft';
  const isLegalReview = !isDesynced && template.status === 'legal_review' && version?.status === 'legal_review';
  const isApproved = !isDesynced && template.status === 'approved' && version?.status === 'approved';
  const isRevisionRequired = !isDesynced && template.status === 'revision_required' && version?.status === 'revision_required';
  const isPublished = !isDesynced && template.status === 'published' && version?.status === 'published';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-[var(--text-primary,#0f172a)]">
      {isDesynced && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            Статусы шаблона и текущей версии рассинхронизированы (Шаблон: {template.status}, Версия: {version?.status})
          </div>
          <p className="text-xs text-amber-800">
            Административные действия заблокированы до восстановления синхронизации.
          </p>
          {canManage && (
            <button
              onClick={handleRepairSync}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Восстановить состояние (для админа)
            </button>
          )}
        </div>
      )}

      <div className="border-b border-[var(--border-primary,#e2e8f0)] pb-4">
        <button
          onClick={() => navigate('/contracts/templates')}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted,#64748b)] hover:text-[var(--text-primary,#0f172a)] font-semibold mb-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> К библиотеке шаблонов
        </button>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                {template.category}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
                {template.status}
              </span>
            </div>
            <h1 className="text-2xl font-black text-[var(--text-primary,#0f172a)] tracking-tight mt-1">
              {template.name}
            </h1>
            <p className="text-xs text-[var(--text-muted,#64748b)] mt-1">{template.description}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {canManage && isDraft && (
              <button
                onClick={() => setShowSubmitReviewDlg(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Отправить на проверку
              </button>
            )}

            {canManage && isLegalReview && (
              <>
                <button
                  onClick={handleApprove}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Одобрить
                </button>
                <button
                  onClick={() => setShowRevisionDlg(true)}
                  className="px-3.5 py-2 bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> На доработку
                </button>
              </>
            )}

            {canManage && isRevisionRequired && (
              <button
                onClick={handleCreateNewVersion}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Создать новую редакцию
              </button>
            )}

            {canManage && isApproved && (
              <button
                onClick={() => setShowPublishDlg(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Опубликовать
              </button>
            )}

            {canManage && isPublished && (
              <>
                <button
                  onClick={handleCreateNewVersion}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Новая редакция
                </button>
                <button
                  onClick={handleArchive}
                  className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Archive className="w-3.5 h-3.5" /> В архив
                </button>
              </>
            )}

            <button
              onClick={() => navigate(`/contracts/create?templateId=${template.id}`)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
            >
              Создать по шаблону
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
          {errorMessage}
        </div>
      )}

      {/* Banner */}
      {isLegalReview ? (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start gap-3 text-xs text-indigo-900">
          <ShieldAlert className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Шаблон находится на юридической проверке:</span> Публикация недоступна до завершения правовой экспертизы. {LEGAL_REVIEW_NOTICE}.
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl flex items-start gap-3 text-xs text-slate-800">
          <ShieldAlert className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Юридическое уведомление:</span> {LEGAL_REVIEW_NOTICE}.
            {version?.publishedAt && (
              <div className="mt-1 text-xs text-slate-600">
                Опубликовано: {new Date(version.publishedAt).toLocaleDateString('ru-RU')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clauses structure */}
      <div className="bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-2xl p-6 space-y-4">
        <h3 className="font-black text-[var(--text-primary,#0f172a)] text-base border-b border-[var(--border-primary,#e2e8f0)] pb-2">
          Структурные пункты договора ({version?.clauses?.length || 0})
        </h3>

        {version && version.clauses && version.clauses.length > 0 ? (
          <div className="space-y-4 text-xs leading-relaxed">
            {version.clauses.map((cl) => (
              <div key={cl.id} className="p-3 bg-[var(--surface-secondary,#f1f5f9)] rounded-xl border border-[var(--border-primary,#e2e8f0)] space-y-1">
                <div className="font-bold text-[var(--text-primary,#0f172a)]">{cl.order}. {cl.title}</div>
                <div className="text-[var(--text-secondary,#334155)] whitespace-pre-wrap">{cl.body}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-[var(--text-muted,#64748b)] italic">Пункты генерируются...</div>
        )}
      </div>

      <ContractConfirmDialog
        isOpen={showPublishDlg}
        title="Подтверждение публикации"
        message="Демонстрационное изменение статуса. Фактическая юридическая проверка не выполнялась"
        confirmText="Да, опубликовать"
        cancelText="Отмена"
        onConfirm={handlePublish}
        onCancel={() => setShowPublishDlg(false)}
      />

      <ContractConfirmDialog
        isOpen={showSubmitReviewDlg}
        title="Отправка на юридическое согласование"
        message="Отправить данный шаблон на рецензию юридической службой платформы?"
        confirmText="Отправить"
        cancelText="Отмена"
        onConfirm={handleSubmitForReview}
        onCancel={() => setShowSubmitReviewDlg(false)}
      />

      {showRevisionDlg && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-[var(--text-primary,#0f172a)]">Возврат на доработку</h3>
            <p className="text-xs text-[var(--text-muted,#64748b)]">Укажите замечания юридической службы:</p>
            <textarea
              rows={3}
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              placeholder="Причина отправки на доработку..."
              className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRevisionDlg(false)}
                className="px-4 py-2 bg-[var(--surface-secondary,#f1f5f9)] text-[var(--text-muted,#64748b)] text-xs font-semibold rounded-xl"
              >
                Отмена
              </button>
              <button
                onClick={handleRequestRevision}
                disabled={!revisionReason.trim()}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 disabled:opacity-50"
              >
                Отправить замечания
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
