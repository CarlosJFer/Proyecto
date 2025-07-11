import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import LoginPage from './page/LoginPage.jsx';
import DashboardPage from './page/DashboardPage.jsx';
import AdminPage from './page/AdminPage.jsx';
import UserAdminPage from './page/UserAdminPage.jsx';
import SecretariaAdminPage from './page/SecretariaAdminPage.jsx';
import Navbar from './components/Navbar.jsx';
import ChangePasswordPage from './page/ChangePasswordPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';


function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <main>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            {/* Rutas Protegidas */}
            <Route element={<ProtectedRoute />}> 
              <Route path="/dashboard/:secretariaId" element={<DashboardPage />} />
              <Route path="/admin/secretarias" element={<SecretariaAdminPage />} />
              <Route path="/change-password" element={<ChangePasswordPage />} />
            </Route>
            {/* Ruta Protegida solo para Admins */}
            <Route element={<ProtectedRoute adminOnly={true} />}>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/users" element={<UserAdminPage />} />
            </Route>
            <Route path="/" element={<LoginPage />} />
          </Routes>
        </main>
      </AuthProvider>
    </Router>
  );
}

export default App;
