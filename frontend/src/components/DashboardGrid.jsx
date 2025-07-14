import React, { useState, useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Switch,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Fullscreen as FullscreenIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useDashboard } from '../context/DashboardContext';
import { useNotifications } from '../context/NotificationContext';
import CustomBarChart from './BarChart';
import CustomPieChart from './PieChart';
import StatsWidget from './StatsWidget';
import HistogramWidget from './HistogramWidget';
import TreemapWidget from './TreemapWidget';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DashboardGrid = ({ data, secretariaId }) => {
  const {
    getEnabledWidgets,
    updateWidget,
    removeWidget,
    updateLayout,
    layouts,
    dashboardSettings,
  } = useDashboard();

  const { showToast } = useNotifications();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedWidget, setSelectedWidget] = useState(null);

  const enabledWidgets = getEnabledWidgets();

  const handleMenuOpen = (event, widget) => {
    setMenuAnchor(event.currentTarget);
    setSelectedWidget(widget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedWidget(null);
  };

  const handleLayoutChange = useCallback((layout, layouts) => {
    Object.keys(layouts).forEach(breakpoint => {
      updateLayout(breakpoint, layouts[breakpoint]);
    });
  }, [updateLayout]);

  const handleRemoveWidget = () => {
    if (selectedWidget) {
      removeWidget(selectedWidget.id);
      showToast(`Widget "${selectedWidget.title}" eliminado`, 'info');
    }
    handleMenuClose();
  };

  const handleConfigureWidget = () => {
    // Aquí se abriría un modal de configuración
    if (selectedWidget) {
      showToast(`Configuración de "${selectedWidget.title}"`, 'info');
    }
    handleMenuClose();
  };

  const handleExportWidget = () => {
    if (selectedWidget) {
      showToast(`Exportando "${selectedWidget.title}"...`, 'loading');
      // Lógica de exportación
    }
    handleMenuClose();
  };

  const renderWidget = (widget) => {
    const widgetData = data?.[widget.dataKey];

    if (!widgetData && widget.dataKey !== 'resumen') {
      return (
        <Card elevation={2} sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No hay datos disponibles
          </Typography>
        </Card>
      );
    }

    let content;
    switch (widget.type) {
      case 'bar':
        content = (
          <CustomBarChart
            data={widgetData}
            xKey={widget.config.xKey}
            barKey={widget.config.barKey}
            title=""
            color={widget.config.color}
          />
        );
        break;
      case 'pie':
        content = (
          <CustomPieChart
            data={widgetData}
            dataKey={widget.config.dataKey}
            nameKey={widget.config.nameKey}
            title=""
          />
        );
        break;
      case 'stats':
        content = <StatsWidget data={data?.resumen} />;
        break;
      case 'histogram':
        content = (
          <HistogramWidget
            data={widgetData}
            xKey={widget.config.xKey}
            barKey={widget.config.barKey}
            color={widget.config.color}
          />
        );
        break;
      case 'treemap':
        content = <TreemapWidget data={widgetData} />;
        break;
      default:
        content = (
          <Typography variant="body2" color="text.secondary">
            Tipo de widget no soportado: {widget.type}
          </Typography>
        );
    }

    return (
      <Card
        elevation={dashboardSettings.compactMode ? 1 : 2}
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:hover .widget-actions': { opacity: 1 },
        }}
      >
        <CardHeader
          title={widget.title}
          titleTypographyProps={{
            variant: dashboardSettings.compactMode ? 'subtitle1' : 'h6',
            noWrap: true,
          }}
          action={
            <Box className="widget-actions" sx={{ opacity: 0, transition: 'opacity 0.2s' }}>
              <Tooltip title="Opciones">
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, widget)}
                  aria-label="opciones del widget"
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            </Box>
          }
          sx={{
            pb: dashboardSettings.compactMode ? 1 : 2,
          }}
        />
        <CardContent sx={{ flexGrow: 1, pt: 0, '&:last-child': { pb: 2 } }}>
          {content}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ width: '100%', minHeight: '400px' }}>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        isDraggable={true}
        isResizable={true}
        compactType="vertical"
        preventCollision={false}
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {enabledWidgets.map((widget) => (
          <div key={widget.id} data-grid={widget.position}>
            {renderWidget(widget)}
          </div>
        ))}
      </ResponsiveGridLayout>

      {/* Menú contextual de widgets */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleConfigureWidget}>
          <SettingsIcon sx={{ mr: 1 }} fontSize="small" />
          Configurar
        </MenuItem>
        <MenuItem onClick={handleExportWidget}>
          <DownloadIcon sx={{ mr: 1 }} fontSize="small" />
          Exportar
        </MenuItem>
        <MenuItem onClick={handleRemoveWidget} sx={{ color: 'error.main' }}>
          <CloseIcon sx={{ mr: 1 }} fontSize="small" />
          Eliminar
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DashboardGrid;