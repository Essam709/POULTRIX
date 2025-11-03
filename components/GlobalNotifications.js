import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';

const GlobalNotifications = () => {
  const { globalNotifications } = useContext(AppContext);

  // 🔥 التعديل: عرض آخر إشعار فقط بدلاً من جميع الإشعارات
  const lastNotification = globalNotifications && globalNotifications.length > 0 
    ? globalNotifications[globalNotifications.length - 1] 
    : null;

  if (!lastNotification) return null;

  return (
    <div className="global-notifications">
      <div 
        className={`global-notification ${lastNotification.type}`}
      >
        <div className="notification-content">
          <i className={`fas ${
            lastNotification.type === 'success' ? 'fa-check-circle' :
            lastNotification.type === 'error' ? 'fa-exclamation-triangle' :
            lastNotification.type === 'warning' ? 'fa-exclamation-circle' :
            'fa-info-circle'
          }`}></i>
          <span>{lastNotification.message}</span>
        </div>
      </div>
      
      <style jsx>{`
        .global-notifications {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          min-width: 300px;
        }
        
        .global-notification {
          padding: 15px 20px;
          border-radius: 10px;
          color: white;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
          animation: slideInRight 0.3s ease;
          border-left: 4px solid;
        }
        
        .global-notification.success {
          background: #28a745;
          border-left-color: #1e7e34;
        }
        
        .global-notification.error {
          background: #dc3545;
          border-left-color: #c82333;
        }
        
        .global-notification.info {
          background: #17a2b8;
          border-left-color: #138496;
        }
        
        .global-notification.warning {
          background: #ffc107;
          color: #212529;
          border-left-color: #e0a800;
        }
        
        .notification-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .notification-content i {
          font-size: 1.2rem;
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @media (max-width: 768px) {
          .global-notifications {
            right: 10px;
            left: 10px;
            min-width: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default GlobalNotifications;