import React from 'react';
import { 
  Plus, 
  Minus, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  ChevronDown, 
  Clock, 
  XCircle, 
  Sparkles,
  LucideIcon
} from 'lucide-react';

// --- PrimaryButton ---
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';
}

export const PrimaryButton: React.FC<ButtonProps> = ({ 
  children, 
  icon: Icon, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyle = "w-full min-h-[52px] md:min-h-[56px] rounded-[16px] px-6 py-3 flex items-center justify-center gap-2.5 text-[15px] sm:text-[16px] font-bold transition-all duration-200 select-none cursor-pointer active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none";
  
  let variantStyle = "premium-gold-button";
  if (variant === 'secondary') {
    variantStyle = "bg-[var(--background-elevated)] hover:bg-[var(--surface-muted)] text-[var(--text-primary)] border border-[var(--border-strong)] shadow-sm dark:bg-[var(--background-secondary)] dark:border-[var(--border-soft)]";
  } else if (variant === 'tertiary') {
    variantStyle = "bg-[var(--surface-muted)] hover:bg-[var(--background-secondary)] text-[var(--text-primary)] border border-[var(--border-soft)]";
  } else if (variant === 'ghost') {
    variantStyle = "bg-transparent hover:bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]";
  } else if (variant === 'danger') {
    variantStyle = "bg-[var(--error)] hover:opacity-90 text-white shadow-sm";
  }

  return (
    <button className={`${baseStyle} ${variantStyle} ${className}`} {...props}>
      {Icon && <Icon className="w-5 h-5 shrink-0" />}
      {children && <span>{children}</span>}
    </button>
  );
};

// --- SecondaryButton ---
export const SecondaryButton: React.FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <PrimaryButton variant="secondary" {...props}>
      {children}
    </PrimaryButton>
  );
};

// --- TertiaryButton ---
export const TertiaryButton: React.FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <PrimaryButton variant="tertiary" {...props}>
      {children}
    </PrimaryButton>
  );
};

// --- GhostButton ---
export const GhostButton: React.FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <PrimaryButton variant="ghost" {...props}>
      {children}
    </PrimaryButton>
  );
};

// --- DangerButton ---
export const DangerButton: React.FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <PrimaryButton variant="danger" {...props}>
      {children}
    </PrimaryButton>
  );
};

// --- IconButton ---
export const IconButton: React.FC<ButtonProps & { icon: LucideIcon }> = ({ icon: Icon, className = '', ...props }) => {
  return (
    <button 
      className={`p-3 rounded-full bg-[var(--background-elevated)] hover:bg-[var(--surface-muted)] text-[var(--text-primary)] border border-[var(--border-soft)] transition-all cursor-pointer flex items-center justify-center active:scale-95 ${className}`} 
      {...props}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
};

// --- PageTitle ---
interface PageTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export const PageTitle: React.FC<PageTitleProps> = ({ title, subtitle, className = '' }) => {
  return (
    <div className={`mb-6 text-left ${className}`}>
      <h2 className="text-2xl md:text-3.5xl font-extrabold text-[var(--text-primary)] tracking-tight leading-tight mb-2">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[var(--text-secondary)] text-sm sm:text-base font-normal leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};

// --- SectionCard ---
export interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  size?: 'normal' | 'large';
  onClick?: () => void;
}

export const SectionCard: React.FC<SectionCardProps> = ({ 
  children, 
  title, 
  subtitle, 
  className = '', 
  size = 'normal',
  onClick
}) => {
  const isLarge = size === 'large';
  const roundedClass = isLarge ? 'rounded-[24px]' : 'rounded-[18px]';
  const hoverClass = onClick ? 'cursor-pointer hover:border-[var(--gold-primary)]/50 transition-all active:scale-[0.99] premium-glass-card-hover' : '';
  
  return (
    <div 
      onClick={onClick}
      className={`premium-glass-card ${roundedClass} p-5 md:p-6 ${hoverClass} ${className}`}
    >
      {(title || subtitle) && (
        <div className="mb-4 text-left">
          {title && <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">{title}</h3>}
          {subtitle && <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

// --- SurfaceCard ---
export const SurfaceCard: React.FC<SectionCardProps> = ({ 
  children, 
  title, 
  subtitle, 
  className = '', 
  onClick 
}) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-[var(--background-elevated)] border border-[var(--border-soft)] rounded-[20px] p-5 md:p-6 shadow-sm ${onClick ? 'cursor-pointer hover:border-[var(--gold-primary)]/40 transition-all active:scale-[0.99]' : ''} ${className}`}
    >
      {(title || subtitle) && (
        <div className="mb-4 text-left">
          {title && <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">{title}</h3>}
          {subtitle && <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

// --- GlassCard ---
export const GlassCard: React.FC<SectionCardProps> = ({ 
  children, 
  title, 
  subtitle, 
  className = '', 
  onClick 
}) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-[var(--surface-glass)] backdrop-blur-md border border-[var(--border-strong)] rounded-[24px] p-5 md:p-6 shadow-md transition-all ${onClick ? 'cursor-pointer hover:border-[var(--gold-primary)]/60 active:scale-[0.99]' : ''} ${className}`}
    >
      {(title || subtitle) && (
        <div className="mb-4 text-left">
          {title && <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">{title}</h3>}
          {subtitle && <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

// --- ActionCard ---
export const ActionCard: React.FC<SectionCardProps & { icon?: LucideIcon }> = ({ 
  children, 
  title, 
  subtitle, 
  icon: Icon,
  className = '', 
  onClick 
}) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-[var(--background-elevated)] border border-[var(--border-soft)] hover:border-[var(--gold-primary)]/50 rounded-[20px] p-5 shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-start gap-4 ${className}`}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-[14px] bg-[var(--gold-highlight)] text-[var(--gold-deep)] flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <div className="flex-1 text-left">
        {title && <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight leading-snug">{title}</h3>}
        {subtitle && <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 leading-normal">{subtitle}</p>}
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
};

// --- EventTypeCard ---
export const EventTypeCard: React.FC<{
  title: string;
  icon: LucideIcon;
  isSelected?: boolean;
  onClick: () => void;
  className?: string;
}> = ({ title, icon: Icon, isSelected, onClick, className = '' }) => {
  return (
    <div 
      onClick={onClick}
      className={`p-5 rounded-[22px] border transition-all cursor-pointer select-none text-left flex flex-col justify-between aspect-[1.1] active:scale-[0.97] ${
        isSelected 
          ? 'bg-[var(--gold-highlight)] border-[var(--gold-primary)] text-[var(--gold-deep)] shadow-sm'
          : 'bg-[var(--background-elevated)] border-[var(--border-soft)] hover:border-[var(--gold-primary)]/40 text-[var(--text-secondary)]'
      } ${className}`}
    >
      <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center transition-colors ${
        isSelected ? 'bg-[var(--gold-primary)] text-white dark:text-slate-900' : 'bg-[var(--surface-muted)] text-[var(--text-secondary)]'
      }`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className={`font-bold text-[16px] sm:text-[18px] mt-4 leading-tight ${isSelected ? 'text-[var(--gold-deep)]' : 'text-[var(--text-primary)]'}`}>
        {title}
      </span>
    </div>
  );
};

// --- BudgetOptionCard ---
export const BudgetOptionCard: React.FC<{
  title: string;
  priceRange: string;
  description: string;
  isSelected?: boolean;
  onClick: () => void;
  className?: string;
}> = ({ title, priceRange, description, isSelected, onClick, className = '' }) => {
  return (
    <div 
      onClick={onClick}
      className={`p-5 rounded-[20px] border transition-all cursor-pointer text-left active:scale-[0.98] ${
        isSelected 
          ? 'bg-[var(--gold-highlight)] border-[var(--gold-primary)] shadow-sm'
          : 'bg-[var(--background-elevated)] border-[var(--border-soft)] hover:border-[var(--gold-primary)]/30'
      } ${className}`}
    >
      <div className="flex justify-between items-start gap-2">
        <h4 className="font-bold text-base sm:text-lg text-[var(--text-primary)]">{title}</h4>
        <span className="font-mono text-sm sm:text-base font-bold text-[var(--gold-primary)] shrink-0">{priceRange}</span>
      </div>
      <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">{description}</p>
    </div>
  );
};

// --- RecommendationCard ---
export const RecommendationCard: React.FC<{
  title: string;
  badge?: string;
  details: string[];
  price?: string;
  onClick?: () => void;
  className?: string;
}> = ({ title, badge, details, price, onClick, className = '' }) => {
  return (
    <div 
      onClick={onClick}
      className={`p-5 rounded-[22px] bg-[var(--background-elevated)] border border-[var(--border-soft)] shadow-sm text-left ${onClick ? 'cursor-pointer hover:border-[var(--gold-primary)]/40 transition-all' : ''} ${className}`}
    >
      <div className="flex justify-between items-start gap-2 mb-3">
        <h4 className="font-bold text-[17px] sm:text-[19px] text-[var(--text-primary)]">{title}</h4>
        {badge && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[var(--gold-highlight)] text-[var(--gold-deep)] border border-[var(--gold-primary)]/20">
            {badge}
          </span>
        )}
      </div>
      <ul className="space-y-1.5 mb-4">
        {details.map((d, i) => (
          <li key={i} className="text-xs sm:text-sm text-[var(--text-secondary)] flex items-start gap-2">
            <span className="text-[var(--gold-primary)] mt-0.5">•</span>
            <span>{d}</span>
          </li>
        ))}
      </ul>
      {price && (
        <div className="pt-3 border-t border-[var(--border-soft)] flex justify-between items-center">
          <span className="text-xs text-[var(--text-muted)]">Ориентир сметы:</span>
          <span className="font-mono font-bold text-[16px] sm:text-[18px] text-[var(--gold-deep)]">{price}</span>
        </div>
      )}
    </div>
  );
};

// --- ProjectSummaryCard ---
export const ProjectSummaryCard: React.FC<{
  name: string;
  date: string;
  guests: number;
  budget: number | string;
  progress: number;
  nextAction: string;
  onClick: () => void;
  className?: string;
}> = ({ name, date, guests, budget, progress, nextAction, onClick, className = '' }) => {
  return (
    <div 
      onClick={onClick}
      className="relative overflow-hidden p-6 rounded-[24px] bg-[var(--background-elevated)] border border-[var(--gold-primary)]/20 hover:border-[var(--gold-primary)]/50 shadow-md transition-all active:scale-[0.99] cursor-pointer text-left group"
    >
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--gold-primary)]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[var(--gold-primary)]/10 transition-all duration-500" />
      
      <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
        <div>
          <span className="text-xs font-bold text-[var(--gold-primary)] tracking-wider uppercase">Ваш проект</span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight mt-0.5">{name}</h3>
        </div>
        <span className="text-xs sm:text-sm px-3 py-1.5 rounded-xl bg-[var(--surface-muted)] text-[var(--text-secondary)] font-medium font-mono">
          {date}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5 border-t border-b border-[var(--border-soft)] py-3">
        <div>
          <span className="text-xs text-[var(--text-muted)]">Гости</span>
          <p className="text-base sm:text-lg font-bold text-[var(--text-primary)]">{guests}</p>
        </div>
        <div>
          <span className="text-xs text-[var(--text-muted)]">Бюджет</span>
          <p className="text-base sm:text-lg font-bold text-[var(--text-primary)]">{typeof budget === 'number' ? `${budget.toLocaleString('ru-RU')} ₽` : budget}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] mb-1.5">
          <span>Подготовка</span>
          <span className="font-mono font-bold text-[var(--gold-primary)]">{progress}%</span>
        </div>
        <div className="h-2 w-full bg-[var(--surface-muted)] rounded-full overflow-hidden mb-4">
          <div className="h-full bg-gradient-to-r from-[var(--gold-deep)] to-[var(--gold-primary)] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="p-3 bg-[var(--gold-highlight)]/40 rounded-[14px] border border-[var(--gold-primary)]/10 flex items-start gap-2">
          <span className="text-[var(--gold-deep)] text-xs font-bold shrink-0 mt-0.5">NADO:</span>
          <span className="text-xs text-[var(--gold-deep)] leading-normal font-medium">{nextAction}</span>
        </div>
      </div>
    </div>
  );
};

// --- FormField ---
interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
  label: string;
  error?: string;
  as?: 'input' | 'select' | 'textarea';
  options?: { value: string; label: string }[];
  children?: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  as = 'input',
  options,
  children,
  className = '',
  ...props
}) => {
  const inputStyle = `w-full min-h-[48px] bg-[var(--background-elevated)] border ${error ? 'border-[var(--error)]' : 'border-[var(--border-strong)]'} focus:border-[var(--gold-primary)] focus:ring-2 focus:ring-[var(--gold-light)]/20 rounded-[14px] px-4 py-2.5 text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-all`;
  
  return (
    <div className={`flex flex-col gap-1.5 text-left w-full ${className}`}>
      <label className="text-sm md:text-base font-medium text-[var(--text-secondary)] pl-1">
        {label}
      </label>
      
      {as === 'select' ? (
        <div className="relative">
          <select className={`${inputStyle} appearance-none pr-10`} {...(props as any)}>
            {options ? options.map(o => (
              <option key={o.value} value={o.value} className="bg-[var(--background-elevated)] text-[var(--text-primary)]">
                {o.label}
              </option>
            )) : children}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
      ) : as === 'textarea' ? (
        <textarea className={`${inputStyle} min-h-[100px] resize-y`} {...(props as any)} />
      ) : (
        <input className={inputStyle} {...props} />
      )}
      
      {error && (
        <span className="text-sm text-[var(--error)] font-medium flex items-center gap-1 mt-0.5 pl-1">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </span>
      )}
    </div>
  );
};

// --- NumberStepper ---
interface NumberStepperProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export const NumberStepper: React.FC<NumberStepperProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 9999,
  className = ''
}) => {
  const handleDecrement = () => {
    if (value > min) onChange(value - 1);
  };
  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div className={`flex items-center justify-between p-4 bg-white rounded-[18px] border border-[var(--color-border)] ${className}`}>
      <span className="text-base font-bold text-[var(--color-text)] text-left">{label}</span>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="w-10 h-10 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] hover:border-[var(--color-gold)] flex items-center justify-center text-[var(--color-text)] disabled:opacity-30 disabled:pointer-events-none active:scale-90 transition-all cursor-pointer shadow-sm"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-xl font-bold text-[var(--color-text)] w-8 text-center select-none font-mono">
          {value}
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="w-10 h-10 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] hover:border-[var(--color-gold)] flex items-center justify-center text-[var(--color-text)] disabled:opacity-30 disabled:pointer-events-none active:scale-90 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// --- ProgressSteps ---
interface ProgressStepsProps {
  totalSteps: number;
  currentStep: number;
  className?: string;
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({ totalSteps, currentStep, className = '' }) => {
  return (
    <div className={`w-full flex items-center gap-2 ${className}`}>
      {Array.from({ length: totalSteps }).map((_, idx) => (
        <div
          key={idx}
          className={`h-2 flex-1 rounded-full transition-all duration-300 ${
            idx < currentStep 
              ? 'bg-gradient-to-r from-[var(--color-gold-deep)] to-[var(--color-gold-light)]' 
              : 'bg-[var(--color-background-soft)]'
          }`}
        />
      ))}
    </div>
  );
};

// --- CategoryCard ---
interface CategoryCardProps {
  title: string;
  icon: LucideIcon;
  count?: number;
  isSelected?: boolean;
  onClick: () => void;
  className?: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  icon: Icon,
  count,
  isSelected,
  onClick,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-[18px] border text-left transition-all w-full flex flex-col justify-between aspect-[1.3] group cursor-pointer active:scale-[0.97] ${
        isSelected
          ? 'bg-[var(--color-champagne)] border-[var(--color-gold)] text-[var(--color-gold-deep)] shadow-sm'
          : 'bg-white border-[var(--color-border)] hover:border-[var(--color-gold-light)] text-[var(--color-text-secondary)]'
      } ${className}`}
    >
      <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center transition-colors ${
        isSelected ? 'bg-[var(--color-gold)] text-white' : 'bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] group-hover:text-[var(--color-gold-deep)]'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className={`font-bold text-sm sm:text-base leading-tight transition-colors ${isSelected ? 'text-[var(--color-gold-deep)]' : 'text-[var(--color-text)]'}`}>
          {title}
        </p>
        {typeof count === 'number' && (
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {count} вариантов
          </p>
        )}
      </div>
    </button>
  );
};

// --- EmptyState ---
interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  ctaText?: string;
  onCtaClick?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Sparkles,
  ctaText,
  onCtaClick,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 premium-glass-card my-4 max-w-md mx-auto ${className}`} id="empty-state-view">
      <div className="w-14 h-14 rounded-full bg-[var(--color-champagne)] flex items-center justify-center text-[var(--color-gold-deep)] mb-5 shadow-sm">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-[var(--color-text)] tracking-tight mb-2">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6 font-normal">
        {description}
      </p>
      {ctaText && onCtaClick && (
        <PrimaryButton onClick={onCtaClick}>
          {ctaText}
        </PrimaryButton>
      )}
    </div>
  );
};

// --- ErrorState ---
interface ErrorStateProps {
  message: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, className = '' }) => {
  return (
    <div className={`p-4 bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 rounded-[14px] flex items-start gap-3 text-left ${className}`}>
      <AlertCircle className="w-5 h-5 text-[var(--color-error)] shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-bold text-[var(--color-error)]">
          Ошибка
        </p>
        <p className="text-sm text-[var(--color-text)] mt-0.5">
          {message}
        </p>
      </div>
    </div>
  );
};

// --- SuccessState ---
interface SuccessStateProps {
  title: string;
  message: string;
  ctaText?: string;
  onCtaClick?: () => void;
  className?: string;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  title,
  message,
  ctaText,
  onCtaClick,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 premium-glass-card my-4 max-w-md mx-auto ${className}`}>
      <div className="w-14 h-14 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center text-[var(--color-success)] mb-5 shadow-sm">
        <CheckCircle2 className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-[var(--color-text)] tracking-tight mb-2">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6 font-normal">
        {message}
      </p>
      {ctaText && onCtaClick && (
        <PrimaryButton onClick={onCtaClick}>
          {ctaText}
        </PrimaryButton>
      )}
    </div>
  );
};

// --- BottomSheet ---
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-sm transition-opacity">
      {/* Click-outside backdrop */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />
      
      {/* Panel */}
      <div className="relative w-full max-w-md bg-white border-t border-[var(--color-border)] rounded-t-[24px] p-6 max-h-[85vh] overflow-y-auto z-10 shadow-2xl">
        {/* Handle */}
        <div className="mx-auto w-12 h-1.5 bg-[var(--color-background-soft)] rounded-full mb-5" />
        
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base sm:text-lg font-bold text-[var(--color-text)]">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-[var(--color-surface-raised)] hover:bg-[var(--color-background-soft)] text-[var(--color-text-secondary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="text-left">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- StatusBadge ---
interface StatusBadgeProps {
  type: 'client' | 'contractor';
  status: 'pending' | 'confirmed' | 'rejected' | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, status }) => {
  if (type === 'client') {
    if (status === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#EAF5EE] text-[#3E8B65] border border-[#3E8B65]/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Подтверждено вами
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#FCF4E7] text-[#694619] border border-[#694619]/20">
          <Clock className="w-3.5 h-3.5" />
          Требует подтверждения
        </span>
      );
    }
  } else {
    if (status === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#EAF5EE] text-[#3E8B65] border border-[#3E8B65]/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Подтверждено подрядчиком
        </span>
      );
    } else if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#FDF0F0] text-[#B94D4D] border border-[#B94D4D]/20">
          <XCircle className="w-3.5 h-3.5" />
          Отклонено подрядчиком
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#FCF4E7] text-[#B9852E] border border-[var(--color-gold)]/20">
          <Clock className="w-3.5 h-3.5 animate-pulse" />
          Ожидается ответ
        </span>
      );
    }
  }
};
