// ARCHIVO: src/pages/LoginPage.js (Modificado)

import React, { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext'; // Importamos el contexto

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext); // Usamos la función login del contexto

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(username, password); // Llamamos a la función del contexto
    } catch (err) {
      setError(err); // El error ya viene formateado desde el contexto
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input placeholder="Usuario" onChange={(e) => setUsername(e.target.value)} />
      <input placeholder="Contraseña" type="password" onChange={(e) => setPassword(e.target.value)} />
      <button type="submit" disabled={loading}>{loading ? 'Cargando...' : 'Iniciar Sesión'}</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}

export default LoginPage;
