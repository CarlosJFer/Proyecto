const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const connectDB = require('./config/db'); // Importar la función centralizada

// Importar rutas
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/uploadRoutes');
const analyticsRoutes = require('./routes/analytics');
const dependencyRoutes = require('./routes/dependency');
const notificationsRoutes = require('./routes/notifications');
const auditRoutes = require('./routes/audit');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (para archivos subidos si es necesario)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Conexión a MongoDB Atlas usando la función centralizada
connectDB();

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dependencies', dependencyRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/audit', auditRoutes);

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    message: 'API de Análisis de Dotación',
    version: '1.0.0',
    status: 'funcionando correctamente',
    endpoints: {
      auth: '/api/auth',
      upload: '/api/upload',
      analytics: '/api/analytics',
      dependencies: '/api/dependencies',
      notifications: '/api/notifications',
      audit: '/api/audit'
    }
  });
});

// Ruta para verificar el estado de la API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado'
  });
});

// Middleware para manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Ruta no encontrada',
    availableRoutes: {
      auth: '/api/auth',
      upload: '/api/upload',
      analytics: '/api/analytics',
      dependencies: '/api/dependencies',
      notifications: '/api/notifications',
      audit: '/api/audit'
    }
  });
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Archivo demasiado grande' });
    }
  }
  
  res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📊 Panel de salud: http://localhost:${PORT}/api/health`);
});

module.exports = app;