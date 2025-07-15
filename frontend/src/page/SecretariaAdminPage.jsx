import React, { useEffect, useState, useMemo } from 'react';
import apiClient from '../services/api';
import { TextField, Button, Card, CardContent, Typography, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Snackbar, Tooltip, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel } from '@mui/material';


const SecretariaAdminPage = () => {
  // Snackbars
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });
  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });
  
  const [secretarias, setSecretarias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Formulario de nueva secretaría/dependencia
  const [newSec, setNewSec] = useState({ nombre: '', codigo: '', descripcion: '', idPadre: '', orden: '', activo: true });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  // Estado y lógica para edición
  const [editingSec, setEditingSec] = useState(null);
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Estado para dependencias existentes (para el select de padre)
  const [allDeps, setAllDeps] = useState([]);

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

  // Cargar todas las dependencias para el select de padre
  const fetchAllDeps = async () => {
    try {
      const { data } = await apiClient.get('/dependencies');
      setAllDeps(data);
    } catch (err) {
      // No hacer nada especial
    }
  };

  useEffect(() => {
    fetchSecretarias();
    fetchAllDeps();
  }, []);

  // Calcular nivel automáticamente
  const getNivel = (idPadre) => {
    if (!idPadre) return 1;
    const padre = allDeps.find(d => d._id === idPadre);
    return padre ? (padre.nivel || 1) + 1 : 1;
  };

  const handleCreateSec = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const payload = {
        ...newSec,
        idPadre: newSec.idPadre === '' ? null : newSec.idPadre,
        nivel: getNivel(newSec.idPadre),
        orden: newSec.orden ? Number(newSec.orden) : undefined,
        activo: newSec.activo !== false,
      };
      await apiClient.post('/dependencies', payload);
      setNewSec({ nombre: '', codigo: '', descripcion: '', idPadre: '', orden: '', activo: true });
      fetchSecretarias();
      fetchAllDeps();
      showSnackbar('Dependencia creada correctamente', 'success');
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Error al crear dependencia');
      showSnackbar(err.response?.data?.message || 'Error al crear dependencia', 'error');
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
      const payload = {
        ...editingSec,
        idPadre: editingSec.idPadre === '' ? null : editingSec.idPadre,
        nivel: getNivel(editingSec.idPadre),
        orden: editingSec.orden ? Number(editingSec.orden) : undefined,
        activo: editingSec.activo !== false,
      };
      await apiClient.put(`/dependencies/${editingSec._id}`, payload);
      setEditingSec(null);
      fetchSecretarias();
      fetchAllDeps();
      showSnackbar('Dependencia editada correctamente', 'success');
    } catch (err) {
      setEditError(err.response?.data?.message || 'Error al editar dependencia');
      showSnackbar(err.response?.data?.message || 'Error al editar dependencia', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const SecretariaRow = React.memo(({ sec, onEdit, onDelete }) => (
    <TableRow key={sec._id}>
      <TableCell>{sec.nombre}</TableCell>
      <TableCell>{sec.codigo}</TableCell>
      <TableCell>{sec.descripcion}</TableCell>
      <TableCell>{sec.activo ? 'Sí' : 'No'}</TableCell>
      <TableCell>
        <Tooltip title="Editar"><span><Button size="small" variant="outlined" sx={{ mr: 1 }} onClick={() => onEdit(sec)}>Editar</Button></span></Tooltip>
        <Tooltip title="Eliminar"><span><Button size="small" variant="outlined" color="error" onClick={() => onDelete(sec._id)}>Eliminar</Button></span></Tooltip>
      </TableCell>
    </TableRow>
  ));

  const secretariasMemo = useMemo(() => secretarias, [secretarias]);

  return (
    <Box maxWidth={900} mx="auto" p={3}>
      <Typography variant="h4" gutterBottom>Gestión de Secretarías</Typography>
      {loading && <Box display="flex" justifyContent="center" my={4}><CircularProgress /></Box>}
      {error && <Alert severity="error">{error}</Alert>}

      {/* Formulario para crear secretaría */}
      <Card className="mb-6 mt-4">
        <CardContent>
          <Typography variant="h6" gutterBottom>Agregar dependencia</Typography>
          <Box component="form" onSubmit={handleCreateSec} display="flex" flexWrap="wrap" gap={2} alignItems="center">
            <TextField required label="Nombre de la dependencia" value={newSec.nombre} onChange={e => setNewSec({ ...newSec, nombre: e.target.value })} size="small" />
            <TextField required label="ID" value={newSec.codigo} onChange={e => setNewSec({ ...newSec, codigo: e.target.value })} size="small" />
            {/* <TextField label="Descripción" value={newSec.descripcion} onChange={e => setNewSec({ ...newSec, descripcion: e.target.value })} size="small" /> */}
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Padre</InputLabel>
              <Select
                value={newSec.idPadre || ''}
                label="Padre"
                onChange={e => setNewSec({ ...newSec, idPadre: e.target.value })}
              >
                <MenuItem value="">(Raíz / Secretaría principal)</MenuItem>
                {allDeps.map(dep => (
                  <MenuItem key={dep._id} value={dep._id}>{dep.nombre} ({dep.codigo})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Orden"
              type="number"
              value={newSec.orden || ''}
              onChange={e => setNewSec({ ...newSec, orden: e.target.value })}
              size="small"
            />
            <FormControlLabel
              control={<Checkbox checked={newSec.activo !== false} onChange={e => setNewSec({ ...newSec, activo: e.target.checked })} />}
              label="Activo"
            />
            <Button type="submit" variant="contained" color="primary" disabled={creating} sx={{ minWidth: 120 }}>
              {creating ? <CircularProgress size={20} color="inherit" /> : 'Agregar'}
            </Button>
            {createError && <Alert severity="error">{createError}</Alert>}
          </Box>
        </CardContent>
      </Card>

      {/* Formulario de edición de secretaría */}
      {editingSec && (
        <Card className="mb-6 mt-4 bg-gray-50">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Editar dependencia</Typography>
            <Box component="form" onSubmit={handleEditSec} display="flex" flexWrap="wrap" gap={2} alignItems="center">
              <TextField required label="Nombre" value={editingSec.nombre} onChange={e => setEditingSec({ ...editingSec, nombre: e.target.value })} size="small" />
              <TextField required label="Código" value={editingSec.codigo} onChange={e => setEditingSec({ ...editingSec, codigo: e.target.value })} size="small" />
              <TextField label="Descripción" value={editingSec.descripcion} onChange={e => setEditingSec({ ...editingSec, descripcion: e.target.value })} size="small" />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Padre</InputLabel>
                <Select
                  value={editingSec.idPadre || ''}
                  label="Padre"
                  onChange={e => setEditingSec({ ...editingSec, idPadre: e.target.value })}
                >
                  <MenuItem value="">(Raíz / Secretaría principal)</MenuItem>
                  {allDeps.filter(dep => dep._id !== editingSec._id).map(dep => (
                    <MenuItem key={dep._id} value={dep._id}>{dep.nombre} ({dep.codigo})</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Orden"
                type="number"
                value={editingSec.orden || ''}
                onChange={e => setEditingSec({ ...editingSec, orden: e.target.value })}
                size="small"
                sx={{ width: 100 }}
              />
              <FormControlLabel
                control={<Checkbox checked={editingSec.activo !== false} onChange={e => setEditingSec({ ...editingSec, activo: e.target.checked })} />}
                label="Activo"
              />
              <TextField
                label="Nivel"
                value={getNivel(editingSec.idPadre)}
                size="small"
                InputProps={{ readOnly: true }}
                sx={{ width: 80 }}
              />
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
                <TableCell>Activo</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {secretariasMemo.map(sec => (
                <SecretariaRow
                  key={sec._id}
                  sec={sec}
                  onEdit={setEditingSec}
                  onDelete={handleDeleteSec}
                />
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
