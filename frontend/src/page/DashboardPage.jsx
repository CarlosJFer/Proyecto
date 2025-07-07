// ARCHIVO: src/pages/DashboardPage.js (Modificado)

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../services/api'; // 1. Importar nuestro cliente API

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

  if (loading) return <p>Cargando datos del dashboard...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  [cite_start]// 4. Actualizamos el JSX para que coincida con la estructura de datos real de la API [cite: 149, 150]
  return (
    <div>
      {/* Si es la página por defecto, mostramos un mensaje de bienvenida */}
      {!data && secretariaId === 'default' && (
        <h1>Bienvenido, por favor selecciona una secretaría para ver el análisis.</h1>
      )}

      {/* Si hay datos, mostramos el dashboard */}
      {data && (
        <>
          <h1>Análisis para: {data.secretaria.nombre}</h1>
          <div style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px' }}>
            <h2>Resumen General</h2>
            <p><strong>Total de Agentes:</strong> {data.resumen.totalAgentes}</p>
            <p><strong>Masa Salarial:</strong> ${data.resumen.masaSalarial.toLocaleString('es-AR')}</p>
            <p><strong>Sueldo Promedio:</strong> ${data.resumen.sueldoPromedio.toLocaleString('es-AR')}</p>
            <p style={{ fontSize: '0.8em', color: '#666' }}>Última actualización: {new Date(data.secretaria.ultimaActualizacion).toLocaleDateString()}</p>
          </div>
          <div style={{ marginTop: '20px' }}>
            {/* Aquí irían los demás componentes de visualización y gráficos */}
            <h2>Distribución por Contratación</h2>
            {/* Ejemplo de cómo mostrar más datos */}
            <ul>
              {data.analisis.contratacion.map(c => (
                <li key={c.tipo}>{c.tipo}: {c.cantidad} agentes ({c.porcentaje}%)</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;