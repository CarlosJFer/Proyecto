import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { Box, Typography } from '@mui/material';

const TreemapWidget = ({ data }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="100%">
        <Typography variant="body2" color="text.secondary">
          No hay datos de estructura disponibles
        </Typography>
      </Box>
    );
  }

  // Generar colores dinámicos
  const colors = [
    '#1976d2', '#dc004e', '#2e7d32', '#ed6c02', 
    '#9c27b0', '#00695c', '#5d4037', '#424242'
  ];

  const processedData = data.map((item, index) => ({
    ...item,
    fill: colors[index % colors.length],
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: 2,
            maxWidth: 200,
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            {data.name || data.departamento}
          </Typography>
          <Typography variant="body2">
            Personal: {data.value || data.cantidad}
          </Typography>
          {data.porcentaje && (
            <Typography variant="body2">
              Porcentaje: {data.porcentaje}%
            </Typography>
          )}
          {data.presupuesto && (
            <Typography variant="body2">
              Presupuesto: ${data.presupuesto.toLocaleString('es-AR')}
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  };

  const CustomContent = ({ root, depth, x, y, width, height, index, name, value }) => {
    if (depth === 1) {
      return (
        <g>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            style={{
              fill: colors[index % colors.length],
              stroke: '#fff',
              strokeWidth: 2,
              strokeOpacity: 1,
            }}
          />
          {width > 60 && height > 30 && (
            <>
              <text
                x={x + width / 2}
                y={y + height / 2 - 5}
                textAnchor="middle"
                fill="#fff"
                fontSize="12"
                fontWeight="bold"
              >
                {name}
              </text>
              <text
                x={x + width / 2}
                y={y + height / 2 + 10}
                textAnchor="middle"
                fill="#fff"
                fontSize="10"
              >
                {value}
              </text>
            </>
          )}
        </g>
      );
    }
    return null;
  };

  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={processedData}
          dataKey="value"
          ratio={4/3}
          stroke="#fff"
          content={<CustomContent />}
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </Box>
  );
};

export default TreemapWidget;