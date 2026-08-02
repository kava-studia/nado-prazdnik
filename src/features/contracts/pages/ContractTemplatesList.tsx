import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContractService } from '../services/ContractService';
import { useContractRepository } from '../hooks/useContractRepository';
import { ContractTemplate } from '../types';
import { ContractConfirmDialog } from '../components/ContractConfirmDialog';
import { LEGAL_REVIEW_NOTICE } from '../templates/defaultTemplates';
import { ShieldAlert, Search, Plus, Filter, FileCode, CheckCircle2, Eye, Edit3, ArrowRight } from 'lucide-react';

export const ContractTemplatesList: React.FC = () => {
  const repository = useContractRepository();
  const contractService = new ContractService(repository);
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Dialog state for publishing
  const [publishTargetId, setPublishTargetId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const list = await contractService.listTemplates();
    setTemplates(list);
  };

  const handlePublishConfirm = async () => {
    if (!publishTargetId) return;
    const tpl = await repository.getTemplate(publishTargetId);
    if (tpl) {
      tpl.status = 'published';
      tpl.updatedAt = new Date().toISOString();
      await repository.saveTemplate(tpl);
      await loadTemplates();
    }
    setPublishTargetId(null);
  };

  const filtered = templates.filter((t) => {
    if (selectedCategory !== 'all' && t.category !== selectedCategory && t.subcategory !== selectedCategory) return false;
    if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
    }
    return true;
  });

  const categories = [
    { id: 'all', label: 'Все категории' },
    { id: 'platform', label: 'Платформенные (13)' },
    { id: 'contractor', label: 'Подрядчики (15)' },
    { id: 'venue', label: 'Площадки (3)' },
    { id: 'organizer', label: 'Организаторы' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 text-stone-800">
      {/* Legal Banner */}
      <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3.5 shadow-sm text-stone-800">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <strong className="font-bold text-amber-900 block mb-0.5">Внимание администратора и юриста:</strong>
          {LEGAL_REVIEW_NOTICE}. По умолчанию всем новым шаблонам присвоен статус <span className="font-bold uppercase tracking-wider text-amber-800">legal_review</span>. Перед публикацией убедитесь в отсутствии юридических противоречий.
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight">
            Официальная библиотека шаблонов (31 шаблон)
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Платформенные правила, договоры подряда и 3 юридические модели площадок
          </p>
        </div>

        <button
          onClick={() => navigate('/contracts/create')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Создать новый договор
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-stone-50 p-3 rounded-2xl border border-stone-200">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по шаблонам..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-white border border-stone-200 hover:border-amber-400 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700 px-2.5 py-1 rounded-md border border-stone-200">
                  {tpl.category} {tpl.subcategory ? `• ${tpl.subcategory}` : ''}
                </span>

                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                  <ShieldAlert className="w-3 h-3 text-amber-600" />
                  Требуется проверка юриста
                </span>
              </div>

              <div>
                <h3 className="font-bold text-stone-900 text-sm leading-snug">
                  {tpl.name}
                </h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed line-clamp-2">
                  {tpl.description}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between gap-2">
              <button
                onClick={() => navigate(`/contracts/templates/${tpl.id}`)}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900 cursor-pointer"
              >
                Просмотр <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPublishTargetId(tpl.id)}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Опубликовать
                </button>
                <button
                  onClick={() => navigate(`/contracts/create?templateId=${tpl.id}`)}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Создать
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Confirmation Dialog for Publishing */}
      <ContractConfirmDialog
        isOpen={!!publishTargetId}
        title="Публикация юридического шаблона"
        message="Вы подтверждаете, что текст данного шаблона был полностью проверен квалифицированным юристом и готов для использования в официальных сделках?"
        confirmText="Да, юридически проверено"
        cancelText="Вернуться к проверке"
        variant="primary"
        onConfirm={handlePublishConfirm}
        onCancel={() => setPublishTargetId(null)}
      />
    </div>
  );
};
