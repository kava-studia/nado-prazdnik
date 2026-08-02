import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Users, Wallet, ChevronRight, Sparkles, AlertCircle, Trash2 } from 'lucide-react';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import { PageTitle, PrimaryButton, SecondaryButton, SurfaceCard } from '../components/UI';

export default function EventsList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    try {
      // Load projects from NADO key or fallback
      const saved = localStorage.getItem('nado_holiday_projects') || localStorage.getItem('evently_projects') || '[]';
      const parsed = JSON.parse(saved);
      setProjects(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      console.error('Failed to parse projects', e);
    }
  }, []);

  const handleSetActive = (project: any) => {
    localStorage.setItem('nado_holiday_active_project', JSON.stringify(project));
    navigate(`/events/${project.id || 'active'}`);
  };

  const handleDeleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Вы уверены, что хотите удалить этот проект?')) return;

    try {
      const updated = projects.filter(p => p.id !== id);
      setProjects(updated);
      localStorage.setItem('nado_holiday_projects', JSON.stringify(updated));
      
      const activeStr = localStorage.getItem('nado_holiday_active_project');
      if (activeStr) {
        const active = JSON.parse(activeStr);
        if (active.id === id) {
          if (updated.length > 0) {
            localStorage.setItem('nado_holiday_active_project', JSON.stringify(updated[0]));
          } else {
            localStorage.removeItem('nado_holiday_active_project');
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen pb-32 flex flex-col justify-between font-sans text-[var(--text-primary)]" id="events-list-view">
      <AppHeader />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <PageTitle 
            title="Мои праздники" 
            subtitle="Управление вашими событиями и планами подготовки NADO"
            className="mb-0"
          />
          <PrimaryButton 
            onClick={() => navigate('/create-event')}
            className="sm:w-auto"
            variant="primary"
          >
            <Plus className="w-5 h-5" />
            <span>Создать праздник</span>
          </PrimaryButton>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16 px-6 bg-[var(--surface-glass)] backdrop-blur-md rounded-[24px] border border-[var(--border-strong)] max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-[var(--gold-highlight)] text-[var(--gold-deep)] flex items-center justify-center mx-auto mb-5 shadow-sm">
              <Sparkles className="w-7 h-7 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Нет активных проектов</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
              Вы еще не создали ни одного праздника. Давайте сделаем это прямо сейчас!
            </p>
            <PrimaryButton onClick={() => navigate('/create-event')}>
              Создать мероприятие
            </PrimaryButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {projects.map((project) => {
              const dateStr = project.date 
                ? new Date(project.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'Дата не выбрана';

              return (
                <div 
                  key={project.id}
                  onClick={() => handleSetActive(project)}
                  className="group relative bg-[var(--background-elevated)] hover:bg-[var(--surface-muted)]/10 border border-[var(--border-soft)] hover:border-[var(--gold-primary)]/40 p-5 rounded-[22px] shadow-sm transition-all duration-200 cursor-pointer text-left flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--gold-deep)] bg-[var(--gold-highlight)] px-2.5 py-0.5 rounded-full border border-[var(--gold-primary)]/10">
                        {project.eventType === 'Wedding' ? 'Свадьба' : project.eventType === 'Birthday' ? 'День рождения' : project.eventType === 'Corporate' ? 'Корпоратив' : 'Праздник'}
                      </span>
                      {project.nadoSegment && (
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--surface-muted)] px-2.5 py-0.5 rounded-full border border-[var(--border-soft)] font-mono">
                          {project.nadoSegment}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
                      {project.name || 'Название праздника'}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--text-secondary)] font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                        {dateStr}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                        {project.guestCount || 0} гостей
                      </span>
                      <span className="flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                        {project.budget ? `${project.budget.toLocaleString('ru-RU')} ₽` : 'Бюджет не указан'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      onClick={(e) => handleDeleteProject(e, project.id)}
                      className="p-3.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all cursor-pointer"
                      title="Удалить проект"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="p-3.5 rounded-xl bg-[var(--surface-muted)] text-[var(--text-secondary)] group-hover:bg-[var(--gold-highlight)] group-hover:text-[var(--gold-deep)] border border-[var(--border-soft)] group-hover:border-[var(--gold-primary)]/30 transition-all">
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
