// ARCHIVO: src/pages/LoginPage.js (Modificado)


import React, { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Card, CardContent, Typography, CircularProgress, Alert, Box, Avatar, IconButton, Tooltip } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme } from '../context/ThemeContext.jsx';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      navigate('/organigrama'); // Redirige al organigrama tras login
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isDarkMode
        ? 'linear-gradient(135deg, #232526 0%, #414345 100%)'
        : 'linear-gradient(135deg, #e3eafc 0%, #f5f7fa 100%)',
      position: 'relative',
    }}>
      {/* Selector de tema arriba a la derecha */}
      <Box sx={{ position: 'absolute', top: 24, right: 32 }}>
        <Tooltip title={isDarkMode ? 'Tema claro' : 'Tema oscuro'}>
          <IconButton color="primary" onClick={toggleTheme}>
            {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Tooltip>
      </Box>
      <Card sx={{
        width: 370,
        p: 3,
        borderRadius: 4,
        boxShadow: 6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
          <LockOutlinedIcon fontSize="large" />
        </Avatar>
        <Typography variant="h5" align="center" fontWeight={700} gutterBottom>
          Iniciar Sesión
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" mb={2}>
          Accede al sistema de análisis de dotación
        </Typography>
        <Box component="form" onSubmit={handleLogin} sx={{ width: '100%', mt: 1 }}>
          <TextField
            label="Usuario"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            fullWidth
            margin="normal"
          />
          <TextField
            label="Contraseña"
            type="password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            margin="normal"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            fullWidth
            size="large"
            sx={{ mt: 2, mb: 1, py: 1.5, fontWeight: 600, fontSize: 18 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar Sesión'}
          </Button>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Box>
      </Card>
    </Box>
  );
};

export default LoginPage;
