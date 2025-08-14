import { useState, useCallback } from 'react';

let notificationId = 0;

const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = ++notificationId;
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      ...notification
    };

    setNotifications(prev => [...prev, newNotification]);
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Métodos de conveniencia para diferentes tipos
  const showSuccess = useCallback((title, message, duration) => {
    return addNotification({ type: 'success', title, message, duration });
  }, [addNotification]);

  const showError = useCallback((title, message, duration) => {
    return addNotification({ type: 'error', title, message, duration: duration || 7000 });
  }, [addNotification]);

  const showWarning = useCallback((title, message, duration) => {
    return addNotification({ type: 'warning', title, message, duration });
  }, [addNotification]);

  const showInfo = useCallback((title, message, duration) => {
    return addNotification({ type: 'info', title, message, duration });
  }, [addNotification]);

  const showEmail = useCallback((title, message, duration) => {
    return addNotification({ type: 'email', title, message, duration });
  }, [addNotification]);

  // Notificaciones específicas para el sistema de RRHH
  const notifyBajaCreada = useCallback((empleadoNombre, conEquiposPendientes = false) => {
    const message = conEquiposPendientes 
      ? 'Baja procesada. Email enviado a sistemas. ATENCIÓN: Equipos pendientes de devolución.'
      : 'Baja procesada exitosamente. Notificación enviada por email a sistemas.';
    
    const type = conEquiposPendientes ? 'warning' : 'success';
    
    return addNotification({
      type,
      title: `Baja procesada - ${empleadoNombre}`,
      message,
      duration: 8000
    });
  }, [addNotification]);

  const notifyEmailEnviado = useCallback((destinatarios) => {
    return addNotification({
      type: 'email',
      title: '📧 Email de notificación enviado',
      message: `Notificación enviada a: ${destinatarios.join(', ')}`,
      duration: 6000
    });
  }, [addNotification]);

  const notifyReservaCreada = useCallback((equipoNombre, empleadoNombre) => {
    return addNotification({
      type: 'success',
      title: '📅 Reserva creada exitosamente',
      message: `${equipoNombre} reservado para ${empleadoNombre}`,
      duration: 5000
    });
  }, [addNotification]);

  const notifyEstadoReserva = useCallback((accion, equipoNombre) => {
    const acciones = {
      'confirmada': { emoji: '✅', text: 'confirmada' },
      'en_curso': { emoji: '🚀', text: 'iniciada' },
      'finalizada': { emoji: '✅', text: 'finalizada' },
      'cancelada': { emoji: '❌', text: 'cancelada' }
    };

    const { emoji, text } = acciones[accion] || { emoji: '📝', text: accion };

    return addNotification({
      type: accion === 'cancelada' ? 'warning' : 'success',
      title: `${emoji} Reserva ${text}`,
      message: `${equipoNombre} - Estado actualizado`,
      duration: 4000
    });
  }, [addNotification]);

  const notifyValidationError = useCallback((campos) => {
    const message = Array.isArray(campos) 
      ? `Campos requeridos: ${campos.join(', ')}`
      : campos;
    
    return addNotification({
      type: 'error',
      title: '⚠️ Error de validación',
      message,
      duration: 6000
    });
  }, [addNotification]);

  const notifyConflictoReserva = useCallback((equipoNombre, fechaConflicto) => {
    return addNotification({
      type: 'warning',
      title: '⚠️ Conflicto de reserva',
      message: `${equipoNombre} no está disponible para ${fechaConflicto}`,
      duration: 7000
    });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showEmail,
    // Métodos específicos del sistema
    notifyBajaCreada,
    notifyEmailEnviado,
    notifyReservaCreada,
    notifyEstadoReserva,
    notifyValidationError,
    notifyConflictoReserva
  };
};

export default useNotifications;
