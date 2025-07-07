import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import LoginPage from './page/LoginPage.jsx';
import DashboardPage from './page/DashboardPage.jsx';
import AdminPage from './page/AdminPage.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';


function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <main style={{ padding: '20px' }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            {/* Rutas Protegidas */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard/:secretariaId" element={<DashboardPage />} />
            </Route>
            {/* Ruta Protegida solo para Admins */}
            <Route element={<ProtectedRoute adminOnly={true} />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
            <Route path="/" element={<LoginPage />} />
          </Routes>
        </main>
      </AuthProvider>
    </Router>
  );
}

export default App;
