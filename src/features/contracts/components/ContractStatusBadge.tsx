import React from 'react';
import { GeneratedContract } from '../types';
import { getStatusBadgeInfo } from '../utils/contractFormatters';

interface Props {
  status: GeneratedContract['status'];
  size?: 'sm' | 'md' | 'lg';
}

export const ContractStatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const info = getStatusBadgeInfo(status);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3.5 py-1.5 text-sm font-semibold' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${info.bgClass} ${info.textClass} ${info.borderClass} ${sizeClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {info.label}
    </span>
  );
};
