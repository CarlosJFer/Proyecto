import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import apiClient from '../services/api';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe ser usado dentro de un NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState({
    email: true,
    push: true,
    desktop: true,
    fileUploads: true,
    dataChanges: true,
    systemAlerts: true,
    weeklyReports: false,
    monthlyReports: true,
  });

  // Cargar configuraciones de notificaciones
  useEffect(() => {
    if (user) {
      const savedSettings = localStorage.getItem(`notification-settings-${user.id}`);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
      loadNotifications();
    }
  }, [user]);

  // Guardar configuraciones automáticamente
  useEffect(() => {
    if (user) {
      localStorage.setItem(`notification-settings-${user.id}`, JSON.stringify(settings));
    }
  }, [settings, user]);

  const loadNotifications = async () => {
    try {
      const response = await apiClient.get('/notifications');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  };

  const showToast = useCallback((message, type = 'success', options = {}) => {
    const toastOptions = {
      duration: 4000,
      position: 'top-right',
      ...options,
    };

    switch (type) {
      case 'success':
        return toast.success(message, toastOptions);
      case 'error':
        return toast.error(message, toastOptions);
      case 'warning':
        return toast(message, {
          ...toastOptions,
          icon: '⚠️',
          style: { background: '#ff9800', color: 'white' },
        });
      case 'info':
        return toast(message, {
          ...toastOptions,
          icon: 'ℹ️',
          style: { background: '#2196f3', color: 'white' },
        });
      case 'loading':
        return toast.loading(message, toastOptions);
      default:
        return toast(message, toastOptions);
    }
  }, []);

  const showPromiseToast = useCallback((promise, messages) => {
    return toast.promise(promise, {
      loading: messages.loading || 'Cargando...',
      success: messages.success || 'Operación completada',
      error: messages.error || 'Ha ocurrido un error',
    });
  }, []);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Mostrar notificación de escritorio si está habilitada
    if (settings.desktop && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title || 'Nueva notificación', {
        body: notification.message,
        icon: '/favicon.ico',
        tag: newNotification.id,
      });
    }

    return newNotification.id;
  }, [settings.desktop]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await apiClient.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marcando todas las notificaciones como leídas:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error eliminando notificación:', error);
    }
  }, [notifications]);

  const clearAllNotifications = useCallback(async () => {
    try {
      await apiClient.delete('/notifications/all');
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error limpiando notificaciones:', error);
    }
  }, []);

  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Solicitar permisos para notificaciones de escritorio
  const requestDesktopPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  // Configurar WebSocket para notificaciones en tiempo real
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user || !settings.push || !token) return;
    const eventSource = new EventSource(`/api/notifications/stream?token=${token}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.notifications) {
          data.notifications.forEach(addNotification);
        }
      } catch (error) {
        console.error('Error procesando notificación:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Error en el stream de notificaciones:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [user, settings.push, addNotification]);

  const value = {
    notifications,
    unreadCount,
    settings,
    showToast,
    showPromiseToast,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    updateSettings,
    requestDesktopPermission,
    loadNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '8px',
          },
          success: {
            style: {
              background: '#4caf50',
            },
          },
          error: {
            style: {
              background: '#f44336',
            },
          },
        }}
      />
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;