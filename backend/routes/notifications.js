const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');
const {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  getNotificationStats
} = require('../controllers/notificationController');

// Middleware para soportar token por query param en SSE
function sseTokenMiddleware(req, res, next) {
  if (!req.headers['authorization'] && req.query.token) {
    req.headers['authorization'] = 'Bearer ' + req.query.token;
  }
  next();
}

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

// Endpoint SSE para notificaciones en tiempo real por usuario autenticado
router.get('/stream', sseTokenMiddleware, authenticateToken, async (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();

  const userId = req.user.userId || req.user._id;
  let lastSentIds = new Set();

  // Función para enviar notificaciones no leídas
  const sendNotifications = async () => {
    const notifications = await Notification.find({ userId, read: false })
      .sort({ createdAt: -1 })
      .lean();
    // Solo enviar las nuevas
    const newNotifications = notifications.filter(n => !lastSentIds.has(String(n._id)));
    if (newNotifications.length > 0) {
      res.write(`data: ${JSON.stringify({ notifications: newNotifications })}\n\n`);
      newNotifications.forEach(n => lastSentIds.add(String(n._id)));
    } else {
      // Mantener la conexión viva
      res.write(`data: ${JSON.stringify({ ping: true })}\n\n`);
    }
  };

  // Enviar notificaciones al conectar
  await sendNotifications();
  // Revisar cada 10 segundos
  const interval = setInterval(sendNotifications, 10000);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

module.exports = router;