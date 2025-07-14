import React, { useState, useEffect } from 'react';
import Joyride, { STATUS, EVENTS } from 'react-joyride';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const TourGuide = ({ isActive, onComplete, tourType = 'dashboard' }) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (isActive) {
      setRun(true);
      setStepIndex(0);
    }
  }, [isActive]);

  const dashboardSteps = [
    {
      target: '.navbar',
      content: '¡Bienvenido! Este es el menú de navegación principal donde puedes acceder a todas las secciones de la aplicación.',
      title: 'Bienvenido a Análisis de Dotación',
      placement: 'bottom',
    },
    {
      target: '[data-tour="secretaria-selector"]',
      content: 'Aquí puedes seleccionar la secretaría que deseas analizar. Los datos se actualizarán automáticamente.',
      title: 'Selector de Secretaría',
      placement: 'bottom',
    },
    {
      target: '[data-tour="dashboard-filters"]',
      content: 'Utiliza estos filtros para refinar los datos mostrados. Puedes filtrar por fechas, tipo de contratación, género y más.',
      title: 'Filtros de Datos',
      placement: 'bottom',
    },
    {
      target: '[data-tour="widget-grid"]',
      content: 'Este es tu dashboard personalizable. Puedes arrastrar, redimensionar y reconfigurar los widgets según tus necesidades.',
      title: 'Dashboard Personalizable',
      placement: 'top',
    },
    {
      target: '[data-tour="widget-menu"]',
      content: 'Haz clic en los tres puntos de cualquier widget para acceder a opciones como configurar, exportar o eliminar.',
      title: 'Opciones de Widgets',
      placement: 'left',
    },
    {
      target: '[data-tour="export-options"]',
      content: 'Desde aquí puedes exportar tus reportes en diferentes formatos: PDF, Excel o JSON.',
      title: 'Exportación de Datos',
      placement: 'bottom',
    },
    {
      target: '[data-tour="theme-toggle"]',
      content: 'Cambia entre tema claro y oscuro según tu preferencia. También puedes ajustar configuraciones de accesibilidad.',
      title: 'Personalización de Tema',
      placement: 'bottom',
    },
    {
      target: '[data-tour="notifications"]',
      content: 'Aquí recibirás notificaciones sobre cargas de archivos, cambios importantes y alertas del sistema.',
      title: 'Centro de Notificaciones',
      placement: 'bottom',
    },
  ];

  const adminSteps = [
    {
      target: '[data-tour="admin-panel"]',
      content: 'Como administrador, tienes acceso a funciones adicionales para gestionar usuarios y configurar el sistema.',
      title: 'Panel de Administración',
      placement: 'bottom',
    },
    {
      target: '[data-tour="user-management"]',
      content: 'Gestiona usuarios, asigna roles y controla los permisos de acceso a diferentes secretarías.',
      title: 'Gestión de Usuarios',
      placement: 'bottom',
    },
    {
      target: '[data-tour="audit-logs"]',
      content: 'Revisa el historial completo de actividades, descargas y cambios realizados en el sistema.',
      title: 'Registros de Auditoría',
      placement: 'bottom',
    },
    {
      target: '[data-tour="system-settings"]',
      content: 'Configura integraciones con servicios externos, notificaciones automáticas y políticas de retención de datos.',
      title: 'Configuración del Sistema',
      placement: 'bottom',
    },
  ];

  const uploadSteps = [
    {
      target: '[data-tour="file-uploader"]',
      content: 'Arrastra y suelta archivos Excel aquí, o haz clic para seleccionarlos. El sistema validará automáticamente el formato.',
      title: 'Carga de Archivos',
      placement: 'top',
    },
    {
      target: '[data-tour="validation-preview"]',
      content: 'Antes de procesar, verás una vista previa de los datos para verificar que todo esté correcto.',
      title: 'Validación de Datos',
      placement: 'bottom',
    },
    {
      target: '[data-tour="processing-status"]',
      content: 'El procesamiento se realiza en segundo plano. Puedes seguir usando la aplicación mientras se completa.',
      title: 'Procesamiento en Background',
      placement: 'bottom',
    },
  ];

  const getSteps = () => {
    switch (tourType) {
      case 'admin':
        return [...dashboardSteps, ...adminSteps];
      case 'upload':
        return uploadSteps;
      case 'dashboard':
      default:
        return dashboardSteps;
    }
  };

  const handleJoyrideCallback = (data) => {
    const { status, type, index } = data;

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      setStepIndex(index + (type === EVENTS.STEP_AFTER ? 1 : 0));
    } else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      setStepIndex(0);
      
      // Marcar el tour como completado
      if (user) {
        const completedTours = JSON.parse(localStorage.getItem(`completed-tours-${user.id}`) || '[]');
        if (!completedTours.includes(tourType)) {
          completedTours.push(tourType);
          localStorage.setItem(`completed-tours-${user.id}`, JSON.stringify(completedTours));
        }
      }

      if (status === STATUS.FINISHED) {
        showToast('¡Tour completado! Ya puedes usar todas las funcionalidades.', 'success');
      }

      if (onComplete) {
        onComplete(status === STATUS.FINISHED);
      }
    }
  };

  const customStyles = {
    options: {
      primaryColor: '#1976d2',
      backgroundColor: '#fff',
      textColor: '#333',
      borderRadius: 8,
      zIndex: 9999,
    },
    tooltip: {
      fontSize: '16px',
      padding: '20px',
    },
    tooltipContainer: {
      textAlign: 'left',
    },
    tooltipTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '10px',
    },
    buttonNext: {
      backgroundColor: '#1976d2',
      fontSize: '14px',
      padding: '8px 16px',
    },
    buttonBack: {
      color: '#1976d2',
      fontSize: '14px',
      padding: '8px 16px',
    },
    buttonSkip: {
      color: '#666',
      fontSize: '14px',
    },
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      stepIndex={stepIndex}
      steps={getSteps()}
      styles={customStyles}
      locale={{
        back: 'Anterior',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        skip: 'Saltar tour',
      }}
      floaterProps={{
        disableAnimation: true,
      }}
    />
  );
};

export default TourGuide;