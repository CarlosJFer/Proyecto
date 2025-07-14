const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// Obtener todas las notificaciones del usuario
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, read, type, priority } = req.query;
    const userId = req.user.id;

    // Construir filtros
    const filters = { userId };
    
    if (read !== undefined) {
      filters.read = read === 'true';
    }
    
    if (type) {
      filters.type = type;
    }
    
    if (priority) {
      filters.priority = priority;
    }

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener notificaciones con paginación
    const notifications = await Notification.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Contar total de notificaciones
    const total = await Notification.countDocuments(filters);
    const unreadCount = await Notification.countDocuments({ 
      userId, 
      read: false 
    });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalNotifications: total,
          hasNextPage: skip + notifications.length < total,
          hasPrevPage: parseInt(page) > 1
        },
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear una nueva notificación
const createNotification = async (req, res) => {
  try {
    const { userId, type, title, message, data, priority } = req.body;

    // Validar campos requeridos
    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Los campos userId, title y message son requeridos'
      });
    }

    // Validar que el userId sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'userId no es válido'
      });
    }

    const notification = new Notification({
      userId,
      type: type || 'info',
      title,
      message,
      data: data || {},
      priority: priority || 'medium'
    });

    await notification.save();

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notificación creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Marcar notificación como leída
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de notificación no válido'
      });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    res.json({
      success: true,
      data: notification,
      message: 'Notificación marcada como leída'
    });
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Marcar todas las notificaciones como leídas
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );

    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount
      },
      message: `${result.modifiedCount} notificaciones marcadas como leídas`
    });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones como leídas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar una notificación
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de notificación no válido'
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Notificación eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar todas las notificaciones leídas
const deleteReadNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.deleteMany({
      userId,
      read: true
    });

    res.json({
      success: true,
      data: {
        deletedCount: result.deletedCount
      },
      message: `${result.deletedCount} notificaciones eliminadas`
    });
  } catch (error) {
    console.error('Error al eliminar notificaciones leídas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener estadísticas de notificaciones
const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Notification.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] } },
          byType: {
            $push: {
              type: '$type',
              read: '$read'
            }
          },
          byPriority: {
            $push: {
              priority: '$priority',
              read: '$read'
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      unread: 0,
      byType: [],
      byPriority: []
    };

    // Procesar estadísticas por tipo
    const typeStats = result.byType.reduce((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = { total: 0, unread: 0 };
      }
      acc[item.type].total++;
      if (!item.read) {
        acc[item.type].unread++;
      }
      return acc;
    }, {});

    // Procesar estadísticas por prioridad
    const priorityStats = result.byPriority.reduce((acc, item) => {
      if (!acc[item.priority]) {
        acc[item.priority] = { total: 0, unread: 0 };
      }
      acc[item.priority].total++;
      if (!item.read) {
        acc[item.priority].unread++;
      }
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        total: result.total,
        unread: result.unread,
        read: result.total - result.unread,
        typeStats,
        priorityStats
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  getNotificationStats
};