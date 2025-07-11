import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';
import { TextField, Button, Card, CardContent, Typography, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Snackbar, Tooltip } from '@mui/material';


const SecretariaAdminPage = () => {
  // Snackbars
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });
  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });
  
  const [secretarias, setSecretarias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Formulario de nueva secretaría
  const [newSec, setNewSec] = useState({ nombre: '', codigo: '', descripcion: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  // Estado y lógica para edición
  const [editingSec, setEditingSec] = useState(null);
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchSecretarias = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get('/dependencies');
      setSecretarias(data.filter(s => s.nivel === 1));
    } catch (err) {
      setError('Error al cargar secretarías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecretarias();
  }, []);

  const handleCreateSec = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await apiClient.post('/dependencies', newSec);
      setNewSec({ nombre: '', codigo: '', descripcion: '' });
      fetchSecretarias();
      showSnackbar('Secretaría creada correctamente', 'success');
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Error al crear secretaría');
      showSnackbar(err.response?.data?.message || 'Error al crear secretaría', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSec = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta secretaría?')) return;
    try {
      await apiClient.delete(`/dependencies/${id}`);
      fetchSecretarias();
      showSnackbar('Secretaría eliminada', 'success');
    } catch (err) {
      showSnackbar('Error al eliminar secretaría', 'error');
    }
  };

  const handleEditSec = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    setEditError('');
    try {
      await apiClient.put(`/dependencies/${editingSec._id}`, editingSec);
      setEditingSec(null);
      fetchSecretarias();
      showSnackbar('Secretaría editada correctamente', 'success');
    } catch (err) {
      setEditError(err.response?.data?.message || 'Error al editar secretaría');
      showSnackbar(err.response?.data?.message || 'Error al editar secretaría', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <Box maxWidth={900} mx="auto" p={3}>
      <Typography variant="h4" gutterBottom>Gestión de Secretarías</Typography>
      {loading && <Box display="flex" justifyContent="center" my={4}><CircularProgress /></Box>}
      {error && <Alert severity="error">{error}</Alert>}

      {/* Formulario para crear secretaría */}
      <Card className="mb-6 mt-4">
        <CardContent>
          <Typography variant="h6" gutterBottom>Crear nueva secretaría</Typography>
          <Box component="form" onSubmit={handleCreateSec} display="flex" flexWrap="wrap" gap={2} alignItems="center">
            <TextField required label="Nombre" value={newSec.nombre} onChange={e => setNewSec({ ...newSec, nombre: e.target.value })} size="small" />
            <TextField required label="Código" value={newSec.codigo} onChange={e => setNewSec({ ...newSec, codigo: e.target.value })} size="small" />
            <TextField label="Descripción" value={newSec.descripcion} onChange={e => setNewSec({ ...newSec, descripcion: e.target.value })} size="small" />
            <Button type="submit" variant="contained" color="primary" disabled={creating} sx={{ minWidth: 120 }}>
              {creating ? <CircularProgress size={20} color="inherit" /> : 'Crear Secretaría'}
            </Button>
            {createError && <Alert severity="error">{createError}</Alert>}
          </Box>
        </CardContent>
      </Card>

      {/* Formulario de edición de secretaría */}
      {editingSec && (
        <Card className="mb-6 mt-4 bg-gray-50">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Editar secretaría</Typography>
            <Box component="form" onSubmit={handleEditSec} display="flex" flexWrap="wrap" gap={2} alignItems="center">
              <TextField required label="Nombre" value={editingSec.nombre} onChange={e => setEditingSec({ ...editingSec, nombre: e.target.value })} size="small" />
              <TextField required label="Código" value={editingSec.codigo} onChange={e => setEditingSec({ ...editingSec, codigo: e.target.value })} size="small" />
              <TextField label="Descripción" value={editingSec.descripcion} onChange={e => setEditingSec({ ...editingSec, descripcion: e.target.value })} size="small" />
              <Button type="submit" variant="contained" color="primary" disabled={savingEdit} sx={{ minWidth: 120 }}>
                {savingEdit ? <CircularProgress size={20} color="inherit" /> : 'Guardar'}
              </Button>
              <Button type="button" variant="outlined" color="secondary" onClick={() => setEditingSec(null)}>Cancelar</Button>
              {editError && <Alert severity="error">{editError}</Alert>}
            </Box>
          </CardContent>
        </Card>
      )}

      {!loading && !error && (
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Código</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {secretarias.map(sec => (
                <TableRow key={sec._id}>
                  <TableCell>{sec.nombre}</TableCell>
                  <TableCell>{sec.codigo}</TableCell>
                  <TableCell>{sec.descripcion}</TableCell>
                  <TableCell>
                    <Tooltip title="Editar secretaría"><span><Button size="small" variant="outlined" sx={{ mr: 1 }} onClick={() => setEditingSec(sec)}>Editar</Button></span></Tooltip>
                    <Tooltip title="Eliminar secretaría"><span><Button size="small" variant="outlined" color="error" onClick={() => handleDeleteSec(sec._id)}>Eliminar</Button></span></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
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
    </Box>
  );
};

export default SecretariaAdminPage;
