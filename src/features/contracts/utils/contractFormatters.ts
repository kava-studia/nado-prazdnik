import { GeneratedContract } from '../types';

export function getStatusBadgeInfo(status: GeneratedContract['status']): { label: string; bgClass: string; textClass: string; borderClass: string } {
  switch (status) {
    case 'draft':
      return { label: 'Черновик', bgClass: 'bg-slate-100', textClass: 'text-slate-700', borderClass: 'border-slate-300' };
    case 'data_required':
      return { label: 'Требуются данные', bgClass: 'bg-amber-50', textClass: 'text-amber-800', borderClass: 'border-amber-300' };
    case 'ready_for_review':
      return { label: 'На согласовании', bgClass: 'bg-blue-50', textClass: 'text-blue-800', borderClass: 'border-blue-300' };
    case 'sent':
      return { label: 'Отправлен стороне', bgClass: 'bg-indigo-50', textClass: 'text-indigo-800', borderClass: 'border-indigo-300' };
    case 'partially_confirmed':
      return { label: 'Частично подтверждён', bgClass: 'bg-amber-50', textClass: 'text-amber-800', borderClass: 'border-amber-300' };
    case 'confirmed':
      return { label: 'Условия согласованы (демо)', bgClass: 'bg-emerald-100', textClass: 'text-emerald-900', borderClass: 'border-emerald-400' };
    case 'superseded':
      return { label: 'Заменён новой версией', bgClass: 'bg-purple-50', textClass: 'text-purple-800', borderClass: 'border-purple-300' };
    case 'cancelled':
      return { label: 'Отменён', bgClass: 'bg-rose-50', textClass: 'text-rose-800', borderClass: 'border-rose-300' };
    case 'completed':
      return { label: 'Исполнен', bgClass: 'bg-slate-100', textClass: 'text-slate-800', borderClass: 'border-slate-300' };
    default:
      return { label: status, bgClass: 'bg-slate-100', textClass: 'text-slate-700', borderClass: 'border-slate-200' };
  }
}

export function formatPrice(priceStr?: string | number): string {
  if (!priceStr) return '0 ₽';
  const num = typeof priceStr === 'number' ? priceStr : parseFloat(priceStr.replace(/\s+/g, '')) || 0;
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(num);
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  } catch {
    return dateStr;
  }
}

export function renderContractText(
  input: string | { title?: string; body: string; order?: number }[],
  values: Record<string, string>
): string {
  if (!input) return '';
  if (Array.isArray(input)) {
    return input.map(cl => {
      let clauseBody = cl.body;
      for (const [k, v] of Object.entries(values)) {
        clauseBody = clauseBody.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v !== undefined && v !== '' ? v : 'Условие не определено');
      }
      return `${cl.title ? cl.title + '\n' : ''}${clauseBody}`;
    }).join('\n\n');
  }
  return input.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const trimmed = key.trim();
    return values[trimmed] !== undefined && values[trimmed] !== '' ? values[trimmed] : `{{${trimmed}}}`;
  });
}

