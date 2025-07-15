import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { HelmetProvider } from 'react-helmet-async';

// Contextos
import { AuthProvider } from './context/AuthContext.jsx';
import CustomThemeProvider from './context/ThemeContext.jsx';
import DashboardProvider from './context/DashboardContext.jsx';
import NotificationProvider from './context/NotificationContext.jsx';

// Páginas (lazy loading)
const LoginPage = lazy(() => import('./page/LoginPage.jsx'));
const DashboardPage = lazy(() => import('./page/DashboardPage.jsx'));
const AdminPage = lazy(() => import('./page/AdminPage.jsx'));
const UserAdminPage = lazy(() => import('./page/UserAdminPage.jsx'));
const SecretariaAdminPage = lazy(() => import('./page/SecretariaAdminPage.jsx'));
const ChangePasswordPage = lazy(() => import('./page/ChangePasswordPage.jsx'));
const ComparisonPage = lazy(() => import('./page/ComparisonPage.jsx'));
const AuditPage = lazy(() => import('./page/AuditPage.jsx'));
const SettingsPage = lazy(() => import('./page/SettingsPage.jsx'));
const OrganigramaPage = lazy(() => import('./page/OrganigramaPage.jsx'));
const UploadPage = lazy(() => import('./page/UploadPage.jsx'));

// Componentes
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ErrorFallback from './components/ErrorFallback.jsx';

// Configuración de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
    },
  },
});

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <CustomThemeProvider>
              <AuthProvider>
                <NotificationProvider>
                  <DashboardProvider>
                    <div className="app">
                      <Navbar />
                      <main className="main-content">
                        <Suspense fallback={<div style={{textAlign:'center',marginTop:40}}>Cargando...</div>}>
                          <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            {/* Rutas Protegidas para Usuarios */}
                            <Route element={<ProtectedRoute />}> 
                              <Route path="/dashboard/:secretariaId" element={<DashboardPage />} />
                              <Route path="/dashboard" element={<DashboardPage />} />
                              <Route path="/comparacion" element={<ComparisonPage />} />
                              <Route path="/change-password" element={<ChangePasswordPage />} />
                              <Route path="/settings" element={<SettingsPage />} />
                              <Route path="/organigrama" element={<OrganigramaPage />} />
                            </Route>
                            {/* Rutas Protegidas solo para Admins */}
                            <Route element={<ProtectedRoute adminOnly={true} />}>
                              <Route path="/admin" element={<AdminPage />} />
                              <Route path="/admin/users" element={<UserAdminPage />} />
                              <Route path="/admin/secretarias" element={<SecretariaAdminPage />} />
                              <Route path="/admin/upload" element={<UploadPage />} />
                              <Route path="/admin/audit" element={<AuditPage />} />
                              <Route path="/admin/organigrama" element={<OrganigramaPage />} />
                            </Route>
                            {/* Redirección por defecto: ahora a /organigrama */}
                            <Route path="/" element={<Navigate to="/organigrama" />} />
                            <Route path="*" element={<Navigate to="/organigrama" />} />
                          </Routes>
                        </Suspense>
                      </main>
                    </div>
                  </DashboardProvider>
                </NotificationProvider>
              </AuthProvider>
            </CustomThemeProvider>
          </Router>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
