import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Card, CardContent, CircularProgress, Alert, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import apiClient from '../services/api';
import { saveAs } from 'file-saver';

const StatCard = React.memo(({ title, value, color = 'primary.main' }) => (
    <Card sx={{ height: '100%' }}>
        <CardContent>
            <Typography color="text.secondary" gutterBottom>
                {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ color }}>
                {value}
            </Typography>
        </CardContent>
    </Card>
));

const CustomPieChart = React.memo(({ data, dataKey, nameKey, title }) => {
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFF'];
    const chartData = useMemo(() => data, [data]);
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="h6" gutterBottom align="center">{title}</Typography>
                <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={chartData} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={100} label>
                                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </Box>
            </CardContent>
        </Card>
    );
});

const CustomBarChart = React.memo(({ data, xKey, barKey, title }) => {
    const chartData = useMemo(() => data, [data]);
    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom align="center">{title}</Typography>
                <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={xKey} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey={barKey} fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </CardContent>
        </Card>
    );
});

const downloadPDF = async (secretariaId, secretariaNombre) => {
    try {
        const token = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).token : null;
        const response = await fetch(
            `http://localhost:5001/api/analytics/secretarias/${secretariaId}/download`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        if (!response.ok) throw new Error('No se pudo descargar el PDF');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${secretariaNombre}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        alert('Error al descargar el PDF');
    }
};

function toCSV(data) {
    const rows = [];
    // Resumen
    rows.push(['Campo', 'Valor']);
    rows.push(['Secretaría', data.secretaria.nombre]);
    rows.push(['Total de Agentes', data.resumen.totalAgentes]);
    rows.push(['Masa Salarial', data.resumen.masaSalarial]);
    rows.push(['Sueldo Promedio', data.resumen.sueldoPromedio]);
    rows.push(['Versión de Datos', data.metadatos.version]);
    rows.push([]);
    // Análisis por tipo de contratación
    rows.push(['Tipo de Contratación', 'Cantidad', 'Porcentaje']);
    data.analisis.contratacion.forEach(item => {
        rows.push([item.tipo, item.cantidad, item.porcentaje]);
    });
    rows.push([]);
    // Análisis por género
    rows.push(['Género', 'Cantidad', 'Porcentaje']);
    data.analisis.genero.forEach(item => {
        rows.push([item.genero, item.cantidad, item.porcentaje]);
    });
    rows.push([]);
    // Análisis por antigüedad
    rows.push(['Antigüedad', 'Cantidad', 'Porcentaje']);
    data.analisis.antiguedad.forEach(item => {
        rows.push([item.rango, item.cantidad, item.porcentaje]);
    });
    return rows.map(r => r.join(',')).join('\n');
}

const exportCSV = (data) => {
    const csv = toCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${data.secretaria.nombre}_dashboard.csv`);
};

const DashboardPage = () => {
    const { secretariaId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [historial, setHistorial] = useState([]);

    useEffect(() => {
        if (secretariaId === 'default' || !secretariaId) {
            setData(null);
            setLoading(false);
            setHistorial([]);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await apiClient.get(`/analytics/secretarias/${secretariaId}`);
                setData(response.data);
            } catch (err) {
                setError('Error al cargar los datos. Por favor, selecciona otra secretaría o contacta al administrador.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const fetchHistorial = async () => {
            try {
                const response = await apiClient.get(`/analytics/secretarias/${secretariaId}/historial`);
                setHistorial(response.data);
            } catch (err) {
                setHistorial([]);
            }
        };

        fetchData();
        fetchHistorial();
    }, [secretariaId]);

    if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
    if (!data) {
        return (
            <Box textAlign="center" p={5}>
                <Typography variant="h4" color="text.secondary">Bienvenido al Panel de Análisis</Typography>
                <Typography variant="h6" color="text.secondary" mt={2}>Por favor, selecciona una secretaría desde el menú superior para comenzar.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ flexGrow: 1, p: 3, backgroundColor: '#f4f6f8' }}>
            <Typography variant="h4" gutterBottom>
                Dashboard: {data.secretaria.nombre}
            </Typography>
            <Typography variant="caption" color="text.secondary" gutterBottom>
                Última Actualización: {new Date(data.secretaria.ultimaActualizacion).toLocaleString('es-AR')}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 2 }}>
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => downloadPDF(data.secretaria.id || secretariaId, data.secretaria.nombre)}
                    disabled={!data}
                >
                    Descargar PDF
                </Button>
                <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => exportCSV(data)}
                    disabled={!data}
                >
                    Exportar CSV
                </Button>
            </Box>

            <Grid container spacing={3} columns={12} mt={2}>
                <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}>
                    <StatCard title="Total de Agentes" value={data.resumen.totalAgentes} />
                </Grid>
                <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}>
                    <StatCard title="Masa Salarial" value={`$${data.resumen.masaSalarial.toLocaleString('es-AR')}`} />
                </Grid>
                <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}>
                    <StatCard title="Sueldo Promedio" value={`$${Math.round(data.resumen.sueldoPromedio).toLocaleString('es-AR')}`} />
                </Grid>
                <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}>
                    <StatCard title="Versión de Datos" value={data.metadatos.version} color="text.secondary" />
                </Grid>

                <Grid sx={{ gridColumn: { xs: 'span 12', lg: 'span 8' } }}>
                    <CustomBarChart data={data.analisis.contratacion} xKey="tipo" barKey="cantidad" title="Distribución por Tipo de Contratación" />
                </Grid>
                <Grid sx={{ gridColumn: { xs: 'span 12', lg: 'span 4' } }}>
                    <CustomPieChart data={data.analisis.genero} dataKey="cantidad" nameKey="genero" title="Distribución por Género" />
                </Grid>
                <Grid sx={{ gridColumn: 'span 12' }}>
                    <CustomBarChart data={data.analisis.antiguedad} xKey="rango" barKey="cantidad" title="Distribución por Antigüedad" />
                </Grid>
            </Grid>

            {/* Historial de cargas */}
            <Box mt={5}>
                <Typography variant="h6" gutterBottom>Historial de Cargas</Typography>
                {historial.length === 0 ? (
                    <Typography color="text.secondary">No hay historial disponible.</Typography>
                ) : (
                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Versión</TableCell>
                                    <TableCell>Archivo</TableCell>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell>Usuario</TableCell>
                                    <TableCell>Total Registros</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {historial.map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{item.version}</TableCell>
                                        <TableCell>{item.archivo}</TableCell>
                                        <TableCell>{new Date(item.fecha).toLocaleString('es-AR')}</TableCell>
                                        <TableCell>{item.usuario}</TableCell>
                                        <TableCell>{item.totalRegistros}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
        </Box>
    );
};

export default DashboardPage;