import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import apiClient from '../services/api';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const Navbar = () => {
  const [secretarias, setSecretarias] = useState([]);
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    const fetchSecretarias = async () => {
      try {
        const { data } = await apiClient.get('/analytics/secretarias');
        setSecretarias(data);
      } catch (error) {
        console.error('Error al cargar las secretarías:', error);
        setSecretarias([]);
      }
    };
    if (user) {
      fetchSecretarias();
    } else {
      setSecretarias([]);
    }
  }, [user]);

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
        <Box className="flex flex-row items-center gap-2">
          <IconButton color="inherit" onClick={toggleTheme} title={isDarkMode ? 'Tema claro' : 'Tema oscuro'}>
            {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
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
