import { Suspense, lazy } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

import { AppLayout } from './components/layout/AppLayout.jsx';
import { LoadingState } from './components/ui/Feedback.jsx';
import { useAuth } from './hooks/auth-context.js';
import { LoginPage } from './pages/LoginPage.jsx';

/**
 * Pages load on demand. The dashboard alone pulls in the whole charting
 * library, which an operator who only came to approve a payment should not
 * have to download first.
 */
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage.jsx').then((m) => ({ default: m.DashboardPage })),
);
const UsersPage = lazy(() => import('./pages/UsersPage.jsx').then((m) => ({ default: m.UsersPage })));
const UserDetailPage = lazy(() =>
  import('./pages/UserDetailPage.jsx').then((m) => ({ default: m.UserDetailPage })),
);
const PricingPage = lazy(() => import('./pages/PricingPage.jsx').then((m) => ({ default: m.PricingPage })));
const PaymentsPage = lazy(() =>
  import('./pages/PaymentsPage.jsx').then((m) => ({ default: m.PaymentsPage })),
);
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx').then((m) => ({ default: m.ReportsPage })));
const AppearancePage = lazy(() =>
  import('./pages/AppearancePage.jsx').then((m) => ({ default: m.AppearancePage })),
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage.jsx').then((m) => ({ default: m.SettingsPage })),
);
const AuditLogPage = lazy(() =>
  import('./pages/AuditLogPage.jsx').then((m) => ({ default: m.AuditLogPage })),
);
const CampaignsPage = lazy(() =>
  import('./pages/CampaignsPage.jsx').then((m) => ({ default: m.CampaignsPage })),
);
const BannersPage = lazy(() =>
  import('./pages/BannersPage.jsx').then((m) => ({ default: m.BannersPage })),
);

function RequireAuth({ children }) {
  const { isAuthenticated, isRestoring } = useAuth();

  // Waiting for the stored session to be re-validated. Rendering the shell here
  // would flash the panel to someone whose access was already revoked.
  if (isRestoring) {
    return (
      <div className="grid min-h-screen place-items-center">
        <LoadingState label="Restoring your session…" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}

export function App() {
  const { isAuthenticated, isRestoring } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated && !isRestoring ? <Navigate to="/" replace /> : <LoginPage />}
      />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route
          element={
            <Suspense fallback={<LoadingState />}>
              <Outlet />
            </Suspense>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:userId" element={<UserDetailPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="banners" element={<BannersPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="appearance" element={<AppearancePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="audit-log" element={<AuditLogPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
