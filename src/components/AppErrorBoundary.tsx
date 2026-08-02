import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorId: string;
}

function createErrorId(): string {
  return `NADO-${Date.now().toString(36).toUpperCase()}`;
}

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorId: '',
  };

  public static getDerivedStateFromError(): State {
    return {
      hasError: true,
      errorId: createErrorId(),
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('NADO ПРАЗДНИК - ошибка интерфейса', {
      errorId: this.state.errorId,
      error,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorId: '' });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, errorId: '' });
    window.location.hash = '#/';
    window.location.reload();
  };

  private handleGoToEvent = () => {
    this.setState({ hasError: false, errorId: '' });
    const activeId = localStorage.getItem('evently_active_project_id');
    window.location.hash = activeId ? `#/events/${activeId}` : '#/';
    window.location.reload();
  };

  public render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] p-6 font-sans">
        <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-8 text-center shadow-2xl">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[var(--gold-primary)]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-rose-400/10 blur-3xl" />

          <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-rose-400/30 bg-rose-400/10 text-rose-500">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h1 className="relative mb-3 text-2xl font-bold tracking-tight">
            Раздел временно не открылся
          </h1>

          <p className="relative mb-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            Данные мероприятия не удалены. Перезагрузите раздел или вернитесь в рабочее пространство.
          </p>

          <p className="relative mb-8 font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            Код ошибки - {this.state.errorId}
          </p>

          <div className="relative flex flex-col gap-3">
            <button
              onClick={this.handleReset}
              className="w-full cursor-pointer rounded-xl bg-[var(--gold-primary)] px-4 py-3 font-bold text-[#17130A] transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Попробовать снова
            </button>

            <button
              onClick={this.handleGoToEvent}
              className="w-full cursor-pointer rounded-xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-3 font-medium text-[var(--text-primary)] transition-all hover:border-[var(--gold-primary)]/40 active:scale-[0.98]"
            >
              Вернуться к мероприятию
            </button>

            <button
              onClick={this.handleGoHome}
              className="w-full cursor-pointer rounded-xl bg-transparent px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
