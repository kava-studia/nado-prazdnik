import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileText,
  Gauge,
  KeyRound,
  LockKeyhole,
  Save,
  Scale,
  Shield,
  Sliders,
  UsersRound,
  WalletCards
} from 'lucide-react';
import { useRepositories } from '../../repositories/RepositoryProvider';
import { useDemoMode } from '../../context/DemoModeContext';
import { AuditLog, ContractTemplate, DisputeCase, PlatformStaffRole, ScoringRuleVersion } from '../../types';
import ReclamationQueue from '../admin/ReclamationQueue';
import SecurityCenter from '../admin/SecurityCenter';
import AccessControlPanel, { staffRolePermissions } from '../admin/AccessControlPanel';

type AdminTab = 'overview' | 'reclamations' | 'security' | 'access' | 'templates' | 'scoring' | 'audit';

const roleLabels: Record<PlatformStaffRole, string> = {
  owner: 'Владелец',
  senior_operator: 'Старший оператор',
  reclamation_manager: 'Менеджер рекламаций',
  security_manager: 'Служба безопасности',
  read_only_auditor: 'Только чтение'
};

const tabs: Array<{ id: AdminTab; label: string; icon: typeof Gauge }> = [
  { id: 'overview', label: 'Обзор', icon: Gauge },
  { id: 'reclamations', label: 'Рекламации', icon: ClipboardList },
  { id: 'security', label: 'Безопасность', icon: Shield },
  { id: 'access', label: 'Доступы', icon: KeyRound },
  { id: 'templates', label: 'Договоры', icon: FileText },
  { id: 'scoring', label: 'Скоринг', icon: Sliders },
  { id: 'audit', label: 'Аудит', icon: Activity }
];

export default function AdminCabinet() {
  const { scoringRepository, contractRepository, auditRepository, disputeRepository } = useRepositories();
  const { isDemoMode } = useDemoMode();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [staffRole, setStaffRole] = useState<PlatformStaffRole>('owner');
  const [rulesVersion, setRulesVersion] = useState<ScoringRuleVersion | null>(null);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [disputes, setDisputes] = useState<DisputeCase[]>([]);
  const [editedWeights, setEditedWeights] = useState<Record<string, number>>({});
  const [notice, setNotice] = useState('');

  const permissions = staffRolePermissions[staffRole];
  const actorId = `demo-${staffRole}`;
  const actorName = roleLabels[staffRole];

  const loadData = async () => {
    const [weights, templateList, logs, caseList] = await Promise.all([
      scoringRepository.getScoringWeights(),
      contractRepository.listTemplates(),
      auditRepository.getLogs(),
      disputeRepository.listDisputes()
    ]);
    setRulesVersion(weights);
    setTemplates(templateList);
    setAuditLogs(logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setDisputes(caseList);
    if (weights) setEditedWeights(Object.fromEntries(weights.rules.map(rule => [rule.id, rule.weight])));
  };

  useEffect(() => {
    loadData().catch(error => console.error('Admin data load failed', error));
    window.addEventListener('demo-state-changed', loadData);
    return () => window.removeEventListener('demo-state-changed', loadData);
  }, []);

  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'security' || activeTab === 'audit') {
      loadData().catch(error => console.error('Admin data refresh failed', error));
    }
  }, [activeTab]);

  const metrics = useMemo(() => {
    const activeCases = disputes.filter(item => !['resolved', 'closed'].includes(item.status));
    const criticalCases = disputes.filter(item => item.riskType === 'safety' || item.riskType === 'fraud');
    const awaitingApproval = disputes.filter(item => item.status === 'awaiting_financial_approval');
    const templatesInReview = templates.filter(item => item.status === 'legal_review' || item.status === 'revision_required');
    return { activeCases, criticalCases, awaitingApproval, templatesInReview };
  }, [disputes, templates]);

  const handleSaveWeights = async () => {
    if (!rulesVersion) return;
    const total = Object.values(editedWeights).reduce<number>((sum, weight) => sum + Number(weight), 0);
    if (total !== 100) {
      setNotice(`Сумма весов должна быть ровно 100%. Сейчас ${total}%.`);
      return;
    }
    if (!permissions.includes('system.admin')) {
      setNotice('Изменение скоринга доступно только владельцу системы.');
      return;
    }

    const updated = {
      ...rulesVersion,
      rules: rulesVersion.rules.map(rule => ({ ...rule, weight: editedWeights[rule.id] || 0 })),
      createdAt: new Date().toISOString(),
      changeReason: 'Изменение весов владельцем через центр управления'
    };
    await scoringRepository.saveScoringWeights(updated);
    const log: AuditLog = {
      id: `audit-${Date.now()}`,
      actorId,
      actorRole: staffRole,
      action: 'UPDATE_SCORING_WEIGHTS',
      entityType: 'scoring',
      entityId: rulesVersion.id,
      oldValue: JSON.stringify(rulesVersion.rules.map(rule => `${rule.metric}:${rule.weight}`)),
      newValue: JSON.stringify(updated.rules.map(rule => `${rule.metric}:${rule.weight}`)),
      reason: updated.changeReason,
      createdAt: new Date().toISOString()
    };
    await auditRepository.addLog(log);
    setNotice('Веса сохранены. Изменение добавлено в аудит.');
    await loadData();
  };

  const handleApproveTemplate = async (templateId: string) => {
    if (!permissions.includes('system.admin')) {
      setNotice('Юридическое утверждение доступно только владельцу в этом демо контуре.');
      return;
    }
    const template = await contractRepository.getTemplate(templateId);
    if (!template) return;
    const oldStatus = template.status;
    template.status = 'approved';
    await contractRepository.saveTemplate(template);
    await auditRepository.addLog({
      id: `audit-${Date.now()}`,
      actorId,
      actorRole: staffRole,
      action: 'APPROVE_CONTRACT_TEMPLATE',
      entityType: 'contract',
      entityId: template.id,
      oldValue: oldStatus,
      newValue: 'approved',
      reason: 'Юридическая проверка завершена владельцем демо контура',
      createdAt: new Date().toISOString()
    });
    setNotice('Шаблон утверждён, действие записано в аудит.');
    await loadData();
  };

  const weightTotal = Object.values(editedWeights).reduce<number>((sum, weight) => sum + Number(weight), 0);

  return (
    <div className="space-y-5" id="admin-cabinet-root">
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border-primary)] bg-[var(--surface-primary)] p-5 sm:p-7">
        <div className="absolute -right-20 -top-24 w-64 h-64 rounded-full bg-[var(--gold-primary)]/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-[var(--gold-primary)]"><Shield className="w-4 h-4" /> NADO Control Center</span>
              {isDemoMode && <span className="text-xs font-black px-2.5 py-1 rounded-full bg-[var(--gold-highlight)] text-[var(--gold-deep)]">ИЗОЛИРОВАННЫЙ ДЕМО КОНТУР</span>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-3">Управление платформой без слепых зон</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-3xl leading-relaxed">Рекламации, безопасность, роли, договоры, скоринг и неизменяемая история действий в одном рабочем центре.</p>
          </div>
          {isDemoMode && (
            <label className="min-w-64 text-left">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Проверить права роли</span>
              <select
                value={staffRole}
                onChange={event => setStaffRole(event.target.value as PlatformStaffRole)}
                className="w-full min-h-12 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-soft)] px-3 text-sm font-black outline-none focus:border-[var(--gold-primary)]"
              >
                {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          )}
        </div>
      </section>

      <nav className="flex gap-2 overflow-x-auto p-2 rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-primary)]" aria-label="Разделы центра управления">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === tab.id ? 'bg-[var(--gold-primary)] text-black shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]'}`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </nav>

      {notice && (
        <div className="p-4 rounded-2xl bg-[var(--gold-highlight)] border border-[var(--gold-primary)]/30 text-sm font-bold flex items-center justify-between gap-3">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} className="text-xs font-black">Закрыть</button>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="space-y-5 animate-fade-in">
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              { label: 'Активные рекламации', value: metrics.activeCases.length, icon: ClipboardList, tone: 'text-[var(--gold-primary)]' },
              { label: 'Критические SAFETY / FRAUD', value: metrics.criticalCases.length, icon: AlertTriangle, tone: metrics.criticalCases.length ? 'text-red-600' : 'text-emerald-600' },
              { label: 'Денежное подтверждение', value: metrics.awaitingApproval.length, icon: WalletCards, tone: 'text-violet-600' },
              { label: 'Документы на проверке', value: metrics.templatesInReview.length, icon: Scale, tone: 'text-[var(--gold-primary)]' }
            ].map(item => (
              <div key={item.label} className="p-5 rounded-2xl bg-[var(--surface-primary)] border border-[var(--border-primary)]">
                <item.icon className={`w-5 h-5 ${item.tone}`} />
                <p className="text-3xl font-black mt-4">{item.value}</p>
                <p className="text-xs font-bold text-[var(--text-secondary)] mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <button type="button" onClick={() => setActiveTab('reclamations')} className="p-5 rounded-3xl bg-[var(--surface-primary)] border border-[var(--border-primary)] text-left hover:border-[var(--gold-primary)] transition-all">
              <ClipboardList className="w-6 h-6 text-[var(--gold-primary)]" />
              <h3 className="text-lg font-black mt-4">Очередь рекламаций</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">SLA, ответственный, проверка фактов, внутренние заметки и решение с двойным контролем денег.</p>
            </button>
            <button type="button" onClick={() => setActiveTab('security')} className="p-5 rounded-3xl bg-[var(--surface-primary)] border border-[var(--border-primary)] text-left hover:border-[var(--gold-primary)] transition-all">
              <Shield className="w-6 h-6 text-[var(--gold-primary)]" />
              <h3 className="text-lg font-black mt-4">Контур безопасности</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">Критические инциденты, автоматические блокировки FRAUD и честный статус защитных мер.</p>
            </button>
            <button type="button" onClick={() => setActiveTab('access')} className="p-5 rounded-3xl bg-[var(--surface-primary)] border border-[var(--border-primary)] text-left hover:border-[var(--gold-primary)] transition-all">
              <UsersRound className="w-6 h-6 text-[var(--gold-primary)]" />
              <h3 className="text-lg font-black mt-4">Роли и полномочия</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">Владелец, старший оператор, рекламации, безопасность и просмотр без права изменений.</p>
            </button>
          </div>

          <section className="p-5 sm:p-7 rounded-3xl bg-[var(--surface-primary)] border border-[var(--border-primary)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--gold-primary)]">NADO SAFE PAY</p>
                <h3 className="text-xl font-black mt-1">Платёжный контур не включён</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-2">Нет фиктивных транзакций и «кошелька». Реальные оплаты появятся только через лицензированного банковского партнёра.</p>
              </div>
              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-soft)] text-xs font-black"><LockKeyhole className="w-4 h-4" /> ЗАБЛОКИРОВАНО ДО ИНТЕГРАЦИИ</span>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'reclamations' && (
        <ReclamationQueue actorId={actorId} actorName={actorName} permissions={permissions} demoMode={isDemoMode} />
      )}

      {activeTab === 'security' && <SecurityCenter disputes={disputes} demoMode={isDemoMode} />}

      {activeTab === 'access' && <AccessControlPanel currentRole={staffRole} />}

      {activeTab === 'templates' && (
        <section className="p-5 sm:p-7 rounded-3xl bg-[var(--surface-primary)] border border-[var(--border-primary)] animate-fade-in">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--gold-primary)]">NADO Contracts</p>
          <h3 className="text-2xl font-black mt-1">Юридические шаблоны</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-2">Рабочие шаблоны требуют фактической юридической проверки перед production использованием.</p>
          <div className="space-y-3 mt-6">
            {templates.map(template => (
              <div key={template.id} className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-soft)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-black">{template.name}</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{template.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-[var(--background-primary)] border border-[var(--border-soft)]">{template.status}</span>
                  {template.status !== 'approved' && template.status !== 'published' && (
                    <button type="button" onClick={() => handleApproveTemplate(template.id)} className="px-4 py-2.5 rounded-xl bg-[var(--gold-primary)] text-black text-xs font-black">Утвердить в демо</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'scoring' && rulesVersion && (
        <section className="p-5 sm:p-7 rounded-3xl bg-[var(--surface-primary)] border border-[var(--border-primary)] animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--gold-primary)]">Scoring Engine</p>
              <h3 className="text-2xl font-black mt-1">Веса алгоритма</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-2">Сумма параметров должна быть ровно 100%. Каждое изменение попадает в аудит.</p>
            </div>
            <span className={`text-sm font-black ${weightTotal === 100 ? 'text-emerald-600' : 'text-red-600'}`}>{weightTotal} / 100%</span>
          </div>
          <div className="grid md:grid-cols-2 gap-3 mt-6">
            {rulesVersion.rules.map(rule => (
              <label key={rule.id} className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-soft)]">
                <span className="flex justify-between gap-3 text-sm font-black"><span>{rule.label}</span><span className="text-[var(--gold-primary)]">{editedWeights[rule.id] || 0}%</span></span>
                <input type="range" min="0" max="50" step="5" value={editedWeights[rule.id] || 0} onChange={event => setEditedWeights(current => ({ ...current, [rule.id]: Number(event.target.value) }))} className="w-full mt-4 accent-[var(--gold-primary)]" />
              </label>
            ))}
          </div>
          <button type="button" onClick={handleSaveWeights} className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--gold-primary)] text-black text-sm font-black"><Save className="w-4 h-4" /> Сохранить веса</button>
        </section>
      )}

      {activeTab === 'audit' && (
        <section className="p-5 sm:p-7 rounded-3xl bg-[var(--surface-primary)] border border-[var(--border-primary)] animate-fade-in">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--gold-primary)]">Immutable audit</p>
              <h3 className="text-2xl font-black mt-1">История административных действий</h3>
            </div>
            <span className="text-xs font-black px-3 py-1.5 rounded-full bg-[var(--surface-secondary)] border border-[var(--border-soft)]">{auditLogs.length} записей</span>
          </div>
          <div className="space-y-3 mt-6 max-h-[680px] overflow-y-auto">
            {auditLogs.map(log => (
              <div key={log.id} className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-soft)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-black">{log.action}</span>
                  <span className="text-xs text-[var(--text-muted)] font-bold">{new Date(log.createdAt).toLocaleString('ru-RU')}</span>
                </div>
                <p className="text-sm mt-2">{log.reason || 'Причина не указана'}</p>
                <div className="grid md:grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-red-50 text-red-700 break-all">Было: {log.oldValue || 'нет данных'}</div>
                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 break-all">Стало: {log.newValue || 'нет данных'}</div>
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div className="p-8 text-center border border-dashed border-[var(--border-soft)] rounded-2xl">
                <CheckCircle2 className="w-9 h-9 text-emerald-600 mx-auto" />
                <p className="text-sm font-black mt-3">Действий пока нет</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
