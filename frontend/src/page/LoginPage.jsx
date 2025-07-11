// ARCHIVO: src/pages/LoginPage.js (Modificado)


import React, { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Card, CardContent, Typography, CircularProgress, Alert } from '@mui/material';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      navigate('/dashboard/default'); // Redirige al dashboard tras login
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm shadow-lg">
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            Iniciar Sesión
          </Typography>
          <form onSubmit={handleLogin} className="flex flex-col gap-4 mt-2">
            <TextField
              label="Usuario"
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
            <TextField
              label="Contraseña"
              type="password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              className="h-12"
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar Sesión'}
            </Button>
            {error && <Alert severity="error">{error}</Alert>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;
