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
import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import { useNotifications } from '../context/NotificationContext.jsx';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';

const Navbar = () => {
  const [secretarias, setSecretarias] = useState([]);
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useTheme();
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleMarkAll = () => {
    markAllAsRead();
    handleClose();
  };

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
      <Toolbar sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Box className="flex flex-row gap-4 items-center">
          <Typography variant="h6" sx={{ color: 'inherit', textDecoration: 'none', fontWeight: 'bold' }}>
            Análisis de Dotación
          </Typography>
        </Box>
        <Box className="flex flex-row items-center gap-2" sx={{ marginLeft: 'auto' }}>
          {/* Botón Inicio (Organigrama) */}
          {user && (
            <Button component={Link} to="/organigrama" color="inherit">Inicio</Button>
          )}
          {/* Botón Dashboard */}
          {user && (
            <Button component={Link} to={user.role === 'admin' ? '/dashboard/default' : '/dashboard/default'} color="inherit">Dashboard</Button>
          )}
          {/* Botón Panel de administración (solo admin) */}
          {user && user.role === 'admin' && (
            <Button component={Link} to="/admin" color="inherit">Panel de administración</Button>
          )}
          {user ? (
            <>
              <Typography component="span" sx={{ mr: 1, ml: 2 }}>
                Hola, {user.username} ({user.role})
              </Typography>
              {/* Campanita de notificaciones */}
              <Tooltip title={unreadCount > 0 ? `Tienes ${unreadCount} notificaciones nuevas` : 'Sin notificaciones nuevas'}>
                <IconButton color="inherit" onClick={handleOpen}>
                  <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Menu anchorEl={anchorEl} open={open} onClose={handleClose} PaperProps={{ sx: { minWidth: 320 } }}>
                <MenuItem disabled divider>
                  <strong>Notificaciones</strong>
                  {unreadCount > 0 && (
                    <Button size="small" sx={{ ml: 'auto' }} onClick={handleMarkAll}>Marcar todas como leídas</Button>
                  )}
                </MenuItem>
                {notifications.length === 0 && (
                  <MenuItem disabled>No tienes notificaciones</MenuItem>
                )}
                {notifications.slice(0, 5).map((n) => (
                  <MenuItem key={n.id} onClick={() => { markAsRead(n.id); handleClose(); }} selected={!n.read} sx={{ whiteSpace: 'normal', fontWeight: n.read ? 'normal' : 'bold' }}>
                    <div>
                      <div>{n.title || 'Notificación'}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{n.message}</div>
                      {!n.read && <span style={{ color: '#1976d2', fontSize: 11 }}>Nueva</span>}
                    </div>
                  </MenuItem>
                ))}
                {notifications.length > 5 && (
                  <MenuItem disabled sx={{ textAlign: 'center' }}>Ver más en el panel de notificaciones</MenuItem>
                )}
                {unreadCount > 0 && (
                  <MenuItem divider disabled sx={{ color: '#388e3c', fontWeight: 'bold', textAlign: 'center' }}>
                    Se han realizado cambios importantes en el dashboard.
                  </MenuItem>
                )}
              </Menu>
              {/* Selector de tema */}
              <IconButton color="inherit" onClick={toggleTheme} title={isDarkMode ? 'Tema claro' : 'Tema oscuro'}>
                {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
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
