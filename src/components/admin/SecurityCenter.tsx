import React from 'react';
import { AlertOctagon, CheckCircle2, Clock3, KeyRound, LockKeyhole, Radar, ShieldCheck, TriangleAlert } from 'lucide-react';
import { DisputeCase } from '../../types';
import { isSlaOverdue } from '../../services/reclamationService';

interface Props {
  disputes: DisputeCase[];
  demoMode: boolean;
}

export default function SecurityCenter({ disputes, demoMode }: Props) {
  const critical = disputes.filter(item => item.riskType === 'safety' || item.riskType === 'fraud');
  const fraud = critical.filter(item => item.riskType === 'fraud');
  const overdue = critical.filter(item => isSlaOverdue(item));

  const controls = [
    { title: 'Разделение demo и real данных', status: 'active', detail: 'Разные ключи хранилища и отдельная демо сессия' },
    { title: 'HttpOnly сессия', status: 'active', detail: 'Cookie недоступна клиентскому JavaScript' },
    { title: 'Защита Telegram initData', status: 'active', detail: 'В production требуется серверная проверка HMAC подписи' },
    { title: 'MAX и Госуслуги', status: 'blocked', detail: 'Production вход закрыт до подключения реальных провайдеров' },
    { title: 'Реальные платежи', status: 'blocked', detail: 'Не включены до лицензированного банковского партнёра' },
    { title: 'Постоянное серверное хранилище сессий', status: 'planned', detail: 'Нужно до публичного production запуска' }
  ] as const;

  return (
    <div className="space-y-5 animate-fade-in" id="admin-security-center">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'Критические сигналы', value: critical.length, icon: AlertOctagon, color: 'text-red-600' },
          { label: 'FRAUD блокировки', value: fraud.length, icon: Radar, color: 'text-red-600' },
          { label: 'Нарушен SLA', value: overdue.length, icon: Clock3, color: overdue.length ? 'text-red-600' : 'text-emerald-600' },
          { label: 'Production заглушки', value: 3, icon: LockKeyhole, color: 'text-[var(--gold-primary)]' }
        ].map(item => (
          <div key={item.label} className="p-5 rounded-2xl bg-[var(--surface-primary)] border border-[var(--border-primary)]">
            <item.icon className={`w-5 h-5 ${item.color}`} />
            <p className="text-3xl font-black mt-4">{item.value}</p>
            <p className="text-xs font-bold text-[var(--text-secondary)] mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-5">
        <section className="p-5 sm:p-7 rounded-3xl bg-[var(--surface-primary)] border border-[var(--border-primary)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--gold-primary)]">Security operations</p>
              <h3 className="text-xl font-black mt-1">Критические инциденты</h3>
            </div>
            {demoMode && <span className="text-xs font-black px-2.5 py-1 rounded-full bg-[var(--gold-highlight)] text-[var(--gold-deep)]">ДЕМО</span>}
          </div>
          <div className="space-y-3 mt-5">
            {critical.map(item => (
              <div key={item.id} className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-950">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black">{item.riskType?.toUpperCase()}</span>
                  <span className="text-xs font-bold">SLA 30 минут</span>
                </div>
                <p className="text-sm font-black mt-2">{item.reason}</p>
                <p className="text-xs mt-2 text-red-800">{item.operationsBlockRequest ? 'Операционная блокировка запрошена автоматически' : 'Передано в срочную проверку безопасности'}</p>
              </div>
            ))}
            {critical.length === 0 && (
              <div className="p-8 text-center border border-dashed border-[var(--border-soft)] rounded-2xl">
                <ShieldCheck className="w-9 h-9 text-emerald-600 mx-auto" />
                <p className="text-sm font-black mt-3">Критических сигналов нет</p>
              </div>
            )}
          </div>
        </section>

        <section className="p-5 sm:p-7 rounded-3xl bg-[var(--surface-primary)] border border-[var(--border-primary)]">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--gold-primary)]">Security baseline</p>
          <h3 className="text-xl font-black mt-1">Контроль защитных мер</h3>
          <div className="space-y-3 mt-5">
            {controls.map(control => (
              <div key={control.title} className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-soft)] flex gap-3">
                {control.status === 'active' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : control.status === 'blocked' ? <LockKeyhole className="w-5 h-5 text-[var(--gold-primary)] shrink-0" /> : <TriangleAlert className="w-5 h-5 text-amber-600 shrink-0" />}
                <div>
                  <p className="text-sm font-black">{control.title}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{control.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 p-4 rounded-2xl bg-[var(--gold-highlight)] border border-[var(--gold-primary)]/25 flex gap-3">
            <KeyRound className="w-5 h-5 text-[var(--gold-primary)] shrink-0" />
            <p className="text-xs leading-relaxed font-bold">Перед публичным запуском обязательны постоянное серверное хранилище сессий, реальные OAuth интеграции и внешний аудит прав доступа.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
