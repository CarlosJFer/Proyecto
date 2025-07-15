import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import BusinessIcon from '@mui/icons-material/Business';

const AdminPage = () => {
    return (
        <Box maxWidth={900} mx="auto" p={3}>
            <Typography variant="h4" gutterBottom align="center">Panel de administración</Typography>
            <Typography variant="subtitle1" color="text.secondary" align="center" mb={4}>
                Accede rápidamente a la gestión de usuarios, carga de archivos y dependencias desde un solo lugar.
            </Typography>
            <Grid container spacing={4} justifyContent="center">
                <Grid item xs={12} md={4}>
                    <Card sx={{ minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <PeopleIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                            <Typography variant="h6">Gestión de Usuarios</Typography>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                                Crea, edita y elimina usuarios del sistema.
                            </Typography>
                            <Button component={Link} to="/admin/users" variant="contained">Ir a Usuarios</Button>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <UploadFileIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                            <Typography variant="h6">Carga de Archivos Excel</Typography>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                                Sube archivos de dotación y actualiza los datos del sistema.
                            </Typography>
                            <Button component={Link} to="/admin/upload" variant="contained">Ir a Carga de Archivos</Button>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <BusinessIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                            <Typography variant="h6">Gestión de Secretarías</Typography>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                                Administra las dependencias jerárquicas del organigrama.
                            </Typography>
                            <Button component={Link} to="/admin/secretarias" variant="contained">Ir a Secretarías</Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminPage;
