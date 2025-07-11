import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';
import { TextField, Button, Select, MenuItem, Card, CardContent, Typography, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Snackbar, Tooltip } from '@mui/material';


const UserAdminPage = () => {
  // Snackbars
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });
  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Formulario de nuevo usuario
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'user' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  // Estado y lógica para edición
  const [editingUser, setEditingUser] = useState(null);
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  // Estado para cambio de contraseña admin->usuario
  const [changingPasswordUserId, setChangingPasswordUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [changePassError, setChangePassError] = useState('');
  const [changePassSuccess, setChangePassSuccess] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get('/auth/users');
      setUsers(data);
    } catch (err) {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await apiClient.post('/auth/users', newUser);
      setNewUser({ username: '', email: '', password: '', role: 'user' });
      fetchUsers();
      showSnackbar('Usuario creado correctamente', 'success');
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Error al crear usuario');
      showSnackbar(err.response?.data?.message || 'Error al crear usuario', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este usuario?')) return;
    try {
      await apiClient.delete(`/auth/users/${userId}`);
      fetchUsers();
      showSnackbar('Usuario eliminado', 'success');
    } catch (err) {
      showSnackbar('Error al eliminar usuario', 'error');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    setEditError('');
    try {
      await apiClient.put(`/auth/users/${editingUser._id}`, editingUser);
      setEditingUser(null);
      fetchUsers();
      showSnackbar('Usuario editado correctamente', 'success');
    } catch (err) {
      setEditError(err.response?.data?.message || 'Error al editar usuario');
      showSnackbar(err.response?.data?.message || 'Error al editar usuario', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Función para cambiar contraseña de usuario (admin)
  const handleChangeUserPassword = async (e) => {
    e.preventDefault();
    setChangingPass(true);
    setChangePassError('');
    setChangePassSuccess('');
    if (!newPassword || newPassword.length < 6) {
      setChangePassError('La nueva contraseña debe tener al menos 6 caracteres');
      setChangingPass(false);
      return;
    }
    try {
      await apiClient.put(`/auth/users/${changingPasswordUserId}/change-password`, { newPassword });
      setChangePassSuccess('Contraseña actualizada');
      showSnackbar('Contraseña actualizada', 'success');
      setNewPassword('');
      setChangingPasswordUserId(null);
      fetchUsers();
    } catch (err) {
      setChangePassError(err.response?.data?.message || 'Error al cambiar contraseña');
      showSnackbar(err.response?.data?.message || 'Error al cambiar contraseña', 'error');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <Box maxWidth={900} mx="auto" p={3}>
      <Typography variant="h4" gutterBottom>Gestión de Usuarios</Typography>
      {loading && <Box display="flex" justifyContent="center" my={4}><CircularProgress /></Box>}
      {error && <Alert severity="error">{error}</Alert>}

      {/* Formulario para crear usuario */}
      <Card className="mb-6 mt-4">
        <CardContent>
          <Typography variant="h6" gutterBottom>Crear nuevo usuario</Typography>
          <Box component="form" onSubmit={handleCreateUser} display="flex" flexWrap="wrap" gap={2} alignItems="center">
            <TextField required label="Usuario" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} size="small" />
            <TextField required label="Email" type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} size="small" />
            <TextField required label="Contraseña" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} size="small" />
            <Select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} size="small">
              <MenuItem value="user">Usuario</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
            <Button type="submit" variant="contained" color="primary" disabled={creating} sx={{ minWidth: 120 }}>
              {creating ? <CircularProgress size={20} color="inherit" /> : 'Crear Usuario'}
            </Button>
            {createError && <Alert severity="error">{createError}</Alert>}
          </Box>
        </CardContent>
      </Card>

      {/* Formulario de edición de usuario */}
      {editingUser && (
        <Card className="mb-6 mt-4 bg-gray-50">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Editar usuario</Typography>
            <Box component="form" onSubmit={handleEditUser} display="flex" flexWrap="wrap" gap={2} alignItems="center">
              <TextField required label="Usuario" value={editingUser.username} onChange={e => setEditingUser({ ...editingUser, username: e.target.value })} size="small" />
              <TextField required label="Email" type="email" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} size="small" />
              <Select value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })} size="small">
                <MenuItem value="user">Usuario</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
              <Button type="submit" variant="contained" color="primary" disabled={savingEdit} sx={{ minWidth: 120 }}>
                {savingEdit ? <CircularProgress size={20} color="inherit" /> : 'Guardar'}
              </Button>
              <Button type="button" variant="outlined" color="secondary" onClick={() => setEditingUser(null)}>Cancelar</Button>
              {editError && <Alert severity="error">{editError}</Alert>}
            </Box>
          </CardContent>
        </Card>
      )}

      {!loading && !error && (
        <>
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow key={user._id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Tooltip title="Editar usuario"><span><Button size="small" variant="outlined" sx={{ mr: 1 }} onClick={() => setEditingUser(user)}>Editar</Button></span></Tooltip>
                  <Tooltip title="Cambiar contraseña"><span><Button size="small" variant="outlined" color="info" sx={{ mr: 1 }} onClick={() => setChangingPasswordUserId(user._id)}>Cambiar contraseña</Button></span></Tooltip>
                  <Tooltip title="Eliminar usuario"><span><Button size="small" variant="outlined" color="error" onClick={() => handleDeleteUser(user._id)}>Eliminar</Button></span></Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
          {/* Formulario de cambio de contraseña admin->usuario */}
          {changingPasswordUserId && (
            <Card className="mt-4 bg-gray-50">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>Nueva contraseña para el usuario</Typography>
                <Box component="form" onSubmit={handleChangeUserPassword} display="flex" flexWrap="wrap" gap={2} alignItems="center">
                  <TextField type="password" label="Nueva contraseña" value={newPassword} onChange={e => setNewPassword(e.target.value)} required size="small" />
                  <Button type="submit" variant="contained" color="primary" disabled={changingPass} sx={{ minWidth: 120 }}>
                    {changingPass ? <CircularProgress size={20} color="inherit" /> : 'Cambiar'}
                  </Button>
                  <Button type="button" variant="outlined" color="secondary" onClick={() => { setChangingPasswordUserId(null); setNewPassword(''); setChangePassError(''); setChangePassSuccess(''); }}>Cancelar</Button>
                  {changePassError && <Alert severity="error">{changePassError}</Alert>}
                  {changePassSuccess && <Alert severity="success">{changePassSuccess}</Alert>}
                </Box>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
};

export default UserAdminPage;