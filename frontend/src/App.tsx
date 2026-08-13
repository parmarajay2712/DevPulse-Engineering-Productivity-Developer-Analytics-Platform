
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './features/dashboard/Dashboard';
import { ErrorFeed } from './features/errors/ErrorFeed';
import { AlertsDashboard } from './features/alerts/AlertsDashboard';
import { LogsExplorer } from './features/analytics/LogsExplorer';
import { DeploymentsTimeline } from './features/projects/DeploymentsTimeline';
import { Settings } from './features/projects/Settings';
import { IncidentsDashboard } from './features/incidents/IncidentsDashboard';
import { Login } from './features/auth/Login';
import { Register } from './features/auth/Register';
import { CommandPalette } from './components/CommandPalette';
import { getAuthToken } from './services/api';
import type { ReactNode } from 'react';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const token = getAuthToken();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <CommandPalette />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/errors" element={<ErrorFeed />} />
                  <Route path="/alerts" element={<AlertsDashboard />} />
                  <Route path="/logs" element={<LogsExplorer />} />
                  <Route path="/deployments" element={<DeploymentsTimeline />} />
                  <Route path="/incidents" element={<IncidentsDashboard />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<div className="p-8 text-center text-zinc-500">Feature coming soon.</div>} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
