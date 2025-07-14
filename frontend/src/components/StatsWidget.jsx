import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Avatar,
  Chip,
} from '@mui/material';
import {
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const StatCard = ({ icon, title, value, subtitle, color, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Paper
      elevation={1}
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        borderRadius: 2,
        background: `linear-gradient(135deg, ${color}15 0%, transparent 100%)`,
        border: `1px solid ${color}20`,
      }}
    >
      <Avatar
        sx={{
          bgcolor: color,
          mb: 1,
          width: 40,
          height: 40,
        }}
      >
        {icon}
      </Avatar>
      <Typography variant="h6" component="div" fontWeight="bold" color={color}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
      {trend && (
        <Chip
          label={trend > 0 ? `+${trend}%` : `${trend}%`}
          size="small"
          color={trend > 0 ? 'success' : 'error'}
          sx={{ mt: 0.5 }}
        />
      )}
    </Paper>
  </motion.div>
);

const StatsWidget = ({ data }) => {
  if (!data) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="100%">
        <Typography variant="body2" color="text.secondary">
          No hay datos de resumen disponibles
        </Typography>
      </Box>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('es-AR').format(number);
  };

  const stats = [
    {
      icon: <PeopleIcon />,
      title: 'Total de Agentes',
      value: formatNumber(data.totalAgentes || 0),
      subtitle: 'Personal activo',
      color: '#1976d2',
      trend: data.trendAgentes,
    },
    {
      icon: <MoneyIcon />,
      title: 'Masa Salarial',
      value: formatCurrency(data.masaSalarial || 0),
      subtitle: 'Total mensual',
      color: '#2e7d32',
      trend: data.trendMasaSalarial,
    },
    {
      icon: <TrendingUpIcon />,
      title: 'Sueldo Promedio',
      value: formatCurrency(data.sueldoPromedio || 0),
      subtitle: 'Promedio general',
      color: '#ed6c02',
      trend: data.trendSueldoPromedio,
    },
    {
      icon: <AssessmentIcon />,
      title: 'Índice de Eficiencia',
      value: `${(data.indiceEficiencia || 0).toFixed(1)}%`,
      subtitle: 'Ratio productividad',
      color: '#9c27b0',
      trend: data.trendEficiencia,
    },
  ];

  return (
    <Box sx={{ height: '100%', p: 1 }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        {stats.map((stat, index) => (
          <Grid item xs={6} md={3} key={index} sx={{ height: '50%' }}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>
      
      {data.ultimaActualizacion && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Última actualización: {new Date(data.ultimaActualizacion).toLocaleString('es-AR')}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StatsWidget;