import React from 'react';
import { ContractVariable } from '../types';
import { evaluateVisibilityCondition } from '../utils/visibility';
import { renderContractText } from '../utils/contractFormatters';

interface ContractVariableRendererProps {
  variables: ContractVariable[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
}

export const ContractVariableRenderer: React.FC<ContractVariableRendererProps> & {
  renderText: (templateText: string, values: Record<string, string>) => string;
} = ({
  variables,
  values,
  onChange,
  disabled = false
}) => {
  // Group variables by group name
  const grouped: Record<string, ContractVariable[]> = {};
  for (const v of variables) {
    if (!evaluateVisibilityCondition(v.visibilityCondition, values)) {
      continue;
    }
    const grp = v.group || 'Общие параметры';
    if (!grouped[grp]) grouped[grp] = [];
    grouped[grp].push(v);
  }

  const renderField = (v: ContractVariable) => {
    const value = values[v.key] ?? v.defaultValue ?? '';

    switch (v.type) {
      case 'textarea':
        return (
          <textarea
            id={`var-${v.key}`}
            value={value}
            onChange={(e) => onChange(v.key, e.target.value)}
            disabled={disabled}
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-primary,#e2e8f0)] bg-[var(--bg-primary,#ffffff)] text-[var(--text-primary,#0f172a)] focus:ring-2 focus:ring-[var(--accent-primary,#3b82f6)] disabled:opacity-50"
            placeholder={v.description}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id={`var-${v.key}`}
              checked={value === 'true' || value === '1' || value === 'yes'}
              onChange={(e) => onChange(v.key, e.target.checked ? 'true' : 'false')}
              disabled={disabled}
              className="h-4 w-4 rounded border-[var(--border-primary,#e2e8f0)] text-[var(--accent-primary,#3b82f6)] focus:ring-[var(--accent-primary,#3b82f6)]"
            />
            <label htmlFor={`var-${v.key}`} className="text-sm text-[var(--text-primary,#0f172a)]">
              {v.description || 'Да'}
            </label>
          </div>
        );

      case 'select':
        return (
          <select
            id={`var-${v.key}`}
            value={value}
            onChange={(e) => onChange(v.key, e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-primary,#e2e8f0)] bg-[var(--bg-primary,#ffffff)] text-[var(--text-primary,#0f172a)] focus:ring-2 focus:ring-[var(--accent-primary,#3b82f6)] disabled:opacity-50"
          >
            <option value="">-- Выберите значение --</option>
            {v.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'number':
      case 'money':
      case 'percentage':
        return (
          <div className="relative">
            <input
              type="number"
              id={`var-${v.key}`}
              value={value}
              onChange={(e) => onChange(v.key, e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-primary,#e2e8f0)] bg-[var(--bg-primary,#ffffff)] text-[var(--text-primary,#0f172a)] focus:ring-2 focus:ring-[var(--accent-primary,#3b82f6)] disabled:opacity-50"
              placeholder={v.description}
            />
            {v.type === 'money' && (
              <span className="absolute right-3 top-2.5 text-xs text-[var(--text-muted,#64748b)]">руб.</span>
            )}
            {v.type === 'percentage' && (
              <span className="absolute right-3 top-2.5 text-xs text-[var(--text-muted,#64748b)]">%</span>
            )}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            id={`var-${v.key}`}
            value={value}
            onChange={(e) => onChange(v.key, e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-primary,#e2e8f0)] bg-[var(--bg-primary,#ffffff)] text-[var(--text-primary,#0f172a)] focus:ring-2 focus:ring-[var(--accent-primary,#3b82f6)] disabled:opacity-50"
          />
        );

      case 'time':
        return (
          <input
            type="time"
            id={`var-${v.key}`}
            value={value}
            onChange={(e) => onChange(v.key, e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-primary,#e2e8f0)] bg-[var(--bg-primary,#ffffff)] text-[var(--text-primary,#0f172a)] focus:ring-2 focus:ring-[var(--accent-primary,#3b82f6)] disabled:opacity-50"
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            id={`var-${v.key}`}
            value={value}
            onChange={(e) => onChange(v.key, e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-primary,#e2e8f0)] bg-[var(--bg-primary,#ffffff)] text-[var(--text-primary,#0f172a)] focus:ring-2 focus:ring-[var(--accent-primary,#3b82f6)] disabled:opacity-50"
          />
        );

      case 'person':
      case 'organization':
      case 'address':
      case 'document_reference':
      case 'text':
      default:
        return (
          <input
            type="text"
            id={`var-${v.key}`}
            value={value}
            onChange={(e) => onChange(v.key, e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-primary,#e2e8f0)] bg-[var(--bg-primary,#ffffff)] text-[var(--text-primary,#0f172a)] focus:ring-2 focus:ring-[var(--accent-primary,#3b82f6)] disabled:opacity-50"
            placeholder={v.description}
          />
        );
    }
  };

  if (Object.keys(grouped).length === 0) {
    return (
      <div className="text-sm text-[var(--text-muted,#64748b)] p-4 text-center">
        Нет доступных переменных для заполнения
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([groupTitle, groupVars]) => (
        <div key={groupTitle} className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted,#64748b)] border-b border-[var(--border-primary,#e2e8f0)] pb-1">
            {groupTitle}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupVars.map((v) => (
              <div key={v.key} className={v.type === 'textarea' ? 'md:col-span-2' : ''}>
                <label htmlFor={`var-${v.key}`} className="block text-xs font-medium text-[var(--text-primary,#0f172a)] mb-1">
                  {v.label} {v.required && <span className="text-red-500">*</span>}
                </label>
                {renderField(v)}
                {v.description && v.type !== 'boolean' && (
                  <p className="text-[11px] text-[var(--text-muted,#64748b)] mt-0.5">{v.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

ContractVariableRenderer.renderText = renderContractText;
