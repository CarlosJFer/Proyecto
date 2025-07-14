const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGOUT',
      'FILE_UPLOAD',
      'FILE_DOWNLOAD',
      'DATA_EXPORT',
      'USER_CREATE',
      'USER_UPDATE',
      'USER_DELETE',
      'SECRETARIA_CREATE',
      'SECRETARIA_UPDATE',
      'SECRETARIA_DELETE',
      'CONFIG_CHANGE',
      'PASSWORD_CHANGE',
      'DASHBOARD_ACCESS',
      'FILTER_APPLY',
      'WIDGET_CONFIG',
      'INTEGRATION_ACCESS',
      'NOTIFICATION_SEND',
      'ERROR_OCCURRED'
    ]
  },
  resource: {
    type: String,
    required: true
  },
  resourceId: {
    type: String,
    index: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  sessionId: {
    type: String,
    index: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW'
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE', 'PENDING'],
    default: 'SUCCESS'
  },
  duration: {
    type: Number, // En milisegundos
    min: 0
  },
  errorMessage: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'audit_logs'
});

// Índices compuestos para consultas eficientes
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ organizationId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });

// TTL para eliminar logs antiguos automáticamente (opcional)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 }); // 1 año

// Método estático para crear logs de auditoría
auditLogSchema.statics.createLog = async function(logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Error creando log de auditoría:', error);
    throw error;
  }
};

// Método para obtener estadísticas de auditoría
auditLogSchema.statics.getStats = async function(filter = {}) {
  try {
    const stats = await this.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] }
          },
          failureCount: {
            $sum: { $cond: [{ $eq: ['$status', 'FAILURE'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas de auditoría:', error);
    throw error;
  }
};

// Método para obtener actividad por usuario
auditLogSchema.statics.getUserActivity = async function(userId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const activity = await this.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            action: '$action'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': -1, '_id.action': 1 } }
    ]);
    
    return activity;
  } catch (error) {
    console.error('Error obteniendo actividad del usuario:', error);
    throw error;
  }
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;