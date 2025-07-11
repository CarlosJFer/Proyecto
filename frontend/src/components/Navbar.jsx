import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext.jsx';
import apiClient from '../services/api';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

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
    <AppBar position="static" color="primary" enableColorOnDark>
      <Toolbar className="flex flex-row justify-between">
        <Box className="flex flex-row gap-4 items-center">
          <Typography variant="h6" component={Link} to={user ? `/dashboard/default` : "/login"} sx={{ color: 'inherit', textDecoration: 'none', fontWeight: 'bold' }}>
            Análisis de Dotación
          </Typography>
          {user && secretarias.map(sec => (
            <Button key={sec.id} component={Link} to={`/dashboard/${sec.id}`} color="inherit">
              {sec.nombre}
            </Button>
          ))}
        </Box>
        <Box>
          {user ? (
            <>
              <Typography component="span" sx={{ mr: 2 }}>
                Hola, {user.username} ({user.role})
              </Typography>
              {user.role === 'admin' && (
                <>
                  <Button component={Link} to="/admin" color="inherit">Admin</Button>
                  <Button component={Link} to="/admin/users" color="inherit">Usuarios</Button>
                  <Button component={Link} to="/admin/secretarias" color="inherit">Secretarías</Button>
                </>
              )}
              <Button onClick={logout} color="inherit">Salir</Button>
            </>
          ) : (
            <Button component={Link} to="/login" color="inherit">Login</Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
