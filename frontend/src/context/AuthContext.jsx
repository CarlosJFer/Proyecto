import React, { createContext, useState, useEffect } from 'react';
import apiClient from '../services/api'; // Usamos nuestro cliente API centralizado

// 1. Creamos el contexto
const AuthContext = createContext();

// 2. Creamos el proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 3. Al cargar, verificamos si hay un usuario en localStorage
  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
    setLoading(false);
  }, []);

  // 4. Función de Login (solo maneja estado, no navegación)
  const login = async (username, password) => {
    try {
      const { data } = await apiClient.post('/auth/login', { username, password });
      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      return data;
    } catch (error) {
      let msg = 'Error al iniciar sesión';
      if (error.response) {
        if (error.response.status === 401 && error.response.data && error.response.data.message) {
          msg = error.response.data.message;
        } else if (error.response.data && error.response.data.message) {
          msg = error.response.data.message;
        }
      } else if (error.message) {
        msg = error.message;
      }
      // Evitar que el error se propague como excepción no controlada
      return Promise.reject(msg);
    }
  };

  // 5. Función de Logout
  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
    // La navegación debe hacerse en el componente, no aquí
  };

  // 6. Proveemos el estado y las funciones a los componentes hijos
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);

export default AuthContext;
