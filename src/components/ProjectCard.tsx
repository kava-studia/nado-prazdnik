import React from 'react';
import { Calendar, Percent, CreditCard } from 'lucide-react';
import { ProjectState } from '../types';

interface ProjectCardProps {
  project: ProjectState;
  daysLeft: number;
  progressPercent: number;
}

export default function ProjectCard({ project, daysLeft, progressPercent }: ProjectCardProps) {
  const leftToPay = Math.max(0, project.budgetTotal - project.budgetPaid);
  const formattedDate = new Date(project.date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="relative premium-glass-card p-6 sm:p-8 overflow-hidden shadow-xl text-left" id="project-summary-card">
      {/* Background elegant gold ambient light */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-[var(--color-gold-light)]/5 blur-[120px] pointer-events-none -z-0" />

      <div className="relative z-10 flex flex-col gap-6">
        
        {/* Title & Timing Block */}
        <div className="flex justify-between items-start gap-4">
          <div className="text-left space-y-2">
            <span className="inline-block px-3 py-0.5 bg-[var(--color-champagne)] text-[var(--color-gold-deep)] text-xs font-bold uppercase tracking-wider border border-[var(--color-gold)]/20 rounded-full">
              Текущий статус события
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[var(--color-text)] tracking-tight leading-tight">
              {project.name}
            </h3>
            <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--color-gold)]" />
              <span>{project.date === 'Дата обсуждается' ? 'Дата обсуждается' : formattedDate}</span>
            </p>
          </div>
          
          <div className="text-right shrink-0">
            <div className="text-3xl sm:text-4xl font-black text-[var(--color-gold)] leading-none font-mono">
              {daysLeft > 0 ? daysLeft : 0}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-widest font-bold mt-1.5">
              дней осталось
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2 text-left">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-[var(--color-text-secondary)] font-semibold">
              Готовность задач подготовки
            </span>
            <span className="font-bold text-[var(--color-text)] font-mono">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-[var(--color-background-soft)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--color-gold-deep)] to-[var(--color-gold-light)] rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Financial Grid */}
        <div className="grid grid-cols-3 gap-3 pt-5 border-t border-[var(--color-border)] text-center">
          <div className="bg-white p-3 rounded-2xl border border-[var(--color-border)] shadow-sm">
            <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-bold mb-1">Смета</p>
            <p className="text-xs sm:text-sm font-black text-[var(--color-text)] font-mono">
              {project.budgetTotal.toLocaleString('ru-RU')} ₽
            </p>
          </div>
          <div className="bg-[#EAF5EE] p-3 rounded-2xl border border-[#3E8B65]/20">
            <p className="text-xs text-[#3E8B65] uppercase tracking-wider font-bold mb-1">Оплачено</p>
            <p className="text-xs sm:text-sm font-black text-[#3E8B65] font-mono">
              {project.budgetPaid.toLocaleString('ru-RU')} ₽
            </p>
          </div>
          <div className="bg-[#FCF4E7] p-3 rounded-2xl border border-[var(--color-gold)]/20">
            <p className="text-xs text-[#694619] uppercase tracking-wider font-bold mb-1">Остаток</p>
            <p className="text-xs sm:text-sm font-black text-[#694619] font-mono">
              {leftToPay.toLocaleString('ru-RU')} ₽
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
