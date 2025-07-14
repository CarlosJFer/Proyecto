import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import UploadSection from '../components/UploadSection';

const AdminPage = () => {
    return (
        <Box maxWidth={800} mx="auto" p={3}>
            <Typography variant="h4" gutterBottom>Panel de Administración</Typography>
            <Grid container spacing={3} columns={12}>
                <Grid sx={{ gridColumn: 'span 12' }}>
                    <UploadSection />
                </Grid>
                <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Gestión de Usuarios</Typography>
                            <Button component={Link} to="/admin/users" variant="contained" sx={{mt: 2}}>Ir a Usuarios</Button>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                     <Card>
                        <CardContent>
                            <Typography variant="h6">Gestión de Secretarías</Typography>
                            <Button component={Link} to="/admin/secretarias" variant="contained" sx={{mt: 2}}>Ir a Secretarías</Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminPage;
