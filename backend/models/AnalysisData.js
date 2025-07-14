// Análisis de datos de agente
// Este modelo define la estructura de los datos de análisis de agentes
const mongoose = require('mongoose');

const analysisDataSchema = new mongoose.Schema({
  secretaria: {
    id: {
      type: String,
      required: true,
      index: true
    },
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    descripcion: String,
    codigo: String,
    area: String,
    ministerio: String
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  archivo: {
    nombreOriginal: {
      type: String,
      required: true
    },
    nombreGuardado: String,
    tamaño: Number,
    tipo: String,
    hash: String, // Para detectar duplicados
    ruta: String
  },
  procesamiento: {
    estado: {
      type: String,
      enum: ['PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'ERROR'],
      default: 'PENDIENTE',
      index: true
    },
    iniciadoEn: Date,
    completadoEn: Date,
    errores: [String],
    warnings: [String],
    tiempoProcesamientoMs: Number,
    registrosProcesados: Number,
    registrosValidos: Number,
    registrosInvalidos: Number
  },
  version: {
    type: Number,
    default: 1
  },
  versionAnterior: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AnalysisData'
  },
  esActual: {
    type: Boolean,
    default: true,
    index: true
  },
  resumen: {
    totalAgentes: {
      type: Number,
      required: true,
      min: 0
    },
    masaSalarial: {
      type: Number,
      required: true,
      min: 0
    },
    sueldoPromedio: {
      type: Number,
      required: true,
      min: 0
    },
    sueldoMinimo: Number,
    sueldoMaximo: Number,
    sueldoMediano: Number,
    indiceEficiencia: Number,
    tendencias: {
      agentes: Number, // Porcentaje de cambio respecto al período anterior
      masaSalarial: Number,
      sueldoPromedio: Number
    },
    ultimaActualizacion: {
      type: Date,
      default: Date.now
    }
  },
  analisis: {
    contratacion: [{
      tipo: String,
      cantidad: Number,
      porcentaje: Number,
      masaSalarial: Number,
      promedioSalarial: Number
    }],
    genero: [{
      genero: String,
      cantidad: Number,
      porcentaje: Number,
      masaSalarial: Number,
      promedioSalarial: Number
    }],
    antiguedad: [{
      rango: String,
      cantidad: Number,
      porcentaje: Number,
      masaSalarial: Number,
      promedioSalarial: Number
    }],
    edad: [{
      rango: String,
      cantidad: Number,
      porcentaje: Number
    }],
    escalaSalarial: [{
      rango: String,
      cantidad: Number,
      porcentaje: Number,
      desde: Number,
      hasta: Number
    }],
    departamentos: [{
      nombre: String,
      cantidad: Number,
      porcentaje: Number,
      masaSalarial: Number,
      subdepartamentos: [{
        nombre: String,
        cantidad: Number,
        masaSalarial: Number
      }]
    }],
    cargos: [{
      nombre: String,
      cantidad: Number,
      porcentaje: Number,
      sueldoPromedio: Number,
      sueldoMinimo: Number,
      sueldoMaximo: Number
    }]
  },
  datosRaw: {
    type: mongoose.Schema.Types.Mixed,
    select: false // No incluir por defecto en consultas
  },
  comparacion: {
    periodoAnterior: {
      fecha: Date,
      cambioAgentes: Number,
      cambioMasaSalarial: Number,
      cambioSueldoPromedio: Number
    },
    benchmark: {
      promedioSectorial: Number,
      posicionRelativa: String, // 'SUPERIOR', 'PROMEDIO', 'INFERIOR'
      percentil: Number
    }
  },
  calidad: {
    puntuacion: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    indicadores: {
      completitud: Number, // Porcentaje de campos completos
      consistencia: Number, // Consistencia en los datos
      exactitud: Number, // Exactitud de los cálculos
      actualidad: Number // Qué tan recientes son los datos
    },
    problemas: [{
      tipo: {
        type: String,
        enum: ['DATO_FALTANTE', 'INCONSISTENCIA', 'VALOR_ATIPICO', 'FORMATO_INCORRECTO']
      },
      descripcion: String,
      campo: String,
      gravedad: {
        type: String,
        enum: ['BAJA', 'MEDIA', 'ALTA', 'CRITICA']
      },
      registrosAfectados: Number
    }]
  },
  metadatos: {
    fechaCorte: Date,
    periodoInicio: Date,
    periodoFin: Date,
    frecuencia: {
      type: String,
      enum: ['MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'],
      default: 'MENSUAL'
    },
    fuente: String,
    metodologia: String,
    observaciones: String,
    tags: [String],
    clasificacion: {
      type: String,
      enum: ['PUBLICO', 'INTERNO', 'CONFIDENCIAL', 'RESTRINGIDO'],
      default: 'INTERNO'
    }
  },
  auditoria: {
    creadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    modificadoPor: [{
      usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      fecha: Date,
      accion: String,
      cambios: mongoose.Schema.Types.Mixed
    }],
    accesos: [{
      usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      fecha: Date,
      tipoAcceso: {
        type: String,
        enum: ['LECTURA', 'DESCARGA', 'EXPORTACION', 'MODIFICACION']
      },
      ipAddress: String
    }]
  },
  configuracion: {
    filtrosAplicados: mongoose.Schema.Types.Mixed,
    parametrosCalculo: mongoose.Schema.Types.Mixed,
    configuracionDashboard: mongoose.Schema.Types.Mixed
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'analysis_data'
});

// Índices compuestos para consultas eficientes
analysisDataSchema.index({ organizationId: 1, 'secretaria.id': 1, esActual: 1 });
analysisDataSchema.index({ organizationId: 1, createdAt: -1 });
analysisDataSchema.index({ uploadedBy: 1, createdAt: -1 });
analysisDataSchema.index({ 'procesamiento.estado': 1 });
analysisDataSchema.index({ 'metadatos.fechaCorte': -1 });

// Virtual para obtener el nombre completo de la secretaría
analysisDataSchema.virtual('nombreCompleto').get(function() {
  return `${this.secretaria.nombre} - ${this.metadatos.fechaCorte?.toLocaleDateString('es-AR') || 'Sin fecha'}`;
});

// Middleware para actualizar la versión anterior como no actual
analysisDataSchema.pre('save', async function(next) {
  if (this.isNew && this.esActual) {
    // Marcar versiones anteriores como no actuales
    await this.constructor.updateMany(
      {
        organizationId: this.organizationId,
        'secretaria.id': this.secretaria.id,
        _id: { $ne: this._id },
        esActual: true
      },
      { 
        esActual: false 
      }
    );
  }
  next();
});

// Método para obtener la versión anterior
analysisDataSchema.methods.getVersionAnterior = async function() {
  return await this.constructor.findOne({
    organizationId: this.organizationId,
    'secretaria.id': this.secretaria.id,
    version: this.version - 1
  });
};

// Método para calcular tendencias
analysisDataSchema.methods.calcularTendencias = async function() {
  const versionAnterior = await this.getVersionAnterior();
  
  if (!versionAnterior) {
    return {
      agentes: 0,
      masaSalarial: 0,
      sueldoPromedio: 0
    };
  }
  
  const calcularCambio = (actual, anterior) => {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return ((actual - anterior) / anterior * 100).toFixed(2);
  };
  
  return {
    agentes: calcularCambio(this.resumen.totalAgentes, versionAnterior.resumen.totalAgentes),
    masaSalarial: calcularCambio(this.resumen.masaSalarial, versionAnterior.resumen.masaSalarial),
    sueldoPromedio: calcularCambio(this.resumen.sueldoPromedio, versionAnterior.resumen.sueldoPromedio)
  };
};

// Método para registrar acceso
analysisDataSchema.methods.registrarAcceso = async function(usuario, tipoAcceso, ipAddress) {
  this.auditoria.accesos.push({
    usuario: usuario._id || usuario,
    fecha: new Date(),
    tipoAcceso,
    ipAddress
  });
  
  // Mantener solo los últimos 100 accesos
  if (this.auditoria.accesos.length > 100) {
    this.auditoria.accesos = this.auditoria.accesos.slice(-100);
  }
  
  await this.save();
};

// Método estático para obtener estadísticas por organización
analysisDataSchema.statics.getEstadisticasOrganizacion = async function(organizationId) {
  try {
    const stats = await this.aggregate([
      { 
        $match: { 
          organizationId: new mongoose.Types.ObjectId(organizationId),
          esActual: true,
          isActive: true
        } 
      },
      {
        $group: {
          _id: null,
          totalSecretarias: { $sum: 1 },
          totalAgentes: { $sum: '$resumen.totalAgentes' },
          masaSalarialTotal: { $sum: '$resumen.masaSalarial' },
          sueldoPromedioGeneral: { $avg: '$resumen.sueldoPromedio' },
          ultimaActualizacion: { $max: '$resumen.ultimaActualizacion' }
        }
      }
    ]);
    
    return stats[0] || {
      totalSecretarias: 0,
      totalAgentes: 0,
      masaSalarialTotal: 0,
      sueldoPromedioGeneral: 0,
      ultimaActualizacion: null
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de organización:', error);
    throw error;
  }
};

// Método estático para comparación entre secretarías
analysisDataSchema.statics.compararSecretarias = async function(organizationId, secretariaIds) {
  try {
    return await this.find({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      'secretaria.id': { $in: secretariaIds },
      esActual: true,
      isActive: true
    }).select('secretaria resumen analisis.contratacion analisis.genero');
  } catch (error) {
    console.error('Error comparando secretarías:', error);
    throw error;
  }
};

// Método para validar calidad de datos
analysisDataSchema.methods.validarCalidad = function() {
  let puntuacion = 100;
  const problemas = [];
  
  // Verificar completitud
  if (!this.resumen.totalAgentes) {
    puntuacion -= 20;
    problemas.push({
      tipo: 'DATO_FALTANTE',
      descripcion: 'Total de agentes no especificado',
      campo: 'resumen.totalAgentes',
      gravedad: 'CRITICA'
    });
  }
  
  if (!this.resumen.masaSalarial) {
    puntuacion -= 15;
    problemas.push({
      tipo: 'DATO_FALTANTE',
      descripcion: 'Masa salarial no especificada',
      campo: 'resumen.masaSalarial',
      gravedad: 'ALTA'
    });
  }
  
  // Verificar consistencia
  if (this.resumen.totalAgentes > 0 && this.resumen.masaSalarial === 0) {
    puntuacion -= 25;
    problemas.push({
      tipo: 'INCONSISTENCIA',
      descripcion: 'Hay agentes pero masa salarial es cero',
      gravedad: 'CRITICA'
    });
  }
  
  // Calcular sueldo promedio y verificar
  const sueldoCalculado = this.resumen.totalAgentes > 0 
    ? this.resumen.masaSalarial / this.resumen.totalAgentes 
    : 0;
  
  const diferencia = Math.abs(sueldoCalculado - this.resumen.sueldoPromedio);
  if (diferencia > sueldoCalculado * 0.01) { // 1% de tolerancia
    puntuacion -= 10;
    problemas.push({
      tipo: 'INCONSISTENCIA',
      descripcion: 'Sueldo promedio no coincide con el calculado',
      campo: 'resumen.sueldoPromedio',
      gravedad: 'MEDIA'
    });
  }
  
  this.calidad = {
    puntuacion: Math.max(0, puntuacion),
    problemas
  };
  
  return this.calidad;
};

const AnalysisData = mongoose.model('AnalysisData', analysisDataSchema);

module.exports = AnalysisData;