const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { body, query, validationResult } = require('express-validator');

// Middleware para validar errores
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Errores de validación',
      errors: errors.array()
    });
  }
  next();
};

// GET /api/notifications - Obtener notificaciones del usuario
router.get('/',
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número mayor a 0'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe estar entre 1 y 100'),
    query('type').optional().isIn(['FILE_UPLOAD', 'FILE_PROCESSING', 'DATA_UPDATE', 'SYSTEM_ALERT', 'USER_ACTION']),
    query('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    query('read').optional().isBoolean()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, type, priority, read } = req.query;
      const userId = req.user.id;

      // Construir filtros
      const filter = { userId };
      if (type) filter.type = type;
      if (priority) filter.priority = priority;
      if (read !== undefined) filter.read = read === 'true';

      // Obtener notificaciones con paginación
      const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('userId', 'username email')
        .lean();

      // Obtener conteo total y no leídas
      const [total, unreadCount] = await Promise.all([
        Notification.countDocuments(filter),
        Notification.getUnreadCount(userId)
      ]);

      res.json({
        success: true,
        data: {
          notifications,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / limit),
            count: notifications.length,
            totalItems: total
          },
          unreadCount
        }
      });

      // Log de auditoría
      await AuditLog.createLog({
        userId,
        action: 'NOTIFICATION_ACCESS',
        resource: 'notifications',
        details: { page, limit, filters: { type, priority, read } },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// GET /api/notifications/unread-count - Obtener conteo de no leídas
router.get('/unread-count',
  authMiddleware,
  async (req, res) => {
    try {
      const unreadCount = await Notification.getUnreadCount(req.user.id);
      
      res.json({
        success: true,
        data: { unreadCount }
      });
    } catch (error) {
      console.error('Error obteniendo conteo de no leídas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// PATCH /api/notifications/:id/read - Marcar notificación como leída
router.patch('/:id/read',
  authMiddleware,
  async (req, res) => {
    try {
      const notification = await Notification.findOne({
        _id: req.params.id,
        userId: req.user.id
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notificación no encontrada'
        });
      }

      await notification.markAsRead();

      res.json({
        success: true,
        message: 'Notificación marcada como leída',
        data: notification
      });

      // Log de auditoría
      await AuditLog.createLog({
        userId: req.user.id,
        action: 'NOTIFICATION_READ',
        resource: 'notification',
        resourceId: notification._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// PATCH /api/notifications/read-all - Marcar todas como leídas
router.patch('/read-all',
  authMiddleware,
  async (req, res) => {
    try {
      const result = await Notification.markAllAsRead(req.user.id);

      res.json({
        success: true,
        message: `${result.modifiedCount} notificaciones marcadas como leídas`,
        data: { modifiedCount: result.modifiedCount }
      });

      // Log de auditoría
      await AuditLog.createLog({
        userId: req.user.id,
        action: 'NOTIFICATION_READ_ALL',
        resource: 'notifications',
        details: { modifiedCount: result.modifiedCount },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// DELETE /api/notifications/:id - Eliminar notificación
router.delete('/:id',
  authMiddleware,
  async (req, res) => {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        userId: req.user.id
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notificación no encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Notificación eliminada correctamente'
      });

      // Log de auditoría
      await AuditLog.createLog({
        userId: req.user.id,
        action: 'NOTIFICATION_DELETE',
        resource: 'notification',
        resourceId: notification._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

    } catch (error) {
      console.error('Error eliminando notificación:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// DELETE /api/notifications/all - Eliminar todas las notificaciones
router.delete('/all',
  authMiddleware,
  async (req, res) => {
    try {
      const result = await Notification.deleteMany({ userId: req.user.id });

      res.json({
        success: true,
        message: `${result.deletedCount} notificaciones eliminadas`,
        data: { deletedCount: result.deletedCount }
      });

      // Log de auditoría
      await AuditLog.createLog({
        userId: req.user.id,
        action: 'NOTIFICATION_DELETE_ALL',
        resource: 'notifications',
        details: { deletedCount: result.deletedCount },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

    } catch (error) {
      console.error('Error eliminando todas las notificaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// POST /api/notifications - Crear nueva notificación (solo admins)
router.post('/',
  authMiddleware,
  [
    body('title').notEmpty().withMessage('Título es requerido').isLength({ max: 200 }),
    body('message').notEmpty().withMessage('Mensaje es requerido').isLength({ max: 1000 }),
    body('type').isIn(['FILE_UPLOAD', 'FILE_PROCESSING', 'DATA_UPDATE', 'SYSTEM_ALERT', 'USER_ACTION']),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    body('targetUsers').optional().isArray()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      // Verificar permisos de admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para crear notificaciones'
        });
      }

      const { title, message, type, priority = 'MEDIUM', targetUsers, data = {} } = req.body;

      // Si no se especifican usuarios, enviar a todos
      let users = targetUsers;
      if (!users || users.length === 0) {
        const User = require('../models/User');
        const allUsers = await User.find({ isActive: true }, '_id');
        users = allUsers.map(user => user._id);
      }

      // Crear notificaciones para cada usuario
      const notifications = users.map(userId => ({
        userId,
        organizationId: req.user.organizationId,
        title,
        message,
        type,
        priority,
        data
      }));

      const createdNotifications = await Notification.createBulk(notifications);

      res.status(201).json({
        success: true,
        message: `${createdNotifications.length} notificaciones creadas`,
        data: { count: createdNotifications.length }
      });

      // Log de auditoría
      await AuditLog.createLog({
        userId: req.user.id,
        action: 'NOTIFICATION_CREATE',
        resource: 'notifications',
        details: { 
          title, 
          type, 
          priority, 
          targetCount: createdNotifications.length 
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

    } catch (error) {
      console.error('Error creando notificaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// GET /api/notifications/stream - Server-Sent Events para notificaciones en tiempo real
router.get('/stream',
  authMiddleware,
  (req, res) => {
    // Configurar cabeceras para SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const userId = req.user.id;

    // Enviar ping inicial
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date() })}\n\n`);

    // Configurar listener para nuevas notificaciones (simulado)
    // En una implementación real, esto se conectaría a Redis o similar
    const intervalId = setInterval(async () => {
      try {
        // Verificar nuevas notificaciones
        const newNotifications = await Notification.find({
          userId,
          createdAt: { $gte: new Date(Date.now() - 60000) }, // Últimos 60 segundos
          read: false
        }).limit(10);

        if (newNotifications.length > 0) {
          res.write(`data: ${JSON.stringify({
            type: 'notifications',
            data: newNotifications
          })}\n\n`);
        }
      } catch (error) {
        console.error('Error en stream de notificaciones:', error);
      }
    }, 30000); // Verificar cada 30 segundos

    // Limpiar al cerrar conexión
    req.on('close', () => {
      clearInterval(intervalId);
    });
  }
);

// GET /api/notifications/stats - Estadísticas de notificaciones (admin)
router.get('/stats',
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver estadísticas'
        });
      }

      const stats = await Notification.getStats({
        organizationId: req.user.organizationId
      });

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

module.exports = router;