import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContractRepository } from '../hooks/useContractRepository';
import { useAuth } from '../../../context/AuthContext';
import { GeneratedContract } from '../types';
import { ContractFilterOptions } from '../repositories/ContractRepository';
import { ContractStatusBadge } from '../components/ContractStatusBadge';
import { formatPrice } from '../utils/contractFormatters';
import { Plus, Search, FileText, ArrowRight } from 'lucide-react';

interface Props {
  roleFilter?: 'contractor' | 'organizer' | 'venue' | 'client';
}

export const ContractsList: React.FC<Props> = ({ roleFilter }) => {
  const navigate = useNavigate();
  const repository = useContractRepository();
  const { user: currentUser } = useAuth();
  const [contracts, setContracts] = useState<GeneratedContract[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadContracts();
  }, [roleFilter, repository, currentUser?.id]);

  const loadContracts = async () => {
    if (!currentUser) {
      setContracts([]);
      return;
    }

    const hasViewAll = Boolean(currentUser.permissions?.includes('contracts.view_all'));
    let filterOptions: ContractFilterOptions = {};

    if (hasViewAll) {
      filterOptions = { currentUserId: currentUser.id, permissions: currentUser.permissions };
    } else if (roleFilter === 'client') {
      filterOptions = { clientId: currentUser.id };
    } else if (roleFilter === 'contractor') {
      filterOptions = { contractorId: currentUser.id };
    } else if (roleFilter === 'venue') {
      filterOptions = { venueId: currentUser.id };
    } else if (roleFilter === 'organizer') {
      filterOptions = { organizerId: currentUser.id };
    } else {
      filterOptions = { userId: currentUser.id };
    }

    const list = await repository.listContracts(filterOptions);
    setContracts(list);
  };

  const filtered = contracts.filter((c) => {
    if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (c.templateName || '').toLowerCase().includes(q) ||
        (c.clientName || '').toLowerCase().includes(q) ||
        (c.contractorName || '').toLowerCase().includes(q) ||
        (c.venueName || '').toLowerCase().includes(q) ||
        (c.organizerName || '').toLowerCase().includes(q) ||
        (c.id || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const statuses = [
    { id: 'all', label: 'Все договоры' },
    { id: 'draft', label: 'Черновики' },
    { id: 'sent', label: 'На согласовании' },
    { id: 'confirmed', label: 'Подтверждённые' },
    { id: 'cancelled', label: 'Отменённые' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 text-[var(--text-primary,#0f172a)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-primary,#e2e8f0)] pb-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            {roleFilter ? `Модуль договоров (${roleFilter.toUpperCase()})` : 'Центр договоров NADO CONTRACTS'}
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            Договоры и соглашения
          </h1>
          <p className="text-xs text-[var(--text-muted,#64748b)] mt-1">
            Безопасное согласование условий, фиксирование цен и версионирование документов
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/contracts/templates')}
            className="px-4 py-2.5 bg-[var(--surface-secondary,#f1f5f9)] hover:bg-[var(--border-primary,#e2e8f0)] text-xs font-semibold rounded-xl border border-[var(--border-primary,#e2e8f0)] transition-colors cursor-pointer"
          >
            Библиотека шаблонов
          </button>
          <button
            onClick={() => navigate('/contracts/create')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Создать договор
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-[var(--surface-secondary,#f1f5f9)] p-3 rounded-2xl border border-[var(--border-primary,#e2e8f0)]">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[var(--text-muted,#64748b)] absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию, клиенту, ID..."
            className="w-full pl-9 pr-4 py-2 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {statuses.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedStatus(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                selectedStatus === s.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] text-[var(--text-muted,#64748b)] hover:bg-[var(--surface-secondary,#f1f5f9)]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts Table / List */}
      {filtered.length === 0 ? (
        <div className="bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <FileText className="w-10 h-10 text-[var(--text-muted,#64748b)] mx-auto opacity-40" />
          <div className="font-bold text-[var(--text-primary,#0f172a)] text-base">Договоры не найдены</div>
          <p className="text-xs text-[var(--text-muted,#64748b)] max-w-sm mx-auto">
            Создайте свой первый договор в пошаговом конструкторе NADO CONTRACTS или выберите шаблон из библиотеки
          </p>
          <button
            onClick={() => navigate('/contracts/create')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors mt-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Создать договор
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] hover:border-indigo-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <ContractStatusBadge status={c.status} />
                  <span className="text-xs font-mono text-[var(--text-muted,#64748b)]">№{c.id}</span>
                  <span className="text-xs font-semibold bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
                    Редакция №{c.currentVersion}
                  </span>
                </div>

                <h3 className="font-bold text-base">
                  {c.templateName}
                </h3>

                <div className="text-xs text-[var(--text-secondary,#334155)] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {c.documentKind === 'platform_policy' ? (
                    <>
                      <div><span className="text-[var(--text-muted,#64748b)]">Аудитория:</span> <strong>{c.variableValues['target_audience'] || 'Все пользователи'}</strong></div>
                      <div><span className="text-[var(--text-muted,#64748b)]">Версия:</span> <strong>{c.variableValues['document_version'] || '1.0'}</strong></div>
                      <div><span className="text-[var(--text-muted,#64748b)]">Статус:</span> <strong>{c.status}</strong></div>
                    </>
                  ) : c.documentKind === 'consent' ? (
                    <>
                      <div><span className="text-[var(--text-muted,#64748b)]">Субъект:</span> <strong>{c.variableValues['data_subject_name'] || c.clientName}</strong></div>
                      <div><span className="text-[var(--text-muted,#64748b)]">Оператор:</span> <strong>{c.variableValues['data_operator_name'] || c.contractorName}</strong></div>
                      <div><span className="text-[var(--text-muted,#64748b)]">Версия:</span> <strong>{c.variableValues['document_version'] || '1.0'}</strong></div>
                    </>
                  ) : c.venueId ? (
                    <>
                      <div><span className="text-[var(--text-muted,#64748b)]">Заказчик:</span> <strong>{c.clientName}</strong></div>
                      <div><span className="text-[var(--text-muted,#64748b)]">Площадка:</span> <strong>{c.venueName}</strong></div>
                      <div><span className="text-[var(--text-muted,#64748b)]">Стоимость:</span> <strong className="text-indigo-900 font-bold">{formatPrice(c.variableValues['price'] || c.variableValues['rent_cost'])}</strong></div>
                    </>
                  ) : c.organizerId ? (
                    <>
                      <div><span className="text-[var(--text-muted,#64748b)]">Заказчик:</span> <strong>{c.clientName}</strong></div>
                      <div><span className="text-[var(--text-muted,#64748b)]">Организатор:</span> <strong>{c.organizerName}</strong></div>
                      <div><span className="text-[var(--text-muted,#64748b)]">Стоимость:</span> <strong className="text-indigo-900 font-bold">{formatPrice(c.variableValues['price'])}</strong></div>
                    </>
                  ) : (
                    <>
                      <div><span className="text-[var(--text-muted,#64748b)]">Заказчик:</span> <strong>{c.clientName}</strong></div>
                      <div><span className="text-[var(--text-muted,#64748b)]">Исполнитель:</span> <strong>{c.contractorName}</strong></div>
                      <div><span className="text-[var(--text-muted,#64748b)]">Стоимость:</span> <strong className="text-indigo-900 font-bold">{formatPrice(c.variableValues['price'])}</strong></div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border-primary,#e2e8f0)]">
                <button
                  onClick={() => navigate(`/contracts/${c.id}`)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  Открыть <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
