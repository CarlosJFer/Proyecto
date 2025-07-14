import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const DashboardContext = createContext();

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard debe ser usado dentro de un DashboardProvider');
  }
  return context;
};

const DEFAULT_WIDGETS = [
  {
    id: 'contratacion-bar',
    type: 'bar',
    title: 'Distribución por Contratación',
    dataKey: 'contratacion',
    enabled: true,
    position: { x: 0, y: 0, w: 6, h: 4 },
    config: {
      xKey: 'tipo',
      barKey: 'cantidad',
      color: '#1976d2',
    },
  },
  {
    id: 'genero-pie',
    type: 'pie',
    title: 'Distribución por Género',
    dataKey: 'genero',
    enabled: true,
    position: { x: 6, y: 0, w: 6, h: 4 },
    config: {
      dataKey: 'cantidad',
      nameKey: 'genero',
    },
  },
  {
    id: 'antiguedad-bar',
    type: 'bar',
    title: 'Distribución por Antigüedad',
    dataKey: 'antiguedad',
    enabled: true,
    position: { x: 0, y: 4, w: 12, h: 4 },
    config: {
      xKey: 'rango',
      barKey: 'cantidad',
      color: '#dc004e',
    },
  },
  {
    id: 'resumen-stats',
    type: 'stats',
    title: 'Estadísticas Generales',
    dataKey: 'resumen',
    enabled: true,
    position: { x: 0, y: 8, w: 12, h: 2 },
    config: {},
  },
  {
    id: 'salarios-histogram',
    type: 'histogram',
    title: 'Distribución Salarial',
    dataKey: 'salarios',
    enabled: false,
    position: { x: 0, y: 10, w: 6, h: 4 },
    config: {
      xKey: 'rango',
      barKey: 'frecuencia',
      color: '#2e7d32',
    },
  },
  {
    id: 'departamentos-tree',
    type: 'treemap',
    title: 'Estructura Departamental',
    dataKey: 'departamentos',
    enabled: false,
    position: { x: 6, y: 10, w: 6, h: 4 },
    config: {},
  },
];

export const DashboardProvider = ({ children }) => {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS);
  const [layouts, setLayouts] = useState({});
  const [filters, setFilters] = useState({
    dateRange: null,
    secretarias: [],
    tipoContratacion: [],
    genero: [],
    searchTerm: '',
  });
  const [dashboardSettings, setDashboardSettings] = useState({
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutos
    compactMode: false,
    showFilters: true,
    exportFormat: 'pdf',
  });

  // Cargar configuración del usuario desde localStorage o API
  useEffect(() => {
    if (user) {
      const savedConfig = localStorage.getItem(`dashboard-config-${user.id}`);
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          if (config.widgets) setWidgets(config.widgets);
          if (config.layouts) setLayouts(config.layouts);
          if (config.filters) setFilters(config.filters);
          if (config.settings) setDashboardSettings(config.settings);
        } catch (error) {
          console.error('Error cargando configuración del dashboard:', error);
        }
      }
    }
  }, [user]);

  // Guardar configuración automáticamente
  useEffect(() => {
    if (user) {
      const config = {
        widgets,
        layouts,
        filters,
        settings: dashboardSettings,
      };
      localStorage.setItem(`dashboard-config-${user.id}`, JSON.stringify(config));
    }
  }, [widgets, layouts, filters, dashboardSettings, user]);

  const updateWidget = (widgetId, updates) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId ? { ...widget, ...updates } : widget
    ));
  };

  const toggleWidget = (widgetId) => {
    updateWidget(widgetId, { enabled: !widgets.find(w => w.id === widgetId)?.enabled });
  };

  const addCustomWidget = (widget) => {
    const newWidget = {
      ...widget,
      id: `custom-${Date.now()}`,
      position: { x: 0, y: 0, w: 6, h: 4 },
    };
    setWidgets(prev => [...prev, newWidget]);
  };

  const removeWidget = (widgetId) => {
    setWidgets(prev => prev.filter(widget => widget.id !== widgetId));
  };

  const reorderWidgets = (newWidgets) => {
    setWidgets(newWidgets);
  };

  const updateLayout = (breakpoint, layout) => {
    setLayouts(prev => ({
      ...prev,
      [breakpoint]: layout,
    }));
  };

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      dateRange: null,
      secretarias: [],
      tipoContratacion: [],
      genero: [],
      searchTerm: '',
    });
  };

  const updateDashboardSettings = (newSettings) => {
    setDashboardSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetDashboard = () => {
    setWidgets(DEFAULT_WIDGETS);
    setLayouts({});
    clearFilters();
    setDashboardSettings({
      autoRefresh: true,
      refreshInterval: 300000,
      compactMode: false,
      showFilters: true,
      exportFormat: 'pdf',
    });
  };

  const getEnabledWidgets = () => {
    return widgets.filter(widget => widget.enabled);
  };

  const getWidgetById = (id) => {
    return widgets.find(widget => widget.id === id);
  };

  const value = {
    widgets,
    layouts,
    filters,
    dashboardSettings,
    updateWidget,
    toggleWidget,
    addCustomWidget,
    removeWidget,
    reorderWidgets,
    updateLayout,
    updateFilters,
    clearFilters,
    updateDashboardSettings,
    resetDashboard,
    getEnabledWidgets,
    getWidgetById,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export default DashboardProvider;