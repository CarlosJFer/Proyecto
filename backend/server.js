const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Importar configuración de base de datos
const connectDB = require('./config/db');

// Importar rutas
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/uploadRoutes');
const analyticsRoutes = require('./routes/analytics');
const dependencyRoutes = require('./routes/dependency');
const notificationRoutes = require('./routes/notifications');
const auditRoutes = require('./routes/audit');

// Importar middleware personalizado
const authMiddleware = require('./middleware/authMiddleware');
const auditMiddleware = require('./middleware/auditMiddleware');

const app = express();

// Configuración de confianza en proxy (para obtener IP real)
app.set('trust proxy', 1);

// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Compresión de respuestas
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Límite por IP
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta nuevamente en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Solo 5 intentos de login por IP
  message: {
    error: 'Demasiados intentos de login, intenta nuevamente en 15 minutos.'
  },
  skipSuccessfulRequests: true,
});

app.use(limiter);
app.use('/api/auth/login', authLimiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://localhost:3000',
      'https://localhost:5173',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Middleware para parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware de auditoría para todas las rutas de API
app.use('/api', auditMiddleware);

// Conexión a MongoDB Atlas
connectDB();

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dependencies', dependencyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);

// Ruta de bienvenida mejorada
app.get('/', (req, res) => {
  res.json({
    message: 'API de Análisis de Dotación - Versión Avanzada',
    version: '2.0.0',
    status: 'funcionando correctamente',
    features: {
      multiTenant: true,
      realTimeNotifications: true,
      advancedAudit: true,
      cloudIntegrations: true,
      advancedExports: true
    },
    endpoints: {
      auth: '/api/auth',
      upload: '/api/upload',
      analytics: '/api/analytics',
      notifications: '/api/notifications',
      audit: '/api/audit',
      dependencies: '/api/dependencies'
    },
    docs: {
      swagger: '/api/docs',
      postman: '/api/postman'
    }
  });
});

// Ruta mejorada para verificar el estado de la API
app.get('/api/health', authMiddleware, async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    const dbStatus = mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado';
    
    // Verificar estadísticas básicas
    const User = require('./models/User');
    const AuditLog = require('./models/AuditLog');
    const Notification = require('./models/Notification');
    
    const [userCount, logCount, notificationCount] = await Promise.all([
      User.countDocuments({ isActive: true }),
      AuditLog.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Notification.countDocuments({ read: false })
    ]);

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())} segundos`,
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`
      },
      database: {
        status: dbStatus,
        collections: {
          users: userCount,
          logsToday: logCount,
          unreadNotifications: notificationCount
        }
      },
      environment: process.env.NODE_ENV || 'development',
      version: '2.0.0'
    });

  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Middleware para manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    requestedPath: req.originalUrl,
    method: req.method,
    availableRoutes: {
      auth: '/api/auth',
      upload: '/api/upload',
      analytics: '/api/analytics',
      notifications: '/api/notifications',
      audit: '/api/audit',
      dependencies: '/api/dependencies'
    }
  });
});

// Middleware para manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error global:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Registrar error en auditoría si es posible
  if (req.user) {
    const AuditLog = require('./models/AuditLog');
    AuditLog.createLog({
      userId: req.user.id,
      action: 'ERROR_OCCURRED',
      resource: 'system',
      details: {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'HIGH',
      status: 'FAILURE',
      errorMessage: err.message
    }).catch(console.error);
  }

  // Respuesta de error personalizada
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Archivo demasiado grande',
        maxSize: '10MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Demasiados archivos',
        maxFiles: 10
      });
    }
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID inválido',
      field: err.path
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Valor duplicado',
      field: Object.keys(err.keyPattern)[0]
    });
  }

  // Error genérico
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
    requestId: req.id || 'unknown'
  });
});

// Manejo de cierre graceful
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown(signal) {
  console.log(`Recibida señal ${signal}. Cerrando servidor gracefully...`);
  
  server.close(() => {
    console.log('Servidor HTTP cerrado.');
    
    mongoose.connection.close(false, () => {
      console.log('Conexión a MongoDB cerrada.');
      process.exit(0);
    });
  });

  // Forzar cierre después de 30 segundos
  setTimeout(() => {
    console.error('No se pudo cerrar gracefully, forzando cierre.');
    process.exit(1);
  }, 30000);
}

const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📊 Panel de salud: http://localhost:${PORT}/api/health`);
  console.log(`🔒 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📝 Auditoría: Habilitada`);
  console.log(`🔔 Notificaciones: Habilitadas`);
});

module.exports = app;