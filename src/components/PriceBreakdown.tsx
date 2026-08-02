import { HelpCircle } from 'lucide-react';

interface PriceRow {
  label: string;
  amount: number;
  description?: string;
}

interface PriceBreakdownProps {
  basePrice: number;
  mandatoryCosts: number;
  extraServicesPrice: number;
  rows?: PriceRow[]; // Custom rows can override standard breakdown
}

export default function PriceBreakdown({
  basePrice,
  mandatoryCosts,
  extraServicesPrice,
  rows
}: PriceBreakdownProps) {
  const finalTotal = basePrice + mandatoryCosts + extraServicesPrice;

  // Use custom rows if provided, otherwise standard
  const displayRows = rows || [
    {
      label: 'Основная стоимость услуги',
      amount: basePrice,
      description: 'Гонорар подрядчика и базовое звуковое сопровождение'
    },
    {
      label: 'Обязательные расходы',
      amount: mandatoryCosts,
      description: 'Транспорт и логистическая подготовка оборудования'
    },
    {
      label: 'Дополнительные опции',
      amount: extraServicesPrice,
      description: 'Световой дизайн, продление работы или спецэффекты'
    }
  ];

  const totalSum = displayRows.reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-4" id="price-breakdown-container">
      <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-outline font-mono">
          Прозрачная стоимость
        </h4>
        <div className="group relative">
          <HelpCircle className="w-3.5 h-3.5 text-outline cursor-pointer hover:text-white transition-colors" />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 rounded bg-surface-container text-xs text-outline opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 border border-white/5 shadow-xl">
            Все цены фиксируются договором и не подлежат одностороннему изменению со стороны подрядчика.
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {displayRows.map((row, idx) => (
          <div key={idx} className="flex justify-between items-start gap-4">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-white">{row.label}</span>
              {row.description && (
                <p className="text-xs text-outline font-sans leading-tight">{row.description}</p>
              )}
            </div>
            <span className="text-xs font-semibold text-white shrink-0 font-mono">
              {row.amount.toLocaleString('ru-RU')} ₽
            </span>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-white/10 flex justify-between items-center bg-white/5 -mx-4 -mb-4 p-4 rounded-b-2xl">
        <span className="text-sm font-bold text-white font-sans uppercase">Итоговая стоимость:</span>
        <span className="text-lg font-black text-primary-gold font-mono">
          {totalSum.toLocaleString('ru-RU')} ₽
        </span>
      </div>
    </div>
  );
}
