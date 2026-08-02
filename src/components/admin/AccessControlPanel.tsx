import React from 'react';
import { Check, Crown, Eye, Headphones, Shield, UserCog } from 'lucide-react';
import { PlatformStaffRole, UserPermission } from '../../types';

const permissionLabels: Record<UserPermission, string> = {
  'contracts.view_all': 'Все договоры',
  'contracts.manage_templates': 'Юридические шаблоны',
  'contracts.cancel_any': 'Отмена договора',
  'contracts.edit_created_draft': 'Редактирование черновика',
  'disputes.view_all': 'Все рекламации',
  'disputes.manage': 'Работа с рекламациями',
  'disputes.approve_financial': 'Денежные решения',
  'security.view': 'Инциденты безопасности',
  'security.manage': 'Операционные блокировки',
  'users.manage_access': 'Роли сотрудников',
  'audit.view': 'Неизменяемый аудит',
  'system.admin': 'Полный системный доступ'
};

const roles: Array<{
  id: PlatformStaffRole;
  title: string;
  description: string;
  icon: typeof Crown;
  permissions: UserPermission[];
}> = [
  {
    id: 'owner',
    title: 'Владелец',
    description: 'Полный контроль, управление ролями и второе подтверждение денежных решений',
    icon: Crown,
    permissions: ['system.admin', 'users.manage_access', 'disputes.approve_financial', 'security.manage', 'audit.view']
  },
  {
    id: 'senior_operator',
    title: 'Старший оператор',
    description: 'Очереди, эскалации и операционная координация без управления владельцами',
    icon: UserCog,
    permissions: ['disputes.view_all', 'disputes.manage', 'disputes.approve_financial', 'security.view', 'audit.view']
  },
  {
    id: 'reclamation_manager',
    title: 'Менеджер рекламаций',
    description: 'Проверка фактов, внутренние заметки и предложение решения без самоодобрения денег',
    icon: Headphones,
    permissions: ['disputes.view_all', 'disputes.manage']
  },
  {
    id: 'security_manager',
    title: 'Служба безопасности',
    description: 'SAFETY и FRAUD, блокировки и расследования без доступа к финансовому решению',
    icon: Shield,
    permissions: ['security.view', 'security.manage', 'disputes.view_all', 'audit.view']
  },
  {
    id: 'read_only_auditor',
    title: 'Только чтение',
    description: 'Просмотр аудита и дел без возможности менять состояние',
    icon: Eye,
    permissions: ['disputes.view_all', 'security.view', 'audit.view']
  }
];

export const staffRolePermissions = Object.fromEntries(roles.map(role => [role.id, role.permissions])) as Record<PlatformStaffRole, UserPermission[]>;

export default function AccessControlPanel({ currentRole }: { currentRole: PlatformStaffRole }) {
  const ownerMode = currentRole === 'owner';
  return (
    <div className="space-y-5 animate-fade-in" id="admin-access-control">
      <div className="p-5 sm:p-7 rounded-3xl bg-[var(--surface-primary)] border border-[var(--border-primary)]">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--gold-primary)]">Role based access</p>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mt-1">
          <div>
            <h3 className="text-2xl font-black">Матрица доступа сотрудников</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-2">Минимально необходимые права, отдельное финансовое подтверждение и полный аудит действий.</p>
          </div>
          <span className={`text-xs font-black px-3 py-1.5 rounded-full ${ownerMode ? 'bg-emerald-100 text-emerald-700' : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)]'}`}>
            {ownerMode ? 'УПРАВЛЕНИЕ ДОСТУПНО ВЛАДЕЛЬЦУ' : 'РЕЖИМ ПРОСМОТРА'}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {roles.map(role => {
          const Icon = role.icon;
          return (
            <section key={role.id} className={`p-5 rounded-3xl bg-[var(--surface-primary)] border ${currentRole === role.id ? 'border-[var(--gold-primary)]' : 'border-[var(--border-primary)]'}`}>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--gold-highlight)] grid place-items-center shrink-0"><Icon className="w-5 h-5 text-[var(--gold-primary)]" /></div>
                <div>
                  <h4 className="text-base font-black">{role.title}</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{role.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-5">
                {role.permissions.map(permission => (
                  <span key={permission} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-soft)] text-xs font-bold">
                    <Check className="w-3 h-3 text-emerald-600" /> {permissionLabels[permission]}
                  </span>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
