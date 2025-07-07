// -----------------------------------------------------------------------------
// ARCHIVO: /routes/analytics.js
// -----------------------------------------------------------------------------

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const AnalysisData = require('../models/AnalysisData');
const Dependency = require('../models/Dependency');

// @desc    Obtener lista de secretarías disponibles
// @route   GET /api/analytics/secretarias
// @access  Private
router.get('/secretarias', authenticateToken, async (req, res) => {
  try {
    // Obtener todas las secretarías que tienen datos analizados
    const secretarias = await AnalysisData.find({ activo: true })
      .select('secretariaId secretariaNombre data.totalAgentes analysisDate')
      .sort({ secretariaNombre: 1 });
    
    // Formatear respuesta
    const secretariasFormateadas = secretarias.map(sec => ({
      id: sec.secretariaId,
      nombre: sec.secretariaNombre,
      totalAgentes: sec.data.totalAgentes,
      ultimaActualizacion: sec.analysisDate,
    }));
    
    res.json(secretariasFormateadas);
    
  } catch (error) {
    console.error('Error obteniendo secretarías:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @desc    Obtener datos de análisis de una secretaría específica
// @route   GET /api/analytics/secretarias/:id
// @access  Private
router.get('/secretarias/:id', authenticateToken, async (req, res) => {
  try {
    const secretariaId = req.params.id;
    
    // Buscar el análisis más reciente de la secretaría
    const analisis = await AnalysisData.getLatestBySecretaria(secretariaId);
    
    if (!analisis) {
      return res.status(404).json({ 
        message: 'No se encontraron datos para esta secretaría' 
      });
    }
    
    // Formatear respuesta con todos los datos
    const respuesta = {
      secretaria: {
        id: analisis.secretariaId,
        nombre: analisis.secretariaNombre,
        ultimaActualizacion: analisis.analysisDate,
      },
      resumen: {
        totalAgentes: analisis.data.totalAgentes,
        sueldoPromedio: analisis.data.analisisSalarial.sueldoPromedio,
        masaSalarial: analisis.data.analisisSalarial.masaTotal,
      },
      analisis: {
        contratacion: analisis.data.agentesPorContratacion,
        funcion: analisis.data.agentesPorFuncion,
        escalafon: analisis.data.agentesPorEscalafon,
        edad: analisis.data.agentesPorRangoEdad,
        antiguedad: analisis.data.agentesPorAntiguedad,
        genero: analisis.data.agentesPorGenero,
        salarial: analisis.data.analisisSalarial,
      },
      metadatos: {
        archivo: analisis.archivoInfo.nombreArchivo,
        fechaCarga: analisis.archivoInfo.fechaCarga,
        totalRegistros: analisis.archivoInfo.totalRegistros,
        version: analisis.version,
      },
    };
    
    res.json(respuesta);
    
  } catch (error) {
    console.error('Error obteniendo datos de secretaría:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @desc    Obtener resumen general de todas las secretarías
// @route   GET /api/analytics/resumen
// @access  Private
router.get('/resumen', authenticateToken, async (req, res) => {
  try {
    // Obtener todos los análisis activos
    const analisis = await AnalysisData.find({ activo: true })
      .select('secretariaNombre data.totalAgentes data.analisisSalarial.masaTotal');
    
    // Calcular totales
    const resumen = {
      totalSecretarias: analisis.length,
      totalAgentes: analisis.reduce((sum, a) => sum + a.data.totalAgentes, 0),
      masaSalarialTotal: analisis.reduce((sum, a) => sum + a.data.analisisSalarial.masaTotal, 0),
      secretariasPorTamaño: {
        pequeñas: analisis.filter(a => a.data.totalAgentes < 100).length,
        medianas: analisis.filter(a => a.data.totalAgentes >= 100 && a.data.totalAgentes < 500).length,
        grandes: analisis.filter(a => a.data.totalAgentes >= 500).length,
      },
      secretarias: analisis.map(a => ({
        nombre: a.secretariaNombre,
        totalAgentes: a.data.totalAgentes,
        masaSalarial: a.data.analisisSalarial.masaTotal,
      })).sort((a, b) => b.totalAgentes - a.totalAgentes),
    };
    
    res.json(resumen);
    
  } catch (error) {
    console.error('Error obteniendo resumen:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @desc    Comparar dos secretarías
// @route   GET /api/analytics/comparar/:id1/:id2
// @access  Private
router.get('/comparar/:id1/:id2', authenticateToken, async (req, res) => {
  try {
    const { id1, id2 } = req.params;
    
    // Obtener datos de ambas secretarías
    const [sec1, sec2] = await Promise.all([
      AnalysisData.getLatestBySecretaria(id1),
      AnalysisData.getLatestBySecretaria(id2)
    ]);
    
    if (!sec1 || !sec2) {
      return res.status(404).json({ 
        message: 'No se encontraron datos para una o ambas secretarías' 
      });
    }
    
    // Crear comparación
    const comparacion = {
      secretaria1: {
        nombre: sec1.secretariaNombre,
        totalAgentes: sec1.data.totalAgentes,
        sueldoPromedio: sec1.data.analisisSalarial.sueldoPromedio,
      },
      secretaria2: {
        nombre: sec2.secretariaNombre,
        totalAgentes: sec2.data.totalAgentes,
        sueldoPromedio: sec2.data.analisisSalarial.sueldoPromedio,
      },
      diferencias: {
        agentes: sec1.data.totalAgentes - sec2.data.totalAgentes,
        sueldo: sec1.data.analisisSalarial.sueldoPromedio - sec2.data.analisisSalarial.sueldoPromedio,
      },
    };
    
    res.json(comparacion);
    
  } catch (error) {
    console.error('Error comparando secretarías:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @desc    Obtener estadísticas por campo específico
// @route   GET /api/analytics/estadisticas/:campo
// @access  Private
router.get('/estadisticas/:campo', authenticateToken, async (req, res) => {
  try {
    const campo = req.params.campo;
    const camposPermitidos = ['contratacion', 'funcion', 'escalafon', 'edad', 'antiguedad', 'genero'];
    
    if (!camposPermitidos.includes(campo)) {
      return res.status(400).json({ 
        message: 'Campo no válido. Campos permitidos: ' + camposPermitidos.join(', ') 
      });
    }
    
    // Obtener todos los análisis
    const analises = await AnalysisData.find({ activo: true });
    
    // Mapear el campo a la propiedad correspondiente
    const mapaCampos = {
      contratacion: 'agentesPorContratacion',
      funcion: 'agentesPorFuncion',
      escalafon: 'agentesPorEscalafon',
      edad: 'agentesPorRangoEdad',
      antiguedad: 'agentesPorAntiguedad',
      genero: 'agentesPorGenero',
    };
    
    const propiedad = mapaCampos[campo];
    
    // Consolidar datos de todas las secretarías
    const consolidado = {};
    analises.forEach(analisis => {
      const datos = analisis.data[propiedad] || [];
      datos.forEach(item => {
        const clave = item.tipo || item.funcion || item.escalafon || item.rango || item.genero;
        if (!consolidado[clave]) {
          consolidado[clave] = 0;
        }
        consolidado[clave] += item.cantidad;
      });
    });
    
    // Calcular totales y porcentajes
    const total = Object.values(consolidado).reduce((sum, val) => sum + val, 0);
    const estadisticas = Object.entries(consolidado).map(([clave, cantidad]) => ({
      [campo === 'contratacion' ? 'tipo' : 
        campo === 'funcion' ? 'funcion' : 
        campo === 'escalafon' ? 'escalafon' : 
        campo === 'edad' || campo === 'antiguedad' ? 'rango' : 'genero']: clave,
      cantidad,
      porcentaje: parseFloat(((cantidad / total) * 100).toFixed(2)),
    })).sort((a, b) => b.cantidad - a.cantidad);
    
    res.json({
      campo,
      total,
      estadisticas,
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;