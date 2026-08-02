import React from 'react';
import { Building2, UtensilsCrossed, Layers, HelpCircle } from 'lucide-react';
import { VenueOperationModel } from '../types';

interface Props {
  selectedModel: VenueOperationModel;
  onSelectModel: (model: VenueOperationModel) => void;
}

export const VenueModelSelector: React.FC<Props> = ({ selectedModel, onSelectModel }) => {
  const models: { id: VenueOperationModel; title: string; desc: string; icon: React.ReactNode; templateId: string }[] = [
    {
      id: 'rent',
      title: 'Передаёт пространство в аренду',
      desc: 'Предоставление зала/шатёра без услуг банкета. Отдельно могут применяться клининг и пробковый сбор.',
      icon: <Building2 className="w-5 h-5 text-[var(--accent-primary,#2563eb)]" />,
      templateId: 'tpl-ven-rent'
    },
    {
      id: 'services',
      title: 'Оказывает комплекс услуг',
      desc: 'Банкетное обслуживание, депозит, ресторанная кухня и персонал без отдельной платы за пространство.',
      icon: <UtensilsCrossed className="w-5 h-5 text-[var(--accent-primary,#2563eb)]" />,
      templateId: 'tpl-ven-service'
    },
    {
      id: 'mixed',
      title: 'Предоставляет пространство и услуги одновременно',
      desc: 'Смешанная модель: в договоре раздельно указываются стоимость аренды зала, банкетного чека и тех. оборудования.',
      icon: <Layers className="w-5 h-5 text-[var(--accent-primary,#2563eb)]" />,
      templateId: 'tpl-ven-mixed'
    },
    {
      id: 'unspecified',
      title: 'Требуется определить модель',
      desc: 'Указать параметры и определить наиболее подходящую юридическую форму взаимодействия.',
      icon: <HelpCircle className="w-5 h-5 text-[var(--text-muted,#64748b)]" />,
      templateId: 'tpl-cnt-universal'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="bg-[var(--accent-light,#eff6ff)] border border-[var(--accent-primary,#2563eb)]/20 rounded-xl p-4">
        <h3 className="text-base font-black text-[var(--text-primary,#0f172a)] tracking-tight">
          Как площадка работает с клиентом?
        </h3>
        <p className="text-xs text-[var(--text-muted,#64748b)] mt-1">
          Выберите финансово-правовую модель взаимодействия площадки с заказчиком для подбора оптимального договора NADO CONTRACTS:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {models.map((m) => {
          const isSelected = selectedModel === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectModel(m.id)}
              className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[var(--accent-light,#eff6ff)] border-[var(--accent-primary,#2563eb)] ring-2 ring-[var(--accent-primary,#2563eb)]/20 shadow-sm'
                  : 'bg-[var(--surface-card,#ffffff)] border-[var(--border-primary,#e2e8f0)] hover:border-[var(--accent-primary,#2563eb)]/40 hover:bg-[var(--surface-secondary,#f8fafc)]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-[var(--accent-primary,#2563eb)] text-white' : 'bg-[var(--surface-secondary,#f8fafc)]'}`}>
                  {m.icon}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-[var(--text-primary,#0f172a)] text-sm">{m.title}</div>
                  <div className="text-xs text-[var(--text-muted,#64748b)] mt-1 leading-relaxed">{m.desc}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
