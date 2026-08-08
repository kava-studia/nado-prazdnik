import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Wallet, Sparkles, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import AppHeader from '../components/AppHeader';
import { getProjects } from '../services/eventlyStorage';
import { EventProject } from '../types';
import { resolveNextAction } from '../utils/nextActionResolver';

export default function PlanCreated() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<EventProject | null>(null);

  useEffect(() => {
    const projects = getProjects();
    const found = projects.find(p => p.id === eventId);
    if (found) {
      setProject(found);
    } else {
      // Fallback if not found
      navigate('/');
    }
  }, [eventId, navigate]);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[var(--color-gold)]" />
      </div>
    );
  }

  const nextAction = resolveNextAction(project);
  const formattedDate = project.date === 'Дата обсуждается' 
    ? 'Дата обсуждается' 
    : new Date(project.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen flex flex-col justify-between font-sans text-[var(--color-text)]" id="plan-created-view">
      <AppHeader title="План готов" />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8 md:py-12 flex flex-col justify-center space-y-8 text-left">
        <div className="text-center space-y-3">
          <div className="inline-flex w-16 h-16 rounded-full bg-[var(--color-champagne)] items-center justify-center text-[var(--color-gold-deep)] mb-2 animate-bounce shadow-sm">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight">Ваш план готов!</h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-md mx-auto leading-relaxed">
            Мы собрали персональный план только из выбранных услуг. Любой этап можно убрать, вернуть или пройти самостоятельно.
          </p>
        </div>

        {/* Project Summary Card (Task 16 & 20) */}
        <div className="premium-glass-card p-6 space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-gold-light)]/5 blur-2xl pointer-events-none" />
          
          <h2 className="text-lg sm:text-xl font-bold text-[var(--color-text)] border-b border-[var(--color-border)] pb-3">
            {project.name}
          </h2>

          <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-[var(--color-gold)]" />
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)]">Дата</p>
                <p className="font-bold text-[var(--color-text)] mt-0.5">{formattedDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-[var(--color-gold)]" />
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)]">Город</p>
                <p className="font-bold text-[var(--color-text)] mt-0.5">{project.city}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-[var(--color-gold)]" />
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)]">Гости</p>
                <p className="font-bold text-[var(--color-text)] mt-0.5">{project.guestsCount} чел.</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Wallet className="w-4 h-4 text-[var(--color-gold)]" />
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)]">Бюджет</p>
                <p className="font-bold text-[var(--color-text)] mt-0.5">
                  {project.budgetTotal > 0 ? `${project.budgetTotal.toLocaleString('ru-RU')} ₽` : 'Обсуждается'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-bold text-[var(--color-text-secondary)]">
            <span>Этапов в вашем плане:</span>
            <span className="text-[var(--color-text)] font-mono bg-white border border-[var(--color-border)] px-3 py-1 rounded-full shadow-sm">
              {project.planItems?.filter((item) => item.status !== 'skipped').length || 0} шагов
            </span>
          </div>
        </div>

        {/* Recommended First Step Action Box */}
        <div className="bg-[var(--color-champagne)]/40 rounded-[20px] p-5 border border-[var(--color-gold)]/20 space-y-3">
          <div className="flex items-center gap-2 text-[var(--color-gold-deep)] text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            Рекомендуемое первое действие
          </div>
          <div>
            <h3 className="font-bold text-[var(--color-text)] text-sm sm:text-base">{nextAction.title}</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">{nextAction.description}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Main Gold CTA Button */}
          <button
            onClick={() => navigate(`/events/${eventId}/plan`)}
            className="w-full py-4 premium-gold-button font-bold text-sm flex items-center justify-center gap-2"
          >
            Продолжить по шагам
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>

          <button
            onClick={() => navigate(`/events/${eventId}/packages`)}
            className="w-full py-4 bg-white hover:bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text)] text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
          >
            Посмотреть готовые пакетные варианты
          </button>

          <button
            onClick={() => navigate(`/events/${eventId}`)}
            className="w-full py-3 text-center text-[var(--color-text-secondary)] hover:text-[var(--color-gold-deep)] text-xs font-bold cursor-pointer transition-colors"
          >
            Открыть рабочий кабинет проекта
          </button>
        </div>
      </main>
    </div>
  );
}
