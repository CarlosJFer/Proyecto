// ARCHIVO: src/App.js (Modificado)

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider> {/* Envolvemos todo en el proveedor */}
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
