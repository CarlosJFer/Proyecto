const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  type: {
    type: String,
    required: true,
    enum: [
      'FILE_UPLOAD',
      'FILE_PROCESSING',
      'FILE_ERROR',
      'DATA_UPDATE',
      'SYSTEM_ALERT',
      'USER_ACTION',
      'INTEGRATION',
      'SECURITY',
      'MAINTENANCE',
      'REMINDER',
      'ACHIEVEMENT',
      'ERROR',
      'INFO',
      'WARNING',
      'SUCCESS'
    ]
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  category: {
    type: String,
    enum: ['SYSTEM', 'USER', 'DATA', 'SECURITY', 'BUSINESS'],
    default: 'USER'
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: Date,
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  action: {
    type: {
      type: String,
      enum: ['LINK', 'BUTTON', 'NONE'],
      default: 'NONE'
    },
    label: String,
    url: String,
    params: mongoose.Schema.Types.Mixed
  },
  channels: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    },
    webhook: {
      type: Boolean,
      default: false
    }
  },
  delivery: {
    inApp: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date
    },
    email: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      error: String
    },
    push: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      error: String
    },
    webhook: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      error: String,
      response: String
    }
  },
  expiresAt: Date,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Índices compuestos para consultas eficientes
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ organizationId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ priority: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Middleware para marcar como leída
notificationSchema.methods.markAsRead = async function() {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    return await this.save();
  }
  return this;
};

// Método estático para crear notificaciones masivas
notificationSchema.statics.createBulk = async function(notifications) {
  try {
    return await this.insertMany(notifications);
  } catch (error) {
    console.error('Error creando notificaciones masivas:', error);
    throw error;
  }
};

// Método estático para obtener estadísticas
notificationSchema.statics.getStats = async function(filter = {}) {
  try {
    const stats = await this.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] }
          },
          byType: {
            $push: {
              type: '$type',
              count: 1
            }
          },
          byPriority: {
            $push: {
              priority: '$priority',
              count: 1
            }
          }
        }
      }
    ]);
    
    return stats[0] || { total: 0, unread: 0, byType: [], byPriority: [] };
  } catch (error) {
    console.error('Error obteniendo estadísticas de notificaciones:', error);
    throw error;
  }
};

// Método para obtener notificaciones no leídas por usuario
notificationSchema.statics.getUnreadCount = async function(userId) {
  try {
    return await this.countDocuments({ 
      userId: new mongoose.Types.ObjectId(userId), 
      read: false 
    });
  } catch (error) {
    console.error('Error obteniendo conteo de no leídas:', error);
    throw error;
  }
};

// Método para marcar todas como leídas
notificationSchema.statics.markAllAsRead = async function(userId) {
  try {
    const result = await this.updateMany(
      { 
        userId: new mongoose.Types.ObjectId(userId), 
        read: false 
      },
      { 
        $set: { 
          read: true, 
          readAt: new Date() 
        } 
      }
    );
    return result;
  } catch (error) {
    console.error('Error marcando todas como leídas:', error);
    throw error;
  }
};

// Método para limpiar notificaciones antiguas
notificationSchema.statics.cleanup = async function(days = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const result = await this.deleteMany({
      createdAt: { $lt: cutoffDate },
      read: true
    });
    
    return result;
  } catch (error) {
    console.error('Error limpiando notificaciones:', error);
    throw error;
  }
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;