import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  TextField,
  Typography,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Code as JsonIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { useNotifications } from '../context/NotificationContext';
import { useDashboard } from '../context/DashboardContext';
import apiClient from '../services/api';

const ExportOptions = ({ data, secretariaId, widgetId = null }) => {
  const { showToast, showPromiseToast } = useNotifications();
  const { getEnabledWidgets, dashboardSettings } = useDashboard();
  const [anchorEl, setAnchorEl] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [exportOptions, setExportOptions] = useState({
    includeCharts: true,
    includeData: true,
    includeFilters: true,
    includeSummary: true,
    orientation: 'landscape',
    paperSize: 'a4',
    quality: 'high',
    fileName: `analisis-dotacion-${new Date().toISOString().split('T')[0]}`,
  });
  const [loading, setLoading] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const openExportDialog = (format) => {
    setSelectedFormat(format);
    setDialogOpen(true);
    handleMenuClose();
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedFormat('pdf');
  };

  const handleOptionChange = (option, value) => {
    setExportOptions(prev => ({ ...prev, [option]: value }));
  };

  const exportToPDF = async () => {
    try {
      setLoading(true);
      
      // Capturar el contenedor del dashboard
      const element = document.querySelector('[data-tour="widget-grid"]') || document.body;
      const canvas = await html2canvas(element, {
        scale: exportOptions.quality === 'high' ? 2 : 1,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: exportOptions.orientation,
        unit: 'mm',
        format: exportOptions.paperSize,
      });

      // Calcular dimensiones
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      // Añadir título
      pdf.setFontSize(16);
      pdf.text('Análisis de Dotación de Personal', pdfWidth / 2, 20, { align: 'center' });
      
      if (data?.secretaria?.nombre) {
        pdf.setFontSize(12);
        pdf.text(`Secretaría: ${data.secretaria.nombre}`, pdfWidth / 2, 25, { align: 'center' });
      }

      // Añadir imagen del dashboard
      if (exportOptions.includeCharts) {
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      }

      // Añadir datos tabulares si se selecciona
      if (exportOptions.includeData && data) {
        pdf.addPage();
        pdf.setFontSize(14);
        pdf.text('Datos Detallados', 20, 20);
        
        let yPos = 40;
        
        if (data.resumen) {
          pdf.setFontSize(12);
          pdf.text('Resumen General:', 20, yPos);
          yPos += 10;
          pdf.text(`Total de Agentes: ${data.resumen.totalAgentes}`, 20, yPos);
          yPos += 6;
          pdf.text(`Masa Salarial: $${data.resumen.masaSalarial?.toLocaleString('es-AR')}`, 20, yPos);
          yPos += 6;
          pdf.text(`Sueldo Promedio: $${data.resumen.sueldoPromedio?.toLocaleString('es-AR')}`, 20, yPos);
          yPos += 15;
        }

        if (data.analisis?.contratacion) {
          pdf.text('Distribución por Contratación:', 20, yPos);
          yPos += 10;
          data.analisis.contratacion.forEach(item => {
            pdf.text(`${item.tipo}: ${item.cantidad} (${item.porcentaje}%)`, 25, yPos);
            yPos += 6;
          });
        }
      }

      // Guardar archivo
      pdf.save(`${exportOptions.fileName}.pdf`);
      showToast('PDF exportado correctamente', 'success');
    } catch (error) {
      console.error('Error exportando PDF:', error);
      showToast('Error al exportar PDF', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      setLoading(true);
      
      const workbook = XLSX.utils.book_new();

      // Hoja de resumen
      if (exportOptions.includeSummary && data?.resumen) {
        const summaryData = [
          ['Métrica', 'Valor'],
          ['Total de Agentes', data.resumen.totalAgentes],
          ['Masa Salarial', data.resumen.masaSalarial],
          ['Sueldo Promedio', data.resumen.sueldoPromedio],
          ['Última Actualización', data.secretaria?.ultimaActualizacion],
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
      }

      // Hoja de contratación
      if (data?.analisis?.contratacion) {
        const contractData = [
          ['Tipo de Contratación', 'Cantidad', 'Porcentaje'],
          ...data.analisis.contratacion.map(item => [item.tipo, item.cantidad, item.porcentaje])
        ];
        const contractSheet = XLSX.utils.aoa_to_sheet(contractData);
        XLSX.utils.book_append_sheet(workbook, contractSheet, 'Contratación');
      }

      // Hoja de género
      if (data?.analisis?.genero) {
        const genderData = [
          ['Género', 'Cantidad', 'Porcentaje'],
          ...data.analisis.genero.map(item => [item.genero, item.cantidad, item.porcentaje])
        ];
        const genderSheet = XLSX.utils.aoa_to_sheet(genderData);
        XLSX.utils.book_append_sheet(workbook, genderSheet, 'Género');
      }

      // Hoja de antigüedad
      if (data?.analisis?.antiguedad) {
        const ageData = [
          ['Rango de Antigüedad', 'Cantidad', 'Porcentaje'],
          ...data.analisis.antiguedad.map(item => [item.rango, item.cantidad, item.porcentaje])
        ];
        const ageSheet = XLSX.utils.aoa_to_sheet(ageData);
        XLSX.utils.book_append_sheet(workbook, ageSheet, 'Antigüedad');
      }

      // Guardar archivo
      XLSX.writeFile(workbook, `${exportOptions.fileName}.xlsx`);
      showToast('Excel exportado correctamente', 'success');
    } catch (error) {
      console.error('Error exportando Excel:', error);
      showToast('Error al exportar Excel', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportToJSON = async () => {
    try {
      setLoading(true);
      
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          secretaria: data?.secretaria?.nombre,
          filters: exportOptions.includeFilters ? useDashboard().filters : null,
        },
        data: data,
        widgets: exportOptions.includeCharts ? getEnabledWidgets() : null,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      saveAs(blob, `${exportOptions.fileName}.json`);
      showToast('JSON exportado correctamente', 'success');
    } catch (error) {
      console.error('Error exportando JSON:', error);
      showToast('Error al exportar JSON', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportToImage = async () => {
    try {
      setLoading(true);
      
      const element = document.querySelector('[data-tour="widget-grid"]') || document.body;
      const canvas = await html2canvas(element, {
        scale: exportOptions.quality === 'high' ? 2 : 1,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      canvas.toBlob(blob => {
        saveAs(blob, `${exportOptions.fileName}.png`);
        showToast('Imagen exportada correctamente', 'success');
        setLoading(false);
      });
    } catch (error) {
      console.error('Error exportando imagen:', error);
      showToast('Error al exportar imagen', 'error');
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setDialogOpen(false);
    
    switch (selectedFormat) {
      case 'pdf':
        await exportToPDF();
        break;
      case 'excel':
        await exportToExcel();
        break;
      case 'json':
        await exportToJSON();
        break;
      case 'image':
        await exportToImage();
        break;
      default:
        showToast('Formato de exportación no soportado', 'error');
    }
  };

  const formatOptions = [
    { value: 'pdf', label: 'PDF', icon: <PdfIcon />, description: 'Documento portable con gráficos' },
    { value: 'excel', label: 'Excel', icon: <ExcelIcon />, description: 'Hojas de cálculo con datos' },
    { value: 'json', label: 'JSON', icon: <JsonIcon />, description: 'Datos estructurados' },
    { value: 'image', label: 'Imagen', icon: <ImageIcon />, description: 'Captura visual del dashboard' },
  ];

  return (
    <>
      <Button
        variant="contained"
        startIcon={<DownloadIcon />}
        onClick={handleMenuOpen}
        data-tour="export-options"
        disabled={loading}
      >
        {loading ? <CircularProgress size={20} /> : 'Exportar'}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {formatOptions.map((format) => (
          <MenuItem key={format.value} onClick={() => openExportDialog(format.value)}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {format.icon}
              <Box>
                <Typography variant="body2">{format.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {format.description}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Menu>

      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Configurar Exportación - {formatOptions.find(f => f.value === selectedFormat)?.label}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Nombre del archivo"
              value={exportOptions.fileName}
              onChange={(e) => handleOptionChange('fileName', e.target.value)}
              sx={{ mb: 3 }}
            />

            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">Contenido a incluir</FormLabel>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exportOptions.includeCharts}
                      onChange={(e) => handleOptionChange('includeCharts', e.target.checked)}
                    />
                  }
                  label="Gráficos y visualizaciones"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exportOptions.includeData}
                      onChange={(e) => handleOptionChange('includeData', e.target.checked)}
                    />
                  }
                  label="Datos tabulares"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exportOptions.includeSummary}
                      onChange={(e) => handleOptionChange('includeSummary', e.target.checked)}
                    />
                  }
                  label="Resumen ejecutivo"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exportOptions.includeFilters}
                      onChange={(e) => handleOptionChange('includeFilters', e.target.checked)}
                    />
                  }
                  label="Filtros aplicados"
                />
              </FormGroup>
            </FormControl>

            {selectedFormat === 'pdf' && (
              <>
                <Divider sx={{ my: 2 }} />
                <FormControl component="fieldset" sx={{ mb: 2 }}>
                  <FormLabel component="legend">Orientación</FormLabel>
                  <RadioGroup
                    value={exportOptions.orientation}
                    onChange={(e) => handleOptionChange('orientation', e.target.value)}
                    row
                  >
                    <FormControlLabel value="landscape" control={<Radio />} label="Horizontal" />
                    <FormControlLabel value="portrait" control={<Radio />} label="Vertical" />
                  </RadioGroup>
                </FormControl>

                <FormControl component="fieldset" sx={{ mb: 2 }}>
                  <FormLabel component="legend">Tamaño de papel</FormLabel>
                  <RadioGroup
                    value={exportOptions.paperSize}
                    onChange={(e) => handleOptionChange('paperSize', e.target.value)}
                    row
                  >
                    <FormControlLabel value="a4" control={<Radio />} label="A4" />
                    <FormControlLabel value="letter" control={<Radio />} label="Carta" />
                    <FormControlLabel value="legal" control={<Radio />} label="Legal" />
                  </RadioGroup>
                </FormControl>
              </>
            )}

            {(selectedFormat === 'pdf' || selectedFormat === 'image') && (
              <>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Calidad</FormLabel>
                  <RadioGroup
                    value={exportOptions.quality}
                    onChange={(e) => handleOptionChange('quality', e.target.value)}
                    row
                  >
                    <FormControlLabel value="standard" control={<Radio />} label="Estándar" />
                    <FormControlLabel value="high" control={<Radio />} label="Alta" />
                  </RadioGroup>
                </FormControl>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancelar</Button>
          <Button onClick={handleExport} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Exportar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ExportOptions;