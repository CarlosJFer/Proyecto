// Análisis de datos de agente
// Este modelo define la estructura de los datos de análisis de agentes
const mongoose = require('mongoose');

const AnalysisDataSchema = new mongoose.Schema({
  secretariaId: {
    type: String,
    required: true,
    index: true,
  },
  secretariaNombre: {
    type: String,
    required: true,
  },
  analysisDate: {
    type: Date,
    default: Date.now,
  },
  // Datos procesados del análisis
  data: {
    // Resumen general
    totalAgentes: {
      type: Number,
      default: 0,
    },
    
    // Análisis por tipo de contratación
    agentesPorContratacion: [{
      tipo: String, // 'Planta Permanente', 'Contrato', 'Locación', etc.
      cantidad: Number,
      porcentaje: Number,
    }],
    
    // Análisis por función
    agentesPorFuncion: [{
      funcion: String,
      cantidad: Number,
      porcentaje: Number,
    }],
    
    // Análisis por escalafón
    agentesPorEscalafon: [{
      escalafon: String,
      cantidad: Number,
      porcentaje: Number,
    }],
    
    // Análisis por edad
    agentesPorRangoEdad: [{
      rango: String, // '18-25', '26-35', etc.
      cantidad: Number,
      porcentaje: Number,
    }],
    
    // Análisis por antigüedad
    agentesPorAntiguedad: [{
      rango: String, // '0-5 años', '6-10 años', etc.
      cantidad: Number,
      porcentaje: Number,
    }],
    
    // Análisis por género
    agentesPorGenero: [{
      genero: String,
      cantidad: Number,
      porcentaje: Number,
    }],
    
    // Análisis salarial
    analisisSalarial: {
      sueldoPromedio: Number,
      sueldoMinimo: Number,
      sueldoMaximo: Number,
      masaTotal: Number,
    },
    
    // Datos adicionales que puedan ser útiles
    estadisticasAdicionales: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  
  // Metadatos del archivo procesado
  archivoInfo: {
    nombreArchivo: String,
    fechaCarga: Date,
    totalRegistros: Number,
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  
  // Para mantener historial
  version: {
    type: Number,
    default: 1,
  },
  
  activo: {
    type: Boolean,
    default: true,
  },
  
}, { timestamps: true });

// Índices para optimizar consultas
AnalysisDataSchema.index({ secretariaId: 1, analysisDate: -1 });
AnalysisDataSchema.index({ analysisDate: -1 });
AnalysisDataSchema.index({ activo: 1 });

// Método para obtener el análisis más reciente de una secretaría
AnalysisDataSchema.statics.getLatestBySecretaria = function(secretariaId) {
  return this.findOne({ 
    secretariaId: secretariaId, 
    activo: true 
  }).sort({ analysisDate: -1 });
};

module.exports = mongoose.model('AnalysisData', AnalysisDataSchema);