import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ContractService } from '../services/ContractService';
import { useContractRepository } from '../hooks/useContractRepository';
import { GeneratedContract, ContractConfirmation, ContractTemplate } from '../types';
import { ContractStatusBadge } from '../components/ContractStatusBadge';
import { 
  DEMO_CONFIRMATION_NOTICE, 
  DEMO_ELECTRONIC_SIGNATURE_NOTICE 
} from '../templates/defaultTemplates';
import { ArrowLeft, CheckCircle2, ShieldAlert, FileCheck, Clock, UserCheck } from 'lucide-react';

export const ContractConfirmations: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();

  const repo = useContractRepository();
  const contractService = useMemo(() => new ContractService(repo), [repo]);

  const [contract, setContract] = useState<GeneratedContract | null>(null);
  const [template, setTemplate] = useState<ContractTemplate | null>(null);

  useEffect(() => {
    if (contractId) {
      repo.getContract(contractId).then(c => {
        setContract(c);
        if (c?.templateId) {
          repo.getTemplate(c.templateId).then(setTemplate);
        }
      });
    }
  }, [contractId, repo]);

  if (!contract) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-[var(--text-muted,#64748b)] text-sm">
        Загрузка истории подтверждений...
      </div>
    );
  }

  const activeVersionId = contract.currentVersionId;
  const getConfForParty = (role: 'client' | 'contractor' | 'venue' | 'organizer'): ContractConfirmation | undefined => {
    if (!activeVersionId) return undefined;
    return contract.confirmations?.find(
      c => c.role === role && c.contractVersionId === activeVersionId
    );
  };

  const clientConf = getConfForParty('client');
  const contractorConf = getConfForParty('contractor');
  const venueConf = getConfForParty('venue');
  const organizerConf = getConfForParty('organizer');

  const templateRoles = (template?.partyRoles || []).filter(r => r !== 'platform' && r !== 'user');

  const parties = [
    {
      role: 'client' as const,
      label: 'Заказчик',
      name: contract.clientName,
      present: Boolean(contract.clientId || contract.clientName),
      conf: clientConf,
      iconColor: 'text-emerald-600'
    },
    {
      role: 'contractor' as const,
      label: 'Исполнитель',
      name: contract.contractorName,
      present: Boolean(contract.contractorId || (contract.contractorName && contract.contractorName !== 'Не указан')),
      conf: contractorConf,
      iconColor: 'text-teal-600'
    },
    {
      role: 'venue' as const,
      label: 'Площадка',
      name: contract.venueName,
      present: Boolean(contract.venueId || contract.venueName),
      conf: venueConf,
      iconColor: 'text-blue-600'
    },
    {
      role: 'organizer' as const,
      label: 'Организатор',
      name: contract.organizerName,
      present: Boolean(contract.organizerId || contract.organizerName),
      conf: organizerConf,
      iconColor: 'text-purple-600'
    }
  ].filter(p => {
    if (templateRoles.length > 0) {
      return templateRoles.includes(p.role);
    }
    return p.present;
  });

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
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">
              Статус и история подтверждений
            </h1>
            <ContractStatusBadge status={contract.status} />
          </div>
          <p className="text-xs text-[var(--text-muted,#64748b)] mt-0.5">
            Договор №{contract.id} • Редакция №{contract.currentVersion}
          </p>
        </div>
      </div>

      {/* Legal Demo Disclaimer Banner */}
      <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl flex items-start gap-3 text-xs text-slate-800">
        <ShieldAlert className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">{DEMO_CONFIRMATION_NOTICE}</div>
          <div className="text-[11px] text-slate-600">{DEMO_ELECTRONIC_SIGNATURE_NOTICE}</div>
        </div>
      </div>

      {/* Current Version Party Confirmation Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {parties.map((p) => (
          <div key={p.role} className="bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-primary,#e2e8f0)] pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className={`w-4 h-4 ${p.iconColor}`} />
                <span className="font-semibold text-xs">{p.label}</span>
              </div>
              {p.conf ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Подтверждено
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  <Clock className="w-3 h-3" /> Ожидает согласования
                </span>
              )}
            </div>

            <div className="text-xs space-y-1 text-[var(--text-secondary,#334155)]">
              <div><span className="text-[var(--text-muted,#64748b)]">ФИО / Наименование:</span> <strong>{p.name || 'Не указан'}</strong></div>
              {p.conf && (
                <>
                  <div><span className="text-[var(--text-muted,#64748b)]">Дата подтверждения:</span> {new Date(p.conf.confirmedAt).toLocaleString('ru-RU')}</div>
                  <div><span className="text-[var(--text-muted,#64748b)]">Примечание:</span> {p.conf.note || 'Без примечаний'}</div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation History Log */}
      <div className="bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-sm">Хронология фиксаций и согласий</h3>
        </div>

        {(!contract.confirmations || contract.confirmations.length === 0) ? (
          <p className="text-xs text-[var(--text-muted,#64748b)] italic py-2">
            В рамках текущего договора фиксации подписи еще не производились.
          </p>
        ) : (
          <div className="divide-y divide-[var(--border-primary,#e2e8f0)]">
            {contract.confirmations.map((c) => (
              <div key={c.id} className="py-3 text-xs flex items-center justify-between">
                <div>
                  <div className="font-semibold">
                    {c.role === 'client' ? 'Заказчик' : c.role === 'contractor' ? 'Исполнитель' : c.role === 'venue' ? 'Площадка' : c.role === 'organizer' ? 'Организатор' : 'Сторона'} (ID: {c.partyId}) • Редакция №{c.contractVersionNumber || 1}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted,#64748b)] mt-0.5">
                    {c.note || 'Подтверждено в системе'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[11px] text-[var(--text-muted,#64748b)]">
                    {new Date(c.confirmedAt).toLocaleString('ru-RU')}
                  </div>
                  {c.isDemo && (
                    <span className="text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                      Демо-режим
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
