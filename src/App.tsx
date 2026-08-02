import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import RootRedirect from './components/RootRedirect';
import AppErrorBoundary from './components/AppErrorBoundary';
import { ThemeProvider } from './theme/ThemeProvider';
import { AuthProvider, ProtectedRoute, PublicOnlyRoute } from './context/AuthContext';
import { DemoModeProvider } from './context/DemoModeContext';
import { RepositoryProvider } from './repositories/RepositoryProvider';
import Welcome from './pages/Welcome';
import Auth from './pages/Auth';

// Protected screens are downloaded only when the user opens them.
const Home = lazy(() => import('./pages/Home'));
const WorkspaceLayout = lazy(() => import('./components/WorkspaceLayout'));
const ContractorCabinet = lazy(() => import('./components/workspace/ContractorCabinet'));
const OrganizerCabinet = lazy(() => import('./components/workspace/OrganizerCabinet'));
const VenueCabinet = lazy(() => import('./components/workspace/VenueCabinet'));
const AdminCabinet = lazy(() => import('./components/workspace/AdminCabinet'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const Catalog = lazy(() => import('./pages/Catalog'));
const ContractorDetail = lazy(() => import('./pages/ContractorDetail'));
const Booking = lazy(() => import('./pages/Booking'));
const ProjectDashboard = lazy(() => import('./pages/ProjectDashboard'));
const DrinksCalculator = lazy(() => import('./pages/DrinksCalculator'));
const BookingsList = lazy(() => import('./pages/BookingsList'));
const Profile = lazy(() => import('./pages/Profile'));
const PlanCreated = lazy(() => import('./pages/PlanCreated'));
const Packages = lazy(() => import('./pages/Packages'));
const Search = lazy(() => import('./pages/Search'));
const EventsList = lazy(() => import('./pages/EventsList'));
const NotFound = lazy(() => import('./pages/NotFound'));
const EventPlan = lazy(() => import('./pages/EventPlan'));
const EventPlanStep = lazy(() => import('./pages/EventPlanStep'));
const Legal = lazy(() => import('./pages/Legal'));
const LegalDocumentPage = lazy(() => import('./pages/LegalDocumentPage'));
const ConsentsSettings = lazy(() => import('./pages/ConsentsSettings'));
const Disputes = lazy(() => import('./pages/Disputes'));
const OrderTerms = lazy(() => import('./pages/OrderTerms'));

const ContractsList = lazy(() =>
  import('./features/contracts/pages/ContractsList').then((module) => ({ default: module.ContractsList }))
);
const ContractTemplatesList = lazy(() =>
  import('./features/contracts/pages/ContractTemplatesList').then((module) => ({ default: module.ContractTemplatesList }))
);
const ContractTemplateDetail = lazy(() =>
  import('./features/contracts/pages/ContractTemplateDetail').then((module) => ({ default: module.ContractTemplateDetail }))
);
const ContractCreateWizard = lazy(() =>
  import('./features/contracts/pages/ContractCreateWizard').then((module) => ({ default: module.ContractCreateWizard }))
);
const ContractDetail = lazy(() =>
  import('./features/contracts/pages/ContractDetail').then((module) => ({ default: module.ContractDetail }))
);
const ContractEdit = lazy(() =>
  import('./features/contracts/pages/ContractEdit').then((module) => ({ default: module.ContractEdit }))
);
const ContractConfirmations = lazy(() =>
  import('./features/contracts/pages/ContractConfirmations').then((module) => ({ default: module.ContractConfirmations }))
);
const ContractVersions = lazy(() =>
  import('./features/contracts/pages/ContractVersions').then((module) => ({ default: module.ContractVersions }))
);
const ContractCompare = lazy(() =>
  import('./features/contracts/pages/ContractCompare').then((module) => ({ default: module.ContractCompare }))
);
const ContractAttachments = lazy(() =>
  import('./features/contracts/pages/ContractAttachments').then((module) => ({ default: module.ContractAttachments }))
);

function RouteLoadingScreen() {
  return (
    <div className="fixed inset-0 z-40 flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-6 text-[var(--text-primary)]">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-11 w-11 animate-spin rounded-full border-4 border-[var(--gold-primary)]/25 border-t-[var(--gold-primary)]" />
        <div>
          <div className="text-sm font-bold tracking-[0.18em]">NADO ПРАЗДНИК</div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">Открываем раздел...</div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DemoModeProvider>
        <AuthProvider>
          <RepositoryProvider>
            <AppErrorBoundary>
              <HashRouter>
                <Suspense fallback={<RouteLoadingScreen />}>
                  <Routes>
                    <Route path="/welcome" element={<PublicOnlyRoute><Welcome /></PublicOnlyRoute>} />

                    <Route path="/auth" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
                    <Route path="/auth/sign-in" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
                    <Route path="/auth/sign-up" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
                    <Route path="/auth/email" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
                    <Route path="/auth/phone" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
                    <Route path="/auth/verify-email" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
                    <Route path="/auth/verify-phone" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
                    <Route path="/auth/account-conflict" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
                    <Route path="/auth/callback/telegram" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
                    <Route path="/auth/callback/max" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
                    <Route path="/auth/callback/esia" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
                    <Route path="/auth/complete" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
                    <Route path="/auth/link" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />

                    <Route path="/" element={<ProtectedRoute><RootRedirect /></ProtectedRoute>} />
                    <Route path="/workspace" element={<ProtectedRoute><WorkspaceLayout /></ProtectedRoute>}>
                      <Route index element={<Navigate to="contractor" replace />} />
                      <Route path="contractor" element={<ContractorCabinet />} />
                      <Route path="organizer" element={<OrganizerCabinet />} />
                      <Route path="venue" element={<VenueCabinet />} />
                      <Route path="admin" element={<AdminCabinet />} />
                    </Route>
                    <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                    <Route path="/start" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
                    <Route path="/create-event" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
                    <Route path="/catalog/:category" element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
                    <Route path="/contractors/:id" element={<ProtectedRoute><ContractorDetail /></ProtectedRoute>} />
                    <Route path="/contractors/:category/:id" element={<ProtectedRoute><ContractorDetail /></ProtectedRoute>} />
                    <Route path="/contractors/dj/:id" element={<ProtectedRoute><ContractorDetail /></ProtectedRoute>} />
                    <Route path="/booking/:contractorId" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
                    <Route path="/events" element={<ProtectedRoute><EventsList /></ProtectedRoute>} />
                    <Route path="/project" element={<ProtectedRoute><ProjectDashboard /></ProtectedRoute>} />
                    <Route path="/events/:eventId" element={<ProtectedRoute><ProjectDashboard /></ProtectedRoute>} />
                    <Route path="/events/:eventId/plan" element={<ProtectedRoute><EventPlan /></ProtectedRoute>} />
                    <Route path="/events/:eventId/plan/:category" element={<ProtectedRoute><EventPlanStep /></ProtectedRoute>} />
                    <Route path="/events/:eventId/plan-created" element={<ProtectedRoute><PlanCreated /></ProtectedRoute>} />
                    <Route path="/events/:eventId/packages" element={<ProtectedRoute><Packages /></ProtectedRoute>} />
                    <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
                    <Route path="/drinks-calculator" element={<ProtectedRoute><DrinksCalculator /></ProtectedRoute>} />
                    <Route path="/bookings" element={<ProtectedRoute><BookingsList /></ProtectedRoute>} />
                    <Route path="/legal" element={<ProtectedRoute><Legal /></ProtectedRoute>} />
                    <Route path="/legal/:documentKey" element={<ProtectedRoute><LegalDocumentPage /></ProtectedRoute>} />
                    <Route path="/profile/consents" element={<ProtectedRoute><ConsentsSettings /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/disputes" element={<ProtectedRoute><Disputes /></ProtectedRoute>} />
                    <Route path="/disputes/:disputeId" element={<ProtectedRoute><Disputes /></ProtectedRoute>} />
                    <Route path="/orders/:orderId/terms" element={<ProtectedRoute><OrderTerms /></ProtectedRoute>} />

                    <Route path="/contracts" element={<ProtectedRoute><ContractsList /></ProtectedRoute>} />
                    <Route path="/contracts/templates" element={<ProtectedRoute><ContractTemplatesList /></ProtectedRoute>} />
                    <Route path="/contracts/templates/:templateId" element={<ProtectedRoute><ContractTemplateDetail /></ProtectedRoute>} />
                    <Route path="/contracts/create" element={<ProtectedRoute><ContractCreateWizard /></ProtectedRoute>} />
                    <Route path="/contracts/:contractId" element={<ProtectedRoute><ContractDetail /></ProtectedRoute>} />
                    <Route path="/contracts/:contractId/edit" element={<ProtectedRoute><ContractEdit /></ProtectedRoute>} />
                    <Route path="/contracts/:contractId/confirmations" element={<ProtectedRoute><ContractConfirmations /></ProtectedRoute>} />
                    <Route path="/contracts/:contractId/versions" element={<ProtectedRoute><ContractVersions /></ProtectedRoute>} />
                    <Route path="/contracts/:contractId/compare" element={<ProtectedRoute><ContractCompare /></ProtectedRoute>} />
                    <Route path="/contracts/:contractId/attachments" element={<ProtectedRoute><ContractAttachments /></ProtectedRoute>} />
                    <Route path="/workspace/contractor/contracts" element={<ProtectedRoute><ContractsList roleFilter="contractor" /></ProtectedRoute>} />
                    <Route path="/workspace/organizer/contracts" element={<ProtectedRoute><ContractsList roleFilter="organizer" /></ProtectedRoute>} />
                    <Route path="/workspace/venue/contracts" element={<ProtectedRoute><ContractsList roleFilter="venue" /></ProtectedRoute>} />
                    <Route path="/admin/contract-templates" element={<ProtectedRoute><ContractTemplatesList /></ProtectedRoute>} />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </HashRouter>
            </AppErrorBoundary>
          </RepositoryProvider>
        </AuthProvider>
      </DemoModeProvider>
    </ThemeProvider>
  );
}
