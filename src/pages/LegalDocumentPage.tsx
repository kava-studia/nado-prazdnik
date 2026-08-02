import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublishedLegalDocument } from '../services/legalStorage';
import { ArrowLeft, FileText, Info, HelpCircle, ShieldAlert } from 'lucide-react';

export default function LegalDocumentPage() {
  const { documentKey } = useParams<{ documentKey: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'human' | 'legal'>('human');

  const doc = getPublishedLegalDocument(documentKey || '');

  if (!doc) {
    return (
      <div className="min-h-screen text-[var(--text-primary)] bg-[var(--background-primary)] flex flex-col items-center justify-center p-6 font-sans">
        <div className="text-center max-w-md space-y-4">
          <h1 className="text-2xl font-black mb-3">Документ не найден</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Запрашиваемый юридический документ отсутствует или был перемещен.</p>
          <button 
            onClick={() => navigate('/legal')}
            className="px-6 py-2.5 premium-gold-button font-bold text-xs uppercase tracking-wider"
          >
            Вернуться к списку документов
          </button>
        </div>
      </div>
    );
  }

  const currentVersion = doc.versions.find(v => v.id === doc.currentVersionId) || doc.versions[0];

  const humanQA: Record<string, { q: string; a: string }[]> = {
    'user-agreement': [
      { q: 'Что это значит?', a: 'Это соглашение между вами и платформой NADO ПРАЗДНИК о правилах пользования инструментами планирования и каталогом.' },
      { q: 'Кто оказывает услугу?', a: 'Услугу оказывает выбранный вами исполнитель (подрядчик), а не сама платформа NADO ПРАЗДНИК.' },
      { q: 'Кому платятся деньги?', a: 'Деньги выплачиваются напрямую исполнителю в соответствии с согласованными условиями заказа или через подключенного платежного партнера.' },
      { q: 'Кто отвечает за заказ?', a: 'Ответственность сторон определяется договором, правилами сервиса и применимым законодательством РФ.' },
      { q: 'Как отменить?', a: 'Заказ можно отменить через личный кабинет. Возврат предоплаты зависит от условий конкретного исполнителя.' },
      { q: 'Как получить возврат?', a: 'Возврат средств оформляется через подачу заявки. Сумма возврата рассчитывается согласно условиям отмены на момент подтверждения заказа.' },
      { q: 'Как открыть спор?', a: 'Если возникли разногласия, перейдите в раздел Споры (/disputes) и отправьте претензию с доказательствами.' },
      { q: 'Какие данные сохраняются?', a: 'Сохраняются ваши контактные данные, параметры мероприятий, переписка с исполнителем и история согласий.' }
    ],
    'privacy-policy': [
      { q: 'Что это значит?', a: 'Правила сбора, хранения и защиты вашей личной информации в соответствии с ФЗ-152.' },
      { q: 'Какие данные сохраняются?', a: 'Ваше имя, номер телефона, email, город проведения события, количество гостей и параметры планирования.' },
      { q: 'Кому передаются данные?', a: 'Данные передаются только тем подрядчикам, которым вы отправляете прямые запросы на бронирование.' },
      { q: 'Как удалить свои данные?', a: 'Вы можете направить запрос в службу поддержки NADO ПРАЗДНИК для полного удаления профиля.' }
    ],
    'personal-data-consent': [
      { q: 'Что это значит?', a: 'Вы разрешаете NADO ПРАЗДНИК обрабатывать ваши персональные данные для связи и бронирования.' },
      { q: 'Какие данные сохраняются?', a: 'Имя, телефон, почта, параметры праздника.' },
      { q: 'Можно ли отозвать?', a: 'Для удаления согласия необходимо отозвать его, направив запрос на удаление аккаунта.' }
    ],
    'booking-rules': [
      { q: 'Что это значит?', a: 'Правила подачи заявок и резервирования даты у подрядчиков.' },
      { q: 'Кто отвечает за заказ?', a: 'Выбранный исполнитель. Сделка заключается напрямую.' },
      { q: 'Как отменить?', a: 'Через раздел ваших бронирований. Сумма возврата зависит от даты отмены.' }
    ],
    'cancellation-refunds': [
      { q: 'Что это значит?', a: 'Правила отмены бронирований и возврата авансовых платежей.' },
      { q: 'Как получить возврат?', a: 'В соответствии со шкалой возвратов в подтвержденной версии условий заказа.' },
      { q: 'Как открыть спор?', a: 'Через арбитраж NADO в случае необоснованного отказа подрядчика.' }
    ],
    'disputes': [
      { q: 'Что это значит?', a: 'Процедура разрешения конфликтных ситуаций.' },
      { q: 'Как открыть спор?', a: 'Заполнить форму в разделе /disputes, приложить переписку и договоры.' },
      { q: 'Кто принимает решение?', a: 'Медиаторы NADO выступают независимыми посредниками для поиска компромисса сторон.' }
    ]
  };

  const defaultQA = [
    { q: 'Что это значит?', a: `Этот документ — "${doc.title}". Он описывает правила взаимодействия на платформе.` },
    { q: 'Кто оказывает услугу?', a: 'Услугу по организации оказывает выбранный подрядчик.' },
    { q: 'Кто отвечает за заказ?', a: 'Ответственность регулируется взаимными условиями заказа и законодательством РФ.' },
    { q: 'Как открыть спор?', a: 'Через раздел «Споры и обращения» на платформе NADO ПРАЗДНИК.' }
  ];

  const qaList = humanQA[doc.key] || defaultQA;

  return (
    <div className="min-h-screen pb-24 font-sans text-[var(--text-primary)] bg-[var(--background-primary)] animate-fade-in" id="legal-doc-view">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--background-elevated)]/85 backdrop-blur-md border-b border-[var(--border-soft)] px-4 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-4 text-left">
          <button 
            onClick={() => navigate('/legal')} 
            className="p-2 bg-[var(--background-secondary)] hover:bg-[var(--border-soft)]/40 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-black tracking-tight text-[var(--text-primary)] truncate">{doc.title}</h1>
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-0.5 font-bold uppercase">
              <span>Версия {currentVersion.version}</span>
              <span>•</span>
              <span className={`font-black ${doc.status === 'published' ? 'text-[#3E8B65]' : 'text-[#B94D4D]'}`}>
                {doc.status === 'published' ? 'Опубликован' : 'Черновик (Draft)'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-8 text-left space-y-6">
        {/* Draft Warning */}
        {doc.status === 'draft' && (
          <div className="p-4 bg-[#FDF0F0] border border-[#B94D4D]/25 rounded-2xl flex items-start gap-3 shadow-sm">
            <ShieldAlert className="w-5 h-5 text-[#B94D4D] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-[#B94D4D] uppercase">Внутренний документ (Режим черновика)</p>
              <p className="text-xs text-[var(--text-secondary)] font-semibold leading-relaxed mt-1">
                Этот документ не является окончательным, так как не заполнены реквизиты владельца платформы NADO ПРАЗДНИК.
              </p>
            </div>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex p-1 bg-[var(--background-secondary)] border border-[var(--border-soft)] rounded-2xl shadow-sm">
          <button
            onClick={() => setActiveTab('human')}
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'human' 
                ? 'bg-[var(--background-elevated)] text-[var(--text-primary)] shadow-sm border border-[var(--border-soft)]' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-[var(--gold-primary)]" />
            Простыми словами
          </button>
          <button
            onClick={() => setActiveTab('legal')}
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'legal' 
                ? 'bg-[var(--background-elevated)] text-[var(--text-primary)] shadow-sm border border-[var(--border-soft)]' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FileText className="w-4 h-4 text-[var(--gold-primary)]" />
            Юридический текст
          </button>
        </div>

        {/* Content render */}
        {activeTab === 'human' ? (
          <div className="space-y-4">
            <div className="p-5 bg-[var(--gold-highlight)] border border-[var(--gold-primary)]/20 rounded-[20px] mb-6 flex gap-3 items-start shadow-sm">
              <Info className="w-5 h-5 text-[var(--gold-primary)] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Резюме документа</h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed font-semibold">
                  {currentVersion.summary}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {qaList.map((qa, index) => (
                <div key={index} className="p-5 bg-[var(--background-elevated)] rounded-2xl shadow-sm border border-[var(--border-soft)]">
                  <h4 className="text-xs font-black text-[var(--gold-primary)] uppercase tracking-wider flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 bg-[var(--gold-primary)] rounded-full"></span>
                    {qa.q}
                  </h4>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed pl-3.5 font-semibold">
                    {qa.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 bg-[var(--background-elevated)] rounded-[24px] shadow-sm border border-[var(--border-soft)]">
            {/* Version Meta block */}
            <div className="mb-6 p-4 bg-[var(--background-secondary)] border border-[var(--border-soft)] rounded-xl text-xs text-[var(--text-secondary)] space-y-2 shadow-sm font-bold uppercase">
              <div className="flex justify-between">
                <span>Дата публикации:</span>
                <span className="font-mono text-[var(--text-primary)] font-bold">{new Date(currentVersion.publishedAt).toLocaleDateString('ru-RU')}</span>
              </div>
              <div className="flex justify-between">
                <span>Вступает в силу:</span>
                <span className="font-mono text-[var(--text-primary)] font-bold">{new Date(currentVersion.effectiveAt).toLocaleDateString('ru-RU')}</span>
              </div>
              <div className="flex justify-between">
                <span>Автор документа:</span>
                <span className="text-[var(--text-primary)] font-bold">{currentVersion.author}</span>
              </div>
              <div className="flex justify-between">
                <span>Причина редакции:</span>
                <span className="text-[var(--text-primary)] font-bold normal-case italic">“{currentVersion.changeReason}”</span>
              </div>
            </div>

            {/* Complete legal text */}
            <div className="whitespace-pre-wrap text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed font-sans space-y-4">
              {currentVersion.content}
            </div>

            {/* Document history link */}
            <div className="mt-8 pt-6 border-t border-[var(--border-soft)] text-center">
              <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">
                Предыдущие версии документа сохранены в истории комплаенса NADO ПРАЗДНИК.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
