const AnalysisData = require('../models/AnalysisData');
const PDFDocument = require('pdfkit');

// Obtener lista de secretarías disponibles
const getSecretarias = async (req, res) => {
  try {
    const secretarias = await AnalysisData.find({ activo: true })
      .select('secretariaId secretariaNombre data.totalAgentes analysisDate')
      .sort({ secretariaNombre: 1 });
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
};

// Obtener datos de análisis de una secretaría específica
const getSecretariaById = async (req, res) => {
  try {
    const secretariaId = req.params.id;
    const analisis = await AnalysisData.getLatestBySecretaria(secretariaId);
    if (!analisis) {
      return res.status(404).json({ message: 'No se encontraron datos para esta secretaría' });
    }
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
};

// Obtener resumen general de todas las secretarías
const getResumen = async (req, res) => {
  try {
    const analisis = await AnalysisData.find({ activo: true })
      .select('secretariaNombre data.totalAgentes data.analisisSalarial.masaTotal');
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
};

// Comparar dos secretarías
const compararSecretarias = async (req, res) => {
  try {
    const { id1, id2 } = req.params;
    const [sec1, sec2] = await Promise.all([
      AnalysisData.getLatestBySecretaria(id1),
      AnalysisData.getLatestBySecretaria(id2)
    ]);
    if (!sec1 || !sec2) {
      return res.status(404).json({ message: 'No se encontraron datos para una o ambas secretarías' });
    }
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
};

// Obtener estadísticas por campo específico
const getEstadisticasPorCampo = async (req, res) => {
  try {
    const campo = req.params.campo;
    const camposPermitidos = ['contratacion', 'funcion', 'escalafon', 'edad', 'antiguedad', 'genero'];
    if (!camposPermitidos.includes(campo)) {
      return res.status(400).json({ message: 'Campo no válido. Campos permitidos: ' + camposPermitidos.join(', ') });
    }
    const analises = await AnalysisData.find({ activo: true });
    const mapaCampos = {
      contratacion: 'agentesPorContratacion',
      funcion: 'agentesPorFuncion',
      escalafon: 'agentesPorEscalafon',
      edad: 'agentesPorRangoEdad',
      antiguedad: 'agentesPorAntiguedad',
      genero: 'agentesPorGenero',
    };
    const propiedad = mapaCampos[campo];
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
    const total = Object.values(consolidado).reduce((sum, val) => sum + val, 0);
    const estadisticas = Object.entries(consolidado).map(([clave, cantidad]) => ({
      [campo === 'contratacion' ? 'tipo' : 
        campo === 'funcion' ? 'funcion' : 
        campo === 'escalafon' ? 'escalafon' : 
        campo === 'edad' || campo === 'antiguedad' ? 'rango' : 'genero']: clave,
      cantidad,
      porcentaje: parseFloat(((cantidad / total) * 100).toFixed(2)),
    })).sort((a, b) => b.cantidad - a.cantidad);
    res.json({ campo, total, estadisticas });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// Descargar PDF con los datos de una secretaría
const downloadSecretariaPDF = async (req, res) => {
  try {
    const secretariaId = req.params.id;
    const analisis = await AnalysisData.getLatestBySecretaria(secretariaId);
    if (!analisis) {
      return res.status(404).json({ message: 'No se encontraron datos para esta secretaría' });
    }

    // Crear el PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${analisis.secretariaNombre}.pdf"`);
    doc.pipe(res);

    // Título
    doc.fontSize(18).text(`Análisis de Secretaría: ${analisis.secretariaNombre}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Fecha de análisis: ${analisis.analysisDate.toLocaleDateString()}`);
    doc.text(`Total de agentes: ${analisis.data.totalAgentes}`);
    doc.text(`Sueldo promedio: $${analisis.data.analisisSalarial.sueldoPromedio.toFixed(2)}`);
    doc.text(`Masa salarial: $${analisis.data.analisisSalarial.masaTotal.toFixed(2)}`);
    doc.moveDown();

    // Análisis por categorías
    const categorias = [
      { titulo: 'Contratación', datos: analisis.data.agentesPorContratacion, campo: 'tipo' },
      { titulo: 'Función', datos: analisis.data.agentesPorFuncion, campo: 'funcion' },
      { titulo: 'Escalafón', datos: analisis.data.agentesPorEscalafon, campo: 'escalafon' },
      { titulo: 'Edad', datos: analisis.data.agentesPorRangoEdad, campo: 'rango' },
      { titulo: 'Antigüedad', datos: analisis.data.agentesPorAntiguedad, campo: 'rango' },
      { titulo: 'Género', datos: analisis.data.agentesPorGenero, campo: 'genero' },
    ];
    categorias.forEach(cat => {
      doc.fontSize(14).text(cat.titulo, { underline: true });
      cat.datos.forEach(item => {
        doc.fontSize(12).text(`${item[cat.campo]}: ${item.cantidad} (${item.porcentaje}%)`);
      });
      doc.moveDown();
    });

    // Información del archivo
    doc.fontSize(10).text(`Archivo original: ${analisis.archivoInfo.nombreArchivo}`);
    doc.text(`Fecha de carga: ${analisis.archivoInfo.fechaCarga.toLocaleDateString()}`);
    doc.text(`Total de registros: ${analisis.archivoInfo.totalRegistros}`);
    doc.text(`Versión: ${analisis.version}`);

    doc.end();
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ message: 'Error generando el PDF' });
  }
};

// Obtener historial de cargas de una secretaría
const getHistorialSecretaria = async (req, res) => {
  try {
    const secretariaId = req.params.id;
    const historial = await AnalysisData.find({ secretariaId })
      .sort({ analysisDate: -1 })
      .populate('archivoInfo.usuarioId', 'username email');
    const resultado = historial.map(item => ({
      version: item.version,
      fecha: item.analysisDate,
      archivo: item.archivoInfo?.nombreArchivo,
      usuario: item.archivoInfo?.usuarioId?.username || 'Desconocido',
      totalRegistros: item.archivoInfo?.totalRegistros,
    }));
    res.json(resultado);
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = {
  getSecretarias,
  getSecretariaById,
  getResumen,
  compararSecretarias,
  getEstadisticasPorCampo,
  downloadSecretariaPDF,
  getHistorialSecretaria
}; 