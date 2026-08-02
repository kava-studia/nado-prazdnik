import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { ClientStatus, ContractorStatus } from '../types';

interface StatusBadgeProps {
  type: 'client' | 'contractor';
  status: ClientStatus | ContractorStatus;
}

export default function StatusBadge({ type, status }: StatusBadgeProps) {
  if (type === 'client') {
    if (status === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Подтверждено вами
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock className="w-3.5 h-3.5 animate-pulse" />
          Требует подтверждения
        </span>
      );
    }
  } else {
    if (status === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Подтверждено подрядчиком
        </span>
      );
    } else if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
          <XCircle className="w-3.5 h-3.5" />
          Отклонено подрядчиком
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock className="w-3.5 h-3.5" />
          Ожидается ответ подрядчика
        </span>
      );
    }
  }
}
