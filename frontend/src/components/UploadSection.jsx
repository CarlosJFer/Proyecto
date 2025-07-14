import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Button, LinearProgress, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText } from '@mui/material';
import apiClient from '../services/api';

const UploadSection = () => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleFileChange = (e) => {
        setFiles(Array.from(e.target.files));
        setError('');
        setSuccess('');
    };

    const handleUpload = async () => {
        setConfirmOpen(false);
        setUploading(true);
        setError('');
        setSuccess('');
        setUploadProgress({});
        const formData = new FormData();
        files.forEach(file => {
            formData.append('archivo', file);
        });
        try {
            await apiClient.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    // Progreso global (no por archivo)
                    setUploadProgress({ total: Math.round((progressEvent.loaded * 100) / progressEvent.total) });
                },
            }).then(res => {
                const resultados = res.data.resultados || [];
                let msg = resultados.map(r => {
                    if (r.error) return `❌ ${r.archivo}: ${r.error}`;
                    return `✔️ ${r.archivo} (${r.secretaria || ''}): ${r.totalRegistros} registros procesados.`;
                }).join('\n');
                setSuccess(msg);
                setSnackbar({ open: true, message: msg, severity: 'success' });
            });
            setFiles([]);
        } catch (err) {
            let errorMessage = err.response?.data?.message || 'Error al subir los archivos.';
            setError(errorMessage);
            setSnackbar({ open: true, message: errorMessage, severity: 'error' });
        }
        setUploading(false);
    };

    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });
    const handleOpenConfirm = () => setConfirmOpen(true);
    const handleCloseConfirm = () => setConfirmOpen(false);

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>Cargar y Procesar Archivos de Dotación</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Sube uno o varios archivos .xls o .xlsx para actualizar los datos de análisis de todas las secretarías.
                </Typography>
                <Box mt={2} display="flex" alignItems="center" gap={2}>
                    <Button variant="outlined" component="label">
                        Seleccionar Archivos
                        <input type="file" hidden accept=".xls,.xlsx" multiple onChange={handleFileChange} />
                    </Button>
                    {files.length > 0 && (
                        <Typography>{files.length} archivo(s) seleccionado(s)</Typography>
                    )}
                </Box>
                {files.length > 0 && (
                    <List dense>
                        {files.map((file, idx) => (
                            <ListItem key={file.name}>
                                <ListItemText primary={file.name} />
                                {uploading && (
                                    <Box width={120} ml={2}>
                                        <LinearProgress variant="determinate" value={uploadProgress[file.name] || 0} />
                                        <Typography variant="caption">{uploadProgress[file.name] || 0}%</Typography>
                                    </Box>
                                )}
                            </ListItem>
                        ))}
                    </List>
                )}
                <Box mt={2}>
                    <Button variant="contained" onClick={handleOpenConfirm} disabled={files.length === 0 || uploading}>
                        {uploading ? 'Procesando...' : 'Subir y Procesar'}
                    </Button>
                </Box>
                <Dialog open={confirmOpen} onClose={handleCloseConfirm}>
                    <DialogTitle>¿Confirmar carga?</DialogTitle>
                    <DialogContent>
                        <Typography>¿Estás seguro que deseas cargar {files.length} archivo(s)?</Typography>
                        <List dense>
                            {files.map((file) => (
                                <ListItem key={file.name}>
                                    <ListItemText primary={file.name} />
                                </ListItem>
                            ))}
                        </List>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseConfirm}>Cancelar</Button>
                        <Button onClick={handleUpload} variant="contained" color="primary">Confirmar</Button>
                    </DialogActions>
                </Dialog>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
                <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </CardContent>
        </Card>
    );
};

export default UploadSection; 