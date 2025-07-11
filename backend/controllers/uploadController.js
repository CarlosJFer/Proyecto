const XLSX = require('xlsx');
const fs = require('fs');
const AnalysisData = require('../models/AnalysisData');

// Funciones auxiliares (puedes moverlas aquí o importarlas si prefieres)
const calcularPorcentaje = (parte, total) => {
  return total > 0 ? ((parte / total) * 100).toFixed(2) : 0;
};

const agruparPorCampo = (datos, campo) => {
  const grupos = {};
  datos.forEach(registro => {
    const valor = registro[campo] || 'No especificado';
    grupos[valor] = (grupos[valor] || 0) + 1;
  });
  return grupos;
};

const calcularRangoEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return 'No especificado';
  const edad = new Date().getFullYear() - new Date(fechaNacimiento).getFullYear();
  if (edad < 25) return '18-25';
  if (edad < 35) return '26-35';
  if (edad < 45) return '36-45';
  if (edad < 55) return '46-55';
  if (edad < 65) return '56-65';
  return '65+';
};

const calcularAntiguedad = (fechaIngreso) => {
  if (!fechaIngreso) return 'No especificado';
  const años = (new Date() - new Date(fechaIngreso)) / (365.25 * 24 * 60 * 60 * 1000);
  if (años < 5) return '0-5 años';
  if (años < 10) return '6-10 años';
  if (años < 15) return '11-15 años';
  if (años < 20) return '16-20 años';
  if (años < 25) return '21-25 años';
  return '25+ años';
};

const procesarDatosExcel = (datosExcel) => {
  const totalRegistros = datosExcel.length;
  const porContratacion = agruparPorCampo(datosExcel, 'TIPO_CONTRATACION');
  const agentesPorContratacion = Object.entries(porContratacion).map(([tipo, cantidad]) => ({ tipo, cantidad, porcentaje: parseFloat(calcularPorcentaje(cantidad, totalRegistros)) }));
  const porFuncion = agruparPorCampo(datosExcel, 'FUNCION');
  const agentesPorFuncion = Object.entries(porFuncion).map(([funcion, cantidad]) => ({ funcion, cantidad, porcentaje: parseFloat(calcularPorcentaje(cantidad, totalRegistros)) }));
  const porEscalafon = agruparPorCampo(datosExcel, 'ESCALAFON');
  const agentesPorEscalafon = Object.entries(porEscalafon).map(([escalafon, cantidad]) => ({ escalafon, cantidad, porcentaje: parseFloat(calcularPorcentaje(cantidad, totalRegistros)) }));
  const edades = {};
  datosExcel.forEach(registro => { const rango = calcularRangoEdad(registro.FECHA_NACIMIENTO); edades[rango] = (edades[rango] || 0) + 1; });
  const agentesPorRangoEdad = Object.entries(edades).map(([rango, cantidad]) => ({ rango, cantidad, porcentaje: parseFloat(calcularPorcentaje(cantidad, totalRegistros)) }));
  const antiguedades = {};
  datosExcel.forEach(registro => { const rango = calcularAntiguedad(registro.FECHA_INGRESO); antiguedades[rango] = (antiguedades[rango] || 0) + 1; });
  const agentesPorAntiguedad = Object.entries(antiguedades).map(([rango, cantidad]) => ({ rango, cantidad, porcentaje: parseFloat(calcularPorcentaje(cantidad, totalRegistros)) }));
  const porGenero = agruparPorCampo(datosExcel, 'GENERO');
  const agentesPorGenero = Object.entries(porGenero).map(([genero, cantidad]) => ({ genero, cantidad, porcentaje: parseFloat(calcularPorcentaje(cantidad, totalRegistros)) }));
  const sueldos = datosExcel.map(registro => parseFloat(registro.SUELDO_BASICO) || 0).filter(sueldo => sueldo > 0);
  const analisisSalarial = {
    sueldoPromedio: sueldos.length > 0 ? sueldos.reduce((a, b) => a + b, 0) / sueldos.length : 0,
    sueldoMinimo: sueldos.length > 0 ? Math.min(...sueldos) : 0,
    sueldoMaximo: sueldos.length > 0 ? Math.max(...sueldos) : 0,
    masaTotal: sueldos.reduce((a, b) => a + b, 0),
  };
  return {
    totalAgentes: totalRegistros,
    agentesPorContratacion,
    agentesPorFuncion,
    agentesPorEscalafon,
    agentesPorRangoEdad,
    agentesPorAntiguedad,
    agentesPorGenero,
    analisisSalarial,
  };
};

// Subir y procesar archivo Excel
const uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se subió ningún archivo' });
    }
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const datosExcel = XLSX.utils.sheet_to_json(worksheet);
    if (datosExcel.length === 0) {
      return res.status(400).json({ message: 'El archivo Excel está vacío' });
    }
    const porSecretaria = {};
    datosExcel.forEach(registro => {
      const secretaria = registro.SECRETARIA || 'No especificada';
      if (!porSecretaria[secretaria]) {
        porSecretaria[secretaria] = [];
      }
      porSecretaria[secretaria].push(registro);
    });
    const resultados = [];
    for (const [secretariaNombre, datosSecretaria] of Object.entries(porSecretaria)) {
      const datosAnalisis = procesarDatosExcel(datosSecretaria);
      const secretariaId = secretariaNombre.toLowerCase().replace(/\s+/g, '-');
      await AnalysisData.updateMany(
        { secretariaId, activo: true },
        { activo: false }
      );
      const nuevoAnalisis = new AnalysisData({
        secretariaId,
        secretariaNombre,
        data: datosAnalisis,
        archivoInfo: {
          nombreArchivo: req.file.originalname,
          fechaCarga: new Date(),
          totalRegistros: datosSecretaria.length,
          usuarioId: req.user._id,
        },
      });
      await nuevoAnalisis.save();
      resultados.push({
        secretaria: secretariaNombre,
        totalRegistros: datosSecretaria.length,
        procesado: true,
      });
    }
    fs.unlinkSync(req.file.path);
    res.json({
      message: 'Archivo procesado exitosamente',
      resultados,
      totalSecretarias: Object.keys(porSecretaria).length,
      totalRegistros: datosExcel.length,
    });
  } catch (error) {
    console.error('Error procesando archivo:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Error procesando el archivo' });
  }
};

module.exports = {
  uploadExcel
}; 