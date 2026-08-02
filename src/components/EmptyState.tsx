import { LucideIcon, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  ctaText?: string;
  onCtaClick?: () => void;
}

export default function EmptyState({
  title,
  description,
  icon: Icon = Sparkles,
  ctaText,
  onCtaClick
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 glass-panel rounded-2xl border border-white/5 my-4 max-w-sm mx-auto" id="empty-state-view">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-white tracking-tight mb-2">
        {title}
      </h3>
      <p className="text-xs text-outline leading-relaxed mb-5 font-sans">
        {description}
      </p>
      {ctaText && onCtaClick && (
        <button
          onClick={onCtaClick}
          className="bg-primary hover:bg-primary-gold text-surface-dim text-xs font-bold font-sans py-2.5 px-5 rounded-lg shadow-md active:scale-95 transition-all"
          id="empty-state-cta-button"
        >
          {ctaText}
        </button>
      )}
    </div>
  );
}
