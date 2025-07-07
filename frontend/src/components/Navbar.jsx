import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext'; // 1. Importar el contexto
import apiClient from '../services/api'; // 2. Importar nuestro cliente API

const Navbar = () => {
  const [secretarias, setSecretarias] = useState([]);
  const { user, logout } = useContext(AuthContext); // 3. Usar el estado y las funciones del contexto

  useEffect(() => {
    // 4. Función para cargar las secretarías desde la API
    const fetchSecretarias = async () => {
      try {
        const { data } = await apiClient.get('/analytics/secretarias');
        setSecretarias(data); // La API devuelve un array con { id, nombre, ... }
      } catch (error) {
        console.error('Error al cargar las secretarías:', error);
        setSecretarias([]); // En caso de error, dejamos la lista vacía
      }
    };

    // 5. Solo intentamos cargar las secretarías si hay un usuario logueado
    if (user) {
      fetchSecretarias();
    } else {
      setSecretarias([]); // Si el usuario cierra sesión, limpiamos la lista
    }
  }, [user]); // 6. El efecto se ejecuta cada vez que el estado del 'user' cambia

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', background: '#333', color: 'white', padding: '10px 20px', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <Link to={user ? `/dashboard/default` : "/login"} style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>
          Análisis de Dotación
        </Link>
        {/* El menú de secretarías ahora se renderiza con datos reales */}
        {user && secretarias.map(sec => (
          <Link key={sec.id} to={`/dashboard/${sec.id}`} style={{ color: 'white', textDecoration: 'none' }}>
            {sec.nombre}
          </Link>
        ))}
      </div>
      <div>
        {user ? (
          <>
            <span style={{ marginRight: '15px' }}>Hola, {user.username} ({user.role})</span>
            {user.role === 'admin' && <Link to="/admin" style={{ color: 'white', textDecoration: 'none', marginRight: '15px' }}>Admin</Link>}
            {/* 7. Usamos la función logout del contexto */}
            <button onClick={logout}>Salir</button>
          </>
        ) : (
          <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
