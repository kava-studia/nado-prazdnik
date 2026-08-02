import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ContractService } from '../services/ContractService';
import { useContractRepository } from '../hooks/useContractRepository';
import { useAuth } from '../../../context/AuthContext';
import { ContractTemplate, VenueOperationModel, ContractTemplateVersion, ExternalContractParty, ContractPartyOption } from '../types';
import { EventProject, Booking } from '../../../types';
import { isLegalEntityConfigured, legalEntityConfig } from '../../../config/legalEntity';
import { VenueModelSelector } from '../components/VenueModelSelector';
import { ContractVariableRenderer } from '../components/ContractVariableRenderer';
import { getAttachmentsForCategory } from '../templates/attachmentTemplates';
import { useRepositories } from '../../../repositories/RepositoryProvider';
import { ContractWizardValidationService } from '../services/ContractWizardValidationService';
import { ArrowLeft, ArrowRight, Save, CheckCircle2, Paperclip, Sparkles, UserPlus, X, AlertTriangle } from 'lucide-react';

export const ContractCreateWizard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTemplateId = searchParams.get('templateId') || 'tpl-cnt-universal';

  const repo = useContractRepository();
  const contractService = useMemo(() => new ContractService(repo), [repo]);
  const { eventRepository, orderRepository, partyRepository } = useRepositories();
  const { user: currentUser } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplateId);
  const [templateVersion, setTemplateVersion] = useState<ContractTemplateVersion | null>(null);
  const [venueModel, setVenueModel] = useState<VenueOperationModel>('mixed');

  const [bindingMode, setBindingMode] = useState<'standalone' | 'event' | 'order'>('standalone');
  const [events, setEvents] = useState<EventProject[]>([]);
  const [orders, setOrders] = useState<Booking[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  // Parties loaded from PartyRepository
  const [clients, setClients] = useState<ContractPartyOption[]>([]);
  const [contractors, setContractors] = useState<ContractPartyOption[]>([]);
  const [venues, setVenues] = useState<ContractPartyOption[]>([]);
  const [organizers, setOrganizers] = useState<ContractPartyOption[]>([]);

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedContractorId, setSelectedContractorId] = useState<string>('');
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [selectedOrganizerId, setSelectedOrganizerId] = useState<string>('');

  // External Party Modal
  const [isAddExternalModalOpen, setIsAddExternalModalOpen] = useState(false);
  const [extPartyRole, setExtPartyRole] = useState<'client' | 'contractor' | 'venue' | 'organizer'>('client');
  const [extPartyName, setExtPartyName] = useState('');
  const [extPartyLegalStatus, setExtPartyLegalStatus] = useState<'individual' | 'self_employed' | 'sole_proprietor' | 'company'>('sole_proprietor');
  const [extPartyPhone, setExtPartyPhone] = useState('');
  const [extPartyEmail, setExtPartyEmail] = useState('');
  const [extPartyRequisites, setExtPartyRequisites] = useState('');

  const [isDemoData, setIsDemoData] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [selectedAttachments, setSelectedAttachments] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    contractService.listTemplates().then(setTemplates);

    if (currentUser?.id) {
      eventRepository.listEvents({ ownerUserId: currentUser.id }).then(setEvents);
      orderRepository.listOrders({ userId: currentUser.id }).then(setOrders);
    } else {
      setEvents([]);
      setOrders([]);
    }

    // Load parties from PartyRepository without forcing default selection to currentUser or first item
    partyRepository.listClients().then(setClients);
    partyRepository.listContractors().then(setContractors);
    partyRepository.listVenues().then(setVenues);
    partyRepository.listOrganizers().then(setOrganizers);
  }, [contractService, eventRepository, orderRepository, partyRepository, currentUser]);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  useEffect(() => {
    if (!selectedTemplate) return;
    contractService.getTemplateVersion(selectedTemplate.currentVersionId).then(tplVer => {
      setTemplateVersion(tplVer);
      if (tplVer && tplVer.variables) {
        const defaults: Record<string, string> = {};
        for (const v of tplVer.variables) {
          if (v.defaultValue) defaults[v.key] = v.defaultValue;
        }
        setFormValues(prev => ({ ...defaults, ...prev }));
      }
    });
  }, [selectedTemplateId, selectedTemplate, contractService]);

  const handleFillDemoData = () => {
    setIsDemoData(true);
    setFormValues(prev => ({
      ...prev,
      client_name: 'Демо Заказчик',
      contractor_name: 'Демо Исполнитель (NADO Event)',
      event_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      event_time: '16:00',
      event_location: 'Москва, банкетный комплекс «Платинум»',
      price: '100000',
      prepayment: '30000',
      service_composition: 'Комплексное обслуживание праздничного мероприятия',
      cancellation_policy: 'Бесплатная отмена за 14 дней до события',
      reschedule_policy: 'Бесплатный перенос при наличии свободной даты у Исполнителя',
      refund_policy: 'Возврат в течение 5 банковских дней за вычетом понесенных расходов',
      prepayment_due_rule: 'В течение 3 рабочих дней после подтверждения условий',
      final_payment_rule: 'В день проведения мероприятия до начала оказания услуг',
      duration: '6',
      dj_included: 'true'
    }));
    setSelectedAttachments(['att-tz', 'att-smeta']);
  };

  const handleVenueModelSelect = (model: VenueOperationModel) => {
    setVenueModel(model);
    if (model === 'rent') setSelectedTemplateId('tpl-ven-rent');
    else if (model === 'services') setSelectedTemplateId('tpl-ven-service');
    else if (model === 'mixed') setSelectedTemplateId('tpl-ven-mixed');
    else setSelectedTemplateId('tpl-cnt-universal');
  };

  const availableAttachments = useMemo(() => {
    if (!selectedTemplate) return [];
    return getAttachmentsForCategory(
      selectedTemplate.category,
      selectedTemplate.subcategory,
      formValues
    );
  }, [selectedTemplate, formValues]);

  // Steps based on documentKind
  const steps = useMemo(() => {
    const docKind = selectedTemplate?.documentKind;
    if (docKind === 'platform_policy') {
      return [
        { num: 1, key: 'template', title: 'Вид политики' },
        { num: 2, key: 'platform_policy', title: 'Оператор платформы и сфера применения' },
        { num: 3, key: 'policy_terms', title: 'Текст условий' },
        { num: 4, key: 'review', title: 'Проверка черновика' }
      ];
    }
    if (docKind === 'consent') {
      return [
        { num: 1, key: 'template', title: 'Вид согласия' },
        { num: 2, key: 'consent', title: 'Субъект и оператор' },
        { num: 3, key: 'consent_purposes', title: 'Условия и цели' },
        { num: 4, key: 'review', title: 'Проверка черновика' }
      ];
    }
    if (docKind === 'venue_contract') {
      return [
        { num: 1, key: 'template', title: 'Модель и вид площадки' },
        { num: 2, key: 'binding', title: 'Режим привязки и заказ' },
        { num: 3, key: 'parties', title: 'Стороны договора' },
        { num: 4, key: 'requisites', title: 'Реквизиты сторон' },
        { num: 5, key: 'services', title: 'Параметры и услуги' },
        { num: 6, key: 'attachments', title: 'Приложения' },
        { num: 7, key: 'review', title: 'Проверка черновика' }
      ];
    }
    return [
      { num: 1, key: 'template', title: 'Вид договора' },
      { num: 2, key: 'binding', title: 'Режим привязки и заказ' },
      { num: 3, key: 'parties', title: 'Стороны договора' },
      { num: 4, key: 'requisites', title: 'Реквизиты сторон' },
      { num: 5, key: 'services', title: 'Состав и параметры услуг' },
      { num: 6, key: 'attachments', title: 'Приложения' },
      { num: 7, key: 'review', title: 'Проверка черновика' }
    ];
  }, [selectedTemplate]);

  const updateField = (key: string, val: string) => {
    setFormValues(prev => ({ ...prev, [key]: val }));
  };

  const currentStepKey = steps[currentStep - 1]?.key || 'template';

  const validateCurrentStep = (): string[] => {
    const docKind = selectedTemplate?.documentKind || 'service_contract';

    if (currentStepKey === 'binding') {
      if (bindingMode === 'event' && !selectedEventId) {
        return ['Привязка к мероприятию обязательна в выбранном режиме (eventId)'];
      }
      if (bindingMode === 'order' && !selectedOrderId) {
        return ['Привязка к заказу обязательна в выбранном режиме (orderId)'];
      }
    }

    const res = ContractWizardValidationService.validateStepKey(
      currentStepKey,
      docKind,
      selectedTemplateId,
      formValues,
      templateVersion || undefined
    );

    return res.errors;
  };

  const handleNext = () => {
    setValidationError(null);
    const errors = validateCurrentStep();
    if (errors.length > 0) {
      setValidationError(errors.join('. '));
      return;
    }
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setValidationError(null);
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFillDemoConditions = () => {
    setFormValues(prev => ({
      ...prev,
      consent_subject_fio: prev['consent_subject_fio'] || 'Иванов Алексей Сергеевич',
      consent_subject_passport: prev['consent_subject_passport'] || '4510 №123456, выдан ГУ МВД по г. Москве',
      consent_subject_address: prev['consent_subject_address'] || 'г. Москва, ул. Ленина, д. 10, кв. 5',
      data_operator_name: prev['data_operator_name'] || (isLegalEntityConfigured() ? (legalEntityConfig.legalName || legalEntityConfig.brandName) : 'ООО "НАДО ПРАЗДНИК"'),
      data_operator_requisites: prev['data_operator_requisites'] || (isLegalEntityConfigured() ? `${legalEntityConfig.legalName}, ИНН ${legalEntityConfig.inn}` : 'ИНН 7700000000, ОГРН 1000000000000'),
      consent_purpose: prev['consent_purpose'] || 'Обеспечение функционирования сервиса и исполнение пользовательских соглашений',
      consent_actions: prev['consent_actions'] || 'Сбор, запись, систематизация, накопление, хранение, уточнение, использование',
      consent_third_parties: prev['consent_third_parties'] || 'Передача партнерам платформы исключительно для оказания запрашиваемых услуг',
      consent_term: prev['consent_term'] || '3 года с даты предоставления либо до момента отзыва',
      consent_withdrawal_procedure: prev['consent_withdrawal_procedure'] || 'Направление письменного заявления на электронную почту оператора',
      consent_date: prev['consent_date'] || new Date().toISOString().split('T')[0],

      event_date: prev['event_date'] || '2026-09-15',
      event_time: prev['event_time'] || '18:00',
      event_location: prev['event_location'] || 'г. Москва, Лофт Кристалл',
      service_composition: prev['service_composition'] || 'Комплексное ведение праздничного мероприятия и техническое сопровождение',
      price: prev['price'] || '50000',
      prepayment: prev['prepayment'] || '15000',
      cancellation_policy: prev['cancellation_policy'] || 'Отмена за 7 дней с возвратом аванса за вычетом понесенных расходов',
      reschedule_policy: prev['reschedule_policy'] || 'Перенос даты возможен по согласованию сторон при наличии свободных слотов',
      refund_policy: prev['refund_policy'] || 'Возврат денежных средств осуществляется в течение 10 рабочих дней',
      prepayment_due_rule: prev['prepayment_due_rule'] || 'В течение 3 дней с момента подписания договора',
      final_payment_rule: prev['final_payment_rule'] || 'В день проведения мероприятия до начала оказания услуг'
    }));
  };

  const handleAddExternalPartySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extPartyName.trim()) {
      setValidationError('Укажите название внешней стороны');
      return;
    }
    try {
      const newExtParty: ExternalContractParty = {
        id: `ext-${crypto.randomUUID()}`,
        role: extPartyRole,
        name: extPartyName.trim(),
        phone: extPartyPhone,
        email: extPartyEmail,
        requisites: extPartyRequisites,
        isExternal: true,
        createdAt: new Date().toISOString()
      };

      await partyRepository.createExternalParty(newExtParty);

      const partyOption: ContractPartyOption = {
        id: newExtParty.id,
        name: newExtParty.name,
        partyId: newExtParty.id,
        displayName: newExtParty.name,
        role: extPartyRole,
        isExternal: true,
        email: newExtParty.email,
        phone: newExtParty.phone,
        requisites: newExtParty.requisites
      };

      if (extPartyRole === 'client') {
        setClients(prev => [...prev, partyOption]);
        setSelectedClientId(newExtParty.id);
        updateField('client_name', newExtParty.name);
        if (newExtParty.requisites) updateField('client_requisites', newExtParty.requisites);
      } else if (extPartyRole === 'contractor') {
        setContractors(prev => [...prev, partyOption]);
        setSelectedContractorId(newExtParty.id);
        updateField('contractor_name', newExtParty.name);
        if (newExtParty.requisites) updateField('contractor_requisites', newExtParty.requisites);
      } else if (extPartyRole === 'venue') {
        setVenues(prev => [...prev, partyOption]);
        setSelectedVenueId(newExtParty.id);
        updateField('venue_name', newExtParty.name);
      } else if (extPartyRole === 'organizer') {
        setOrganizers(prev => [...prev, partyOption]);
        setSelectedOrganizerId(newExtParty.id);
        updateField('organizer_name', newExtParty.name);
      }

      setIsAddExternalModalOpen(false);
      setExtPartyName('');
      setExtPartyPhone('');
      setExtPartyEmail('');
      setExtPartyRequisites('');
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : 'Ошибка добавления стороны');
    }
  };

  const handleSaveDraft = async () => {
    if (!currentUser) {
      setValidationError('Необходима авторизация для создания договора');
      return;
    }
    setIsSaving(true);
    setValidationError(null);
    try {
      const clientId = selectedClientId || undefined;
      const contractorId = selectedContractorId || undefined;
      const venueId = selectedVenueId || undefined;
      const organizerId = selectedOrganizerId || undefined;

      // Standalone mode must not save eventId and orderId
      const eventId = bindingMode === 'standalone' ? undefined : (selectedEventId || undefined);
      const orderId = bindingMode === 'order' ? selectedOrderId || undefined : undefined;

      const draft = await contractService.createContractDraft({
        templateId: selectedTemplateId,
        documentKind: selectedTemplate?.documentKind,
        parties: {
          clientId,
          contractorId,
          venueId,
          organizerId
        },
        initialValues: formValues,
        eventId,
        orderId,
        createdByUserId: currentUser.id,
        demo: isDemoData
      });

      for (const attId of selectedAttachments) {
        const attTpl = availableAttachments.find(a => a.id === attId);
        if (attTpl) {
          await contractService.addAttachment(draft.id, attTpl.name, attTpl.category, attTpl.defaultContent);
        }
      }

      navigate(`/contracts/${draft.id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка сохранения черновика';
      setValidationError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-[var(--text-primary,#0f172a)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--border-primary,#e2e8f0)] pb-4 gap-4">
        <div>
          <button
            onClick={() => navigate('/contracts')}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted,#64748b)] hover:text-[var(--text-primary,#0f172a)] font-medium mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Назад к договорам
          </button>
          <h1 className="text-2xl font-bold tracking-tight">
            Конструктор договоров NADO CONTRACTS
          </h1>
          <p className="text-xs text-[var(--text-muted,#64748b)] mt-0.5">
            Шаг {currentStep} из {steps.length}: {steps[currentStep - 1]?.title}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFillDemoData}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Подставить демо-данные
          </button>

          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface-secondary,#f1f5f9)] hover:bg-[var(--border-primary,#e2e8f0)] text-xs font-semibold rounded-xl border border-[var(--border-primary,#e2e8f0)] transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4 text-indigo-600" />
            Сохранить черновик
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-[var(--surface-secondary,#f1f5f9)] rounded-full h-2 overflow-hidden flex border border-[var(--border-primary,#e2e8f0)]">
        <div
          className="bg-indigo-600 h-full transition-all duration-300"
          style={{ width: `${(currentStep / steps.length) * 100}%` }}
        />
      </div>

      {validationError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
          {validationError}
        </div>
      )}

      {/* STEP CONTENT CONTAINER */}
      <div className="bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-2xl p-6 shadow-xs min-h-[360px]">
        {/* Step Key: template */}
        {currentStepKey === 'template' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold mb-1">Шаг 1: Выберите шаблон или вид договора</h3>
              <p className="text-xs text-[var(--text-muted,#64748b)]">
                Шаблоны сгруппированы по категориям платформы, подрядчиков и площадок
              </p>
            </div>

            {selectedTemplateId.includes('ven') && (
              <VenueModelSelector selectedModel={venueModel} onSelectModel={handleVenueModelSelect} />
            )}

            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold">Библиотека шаблонов ({templates.length})</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.category.toUpperCase()}] {t.name}
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <div className="p-3 bg-[var(--surface-secondary,#f1f5f9)] rounded-xl border border-[var(--border-primary,#e2e8f0)] text-xs text-[var(--text-muted,#64748b)]">
                  {selectedTemplate.description}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step Key: binding */}
        {currentStepKey === 'binding' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold mb-1">Режим привязки документа</h3>
              <p className="text-xs text-[var(--text-muted,#64748b)]">Выберите характер привязки к сущностям платформы NADO</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setBindingMode('standalone')}
                className={`p-4 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  bindingMode === 'standalone'
                    ? 'border-indigo-600 bg-indigo-50/50 font-bold text-indigo-900'
                    : 'border-[var(--border-primary,#e2e8f0)] bg-[var(--surface-secondary,#f1f5f9)] hover:bg-[var(--border-primary,#e2e8f0)]'
                }`}
              >
                <div className="font-semibold mb-1">Автономный договор</div>
                <div className="text-[11px] text-[var(--text-muted,#64748b)]">Без обязательной привязки к заказу или мероприятию</div>
              </button>

              <button
                type="button"
                onClick={() => setBindingMode('event')}
                className={`p-4 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  bindingMode === 'event'
                    ? 'border-indigo-600 bg-indigo-50/50 font-bold text-indigo-900'
                    : 'border-[var(--border-primary,#e2e8f0)] bg-[var(--surface-secondary,#f1f5f9)] hover:bg-[var(--border-primary,#e2e8f0)]'
                }`}
              >
                <div className="font-semibold mb-1">Привязка к мероприятию</div>
                <div className="text-[11px] text-[var(--text-muted,#64748b)]">Требуется выбор конкретного события из списка</div>
              </button>

              <button
                type="button"
                onClick={() => setBindingMode('order')}
                className={`p-4 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  bindingMode === 'order'
                    ? 'border-indigo-600 bg-indigo-50/50 font-bold text-indigo-900'
                    : 'border-[var(--border-primary,#e2e8f0)] bg-[var(--surface-secondary,#f1f5f9)] hover:bg-[var(--border-primary,#e2e8f0)]'
                }`}
              >
                <div className="font-semibold mb-1">Привязка к заказу</div>
                <div className="text-[11px] text-[var(--text-muted,#64748b)]">Требуется выбор конкретного бронирования / заказа</div>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
              <div>
                <label className="font-semibold block mb-1">
                  Мероприятие {bindingMode === 'event' && <span className="text-rose-600">*</span>}
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl font-medium"
                >
                  <option value="">-- Выберите событие --</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} ({ev.date || 'Дата не указана'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  Заказ / Бронирование {bindingMode === 'order' && <span className="text-rose-600">*</span>}
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl font-medium"
                >
                  <option value="">-- Выберите заказ --</option>
                  {orders.map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      Заказ #{ord.id.substring(0, 8)} ({ord.price || 0} руб)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step Key: parties */}
        {currentStepKey === 'parties' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold mb-0.5">Стороны договора</h3>
                <p className="text-[11px] text-[var(--text-muted,#64748b)]">Выберите зарегистрированные стороны из PartyRepository или добавьте внешнюю</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddExternalModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold rounded-lg text-xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" /> Добавить внешнюю сторону
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold block mb-1">Заказчик (Client)</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedClientId(id);
                    const c = clients.find(cl => cl.id === id);
                    if (c) updateField('client_name', c.name);
                  }}
                  className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl font-medium"
                >
                  <option value="">-- Выберите Заказчика --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.email ? `(${c.email})` : ''} {c.isExternal ? '[Внешняя]' : ''}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={formValues['client_name'] || ''}
                  onChange={(e) => updateField('client_name', e.target.value)}
                  className="w-full p-2.5 mt-2 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-lg font-medium"
                  placeholder="ФИО / Наименование Заказчика в тексте"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  {selectedTemplate?.documentKind === 'venue_contract' ? 'Площадка / Исполнитель' : 'Исполнитель (Contractor)'}
                </label>
                {selectedTemplate?.documentKind === 'venue_contract' ? (
                  <select
                    value={selectedVenueId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedVenueId(id);
                      const v = venues.find(vn => vn.id === id);
                      if (v) updateField('contractor_name', v.name);
                    }}
                    className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl font-medium"
                  >
                    <option value="">-- Выберите Площадку --</option>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} {v.isExternal ? '[Внешняя]' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={selectedContractorId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedContractorId(id);
                      const cnt = contractors.find(cn => cn.id === id);
                      if (cnt) updateField('contractor_name', cnt.name);
                    }}
                    className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl font-medium"
                  >
                    <option value="">-- Выберите Исполнителя --</option>
                    {contractors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.isExternal ? '[Внешняя]' : ''}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  value={formValues['contractor_name'] || ''}
                  onChange={(e) => updateField('contractor_name', e.target.value)}
                  className="w-full p-2.5 mt-2 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-lg font-medium"
                  placeholder="Наименование Исполнителя в тексте"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step Key: requisites */}
        {currentStepKey === 'requisites' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-base font-bold mb-1">Реквизиты сторон</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[var(--surface-secondary,#f1f5f9)] border border-[var(--border-primary,#e2e8f0)] rounded-xl space-y-3">
                <div className="font-semibold">Реквизиты Заказчика</div>
                <textarea
                  rows={3}
                  placeholder="Паспортные данные / ИНН / Адрес регистрации Заказчика"
                  value={formValues['client_requisites'] || ''}
                  onChange={(e) => updateField('client_requisites', e.target.value)}
                  className="w-full p-2.5 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-lg"
                />
              </div>

              <div className="p-4 bg-[var(--surface-secondary,#f1f5f9)] border border-[var(--border-primary,#e2e8f0)] rounded-xl space-y-3">
                <div className="font-semibold">Реквизиты Исполнителя / Площадки</div>
                <textarea
                  rows={3}
                  placeholder="ИНН / ОГРНИП / Расчётный счёт / Банк Исполнителя"
                  value={formValues['contractor_requisites'] || ''}
                  onChange={(e) => updateField('contractor_requisites', e.target.value)}
                  className="w-full p-2.5 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step Key: services (ContractVariableRenderer) */}
        {currentStepKey === 'services' && (
          <div className="space-y-4 text-xs">
            <div>
              <h3 className="text-base font-bold mb-1">Условия и параметры договора</h3>
              <p className="text-[11px] text-[var(--text-muted,#64748b)]">
                Динамические переменные шаблона зафиксированы в текущей версии редакции
              </p>
            </div>

            {templateVersion && templateVersion.variables && templateVersion.variables.length > 0 ? (
              <ContractVariableRenderer
                variables={templateVersion.variables}
                values={formValues}
                onChange={updateField}
              />
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="font-semibold block mb-1">Предмет и объем услуг</label>
                  <textarea
                    rows={4}
                    value={formValues['service_composition'] || ''}
                    onChange={(e) => updateField('service_composition', e.target.value)}
                    className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl font-medium"
                    placeholder="Укажите перечень оказываемых услуг..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold block mb-1">Итоговая стоимость (руб)</label>
                    <input
                      type="number"
                      value={formValues['price'] || ''}
                      onChange={(e) => updateField('price', e.target.value)}
                      className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Сумма аванса (руб)</label>
                    <input
                      type="number"
                      value={formValues['prepayment'] || ''}
                      onChange={(e) => updateField('prepayment', e.target.value)}
                      className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step Key: platform_policy */}
        {currentStepKey === 'platform_policy' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-base font-bold mb-1">Оператор платформы и сфера применения</h3>

            {!isLegalEntityConfigured() && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-start gap-2.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Юридическое лицо платформы не заполнено в legalEntityConfig</div>
                  <div className="text-[11px] text-amber-700">
                    Поля оператора оставлены пустыми. Черновик можно сохранить, но его публикация и юридическое одобрение будут заблокированы.
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold block mb-1">Наименование оператора платформы</label>
                <input
                  type="text"
                  value={formValues['platform_operator_name'] || (isLegalEntityConfigured() ? (legalEntityConfig.legalName || legalEntityConfig.brandName) : '')}
                  onChange={(e) => updateField('platform_operator_name', e.target.value)}
                  className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl font-medium"
                  placeholder="Не указано"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Реквизиты оператора платформы</label>
                <input
                  type="text"
                  value={formValues['platform_operator_details'] || (isLegalEntityConfigured() ? `${legalEntityConfig.legalName}, ИНН ${legalEntityConfig.inn}` : '')}
                  onChange={(e) => updateField('platform_operator_details', e.target.value)}
                  className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl"
                  placeholder="Не указаны"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Домен платформы (platform_domain)</label>
                <input
                  type="text"
                  value={formValues['platform_domain'] || ''}
                  onChange={(e) => updateField('platform_domain', e.target.value)}
                  className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl"
                  placeholder="например, nado.io"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Дата вступления в силу (policy_effective_date)</label>
                <input
                  type="date"
                  value={formValues['policy_effective_date'] || ''}
                  onChange={(e) => updateField('policy_effective_date', e.target.value)}
                  className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl"
                />
              </div>

              <div className="md:col-span-2">
                <label className="font-semibold block mb-1">Применимое право (governing_law)</label>
                <input
                  type="text"
                  value={formValues['governing_law'] || ''}
                  onChange={(e) => updateField('governing_law', e.target.value)}
                  className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl"
                  placeholder="например, Законодательство Российской Федерации"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step Key: policy_terms */}
        {currentStepKey === 'policy_terms' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-base font-bold mb-1">Текст и условия политики</h3>
            <div>
              <label className="font-semibold block mb-1">Содержание основных положений</label>
              <textarea
                rows={6}
                value={formValues['policy_terms'] || ''}
                onChange={(e) => updateField('policy_terms', e.target.value)}
                className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl"
                placeholder="Введите текст или изменения регламента..."
              />
            </div>
          </div>
        )}

        {/* Step Key: consent */}
        {currentStepKey === 'consent' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold mb-1">Субъект и оператор персональных данных</h3>
              <button
                type="button"
                onClick={handleFillDemoConditions}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 cursor-pointer"
              >
                Подставить демонстрационные условия
              </button>
            </div>

            {!isLegalEntityConfigured() && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-start gap-2.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Юридическое лицо платформы не заполнено в legalEntityConfig</div>
                  <div className="text-[11px] text-amber-700">
                    Поля оператора персональных данных оставлены пустыми. Черновик можно сохранить, но публикация будет заблокирована.
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold block mb-1">ФИО субъекта (consent_subject_fio) *</label>
                <input
                  type="text"
                  value={formValues['consent_subject_fio'] || formValues['data_subject_name'] || formValues['client_name'] || ''}
                  onChange={(e) => {
                    updateField('consent_subject_fio', e.target.value);
                    updateField('data_subject_name', e.target.value);
                  }}
                  className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl font-medium"
                  placeholder="Иванов Алексей Сергеевич"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Паспортные данные / удостоверение (consent_subject_passport) *</label>
                <input
                  type="text"
                  value={formValues['consent_subject_passport'] || ''}
                  onChange={(e) => updateField('consent_subject_passport', e.target.value)}
                  className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl"
                  placeholder="Паспортные данные"
                />
              </div>

              <div className="md:col-span-2">
                <label className="font-semibold block mb-1">Адрес регистрации субъекта (consent_subject_address) *</label>
                <input
                  type="text"
                  value={formValues['consent_subject_address'] || ''}
                  onChange={(e) => updateField('consent_subject_address', e.target.value)}
                  className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl"
                  placeholder="г. Москва, ул..."
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Наименование оператора (data_operator_name) *</label>
                <input
                  type="text"
                  value={formValues['data_operator_name'] || (isLegalEntityConfigured() ? (legalEntityConfig.legalName || legalEntityConfig.brandName) : '')}
                  onChange={(e) => updateField('data_operator_name', e.target.value)}
                  className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl"
                  placeholder="Не указано"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Реквизиты оператора (data_operator_requisites) *</label>
                <input
                  type="text"
                  value={formValues['data_operator_requisites'] || (isLegalEntityConfigured() ? `${legalEntityConfig.legalName}, ИНН ${legalEntityConfig.inn}` : '')}
                  onChange={(e) => updateField('data_operator_requisites', e.target.value)}
                  className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl"
                  placeholder="Не указаны"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step Key: consent_purposes */}
        {currentStepKey === 'consent_purposes' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold mb-1">Цели и условия обработки данных</h3>
              <button
                type="button"
                onClick={handleFillDemoConditions}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 cursor-pointer"
              >
                Подставить демонстрационные условия
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">Цель обработки ПДн (consent_purpose) *</label>
                <input
                  type="text"
                  value={formValues['consent_purpose'] || ''}
                  onChange={(e) => updateField('consent_purpose', e.target.value)}
                  className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl"
                  placeholder="Укажите цель обработки..."
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Разрешенные действия (consent_actions) *</label>
                <input
                  type="text"
                  value={formValues['consent_actions'] || ''}
                  onChange={(e) => updateField('consent_actions', e.target.value)}
                  className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl"
                  placeholder="Сбор, систематизация, хранение..."
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Передача третьим лицам (consent_third_parties) *</label>
                <input
                  type="text"
                  value={formValues['consent_third_parties'] || ''}
                  onChange={(e) => updateField('consent_third_parties', e.target.value)}
                  className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl"
                  placeholder="Без передачи третьим лицам или с указанием условий..."
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Срок действия согласия (consent_term) *</label>
                <input
                  type="text"
                  value={formValues['consent_term'] || ''}
                  onChange={(e) => updateField('consent_term', e.target.value)}
                  className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl"
                  placeholder="Срок действия согласия..."
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Порядок отзыва согласия (consent_withdrawal_procedure) *</label>
                <input
                  type="text"
                  value={formValues['consent_withdrawal_procedure'] || ''}
                  onChange={(e) => updateField('consent_withdrawal_procedure', e.target.value)}
                  className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl"
                  placeholder="Порядок направления отзыва..."
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Дата предоставления (consent_date) *</label>
                <input
                  type="date"
                  value={formValues['consent_date'] || ''}
                  onChange={(e) => updateField('consent_date', e.target.value)}
                  className="w-full p-3 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step Key: attachments */}
        {currentStepKey === 'attachments' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-base font-bold mb-1">Приложения к договору</h3>
            <p className="text-[11px] text-[var(--text-muted,#64748b)]">
              Доступны шаблоны приложений, фильтрованные по категории «{selectedTemplate?.category}» ({availableAttachments.length} шт.)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto p-1">
              {availableAttachments.map((att) => {
                const isSelected = selectedAttachments.includes(att.id);
                return (
                  <button
                    key={att.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedAttachments(prev => prev.filter(i => i !== att.id));
                      } else {
                        setSelectedAttachments(prev => [...prev, att.id]);
                      }
                    }}
                    className={`text-left p-3 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-400 font-bold text-indigo-900'
                        : 'bg-[var(--surface-secondary,#f1f5f9)] border-[var(--border-primary,#e2e8f0)] text-[var(--text-primary,#0f172a)] hover:bg-[var(--border-primary,#e2e8f0)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-indigo-600" />
                      <div>
                        <div>{att.name}</div>
                        <div className="text-[10px] font-normal text-[var(--text-muted,#64748b)]">{att.category}</div>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step Key: review */}
        {currentStepKey === 'review' && (
          <div className="space-y-6 text-xs">
            <div>
              <h3 className="text-base font-bold mb-1">Проверка параметров перед сохранением</h3>
              <p className="text-[11px] text-[var(--text-muted,#64748b)]">
                Проверьте введенные данные. Нажатие сформирует рабочий черновик с закрепленными параметрами.
              </p>
            </div>

            <div className="bg-[var(--surface-secondary,#f1f5f9)] p-4 rounded-xl border border-[var(--border-primary,#e2e8f0)] space-y-2">
              <div><span className="text-[var(--text-muted,#64748b)]">Шаблон:</span> <strong>{selectedTemplate?.name}</strong></div>
              <div><span className="text-[var(--text-muted,#64748b)]">Заказчик:</span> <strong>{formValues['client_name'] || 'Не указан'}</strong></div>
              <div><span className="text-[var(--text-muted,#64748b)]">Исполнитель / Площадка:</span> <strong>{formValues['contractor_name'] || formValues['venue_name'] || 'Не указан'}</strong></div>
              {formValues['price'] && (
                <div><span className="text-[var(--text-muted,#64748b)]">Стоимость:</span> <strong>{formValues['price']} руб.</strong></div>
              )}
              <div><span className="text-[var(--text-muted,#64748b)]">Приложений выбрано:</span> <strong>{selectedAttachments.length} шт.</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-[var(--border-primary,#e2e8f0)] text-xs font-semibold rounded-xl hover:bg-[var(--surface-secondary,#f1f5f9)] disabled:opacity-40 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Назад
        </button>

        {currentStep < steps.length ? (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Продолжить <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" /> Сформировать черновик
          </button>
        )}
      </div>

      {/* Modal: Add External Party */}
      {isAddExternalModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-primary,#ffffff)] rounded-2xl max-w-md w-full p-6 space-y-4 border border-[var(--border-primary,#e2e8f0)] shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-primary,#e2e8f0)] pb-3">
              <h3 className="text-sm font-bold">Добавить внешнюю сторону</h3>
              <button onClick={() => setIsAddExternalModalOpen(false)} className="text-[var(--text-muted,#64748b)] hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExternalPartySubmit} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Роль стороны</label>
                <select
                  value={extPartyRole}
                  onChange={(e) => setExtPartyRole(e.target.value as 'client' | 'contractor' | 'venue' | 'organizer')}
                  className="w-full p-2.5 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl font-medium"
                >
                  <option value="client">Заказчик (Client)</option>
                  <option value="contractor">Исполнитель (Contractor)</option>
                  <option value="venue">Площадка (Venue)</option>
                  <option value="organizer">Организатор (Organizer)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Наименование / ФИО *</label>
                <input
                  type="text"
                  required
                  value={extPartyName}
                  onChange={(e) => setExtPartyName(e.target.value)}
                  className="w-full p-2.5 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl"
                  placeholder="ООО «Праздник», ИП Орлов, etc."
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Правовой статус</label>
                <select
                  value={extPartyLegalStatus}
                  onChange={(e) => setExtPartyLegalStatus(e.target.value as 'individual' | 'self_employed' | 'sole_proprietor' | 'company')}
                  className="w-full p-2.5 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl"
                >
                  <option value="sole_proprietor">ИП (Индивидуальный предприниматель)</option>
                  <option value="company">ООО / Юридическое лицо</option>
                  <option value="self_employed">Самозанятый (НПД)</option>
                  <option value="individual">Физическое лицо</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Телефон</label>
                  <input
                    type="text"
                    value={extPartyPhone}
                    onChange={(e) => setExtPartyPhone(e.target.value)}
                    className="w-full p-2.5 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl"
                    placeholder="+7 (999) 000-00-00"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={extPartyEmail}
                    onChange={(e) => setExtPartyEmail(e.target.value)}
                    className="w-full p-2.5 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Реквизиты</label>
                <textarea
                  rows={2}
                  value={extPartyRequisites}
                  onChange={(e) => setExtPartyRequisites(e.target.value)}
                  className="w-full p-2.5 bg-[var(--bg-primary,#ffffff)] border border-[var(--border-primary,#e2e8f0)] rounded-xl"
                  placeholder="ИНН, КПП, ОГРН, Банк, Р/с"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddExternalModalOpen(false)}
                  className="px-4 py-2 border border-[var(--border-primary,#e2e8f0)] rounded-xl hover:bg-[var(--surface-secondary,#f1f5f9)] font-medium"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
