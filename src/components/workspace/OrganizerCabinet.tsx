import React, { useState, useEffect } from 'react';
import {
  Folder,
  Users,
  Grid,
  TrendingUp,
  Briefcase,
  Search,
  Plus,
  PlusCircle,
  FolderPlus,
  CheckCircle,
  FileText,
  DollarSign
} from 'lucide-react';
import {
  eventRepository,
  clientRepository,
  contractorRepository,
  contractRepository
} from '../../repositories';
import { EventProject, CRMClient, ContractorProfile, GeneratedContract } from '../../types';

import { useAuth } from '../../context/AuthContext';

export default function OrganizerCabinet() {
  const { user: currentUser } = useAuth();
  const [projects, setProjects] = useState<EventProject[]>([]);
  const [clients, setClients] = useState<CRMClient[]>([]);
  const [contractors, setContractors] = useState<ContractorProfile[]>([]);
  const [contracts, setContracts] = useState<GeneratedContract[]>([]);

  // Search/Filters states
  const [contractorCategoryFilter, setContractorCategoryFilter] = useState('');
  const [contractorSearch, setContractorSearch] = useState('');

  // Active view: 'projects' | 'clients' | 'team_builder' | 'contracts'
  const [activeTab, setActiveTab] = useState<'projects' | 'clients' | 'team_builder' | 'contracts'>('projects');

  const loadData = async () => {
    try {
      const allEvents = await eventRepository.listEvents({ ownerUserId: currentUser?.id || 'demo-user-id' });
      setProjects(allEvents);

      const allClients = await clientRepository.listClients('demo-user-id');
      setClients(allClients);

      const allContractors = await contractorRepository.listProfiles();
      setContractors(allContractors);

      const allContracts = await contractRepository.listContracts({ clientId: 'demo-user-id' });
      setContracts(allContracts);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('demo-state-changed', loadData);
    return () => window.removeEventListener('demo-state-changed', loadData);
  }, []);

  // Update Project stage from Kanban click
  const moveProjectStage = async (id: string, newStage: 'planning' | 'active' | 'completed') => {
    const proj = await eventRepository.getEvent(id);
    if (proj) {
      proj.status = newStage;
      await eventRepository.saveEvent(proj);
      await loadData();
    }
  };

  const getFilteredContractors = () => {
    return contractors.filter(c => {
      const matchCat = contractorCategoryFilter ? c.category === contractorCategoryFilter : true;
      const matchSearch = contractorSearch
        ? c.displayName.toLowerCase().includes(contractorSearch.toLowerCase()) ||
          c.description.toLowerCase().includes(contractorSearch.toLowerCase())
        : true;
      return matchCat && matchSearch;
    });
  };

  return (
    <div className="space-y-6" id="organizer-cabinet-root">
      {/* Tab select bar */}
      <div className="flex border-b border-[var(--border-soft)] gap-4" id="organizer-tab-bar">
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${activeTab === 'projects' ? 'border-[var(--gold-primary)] text-[var(--gold-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Канбан-Доска проектов</span>
        </button>

        <button
          onClick={() => setActiveTab('clients')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${activeTab === 'clients' ? 'border-[var(--gold-primary)] text-[var(--gold-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}
        >
          <Users className="w-4 h-4" />
          <span>База клиентов</span>
        </button>

        <button
          onClick={() => setActiveTab('team_builder')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${activeTab === 'team_builder' ? 'border-[var(--gold-primary)] text-[var(--gold-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}
        >
          <Search className="w-4 h-4" />
          <span>Конструктор команд</span>
        </button>

        <button
          onClick={() => setActiveTab('contracts')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${activeTab === 'contracts' ? 'border-[var(--gold-primary)] text-[var(--gold-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}
        >
          <FileText className="w-4 h-4" />
          <span>Библиотека договоров</span>
        </button>
      </div>

      {/* View: Projects Kanban board */}
      {activeTab === 'projects' && (
        <div className="space-y-6 animate-fade-in text-left">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="kanban-board">
            
            {/* COLUMN: PLANNING */}
            <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-amber-500 font-mono">Планирование</span>
                <span className="text-xs font-bold font-mono bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded-full">
                  {projects.filter(p => p.status === 'planning').length}
                </span>
              </div>
              <div className="space-y-3">
                {projects.filter(p => p.status === 'planning').map(p => (
                  <div key={p.id} className="bg-[var(--surface-secondary)] border border-[var(--border-soft)] rounded-2xl p-4 space-y-3 text-left hover:border-[var(--gold-primary)] transition-all">
                    <div>
                      <h4 className="text-sm font-extrabold">{p.name}</h4>
                      <span className="text-xs font-mono text-[var(--text-secondary)]">{p.eventType} • {p.guestsCount} гостей</span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-[var(--border-soft)] pt-2.5">
                      <span className="font-semibold font-mono text-[var(--gold-primary)]">{p.budgetTotal.toLocaleString('ru-RU')} ₽</span>
                      <button
                        onClick={() => moveProjectStage(p.id, 'active')}
                        className="text-xs font-bold uppercase text-[var(--gold-primary)] hover:underline cursor-pointer"
                      >
                        Запустить →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN: ACTIVE */}
            <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-green-500 font-mono">Активные проекты</span>
                <span className="text-xs font-bold font-mono bg-green-500/10 text-green-500 px-2.5 py-0.5 rounded-full">
                  {projects.filter(p => p.status === 'active').length}
                </span>
              </div>
              <div className="space-y-3">
                {projects.filter(p => p.status === 'active').map(p => (
                  <div key={p.id} className="bg-[var(--surface-secondary)] border border-[var(--border-soft)] rounded-2xl p-4 space-y-3 text-left hover:border-[var(--gold-primary)] transition-all">
                    <div>
                      <h4 className="text-sm font-extrabold">{p.name}</h4>
                      <span className="text-xs font-mono text-[var(--text-secondary)]">{p.eventType} • {p.guestsCount} гостей</span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-[var(--border-soft)] pt-2.5">
                      <span className="font-semibold font-mono text-[var(--gold-primary)]">{p.budgetTotal.toLocaleString('ru-RU')} ₽</span>
                      <button
                        onClick={() => moveProjectStage(p.id, 'completed')}
                        className="text-xs font-bold uppercase text-[var(--gold-primary)] hover:underline cursor-pointer"
                      >
                        Завершить →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN: COMPLETED */}
            <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-blue-500 font-mono">Архив / Завершено</span>
                <span className="text-xs font-bold font-mono bg-blue-500/10 text-blue-500 px-2.5 py-0.5 rounded-full">
                  {projects.filter(p => p.status === 'completed').length}
                </span>
              </div>
              <div className="space-y-3">
                {projects.filter(p => p.status === 'completed').map(p => (
                  <div key={p.id} className="bg-[var(--surface-secondary)] border border-[var(--border-soft)] rounded-2xl p-4 space-y-3 opacity-75 text-left">
                    <div>
                      <h4 className="text-sm font-extrabold">{p.name}</h4>
                      <span className="text-xs font-mono text-[var(--text-secondary)]">{p.eventType} • {p.guestsCount} гостей</span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-[var(--border-soft)] pt-2.5">
                      <span className="font-semibold font-mono text-emerald-400">Оплачено на 100%</span>
                      <span className="text-xs text-green-500 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Готово
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* View: Client database directory */}
      {activeTab === 'clients' && (
        <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">База данных клиентов в CRM</h3>
            <span className="text-xs font-mono text-[var(--text-secondary)]">Всего: {clients.length}</span>
          </div>

          <div className="space-y-3.5">
            {clients.map(cl => (
              <div
                key={cl.id}
                className="p-5 bg-[var(--surface-secondary)] border border-[var(--border-soft)] rounded-2xl flex flex-wrap items-center justify-between gap-6 hover:border-[var(--gold-primary)] transition-all"
              >
                <div className="space-y-1">
                  <h4 className="text-base font-bold">{cl.name}</h4>
                  <div className="text-xs text-[var(--text-secondary)] space-x-4">
                    <span>Тел: {cl.phone}</span>
                    <span>Email: {cl.email}</span>
                    <span>Канал: {cl.contactChannel}</span>
                  </div>
                </div>

                <div className="flex gap-6 items-center">
                  <div className="text-right">
                    <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold block">Покупок</span>
                    <span className="text-sm font-bold font-mono">{cl.projectsCount}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold block">Выручка</span>
                    <span className="text-sm font-bold font-mono text-emerald-400">{cl.totalSpent.toLocaleString('ru-RU')} ₽</span>
                  </div>

                  {cl.activeDisputesCount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold uppercase font-mono">
                      {cl.activeDisputesCount} Активный спор
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View: Contractor Team Builder */}
      {activeTab === 'team_builder' && (
        <div className="space-y-6 animate-fade-in text-left">
          <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-5 shadow-sm flex flex-wrap gap-4 items-center">
            <div className="flex-1 relative min-w-[200px]">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Поиск исполнителя по имени, описанию..."
                value={contractorSearch}
                onChange={e => setContractorSearch(e.target.value)}
                className="w-full p-2.5 pl-10 text-sm bg-[var(--surface-secondary)] border border-[var(--border-soft)] rounded-xl outline-none focus:border-[var(--gold-primary)] text-white"
              />
            </div>

            <select
              value={contractorCategoryFilter}
              onChange={e => setContractorCategoryFilter(e.target.value)}
              className="p-2.5 text-sm bg-[var(--surface-secondary)] border border-[var(--border-soft)] rounded-xl outline-none text-white font-medium cursor-pointer"
            >
              <option value="">Все категории</option>
              <option value="venue">Площадка</option>
              <option value="host">Ведущий</option>
              <option value="dj">Диджей</option>
              <option value="photographer">Фотограф</option>
              <option value="videographer">Видеограф</option>
              <option value="catering">Кейтеринг</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {getFilteredContractors().map(c => (
              <div
                key={c.id}
                className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-6 space-y-4 flex flex-col justify-between hover:border-[var(--gold-primary)] transition-all"
              >
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-xs uppercase font-bold font-mono bg-black/20 text-[var(--gold-primary)] px-2.5 py-0.5 rounded-full">
                        {c.category === 'venue' ? 'Площадка' : c.category === 'host' ? 'Ведущий' : c.category === 'dj' ? 'Диджей' : c.category}
                      </span>
                      <h4 className="text-lg font-extrabold mt-1.5">{c.displayName}</h4>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-[var(--text-muted)] font-mono block">Старт от</span>
                      <span className="text-base font-black font-mono text-[var(--gold-primary)]">
                        {c.startingPrice.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">{c.description}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--border-soft)]">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[var(--gold-primary)] font-bold">★ {c.reputation.rating}</span>
                    <span className="text-[var(--text-muted)]">({c.reputation.reviewsCount} отзывов)</span>
                  </div>

                  <button className="px-4 py-2 bg-[var(--surface-secondary)] border border-[var(--border-soft)] hover:border-[var(--gold-primary)] text-xs font-bold rounded-xl transition-all cursor-pointer">
                    Пригласить в команду
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View: Contracts library */}
      {activeTab === 'contracts' && (
        <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in text-left">
          <h3 className="text-lg font-bold">Активные договоры клиентов платформы</h3>
          <div className="space-y-3">
            {contracts.length > 0 ? (
              contracts.map(cnt => (
                <div
                  key={cnt.id}
                  className="p-4 bg-[var(--surface-secondary)] border border-[var(--border-soft)] rounded-2xl flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="space-y-1 text-left">
                    <h4 className="text-sm font-bold">{cnt.templateName}</h4>
                    <span className="text-xs text-[var(--text-secondary)] block font-mono">
                      Версия {cnt.currentVersion} • Клиент: {cnt.clientName} • Исполнитель: {cnt.contractorName}
                    </span>
                  </div>

                  <span className="text-xs font-semibold font-mono uppercase bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full">
                    {cnt.status === 'confirmed' ? 'Двусторонне подписан' : cnt.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--text-secondary)] py-2">Нет сформированных договоров.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
