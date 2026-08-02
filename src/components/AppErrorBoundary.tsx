import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false });
    window.location.reload();
  };

  private handleGoHome = () => {
    (this as any).setState({ hasError: false });
    window.location.hash = '#/';
    window.location.reload();
  };

  private handleGoToEvent = () => {
    (this as any).setState({ hasError: false });
    // Try to find the active event ID from localStorage
    const activeId = localStorage.getItem('evently_active_project_id');
    if (activeId) {
      window.location.hash = `#/events/${activeId}`;
    } else {
      window.location.hash = '#/';
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F1115] text-[#F3F4F6] flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#171A21] border border-white/10 rounded-[24px] p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold tracking-tight mb-3">
              Не удалось открыть этот раздел
            </h1>
            
            <p className="text-sm text-[#B8BDC9] mb-8 leading-relaxed">
              Данные мероприятия сохранены. Попробуйте открыть раздел ещё раз
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full py-3 px-4 bg-[#FFB800] hover:bg-[#FFB800]/90 text-black font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer"
              >
                Попробовать снова
              </button>
              
              <button
                onClick={this.handleGoToEvent}
                className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-[#F3F4F6] font-medium rounded-xl transition-all active:scale-[0.98] cursor-pointer"
              >
                Вернуться к мероприятию
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full py-3 px-4 bg-transparent hover:bg-white/5 text-[#B8BDC9] hover:text-white text-sm font-medium rounded-xl transition-all cursor-pointer"
              >
                На главную
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
export default AppErrorBoundary;
