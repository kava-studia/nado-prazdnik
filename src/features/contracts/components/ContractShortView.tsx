import React from 'react';
import { GeneratedContract } from '../types';
import { formatPrice, formatDate } from '../utils/contractFormatters';
import { Users, Calendar, MapPin, DollarSign, RefreshCw, XCircle, FileText, CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react';

interface Props {
  contract: GeneratedContract;
}

export const ContractShortView: React.FC<Props> = ({ contract }) => {
  const vals = contract.variableValues || {};

  const formatSecuredValue = (val: string | undefined, fallback: string) => {
    if (!val || val === 'Условие ещё не определено') return fallback;
    if (val === '[СКРЫТО]' || val === '[HIDDEN]') return 'Данные скрыты до согласования';
    return val;
  };

  const clientName = formatSecuredValue(vals['client_name'] || contract.clientName, 'Данные скрыты до согласования');
  const contractorName = formatSecuredValue(vals['contractor_name'] || contract.contractorName, 'Данные скрыты до согласования');
  const venueName = formatSecuredValue(vals['venue_name'] || contract.venueName || contractorName, 'Данные скрыты до согласования');
  const organizerName = formatSecuredValue(vals['organizer_name'] || contract.organizerName || contractorName, 'Данные скрыты до согласования');

  const docKind = contract.documentKind || 'service_contract';
  const category = contract.category || 'contractor';
  const partyRoles = contract.partyRoles || [];

  // Render Platform Policy view
  if (docKind === 'platform_policy') {
    return (
      <div className="bg-[var(--surface-card,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-2xl p-6 space-y-6 shadow-xs text-[var(--text-primary,#0f172a)]">
        <div className="border-b border-[var(--border-primary,#e2e8f0)] pb-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
              Политика платформы NADO
            </span>
            <h3 className="text-xl font-black text-[var(--text-primary,#0f172a)] mt-2">
              {contract.templateName}
            </h3>
            <p className="text-xs text-[var(--text-muted,#64748b)] mt-0.5">
              Редакция №{contract.currentVersion} • ID: {contract.id}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-[var(--surface-secondary,#f8fafc)] rounded-xl border border-[var(--border-primary,#e2e8f0)] space-y-1">
            <div className="font-bold text-[var(--text-muted,#64748b)]">Владелец документа</div>
            <div className="font-semibold text-sm">{vals['data_operator_name'] || 'Условие ещё не определено'}</div>
          </div>

          <div className="p-4 bg-[var(--surface-secondary,#f8fafc)] rounded-xl border border-[var(--border-primary,#e2e8f0)] space-y-1">
            <div className="font-bold text-[var(--text-muted,#64748b)]">Целевая аудитория</div>
            <div className="font-semibold text-sm">{vals['target_audience'] || 'Условие ещё не определено'}</div>
          </div>

          <div className="p-4 bg-[var(--surface-secondary,#f8fafc)] rounded-xl border border-[var(--border-primary,#e2e8f0)] space-y-1">
            <div className="font-bold text-[var(--text-muted,#64748b)]">Версия и дата вступления</div>
            <div className="font-medium">Версия: {vals['document_version'] || contract.currentVersion} • С {vals['effective_date'] ? formatDate(vals['effective_date']) : formatDate(contract.createdAt)}</div>
          </div>

          <div className="p-4 bg-[var(--surface-secondary,#f8fafc)] rounded-xl border border-[var(--border-primary,#e2e8f0)] space-y-1">
            <div className="font-bold text-[var(--text-muted,#64748b)]">Статус проверки</div>
            <div className="font-semibold text-emerald-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {contract.status === 'confirmed' ? 'Утвержден и действует' : 'В процессе согласования'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Consent view
  if (docKind === 'consent') {
    return (
      <div className="bg-[var(--surface-card,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-2xl p-6 space-y-6 shadow-xs text-[var(--text-primary,#0f172a)]">
        <div className="border-b border-[var(--border-primary,#e2e8f0)] pb-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
              Согласие на обработку ПДн
            </span>
            <h3 className="text-xl font-black text-[var(--text-primary,#0f172a)] mt-2">
              {contract.templateName}
            </h3>
            <p className="text-xs text-[var(--text-muted,#64748b)] mt-0.5">
              Редакция №{contract.currentVersion} • ID: {contract.id}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-[var(--surface-secondary,#f8fafc)] rounded-xl border border-[var(--border-primary,#e2e8f0)] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary,#0f172a)] mb-1">
              <UserCheck className="w-4 h-4 text-indigo-600" /> Subj / Субъект
            </div>
            <div>{vals['consent_subject_fio'] || vals['data_subject_name'] || clientName}</div>
            <div className="text-[var(--text-muted,#64748b)] text-[11px]">{vals['consent_subject_passport'] || ''}</div>
          </div>

          <div className="p-4 bg-[var(--surface-secondary,#f8fafc)] rounded-xl border border-[var(--border-primary,#e2e8f0)] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary,#0f172a)] mb-1">
              <ShieldCheck className="w-4 h-4 text-indigo-600" /> Operator / Оператор
            </div>
            <div>{vals['data_operator_name'] || 'Условие ещё не определено'}</div>
            <div className="text-[var(--text-muted,#64748b)] text-[11px]">{vals['data_operator_requisites'] || ''}</div>
          </div>

          <div className="p-4 bg-[var(--surface-secondary,#f8fafc)] rounded-xl border border-[var(--border-primary,#e2e8f0)] space-y-1 col-span-1 md:col-span-2">
            <div className="font-bold text-[var(--text-primary,#0f172a)]">Цель и Разрешенные действия</div>
            <p className="text-[var(--text-muted,#64748b)] mt-0.5">{vals['consent_purpose'] || vals['processing_purpose'] || 'Условие ещё не определено'}</p>
            <div className="font-medium mt-1">Действия: {vals['consent_actions'] || 'Условие ещё не определено'}</div>
          </div>

          <div className="p-4 bg-[var(--surface-secondary,#f8fafc)] rounded-xl border border-[var(--border-primary,#e2e8f0)] space-y-1">
            <div className="font-bold text-[var(--text-primary,#0f172a)]">Передача и Срок</div>
            <div>Передача третьим лицам: {vals['consent_third_parties'] || 'Условие ещё не определено'}</div>
            <div>Срок: {vals['consent_term'] || 'Условие ещё не определено'}</div>
          </div>

          <div className="p-4 bg-[var(--surface-secondary,#f8fafc)] rounded-xl border border-[var(--border-primary,#e2e8f0)] space-y-1">
            <div className="font-bold text-[var(--text-primary,#0f172a)]">Порядок отзыва и Дата</div>
            <div>Отзыв: {vals['consent_withdrawal_procedure'] || 'Условие ещё не определено'}</div>
            <div>Дата: {vals['consent_date'] ? formatDate(vals['consent_date']) : 'Условие ещё не определено'}</div>
          </div>
        </div>
      </div>
    );
  }

  // Render Venue contract view
  if (docKind === 'venue_contract' || category === 'venue' || partyRoles.includes('venue')) {
    return (
      <div className="bg-[var(--surface-card,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-2xl p-6 space-y-6 shadow-xs text-[var(--text-primary,#0f172a)]">
        <div className="border-b border-[var(--border-primary,#e2e8f0)] pb-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
              Договор площадки
            </span>
            <h3 className="text-xl font-black text-[var(--text-primary,#0f172a)] mt-2">
              {contract.templateName}
            </h3>
            <p className="text-xs text-[var(--text-muted,#64748b)] mt-0.5">
              Редакция №{contract.currentVersion} • ID: {contract.id}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-[var(--surface-secondary,#f8fafc)] rounded-xl border border-[var(--border-primary,#e2e8f0)] space-y-1">
            <div className="flex items-center gap-2 font-bold text-[var(--text-primary,#0f172a)]">
              <Users className="w-4 h-4 text-indigo-600" /> Стороны
            </div>
            <div><span className="text-[var(--text-muted,#64748b)]">Заказчик:</span> <strong>{clientName}</strong></div>
            <div><span className="text-[var(--text-muted,#64748b)]">Площадка:</span> <strong>{venueName}</strong></div>
          </div>

          <div className="p-4 bg-[var(--surface-secondary,#f8fafc)] rounded-xl border border-[var(--border-primary,#e2e8f0)] space-y-1">
            <div className="flex items-center gap-2 font-bold text-[var(--text-primary,#0f172a)]">
              <MapPin className="w-4 h-4 text-indigo-600" /> Модель площадки и Зал
            </div>
            <div>Модель: <strong>{contract.templateSubcategory || vals['venue_model'] || 'Аренда / Услуги'}</strong></div>
            <div>Локация: {vals['event_location'] || 'Условие ещё не определено'}</div>
          </div>

          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-2 col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 font-bold text-[var(--text-primary,#0f172a)] text-sm">
              <DollarSign className="w-4 h-4 text-indigo-600" /> Состав стоимости
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
              <div><span className="text-[var(--text-muted,#64748b)]">Общая цена:</span> <strong className="text-indigo-700 text-sm block">{vals['price'] ? formatPrice(vals['price']) : '—'}</strong></div>
              <div><span className="text-[var(--text-muted,#64748b)]">Аренда:</span> <strong className="block">{vals['rent_cost'] ? formatPrice(vals['rent_cost']) : '—'}</strong></div>
              <div><span className="text-[var(--text-muted,#64748b)]">Питание:</span> <strong className="block">{vals['catering_cost'] ? formatPrice(vals['catering_cost']) : '—'}</strong></div>
              <div><span className="text-[var(--text-muted,#64748b)]">Оборудование:</span> <strong className="block">{vals['tech_cost'] ? formatPrice(vals['tech_cost']) : '—'}</strong></div>
            </div>
          </div>

          {vals['cork_fee'] && (
            <div className="p-4 bg-[var(--surface-secondary,#f8fafc)] rounded-xl border border-[var(--border-primary,#e2e8f0)] space-y-1">
              <div className="font-bold text-[var(--text-primary,#0f172a)]">Пробковый сбор</div>
              <div className="text-[var(--text-muted,#64748b)]">{vals['cork_fee']} ₽/чел</div>
            </div>
          )}

          <div className="p-4 bg-[var(--surface-secondary,#f8fafc)] rounded-xl border border-[var(--border-primary,#e2e8f0)] space-y-1">
            <div className="font-bold text-[var(--text-primary,#0f172a)]">Ограничения площадки</div>
            <div className="text-[var(--text-muted,#64748b)]">{vals['venue_restrictions'] || 'Стандартные правила эксплуатации'}</div>
          </div>
        </div>
      </div>
    );
  }

  // Render Organizer contract view
  if (category === 'organizer' || partyRoles.includes('organizer')) {
    return (
      <div className="bg-[var(--surface-card,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-2xl p-6 space-y-6 shadow-xs text-[var(--text-primary,#0f172a)]">
        <div className="border-b border-[var(--border-primary,#e2e8f0)] pb-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
              Договор организатора
            </span>
            <h3 className="text-xl font-black text-[var(--text-primary,#0f172a)] mt-2">
              {contract.templateName}
            </h3>
            <p className="text-xs text-[var(--text-muted,#64748b)] mt-0.5">
              Редакция №{contract.currentVersion} • ID: {contract.id}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-[var(--surface-secondary,#f8fafc)] rounded-xl border border-[var(--border-primary,#e2e8f0)] space-y-1">
            <div className="flex items-center gap-2 font-bold text-[var(--text-primary,#0f172a)]">
              <Users className="w-4 h-4 text-indigo-600" /> Стороны
            </div>
            <div><span className="text-[var(--text-muted,#64748b)]">Заказчик:</span> <strong>{clientName}</strong></div>
            <div><span className="text-[var(--text-muted,#64748b)]">Организатор:</span> <strong>{organizerName}</strong></div>
          </div>

          <div className="p-4 bg-[var(--surface-secondary,#f8fafc)] rounded-xl border border-[var(--border-primary,#e2e8f0)] space-y-1">
            <div className="flex items-center gap-2 font-bold text-[var(--text-primary,#0f172a)]">
              <FileText className="w-4 h-4 text-indigo-600" /> Состав организации
            </div>
            <div>{vals['team_composition'] || 'Команда специалистов и координаторов'}</div>
          </div>

          <div className="p-4 bg-[var(--surface-secondary,#f8fafc)] rounded-xl border border-[var(--border-primary,#e2e8f0)] space-y-1">
            <div className="flex items-center gap-2 font-bold text-[var(--text-primary,#0f172a)]">
              <Calendar className="w-4 h-4 text-indigo-600" /> Координация
            </div>
            <div>{vals['coordination_scope'] || 'Полное сопровождение мероприятия'}</div>
          </div>

          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-1">
            <div className="flex items-center gap-2 font-bold text-[var(--text-primary,#0f172a)]">
              <DollarSign className="w-4 h-4 text-indigo-600" /> Стоимость
            </div>
            <div className="text-base font-black text-indigo-700">
              {vals['price'] ? formatPrice(vals['price']) : 'Условие ещё не определено'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render standard Service Contract view
  const serviceText = vals['service_composition'] || contract.templateName || 'Условие ещё не определено';
  const dateText = vals['event_date'] ? formatDate(vals['event_date']) : 'Условие ещё не определено';
  const timeText = vals['event_time'] ? `с ${vals['event_time']}` : '';
  const locationText = vals['event_location'] || 'Условие ещё не определено';
  const priceText = vals['price'] ? formatPrice(vals['price']) : 'Условие ещё не определено';

  const prepayNum = Number(vals['prepayment'] || 0);
  const prepaymentDisplay = prepayNum > 0 ? formatPrice(vals['prepayment']) : (vals['prepayment'] === '0' ? 'Предоплата не требуется' : 'Условие ещё не определено');

  const cancellationPolicy = vals['cancellation_policy'] || 'Условие ещё не определено';
  const reschedulePolicy = vals['reschedule_policy'] || 'Условие ещё не определено';
  const refundPolicy = vals['refund_policy'] || 'Условие ещё не определено';
  const prepaymentDueRule = vals['prepayment_due_rule'] || 'Условие ещё не определено';
  const finalPaymentRule = vals['final_payment_rule'] || 'Условие ещё не определено';

  return (
    <div className="bg-[var(--surface-card,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-2xl p-6 space-y-6 shadow-xs text-[var(--text-primary,#0f172a)]">
      <div className="border-b border-[var(--border-primary,#e2e8f0)] pb-4 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
            Краткая сводка договора
          </span>
          <h3 className="text-xl font-black text-[var(--text-primary,#0f172a)] mt-2">
            {contract.templateName}
          </h3>
          <p className="text-xs text-[var(--text-muted,#64748b)] mt-0.5">
            Редакция №{contract.currentVersion} • ID: {contract.id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Кто стороны */}
        <div className="p-4 bg-[var(--surface-secondary,#f8fafc)] rounded-xl border border-[var(--border-primary,#e2e8f0)] space-y-2">
          <div className="flex items-center gap-2 font-bold text-[var(--text-primary,#0f172a)] text-sm">
            <Users className="w-4 h-4 text-indigo-600" />
            Кто стороны
          </div>
          <div className="text-xs space-y-1">
            <div><span className="text-[var(--text-muted,#64748b)]">Заказчик:</span> <strong className="text-[var(--text-primary,#0f172a)]">{clientName}</strong></div>
            <div><span className="text-[var(--text-muted,#64748b)]">Исполнитель:</span> <strong className="text-[var(--text-primary,#0f172a)]">{contractorName}</strong></div>
          </div>
        </div>

        {/* 2. Какая услуга */}
        <div className="p-4 bg-[var(--surface-secondary,#f8fafc)] rounded-xl border border-[var(--border-primary,#e2e8f0)] space-y-2">
          <div className="flex items-center gap-2 font-bold text-[var(--text-primary,#0f172a)] text-sm">
            <FileText className="w-4 h-4 text-indigo-600" />
            Какая услуга
          </div>
          <div className="text-xs text-[var(--text-primary,#0f172a)] leading-relaxed font-medium">
            {serviceText}
          </div>
        </div>

        {/* 3. Когда */}
        <div className="p-4 bg-[var(--surface-secondary,#f8fafc)] rounded-xl border border-[var(--border-primary,#e2e8f0)] space-y-2">
          <div className="flex items-center gap-2 font-bold text-[var(--text-primary,#0f172a)] text-sm">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Когда
          </div>
          <div className="text-xs text-[var(--text-primary,#0f172a)]">
            <div><strong>{dateText}</strong> {timeText}</div>
            {vals['setup_time'] && <div className="text-[var(--text-muted,#64748b)] text-[11px] mt-0.5">Допуск с {vals['setup_time']}</div>}
          </div>
        </div>

        {/* 4. Где */}
        <div className="p-4 bg-[var(--surface-secondary,#f8fafc)] rounded-xl border border-[var(--border-primary,#e2e8f0)] space-y-2">
          <div className="flex items-center gap-2 font-bold text-[var(--text-primary,#0f172a)] text-sm">
            <MapPin className="w-4 h-4 text-indigo-600" />
            Где
          </div>
          <div className="text-xs text-[var(--text-primary,#0f172a)]">
            <div>{locationText}</div>
            {vals['hall_name'] && <div className="text-[var(--text-muted,#64748b)] text-[11px] mt-0.5">Зал: {vals['hall_name']}</div>}
          </div>
        </div>

        {/* 5. Сколько стоит */}
        <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-2 col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 font-bold text-[var(--text-primary,#0f172a)] text-sm">
            <DollarSign className="w-4 h-4 text-indigo-600" />
            Сколько стоит и как оплачивается
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs pt-1">
            <div>
              <div className="text-[var(--text-muted,#64748b)]">Общая стоимость:</div>
              <div className="text-base font-black text-indigo-700">{priceText}</div>
            </div>
            <div>
              <div className="text-[var(--text-muted,#64748b)]">Размер аванса:</div>
              <div className="text-sm font-bold text-[var(--text-primary,#0f172a)]">{prepaymentDisplay}</div>
            </div>
            <div>
              <div className="text-[var(--text-muted,#64748b)]">Сроки расчетов:</div>
              <div className="font-medium text-[var(--text-primary,#0f172a)]">
                Аванс: {prepaymentDueRule}<br />Финальная оплата: {finalPaymentRule}
              </div>
            </div>
          </div>
        </div>

        {/* 6. Отмена и Перенос */}
        <div className="p-4 bg-[var(--surface-secondary,#f8fafc)] rounded-xl border border-[var(--border-primary,#e2e8f0)] space-y-2">
          <div className="flex items-center gap-2 font-bold text-[var(--text-primary,#0f172a)] text-sm">
            <XCircle className="w-4 h-4 text-rose-600" />
            Как отменить
          </div>
          <p className="text-xs text-[var(--text-muted,#64748b)] leading-relaxed">
            {cancellationPolicy}. {refundPolicy}.
          </p>
        </div>

        <div className="p-4 bg-[var(--surface-secondary,#f8fafc)] rounded-xl border border-[var(--border-primary,#e2e8f0)] space-y-2">
          <div className="flex items-center gap-2 font-bold text-[var(--text-primary,#0f172a)] text-sm">
            <RefreshCw className="w-4 h-4 text-blue-600" />
            Как перенести
          </div>
          <p className="text-xs text-[var(--text-muted,#64748b)] leading-relaxed">
            {reschedulePolicy}.
          </p>
        </div>
      </div>

      {/* 7. Входящие приложения */}
      <div className="pt-2">
        <h4 className="font-bold text-[var(--text-primary,#0f172a)] text-xs uppercase tracking-wider mb-2">
          Входящие приложения ({contract.attachments?.length || 0})
        </h4>
        {contract.attachments && contract.attachments.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {contract.attachments.map((att) => (
              <span key={att.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--surface-secondary,#f8fafc)] text-[var(--text-primary,#0f172a)] rounded-lg text-xs font-medium border border-[var(--border-primary,#e2e8f0)]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {att.name}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-xs text-[var(--text-muted,#64748b)] italic">Приложения пока не прикреплены</div>
        )}
      </div>
    </div>
  );
};
