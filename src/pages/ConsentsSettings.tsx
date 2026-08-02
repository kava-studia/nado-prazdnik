import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLegalDocuments, getUserConsents } from '../services/legalStorage';
import { ArrowLeft, Check, ToggleLeft, ToggleRight, Lock, Info } from 'lucide-react';

export default function ConsentsSettings() {
  const navigate = useNavigate();
  const [consents, setConsents] = useState<any[]>([]);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const [offersEnabled, setOffersEnabled] = useState(false);
  const [newsEnabled, setNewsEnabled] = useState(false);

  useEffect(() => {
    loadConsents();
  }, []);

  const loadConsents = () => {
    const userConsents = getUserConsents();
    setConsents(userConsents);
    
    // Check optional consents from storage
    const mConsent = userConsents.find(c => c.documentId === 'doc-marketing' && !c.revokedAt);
    const oConsent = userConsents.find(c => c.documentId === 'doc-offers' && !c.revokedAt);
    const nConsent = userConsents.find(c => c.documentId === 'doc-news' && !c.revokedAt);
    
    setMarketingEnabled(!!mConsent);
    setOffersEnabled(!!oConsent);
    setNewsEnabled(!!nConsent);
  };

  const handleToggleOptional = (key: 'marketing' | 'offers' | 'news', current: boolean) => {
    const docId = `doc-${key}`;
    const userConsents = getUserConsents();
    
    if (current) {
      // Revoke optional
      const doc = getLegalDocuments().find(d => d.key === key);
      
      // Update locally
      let updated = false;
      const newConsents = userConsents.map(c => {
        if (c.userId === 'current_user' && c.documentId === docId && !c.revokedAt) {
          updated = true;
          return { ...c, revokedAt: new Date().toISOString() };
        }
        return c;
      });
      if (updated) {
        localStorage.setItem('nado_holiday_consents', JSON.stringify(newConsents));
      }
    } else {
      // Record consent
      const newRecord = {
        id: `consent-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        userId: 'current_user',
        documentId: docId,
        documentVersionId: 'ver-optional-100',
        acceptedAt: new Date().toISOString(),
        acceptanceMethod: 'checkbox_click' as const,
        technicalMetadata: `Browser: ${navigator.userAgent}`
      };
      userConsents.push(newRecord);
      localStorage.setItem('nado_holiday_consents', JSON.stringify(userConsents));
    }
    
    loadConsents();
  };

  const mandatoryDocs = [
    { key: 'user-agreement', label: 'Пользовательское соглашение' },
    { key: 'privacy-policy', label: 'Политика конфиденциальности' },
    { key: 'personal-data-consent', label: 'Согласие на обработку персональных данных' },
    { key: 'booking-rules', label: 'Правила бронирования и отмены' }
  ];

  return (
    <div className="min-h-screen pb-24 font-sans text-[var(--text-primary)] bg-[var(--background-primary)] animate-fade-in" id="consents-view">
      <header className="sticky top-0 z-30 bg-[var(--background-elevated)]/85 backdrop-blur-md border-b border-[var(--border-soft)] px-4 py-4 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 bg-[var(--background-secondary)] hover:bg-[var(--border-soft)]/40 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
          <div className="text-left">
            <h1 className="text-lg font-black text-[var(--text-primary)] tracking-tight">Настройки согласий</h1>
            <p className="text-xs text-[var(--text-secondary)]">Управление вашими юридическими подтверждениями</p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 mt-8 space-y-6 text-left">
        <div className="p-4 bg-[var(--gold-highlight)] border border-[var(--gold-primary)]/20 rounded-2xl flex gap-3 shadow-sm">
          <Info className="w-5 h-5 text-[var(--gold-primary)] shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
            В соответствии с законодательством РФ, вы можете управлять дополнительными (необязательными) согласиями в любой момент. Обязательные согласия необходимы для активного планирования мероприятий и работы с подрядчиками на платформе.
          </p>
        </div>

        {/* Required consents list */}
        <section className="bg-[var(--background-elevated)] border border-[var(--border-soft)] rounded-[24px] p-6 space-y-4 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-[var(--gold-primary)] mb-2 flex items-center gap-2">
            <Lock className="w-4 h-4 text-[var(--gold-primary)]" />
            Обязательные документы
          </h2>
          
          <div className="divide-y divide-[var(--border-soft)]">
            {mandatoryDocs.map((docItem) => {
              const doc = getLegalDocuments().find(d => d.key === docItem.key);
              const accepted = consents.find(c => doc && c.documentId === doc.id && !c.revokedAt);
              
              return (
                <div key={docItem.key} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4 text-left">
                  <div className="min-w-0">
                    <h3 className="text-xs font-black text-[var(--text-primary)] tracking-tight leading-tight">{docItem.label}</h3>
                    <p className="text-xs text-[var(--text-secondary)] font-bold mt-1 uppercase">
                      {accepted 
                        ? `Принято: ${new Date(accepted.acceptedAt).toLocaleDateString('ru-RU')} (Версия ${doc?.versions[0].version})`
                        : 'Статус: Принято при регистрации/планировании'
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-black text-[#3E8B65] bg-[#EAF5EE] border border-[#3E8B65]/20 px-2.5 py-1 rounded-full shrink-0">
                    <Check className="w-3.5 h-3.5" />
                    АКТИВНО
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Optional consents list */}
        <section className="bg-[var(--background-elevated)] border border-[var(--border-soft)] rounded-[24px] p-6 space-y-6 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-[var(--gold-primary)] mb-2">
            Необязательные согласия
          </h2>

          {/* Marketing Toggle */}
          <div className="flex items-start justify-between gap-4 text-left">
            <div className="flex-1">
              <h3 className="text-xs font-black text-[var(--text-primary)]">Рекламные сообщения</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                Получать новости, полезные статьи, подборки площадок и общие промокоды от NADO.
              </p>
            </div>
            <button 
              onClick={() => handleToggleOptional('marketing', marketingEnabled)}
              className="text-[var(--gold-primary)] hover:opacity-90 transition-all cursor-pointer shrink-0 animate-pulse-slow"
            >
              {marketingEnabled ? (
                <ToggleRight className="w-12 h-8" />
              ) : (
                <ToggleLeft className="w-12 h-8 text-[var(--text-secondary)]/40" />
              )}
            </button>
          </div>

          {/* Offers Toggle */}
          <div className="flex items-start justify-between gap-4 pt-4 border-t border-[var(--border-soft)] text-left">
            <div className="flex-1">
              <h3 className="text-xs font-black text-[var(--text-primary)]">Персональные предложения</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                Разрешить автоматический подбор индивидуальных скидок от подрядчиков на основе параметров события.
              </p>
            </div>
            <button 
              onClick={() => handleToggleOptional('offers', offersEnabled)}
              className="text-[var(--gold-primary)] hover:opacity-90 transition-all cursor-pointer shrink-0"
            >
              {offersEnabled ? (
                <ToggleRight className="w-12 h-8" />
              ) : (
                <ToggleLeft className="w-12 h-8 text-[var(--text-secondary)]/40" />
              )}
            </button>
          </div>

          {/* News Toggle */}
          <div className="flex items-start justify-between gap-4 pt-4 border-t border-[var(--border-soft)] text-left">
            <div className="flex-1">
              <h3 className="text-xs font-black text-[var(--text-primary)]">Уведомления о новых услугах</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                Информировать о появлении новых категорий специалистов в вашем городе проведения.
              </p>
            </div>
            <button 
              onClick={() => handleToggleOptional('news', newsEnabled)}
              className="text-[var(--gold-primary)] hover:opacity-90 transition-all cursor-pointer shrink-0"
            >
              {newsEnabled ? (
                <ToggleRight className="w-12 h-8" />
              ) : (
                <ToggleLeft className="w-12 h-8 text-[var(--text-secondary)]/40" />
              )}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
