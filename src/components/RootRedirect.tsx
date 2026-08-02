import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDemoMode } from '../context/DemoModeContext';

export default function RootRedirect() {
  const { authMode, user } = useAuth();
  const { demoRole } = useDemoMode();

  if (authMode === 'loading') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <div className="w-12 h-12 border-4 border-[var(--gold-primary)] border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-xs text-[var(--text-muted)] mt-1 tracking-widest font-mono uppercase">Определение маршрута...</div>
      </div>
    );
  }

  if (authMode === 'unauthenticated' || !user) {
    return <Navigate to="/welcome" replace />;
  }

  // Determine active role (either from demoMode or from the user's primary role)
  const activeRole = authMode === 'demo' ? demoRole : (user.roles && user.roles[0]) || 'client';

  if (activeRole === 'client') {
    return <Navigate to="/home" replace />;
  }

  // Redirect other roles to their specific workspaces
  if (activeRole === 'contractor') {
    return <Navigate to="/workspace/contractor" replace />;
  }
  if (activeRole === 'organizer') {
    return <Navigate to="/workspace/organizer" replace />;
  }
  if (activeRole === 'venue_manager') {
    return <Navigate to="/workspace/venue" replace />;
  }
  if (activeRole === 'administrator') {
    return <Navigate to="/workspace/admin" replace />;
  }

  return <Navigate to="/home" replace />;
}
