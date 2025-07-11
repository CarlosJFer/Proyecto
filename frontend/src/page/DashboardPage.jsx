// ARCHIVO: src/pages/DashboardPage.js (Modificado)


import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../services/api';
import CustomBarChart from '../components/BarChart.jsx';
import CustomPieChart from '../components/PieChart.jsx';
import { Box, Typography, Card, CardContent, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const DashboardPage = () => {
  const { secretariaId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Si el ID es "default", no cargamos nada.
    if (secretariaId === 'default') {
      setData(null);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // 2. Usamos apiClient para llamar al endpoint real. El token se añade automáticamente.
        const response = await apiClient.get(`/analytics/secretarias/${secretariaId}`);
        setData(response.data); // 3. Guardamos los datos reales en el estado
      } catch (err) {
        setError('Error al cargar los datos de la secretaría.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [secretariaId]); // Se ejecuta cada vez que cambia el secretariaId en la URL

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  return (
    <Box maxWidth={1200} mx="auto" p={3}>
      {/* Si es la página por defecto, mostramos un mensaje de bienvenida */}
      {!data && secretariaId === 'default' && (
        <Typography variant="h4" align="center" color="text.secondary">Bienvenido, por favor selecciona una secretaría para ver el análisis.</Typography>
      )}

      {/* Si hay datos, mostramos el dashboard */}
      {data && (
        <>
          <Typography variant="h4" gutterBottom> Análisis para: {data.secretaria.nombre} </Typography>
          <Card className="mb-6 mt-4 bg-gray-50">
            <CardContent>
              <Typography variant="h6" gutterBottom>Resumen General</Typography>
              <Box display="flex" gap={6} flexWrap="wrap">
                <Box>
                  <Typography><strong>Total de Agentes:</strong> {data.resumen.totalAgentes}</Typography>
                  <Typography><strong>Masa Salarial:</strong> ${data.resumen.masaSalarial.toLocaleString('es-AR')}</Typography>
                  <Typography><strong>Sueldo Promedio:</strong> ${data.resumen.sueldoPromedio.toLocaleString('es-AR')}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Última actualización: {new Date(data.secretaria.ultimaActualizacion).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Gráficos principales */}
          <Box display="flex" gap={6} flexWrap="wrap" justifyContent="space-between">
            {/* Gráfico de barras: Distribución por tipo de contratación */}
            <Box flex={1} minWidth={350}>
              <CustomBarChart
                data={data.analisis.contratacion}
                xKey="tipo"
                barKey="cantidad"
                title="Distribución por Contratación"
              />
            </Box>
            {/* Gráfico de torta: Distribución por género (si existe) */}
            {data.analisis.genero && Array.isArray(data.analisis.genero) && data.analisis.genero.length > 0 && (
              <Box flex={1} minWidth={350}>
                <CustomPieChart
                  data={data.analisis.genero}
                  dataKey="cantidad"
                  nameKey="genero"
                  title="Distribución por Género"
                />
              </Box>
            )}
          </Box>

          {/* Otros gráficos: Antigüedad, agrupaciones, etc. */}
          {data.analisis.antiguedad && Array.isArray(data.analisis.antiguedad) && data.analisis.antiguedad.length > 0 && (
            <Box mt={4}>
              <CustomBarChart
                data={data.analisis.antiguedad}
                xKey="rango"
                barKey="cantidad"
                title="Distribución por Antigüedad"
              />
            </Box>
          )}

          {/* Tabla de detalle por tipo de contratación */}
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>Detalle por Contratación</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Cantidad</TableCell>
                    <TableCell>%</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.analisis.contratacion.map(c => (
                    <TableRow key={c.tipo}>
                      <TableCell>{c.tipo}</TableCell>
                      <TableCell>{c.cantidad}</TableCell>
                      <TableCell>{c.porcentaje}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </>
      )}
    </Box>
  );
}

export default DashboardPage;