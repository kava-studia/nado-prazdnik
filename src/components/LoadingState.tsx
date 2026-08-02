export default function LoadingState({ message = 'Загрузка...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center" id="loading-state-view">
      <div className="relative w-12 h-12 mb-4">
        {/* Spinner rings */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-2 border-t-primary animate-spin" />
      </div>
      <p className="text-xs font-mono text-outline uppercase tracking-wider">{message}</p>
    </div>
  );
}
