const AuditLog = require('../models/AuditLog');
const jwt = require('jsonwebtoken');

// Configuración de acciones que deben ser auditadas
const AUDITABLE_ACTIONS = {
  'POST': {
    '/auth/login': 'LOGIN',
    '/auth/logout': 'LOGOUT',
    '/auth/register': 'USER_CREATE',
    '/upload': 'FILE_UPLOAD',
    '/analytics/export': 'DATA_EXPORT',
    '/notifications': 'NOTIFICATION_CREATE'
  },
  'GET': {
    '/analytics': 'DASHBOARD_ACCESS',
    '/audit/logs': 'AUDIT_ACCESS',
    '/audit/export': 'AUDIT_EXPORT'
  },
  'PUT': {
    '/auth/password': 'PASSWORD_CHANGE',
    '/users': 'USER_UPDATE'
  },
  'PATCH': {
    '/users': 'USER_UPDATE',
    '/notifications': 'NOTIFICATION_READ'
  },
  'DELETE': {
    '/users': 'USER_DELETE',
    '/notifications': 'NOTIFICATION_DELETE'
  }
};

// Rutas que deben ser excluidas del audit (para evitar ruido)
const EXCLUDED_PATHS = [
  '/health',
  '/api/health',
  '/notifications/stream',
  '/notifications/unread-count'
];

// Función para determinar la severidad basada en la acción y el resultado
function determineSeverity(action, method, statusCode, path) {
  // Severidad CRITICAL
  if (action === 'USER_DELETE' || action === 'AUDIT_CLEANUP') {
    return 'CRITICAL';
  }
  
  // Severidad HIGH
  if (
    action === 'LOGIN' && statusCode >= 400 ||
    action === 'PASSWORD_CHANGE' ||
    action === 'USER_CREATE' ||
    action === 'CONFIG_CHANGE' ||
    statusCode >= 500
  ) {
    return 'HIGH';
  }
  
  // Severidad MEDIUM
  if (
    action === 'FILE_UPLOAD' ||
    action === 'DATA_EXPORT' ||
    action === 'AUDIT_ACCESS' ||
    statusCode >= 400
  ) {
    return 'MEDIUM';
  }
  
  // Severidad LOW (por defecto)
  return 'LOW';
}

// Función para determinar el estado basado en el código de respuesta
function determineStatus(statusCode) {
  if (statusCode >= 200 && statusCode < 300) {
    return 'SUCCESS';
  } else if (statusCode >= 400) {
    return 'FAILURE';
  } else {
    return 'PENDING';
  }
}

// Función para extraer el usuario del token JWT sin validar completamente
function extractUserFromToken(authHeader) {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    // Decodificar sin verificar (solo para obtener el payload)
    const decoded = jwt.decode(token);
    return decoded;
  } catch (error) {
    return null;
  }
}

// Función para extraer información relevante del cuerpo de la request
function extractRelevantDetails(body, path, method) {
  const details = {};
  
  // Para uploads, extraer información del archivo
  if (path.includes('upload') && body) {
    if (body.fileName) details.fileName = body.fileName;
    if (body.fileSize) details.fileSize = body.fileSize;
    if (body.secretariaId) details.secretariaId = body.secretariaId;
  }
  
  // Para exports, extraer formato y filtros
  if (path.includes('export') && body) {
    if (body.format) details.format = body.format;
    if (body.filters) details.filters = body.filters;
  }
  
  // Para cambio de contraseña, solo indicar que se cambió
  if (path.includes('password')) {
    details.passwordChanged = true;
  }
  
  // Para login, extraer algunos datos (sin información sensible)
  if (path.includes('login') && body) {
    if (body.username) details.username = body.username;
    // NO incluir password por seguridad
  }
  
  return details;
}

// Middleware principal de auditoría
const auditMiddleware = (req, res, next) => {
  // Verificar si la ruta debe ser auditada
  if (EXCLUDED_PATHS.some(path => req.path.includes(path))) {
    return next();
  }
  
  const startTime = Date.now();
  const originalSend = res.send;
  
  // Sobrescribir res.send para capturar la respuesta
  res.send = function(body) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Intentar crear el log de auditoría
    createAuditLog(req, res, duration, body).catch(error => {
      console.error('Error creando log de auditoría:', error);
    });
    
    // Restaurar la función original y enviar respuesta
    res.send = originalSend;
    return originalSend.call(this, body);
  };
  
  next();
};

// Función asíncrona para crear el log de auditoría
async function createAuditLog(req, res, duration, responseBody) {
  try {
    const method = req.method;
    const path = req.path;
    const statusCode = res.statusCode;
    
    // Intentar extraer usuario del token
    const userInfo = extractUserFromToken(req.get('Authorization'));
    
    // Si no hay usuario y no es una ruta pública, salir
    if (!userInfo && !path.includes('login') && !path.includes('register')) {
      return;
    }
    
    // Determinar la acción basada en la ruta y método
    let action = AUDITABLE_ACTIONS[method]?.[path];
    
    // Si no hay acción específica, crear una genérica
    if (!action) {
      if (path.includes('login')) action = 'LOGIN';
      else if (path.includes('logout')) action = 'LOGOUT';
      else if (path.includes('upload')) action = 'FILE_UPLOAD';
      else if (path.includes('export')) action = 'DATA_EXPORT';
      else if (path.includes('dashboard')) action = 'DASHBOARD_ACCESS';
      else if (path.includes('analytics')) action = 'DASHBOARD_ACCESS';
      else action = `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
    }
    
    // Extraer detalles relevantes
    const details = {
      ...extractRelevantDetails(req.body, path, method),
      method,
      path,
      statusCode,
      queryParams: req.query,
      responseTime: duration
    };
    
    // Si hubo error, incluir información del error
    if (statusCode >= 400 && responseBody) {
      try {
        const errorInfo = JSON.parse(responseBody);
        if (errorInfo.message) {
          details.errorMessage = errorInfo.message;
        }
      } catch (e) {
        // Si no se puede parsear, usar el body como string
        details.errorMessage = responseBody.toString().substring(0, 200);
      }
    }
    
    // Crear el log de auditoría
    const auditData = {
      userId: userInfo?.id || null,
      action,
      resource: extractResourceFromPath(path),
      resourceId: req.params.id || req.params.userId || req.params.secretariaId || null,
      details,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      sessionId: req.sessionID || null,
      organizationId: userInfo?.organizationId || null,
      severity: determineSeverity(action, method, statusCode, path),
      status: determineStatus(statusCode),
      duration,
      errorMessage: statusCode >= 400 ? details.errorMessage : null
    };
    
    // Solo crear el log si tenemos datos mínimos requeridos
    if (auditData.action && auditData.resource) {
      await AuditLog.createLog(auditData);
    }
    
  } catch (error) {
    // No propagar errores de auditoría para no afectar la aplicación principal
    console.error('Error en middleware de auditoría:', error);
  }
}

// Función para extraer el nombre del recurso desde la ruta
function extractResourceFromPath(path) {
  if (path.includes('auth')) return 'authentication';
  if (path.includes('user')) return 'user';
  if (path.includes('upload')) return 'file';
  if (path.includes('analytics')) return 'analytics';
  if (path.includes('dashboard')) return 'dashboard';
  if (path.includes('notification')) return 'notification';
  if (path.includes('audit')) return 'audit';
  if (path.includes('dependency') || path.includes('secretaria')) return 'secretaria';
  
  // Extraer el primer segmento de la ruta como recurso
  const segments = path.split('/').filter(Boolean);
  return segments.length > 1 ? segments[1] : 'unknown';
}

// Función para crear logs de auditoría manuales (para uso en controladores)
const createManualAuditLog = async (logData) => {
  try {
    await AuditLog.createLog(logData);
  } catch (error) {
    console.error('Error creando log manual de auditoría:', error);
  }
};

module.exports = {
  auditMiddleware,
  createManualAuditLog,
  determineSeverity,
  determineStatus
};