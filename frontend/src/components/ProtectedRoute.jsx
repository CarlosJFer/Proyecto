import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext.jsx';

const ProtectedRoute = ({ adminOnly = false }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    // Si no hay usuario, redirige a la página de login
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    // Si la ruta es solo para admin y el usuario no lo es, redirige
    return <Navigate to="/dashboard/default" replace />;
  }

  // Si todo está bien, muestra el contenido de la ruta
  return <Outlet />;
};

export default ProtectedRoute;
