import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getLegalDocuments } from '../services/legalStorage';
import { legalEntityConfig, isLegalEntityConfigured } from '../config/legalEntity';
import { Shield, CheckCircle, AlertTriangle, ArrowLeft, Landmark, FileText } from 'lucide-react';

export default function Legal() {
  const navigate = useNavigate();
  const documents = getLegalDocuments();
  const isConfigured = isLegalEntityConfigured();

  // Legal setup status checklist
  const checklist = [
    { label: 'Реквизиты заполнены', done: isConfigured },
    { label: 'Документы проверены', done: isConfigured },
    { label: 'Версии опубликованы', done: true },
    { label: 'Согласия настроены', done: true },
    { label: 'Платёжный партнёр подключён', done: false },
    { label: 'Политика возвратов настроена', done: true }
  ];

  return (
    <div className="min-h-screen pb-24 font-sans text-[var(--text-primary)] bg-[var(--background-primary)] animate-fade-in" id="legal-center-view">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--background-elevated)]/85 backdrop-blur-md border-b border-[var(--border-soft)] px-4 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-4 text-left">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 bg-[var(--background-secondary)] hover:bg-[var(--border-soft)]/40 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-[var(--text-primary)]">Юридический центр</h1>
            <p className="text-xs text-[var(--text-secondary)]">Документы, регламенты и комплаенс платформы NADO ПРАЗДНИК</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8 text-left space-y-8">
        
        {/* Admin Compliance Check Panel */}
        <section className="bg-[var(--background-elevated)] border border-dashed border-[var(--gold-primary)]/30 rounded-[24px] p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="p-3 bg-[var(--gold-highlight)] border border-[var(--gold-primary)]/20 rounded-2xl shrink-0">
              <Shield className="w-6 h-6 text-[var(--gold-deep)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-[var(--gold-deep)] bg-[var(--gold-highlight)] px-2.5 py-1 rounded-full border border-[var(--gold-primary)]/10">
                  Административная панель комплаенса
                </span>
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Видно только владельцу</span>
              </div>
              
              <h2 className="text-lg font-black mt-2 text-[var(--text-primary)] tracking-tight">Статус готовности юридической системы</h2>
              
              {!isConfigured && (
                <div className="mt-4 p-4 bg-[#FDF0F0] border border-[#B94D4D]/25 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#B94D4D] shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#B94D4D] uppercase">
                      Необходимо заполнить реквизиты владельца платформы
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] font-semibold leading-relaxed mt-1">
                      Документы являются рабочими шаблонами и должны быть проверены юристом перед публикацией платформы. Сейчас все документы находятся во внутреннем статусе <span className="font-mono text-[#B94D4D] font-black">draft</span>.
                    </p>
                  </div>
                </div>
              )}

              {/* Status Checklist Grid */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {checklist.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-[var(--background-secondary)] border border-[var(--border-soft)] rounded-xl shadow-sm">
                    <CheckCircle className={`w-4 h-4 shrink-0 ${item.done ? 'text-[#3E8B65]' : 'text-[var(--text-secondary)]/40'}`} />
                    <span className="text-xs text-[var(--text-primary)] font-semibold">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Current Credentials state */}
              <div className="mt-4 pt-4 border-t border-[var(--border-soft)] flex flex-wrap gap-x-6 gap-y-2 text-xs text-[var(--text-secondary)] font-bold uppercase">
                <div>Юр. лицо: <span className="text-[var(--text-primary)] font-mono font-bold">{legalEntityConfig.legalName || 'Не заполнено'}</span></div>
                <div>ИНН: <span className="text-[var(--text-primary)] font-mono font-bold">{legalEntityConfig.inn || 'Не заполнено'}</span></div>
                <div>ОГРН: <span className="text-[var(--text-primary)] font-mono font-bold">{legalEntityConfig.ogrn || 'Не заполнено'}</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* Introduction to the platform role */}
        <section className="bg-[var(--background-elevated)] border border-[var(--border-soft)] rounded-[24px] p-6 shadow-sm">
          <h3 className="text-base font-black flex items-center gap-2 mb-3 text-[var(--text-primary)] tracking-tight">
            <Landmark className="w-4 h-4 text-[var(--gold-primary)]" />
            Как работает NADO ПРАЗДНИК
          </h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-semibold">
            NADO ПРАЗДНИК помогает клиенту и исполнителю найти друг друга, согласовать условия и сохранить договорённости. Услугу оказывает выбранный исполнитель. Договор оказания услуги заключается напрямую между клиентом и исполнителем.
          </p>
          <div className="mt-4 pt-4 border-t border-[var(--border-soft)]">
            <h4 className="text-xs font-bold text-[var(--gold-deep)] uppercase tracking-wider mb-2">Ответственность сторон</h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
              Ответственность сторон определяется договором, правилами сервиса и применимым законодательством РФ. Мы не пытаемся снять с платформы любую ответственность, которая может быть установлена законом.
            </p>
          </div>
        </section>

        {/* Grid of Legal Documents */}
        <div className="space-y-4">
          <h3 className="text-lg font-black flex items-center gap-2 text-[var(--text-primary)] tracking-tight">
            <FileText className="w-5 h-5 text-[var(--gold-primary)]" />
            Регламенты и соглашения
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => {
              const currentVer = doc.versions.find(v => v.id === doc.currentVersionId) || doc.versions[0];
              return (
                <div 
                  key={doc.id}
                  onClick={() => navigate(`/legal/${doc.key}`)}
                  className="group p-5 bg-[var(--background-elevated)] border border-[var(--border-soft)] rounded-[20px] transition-all cursor-pointer shadow-sm hover:border-[var(--gold-primary)]/40 hover:scale-[1.01]"
                >
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <h4 className="font-black text-sm text-[var(--text-primary)] group-hover:text-[var(--gold-deep)] transition-colors tracking-tight">
                      {doc.title}
                    </h4>
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                      doc.status === 'published' 
                        ? 'bg-[#EAF5EE] border-[#3E8B65]/20 text-[#3E8B65]' 
                        : 'bg-[#FDF0F0] border-[#B94D4D]/25 text-[#B94D4D]'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                  
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed mb-4 font-semibold">
                    {currentVer.summary}
                  </p>

                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono font-bold uppercase">
                    <span>Версия {currentVer.version}</span>
                    <span>Обновлено {new Date(currentVer.publishedAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
