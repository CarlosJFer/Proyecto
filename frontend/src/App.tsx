import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { HelmetProvider } from 'react-helmet-async';

// Contextos
import { AuthProvider } from './context/AuthContext.jsx';
import CustomThemeProvider from './context/ThemeContext.jsx';
import DashboardProvider from './context/DashboardContext.jsx';
import NotificationProvider from './context/NotificationContext.jsx';

// Páginas
import LoginPage from './page/LoginPage.jsx';
import DashboardPage from './page/DashboardPage.jsx';
import AdminPage from './page/AdminPage.jsx';
import UserAdminPage from './page/UserAdminPage.jsx';
import SecretariaAdminPage from './page/SecretariaAdminPage.jsx';
import ChangePasswordPage from './page/ChangePasswordPage.jsx';
import ComparisonPage from './page/ComparisonPage.jsx';
import AuditPage from './page/AuditPage.jsx';
import SettingsPage from './page/SettingsPage.jsx';

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
                        <Routes>
                          <Route path="/login" element={<LoginPage />} />
                          
                          {/* Rutas Protegidas para Usuarios */}
                          <Route element={<ProtectedRoute />}> 
                            <Route path="/dashboard/:secretariaId" element={<DashboardPage />} />
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/comparacion" element={<ComparisonPage />} />
                            <Route path="/change-password" element={<ChangePasswordPage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                          </Route>
                          
                          {/* Rutas Protegidas solo para Admins */}
                          <Route element={<ProtectedRoute adminOnly={true} />}>
                            <Route path="/admin" element={<AdminPage />} />
                            <Route path="/admin/users" element={<UserAdminPage />} />
                            <Route path="/admin/secretarias" element={<SecretariaAdminPage />} />
                            <Route path="/admin/audit" element={<AuditPage />} />
                          </Route>
                          
                          {/* Redirección por defecto */}
                          <Route path="/" element={<LoginPage />} />
                        </Routes>
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
