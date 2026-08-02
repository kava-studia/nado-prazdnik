import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import RootRedirect from './components/RootRedirect';
import WorkspaceLayout from './components/WorkspaceLayout';
import ContractorCabinet from './components/workspace/ContractorCabinet';
import OrganizerCabinet from './components/workspace/OrganizerCabinet';
import VenueCabinet from './components/workspace/VenueCabinet';
import AdminCabinet from './components/workspace/AdminCabinet';
import CreateEvent from './pages/CreateEvent';
import Catalog from './pages/Catalog';
import ContractorDetail from './pages/ContractorDetail';
import Booking from './pages/Booking';
import ProjectDashboard from './pages/ProjectDashboard';
import DrinksCalculator from './pages/DrinksCalculator';
import BookingsList from './pages/BookingsList';
import Profile from './pages/Profile';
import PlanCreated from './pages/PlanCreated';
import Packages from './pages/Packages';
import Search from './pages/Search';
import EventsList from './pages/EventsList';

// New system routes and error boundary
import AppErrorBoundary from './components/AppErrorBoundary';
import NotFound from './pages/NotFound';
import EventPlan from './pages/EventPlan';
import EventPlanStep from './pages/EventPlanStep';
import Legal from './pages/Legal';
import LegalDocumentPage from './pages/LegalDocumentPage';
import ConsentsSettings from './pages/ConsentsSettings';
import Disputes from './pages/Disputes';
import OrderTerms from './pages/OrderTerms';
import { ThemeProvider } from './theme/ThemeProvider';

// Auth Integration imports
import { AuthProvider, ProtectedRoute, PublicOnlyRoute } from './context/AuthContext';
import { DemoModeProvider } from './context/DemoModeContext';
import { RepositoryProvider } from './repositories/RepositoryProvider';
import Welcome from './pages/Welcome';
import Auth from './pages/Auth';

// NADO CONTRACTS imports
import { ContractsList } from './features/contracts/pages/ContractsList';
import { ContractTemplatesList } from './features/contracts/pages/ContractTemplatesList';
import { ContractTemplateDetail } from './features/contracts/pages/ContractTemplateDetail';
import { ContractCreateWizard } from './features/contracts/pages/ContractCreateWizard';
import { ContractDetail } from './features/contracts/pages/ContractDetail';
import { ContractEdit } from './features/contracts/pages/ContractEdit';
import { ContractConfirmations } from './features/contracts/pages/ContractConfirmations';
import { ContractVersions } from './features/contracts/pages/ContractVersions';
import { ContractCompare } from './features/contracts/pages/ContractCompare';
import { ContractAttachments } from './features/contracts/pages/ContractAttachments';

export default function App() {
  return (
    <ThemeProvider>
      <DemoModeProvider>
        <AuthProvider>
          <RepositoryProvider>
            <AppErrorBoundary>
            <HashRouter>
            <Routes>
              {/* Public routes only */}
              <Route path="/welcome" element={<PublicOnlyRoute><Welcome /></PublicOnlyRoute>} />
              
              {/* Authentication Routes */}
              <Route path="/auth" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
              <Route path="/auth/sign-in" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
              <Route path="/auth/sign-up" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
              <Route path="/auth/email" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
              <Route path="/auth/phone" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
              <Route path="/auth/verify-email" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
              <Route path="/auth/verify-phone" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
              <Route path="/auth/account-conflict" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
              
              {/* OAuth flow simulations */}
              <Route path="/auth/callback/telegram" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
              <Route path="/auth/callback/max" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
              <Route path="/auth/callback/esia" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
              <Route path="/auth/complete" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
              <Route path="/auth/link" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />

              {/* Protected Workspace / OS Routes */}
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
              
              {/* Unified Contractor Details */}
              <Route path="/contractors/:id" element={<ProtectedRoute><ContractorDetail /></ProtectedRoute>} />
              <Route path="/contractors/:category/:id" element={<ProtectedRoute><ContractorDetail /></ProtectedRoute>} />
              <Route path="/contractors/dj/:id" element={<ProtectedRoute><ContractorDetail /></ProtectedRoute>} />
              
              <Route path="/booking/:contractorId" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
              
              {/* Unified Project Dashboard and Events list */}
              <Route path="/events" element={<ProtectedRoute><EventsList /></ProtectedRoute>} />
              <Route path="/project" element={<ProtectedRoute><ProjectDashboard /></ProtectedRoute>} />
              <Route path="/events/:eventId" element={<ProtectedRoute><ProjectDashboard /></ProtectedRoute>} />
              
              {/* Step-by-step organization routes */}
              <Route path="/events/:eventId/plan" element={<ProtectedRoute><EventPlan /></ProtectedRoute>} />
              <Route path="/events/:eventId/plan/:category" element={<ProtectedRoute><EventPlanStep /></ProtectedRoute>} />
              
              <Route path="/events/:eventId/plan-created" element={<ProtectedRoute><PlanCreated /></ProtectedRoute>} />
              <Route path="/events/:eventId/packages" element={<ProtectedRoute><Packages /></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
              <Route path="/drinks-calculator" element={<ProtectedRoute><DrinksCalculator /></ProtectedRoute>} />
              <Route path="/bookings" element={<ProtectedRoute><BookingsList /></ProtectedRoute>} />
              
              {/* Legal routes */}
              <Route path="/legal" element={<ProtectedRoute><Legal /></ProtectedRoute>} />
              <Route path="/legal/:documentKey" element={<ProtectedRoute><LegalDocumentPage /></ProtectedRoute>} />
              <Route path="/profile/consents" element={<ProtectedRoute><ConsentsSettings /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/disputes" element={<ProtectedRoute><Disputes /></ProtectedRoute>} />
              <Route path="/disputes/:disputeId" element={<ProtectedRoute><Disputes /></ProtectedRoute>} />
              <Route path="/orders/:orderId/terms" element={<ProtectedRoute><OrderTerms /></ProtectedRoute>} />

              {/* NADO CONTRACTS routes */}
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

              {/* Cabinet-specific contract routes */}
              <Route path="/workspace/contractor/contracts" element={<ProtectedRoute><ContractsList roleFilter="contractor" /></ProtectedRoute>} />
              <Route path="/workspace/organizer/contracts" element={<ProtectedRoute><ContractsList roleFilter="organizer" /></ProtectedRoute>} />
              <Route path="/workspace/venue/contracts" element={<ProtectedRoute><ContractsList roleFilter="venue" /></ProtectedRoute>} />
              <Route path="/admin/contract-templates" element={<ProtectedRoute><ContractTemplatesList /></ProtectedRoute>} />
              
              {/* Fallback 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
        </AppErrorBoundary>
        </RepositoryProvider>
      </AuthProvider>
      </DemoModeProvider>
    </ThemeProvider>
  );
}
