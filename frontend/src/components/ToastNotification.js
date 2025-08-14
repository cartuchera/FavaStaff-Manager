import React, { useState, useEffect } from 'react';
import './ToastNotification.css';

const ToastNotification = ({ notifications, onRemove }) => {
  return (
    <div className="toast-container">
      {notifications.map((notification) => (
        <Toast 
          key={notification.id} 
          notification={notification} 
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

const Toast = ({ notification, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(notification.id);
    }, notification.duration || 5000);

    return () => clearTimeout(timer);
  }, [notification, onRemove]);

  const getToastClass = () => {
    const baseClass = 'toast';
    const typeClass = `toast-${notification.type}`;
    return `${baseClass} ${typeClass}`;
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'email': return '📧';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={getToastClass()}>
      <div className="toast-content">
        <span className="toast-icon">{getIcon()}</span>
        <div className="toast-text">
          <div className="toast-title">{notification.title}</div>
          {notification.message && (
            <div className="toast-message">{notification.message}</div>
          )}
        </div>
      </div>
      <button 
        className="toast-close" 
        onClick={() => onRemove(notification.id)}
        aria-label="Cerrar notificación"
      >
        ×
      </button>
    </div>
  );
};

export default ToastNotification;
