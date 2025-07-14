const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const AuditLog = require('../models/AuditLog');
const { query, validationResult } = require('express-validator');
const ExcelJS = require('exceljs');

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

// Middleware para verificar permisos de admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a los registros de auditoría'
    });
  }
  next();
};

// GET /api/audit/logs - Obtener registros de auditoría
router.get('/logs',
  authMiddleware,
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número mayor a 0'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe estar entre 1 y 100'),
    query('action').optional().isString(),
    query('userId').optional().isMongoId(),
    query('resource').optional().isString(),
    query('severity').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    query('status').optional().isIn(['SUCCESS', 'FAILURE', 'PENDING']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('search').optional().isString()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 50,
        action,
        userId,
        resource,
        severity,
        status,
        startDate,
        endDate,
        search
      } = req.query;

      // Construir filtros
      const filter = { organizationId: req.user.organizationId };
      
      if (action) filter.action = action;
      if (userId) filter.userId = userId;
      if (resource) filter.resource = resource;
      if (severity) filter.severity = severity;
      if (status) filter.status = status;

      // Filtro por fechas
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      // Búsqueda en múltiples campos
      if (search) {
        filter.$or = [
          { action: { $regex: search, $options: 'i' } },
          { resource: { $regex: search, $options: 'i' } },
          { ipAddress: { $regex: search, $options: 'i' } },
          { 'details.fileName': { $regex: search, $options: 'i' } }
        ];
      }

      // Ejecutar consulta con paginación
      const [logs, total] = await Promise.all([
        AuditLog.find(filter)
          .populate('userId', 'username email')
          .sort({ createdAt: -1 })
          .limit(limit * 1)
          .skip((page - 1) * limit)
          .lean(),
        AuditLog.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / limit),
            count: logs.length,
            totalItems: total
          },
          filters: {
            action,
            userId,
            resource,
            severity,
            status,
            startDate,
            endDate,
            search
          }
        }
      });

      // Log del acceso a auditoría
      await AuditLog.createLog({
        userId: req.user.id,
        action: 'AUDIT_ACCESS',
        resource: 'audit_logs',
        details: { 
          filters: { action, userId, resource, severity, status },
          pagination: { page, limit }
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        organizationId: req.user.organizationId
      });

    } catch (error) {
      console.error('Error obteniendo logs de auditoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// GET /api/audit/stats - Estadísticas de auditoría
router.get('/stats',
  authMiddleware,
  requireAdmin,
  [
    query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Período inválido'),
    query('groupBy').optional().isIn(['action', 'user', 'resource', 'day', 'hour'])
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { period = '30d', groupBy = 'action' } = req.query;

      // Calcular fecha de inicio según el período
      const now = new Date();
      const startDate = new Date();
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const filter = {
        organizationId: req.user.organizationId,
        createdAt: { $gte: startDate }
      };

      // Obtener estadísticas generales
      const [generalStats, groupedStats] = await Promise.all([
        AuditLog.getStats(filter),
        getGroupedStats(filter, groupBy)
      ]);

      // Estadísticas por severidad
      const severityStats = await AuditLog.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      // Actividad por día
      const dailyActivity = await AuditLog.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
            },
            count: { $sum: 1 },
            errors: {
              $sum: { $cond: [{ $eq: ['$status', 'FAILURE'] }, 1, 0] }
            }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]);

      res.json({
        success: true,
        data: {
          period,
          general: generalStats,
          grouped: groupedStats,
          severity: severityStats,
          daily: dailyActivity,
          summary: {
            totalEvents: generalStats.reduce((sum, stat) => sum + stat.count, 0),
            uniqueActions: generalStats.length,
            errorRate: calculateErrorRate(generalStats)
          }
        }
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas de auditoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// GET /api/audit/user/:userId - Actividad de un usuario específico
router.get('/user/:userId',
  authMiddleware,
  requireAdmin,
  [
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Días debe estar entre 1 y 365')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { days = 30 } = req.query;

      const activity = await AuditLog.getUserActivity(userId, days);

      res.json({
        success: true,
        data: {
          userId,
          period: `${days} días`,
          activity
        }
      });

    } catch (error) {
      console.error('Error obteniendo actividad del usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// GET /api/audit/export - Exportar logs de auditoría
router.get('/export',
  authMiddleware,
  requireAdmin,
  [
    query('format').optional().isIn(['csv', 'excel', 'json']).withMessage('Formato inválido'),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('action').optional().isString(),
    query('severity').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        format = 'excel',
        startDate,
        endDate,
        action,
        severity
      } = req.query;

      // Construir filtros
      const filter = { organizationId: req.user.organizationId };
      if (action) filter.action = action;
      if (severity) filter.severity = severity;
      
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      // Obtener logs (limitado a 10000 registros para rendimiento)
      const logs = await AuditLog.find(filter)
        .populate('userId', 'username email')
        .sort({ createdAt: -1 })
        .limit(10000)
        .lean();

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `audit-logs-${timestamp}`;

      switch (format) {
        case 'json':
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
          res.json(logs);
          break;

        case 'excel':
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet('Logs de Auditoría');

          // Configurar columnas
          worksheet.columns = [
            { header: 'Fecha', key: 'createdAt', width: 20 },
            { header: 'Usuario', key: 'user', width: 20 },
            { header: 'Acción', key: 'action', width: 20 },
            { header: 'Recurso', key: 'resource', width: 20 },
            { header: 'Estado', key: 'status', width: 15 },
            { header: 'Severidad', key: 'severity', width: 15 },
            { header: 'IP', key: 'ipAddress', width: 15 },
            { header: 'Detalles', key: 'details', width: 30 }
          ];

          // Agregar datos
          logs.forEach(log => {
            worksheet.addRow({
              createdAt: log.createdAt.toLocaleString('es-AR'),
              user: log.userId?.username || 'Usuario eliminado',
              action: log.action,
              resource: log.resource,
              status: log.status,
              severity: log.severity,
              ipAddress: log.ipAddress,
              details: JSON.stringify(log.details)
            });
          });

          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
          
          await workbook.xlsx.write(res);
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Formato no soportado'
          });
      }

      // Log de la exportación
      await AuditLog.createLog({
        userId: req.user.id,
        action: 'AUDIT_EXPORT',
        resource: 'audit_logs',
        details: { 
          format, 
          recordCount: logs.length,
          filters: { action, severity, startDate, endDate }
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        organizationId: req.user.organizationId
      });

    } catch (error) {
      console.error('Error exportando logs de auditoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// DELETE /api/audit/cleanup - Limpiar logs antiguos
router.delete('/cleanup',
  authMiddleware,
  requireAdmin,
  [
    query('days').optional().isInt({ min: 30 }).withMessage('Días debe ser mínimo 30')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { days = 365 } = req.query;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await AuditLog.deleteMany({
        organizationId: req.user.organizationId,
        createdAt: { $lt: cutoffDate },
        severity: { $in: ['LOW', 'MEDIUM'] } // Solo eliminar logs de baja/media severidad
      });

      res.json({
        success: true,
        message: `${result.deletedCount} registros eliminados`,
        data: { deletedCount: result.deletedCount }
      });

      // Log de la limpieza
      await AuditLog.createLog({
        userId: req.user.id,
        action: 'AUDIT_CLEANUP',
        resource: 'audit_logs',
        details: { 
          days, 
          deletedCount: result.deletedCount,
          cutoffDate: cutoffDate.toISOString()
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        organizationId: req.user.organizationId,
        severity: 'HIGH'
      });

    } catch (error) {
      console.error('Error limpiando logs de auditoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// Funciones auxiliares
async function getGroupedStats(filter, groupBy) {
  let groupStage;
  
  switch (groupBy) {
    case 'user':
      groupStage = {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
          actions: { $addToSet: '$action' }
        }
      };
      break;
    case 'resource':
      groupStage = {
        $group: {
          _id: '$resource',
          count: { $sum: 1 },
          users: { $addToSet: '$userId' }
        }
      };
      break;
    case 'day':
      groupStage = {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 }
        }
      };
      break;
    case 'hour':
      groupStage = {
        $group: {
          _id: {
            hour: { $hour: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      };
      break;
    default: // action
      groupStage = {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      };
  }

  return await AuditLog.aggregate([
    { $match: filter },
    groupStage,
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]);
}

function calculateErrorRate(stats) {
  const total = stats.reduce((sum, stat) => sum + stat.count, 0);
  const errors = stats.reduce((sum, stat) => sum + (stat.failureCount || 0), 0);
  return total > 0 ? ((errors / total) * 100).toFixed(2) : 0;
}

module.exports = router;