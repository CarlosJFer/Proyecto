const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  getNotificationStats
} = require('../controllers/notificationController');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// GET /api/notifications - Obtener notificaciones del usuario
router.get('/', getNotifications);

// GET /api/notifications/stats - Obtener estadísticas de notificaciones
router.get('/stats', getNotificationStats);

// POST /api/notifications - Crear nueva notificación (admin only)
router.post('/', createNotification);

// PUT /api/notifications/:id/read - Marcar notificación como leída
router.put('/:id/read', markAsRead);

// PUT /api/notifications/read-all - Marcar todas las notificaciones como leídas
router.put('/read-all', markAllAsRead);

// DELETE /api/notifications/:id - Eliminar una notificación específica
router.delete('/:id', deleteNotification);

// DELETE /api/notifications/read - Eliminar todas las notificaciones leídas
router.delete('/read', deleteReadNotifications);

module.exports = router;