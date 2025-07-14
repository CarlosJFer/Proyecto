import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  IconButton,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Button,
  Typography,
  Slider,
  Switch,
  FormControlLabel,
  Autocomplete,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { useDashboard } from '../context/DashboardContext';
import { useNotifications } from '../context/NotificationContext';

const AdvancedFilters = ({ onFiltersChange, availableData }) => {
  const { filters, updateFilters, clearFilters } = useDashboard();
  const { showToast } = useNotifications();
  const [expanded, setExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...localFilters, [filterKey]: value };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    updateFilters(localFilters);
    if (onFiltersChange) {
      onFiltersChange(localFilters);
    }
    showToast('Filtros aplicados correctamente', 'success');
  };

  const resetFilters = () => {
    clearFilters();
    setLocalFilters({
      dateRange: null,
      secretarias: [],
      tipoContratacion: [],
      genero: [],
      searchTerm: '',
      salaryRange: [0, 1000000],
      antiguedadRange: [0, 40],
      edad: { min: 18, max: 70 },
      estado: 'todos',
      departamento: [],
    });
    if (onFiltersChange) {
      onFiltersChange({});
    }
    showToast('Filtros reiniciados', 'info');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.searchTerm) count++;
    if (localFilters.secretarias?.length > 0) count++;
    if (localFilters.tipoContratacion?.length > 0) count++;
    if (localFilters.genero?.length > 0) count++;
    if (localFilters.departamento?.length > 0) count++;
    if (localFilters.dateRange) count++;
    if (localFilters.estado !== 'todos') count++;
    return count;
  };

  // Opciones disponibles (estas vendrían del backend en una implementación real)
  const tiposContratacion = ['Planta Permanente', 'Planta Transitoria', 'Contrato', 'Pasantía'];
  const generos = ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir'];
  const secretariasDisponibles = availableData?.secretarias || [];
  const departamentos = availableData?.departamentos || [];
  const estados = [
    { value: 'todos', label: 'Todos' },
    { value: 'activo', label: 'Activos' },
    { value: 'inactivo', label: 'Inactivos' },
    { value: 'licencia', label: 'En Licencia' },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Card data-tour="dashboard-filters" sx={{ mb: 2 }}>
        <CardHeader
          avatar={<FilterIcon />}
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getActiveFiltersCount() > 0 && (
                <Chip
                  label={`${getActiveFiltersCount()} filtros activos`}
                  size="small"
                  color="primary"
                />
              )}
              <IconButton
                onClick={handleExpandClick}
                aria-expanded={expanded}
                aria-label="mostrar filtros"
                sx={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              >
                <ExpandMoreIcon />
              </IconButton>
            </Box>
          }
          title="Filtros Avanzados"
          titleTypographyProps={{ variant: 'h6' }}
        />
        
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent>
            <Grid container spacing={3}>
              {/* Búsqueda por texto */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Búsqueda global"
                  placeholder="Buscar por nombre, DNI, cargo..."
                  value={localFilters.searchTerm || ''}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  InputProps={{
                    endAdornment: <SearchIcon />,
                  }}
                />
              </Grid>

              {/* Rango de fechas */}
              <Grid item xs={12} md={4}>
                <DatePicker
                  label="Fecha desde"
                  value={localFilters.dateRange?.start || null}
                  onChange={(date) => handleFilterChange('dateRange', {
                    ...localFilters.dateRange,
                    start: date
                  })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <DatePicker
                  label="Fecha hasta"
                  value={localFilters.dateRange?.end || null}
                  onChange={(date) => handleFilterChange('dateRange', {
                    ...localFilters.dateRange,
                    end: date
                  })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              {/* Secretarías */}
              <Grid item xs={12} md={6}>
                <Autocomplete
                  multiple
                  options={secretariasDisponibles}
                  getOptionLabel={(option) => option.nombre || option}
                  value={localFilters.secretarias || []}
                  onChange={(event, newValue) => handleFilterChange('secretarias', newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Secretarías" placeholder="Seleccionar secretarías" />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option.nombre || option}
                        {...getTagProps({ index })}
                        key={index}
                      />
                    ))
                  }
                />
              </Grid>

              {/* Tipo de contratación */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Contratación</InputLabel>
                  <Select
                    multiple
                    value={localFilters.tipoContratacion || []}
                    onChange={(e) => handleFilterChange('tipoContratacion', e.target.value)}
                    input={<OutlinedInput label="Tipo de Contratación" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {tiposContratacion.map((tipo) => (
                      <MenuItem key={tipo} value={tipo}>
                        {tipo}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Género */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Género</InputLabel>
                  <Select
                    multiple
                    value={localFilters.genero || []}
                    onChange={(e) => handleFilterChange('genero', e.target.value)}
                    input={<OutlinedInput label="Género" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {generos.map((genero) => (
                      <MenuItem key={genero} value={genero}>
                        {genero}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Estado */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={localFilters.estado || 'todos'}
                    onChange={(e) => handleFilterChange('estado', e.target.value)}
                    label="Estado"
                  >
                    {estados.map((estado) => (
                      <MenuItem key={estado.value} value={estado.value}>
                        {estado.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Departamentos */}
              <Grid item xs={12} md={4}>
                <Autocomplete
                  multiple
                  options={departamentos}
                  getOptionLabel={(option) => option.nombre || option}
                  value={localFilters.departamento || []}
                  onChange={(event, newValue) => handleFilterChange('departamento', newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Departamentos" placeholder="Seleccionar departamentos" />
                  )}
                />
              </Grid>

              {/* Rango salarial */}
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Rango Salarial (ARS)</Typography>
                <Slider
                  value={localFilters.salaryRange || [0, 1000000]}
                  onChange={(e, newValue) => handleFilterChange('salaryRange', newValue)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={1000000}
                  step={10000}
                  marks={[
                    { value: 0, label: '$0' },
                    { value: 500000, label: '$500K' },
                    { value: 1000000, label: '$1M' },
                  ]}
                  valueLabelFormat={(value) => `$${value.toLocaleString('es-AR')}`}
                />
              </Grid>

              {/* Rango de antigüedad */}
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Antigüedad (años)</Typography>
                <Slider
                  value={localFilters.antiguedadRange || [0, 40]}
                  onChange={(e, newValue) => handleFilterChange('antiguedadRange', newValue)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={40}
                  step={1}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 20, label: '20' },
                    { value: 40, label: '40' },
                  ]}
                  valueLabelFormat={(value) => `${value} años`}
                />
              </Grid>

              {/* Botones de acción */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={resetFilters}
                  >
                    Limpiar Filtros
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<FilterIcon />}
                    onClick={applyFilters}
                  >
                    Aplicar Filtros
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Collapse>
      </Card>
    </LocalizationProvider>
  );
};

export default AdvancedFilters;