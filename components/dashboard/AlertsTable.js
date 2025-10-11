// components/dashboard/AlertsTable.js
import React, { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';

export default function AlertsTable({ alerts }) {
  const { language } = useContext(AppContext);

  // بيانات التنبيهات الافتراضية
  const defaultAlerts = [
    {
      id: 1,
      type: 'warning',
      message: 'ارتفاع في درجة الحرارة عن المعدل الطبيعي',
      time: '2024-01-15 14:30',
      sensor: 'temperature',
      value: '32.5°C',
      status: 'active'
    },
    {
      id: 2,
      type: 'danger',
      message: 'انخفاض حاد في مستوى الرطوبة',
      time: '2024-01-15 13:45',
      sensor: 'humidity',
      value: '45%',
      status: 'active'
    },
    {
      id: 3,
      type: 'info',
      message: 'تفعيل نظام التهوية التلقائي',
      time: '2024-01-15 12:20',
      sensor: 'ventilation',
      value: 'ON',
      status: 'resolved'
    }
  ];

  // معالجة البيانات الواردة
  const processAlerts = (alertsData) => {
    if (!alertsData) {
      return defaultAlerts;
    }

    // إذا كانت البيانات مصفوفة
    if (Array.isArray(alertsData)) {
      return alertsData.length > 0 ? alertsData : defaultAlerts;
    }

    // إذا كانت البيانات كائن، تحويلها إلى مصفوفة
    if (typeof alertsData === 'object') {
      const alertsArray = Object.values(alertsData);
      return alertsArray.length > 0 ? alertsArray : defaultAlerts;
    }

    return defaultAlerts;
  };

  const displayedAlerts = processAlerts(alerts);

  const translations = {
    ar: {
      alerts: "التنبيهات",
      type: "النوع",
      message: "الرسالة",
      sensor: "المستشعر",
      value: "القيمة",
      time: "الوقت",
      status: "الحالة",
      noAlerts: "لا توجد تنبيهات حالياً",
      markResolved: "تم الحل",
      active: "نشط",
      resolved: "تم الحل",
      critical: "حرج",
      warning: "تحذير",
      info: "معلومات"
    },
    en: {
      alerts: "Alerts",
      type: "Type",
      message: "Message",
      sensor: "Sensor",
      value: "Value",
      time: "Time",
      status: "Status",
      noAlerts: "No alerts at the moment",
      markResolved: "Mark Resolved",
      active: "Active",
      resolved: "Resolved",
      critical: "Critical",
      warning: "Warning",
      info: "Info"
    }
  };

  const t = translations[language];

  const getAlertIcon = (type) => {
    switch (type) {
      case 'danger':
      case 'critical':
        return 'fa-exclamation-triangle';
      case 'warning':
        return 'fa-exclamation-circle';
      case 'info':
        return 'fa-info-circle';
      default:
        return 'fa-bell';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'danger':
      case 'critical':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      case 'info':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#EF4444';
      case 'resolved':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const formatTime = (timeString) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      });
    } catch (error) {
      return timeString;
    }
  };

  const handleResolveAlert = (alertId) => {
    // هنا يمكن إضافة منطق تحديث حالة التنبيه في Firebase
    console.log('Resolving alert:', alertId);
    // firebaseService.updateAlertStatus(currentDevice, alertId, 'resolved');
  };

  if (!displayedAlerts || displayedAlerts.length === 0) {
    return (
      <div className="card alerts-table">
        <h3>⚠️ {t.alerts}</h3>
        <div className="no-alerts">
          <i className="fas fa-check-circle"></i>
          <p>{t.noAlerts}</p>
        </div>

        <style jsx>{`
          .no-alerts {
            text-align: center;
            padding: 40px 20px;
            color: var(--text-gray);
          }

          .no-alerts i {
            font-size: 3rem;
            margin-bottom: 15px;
            color: var(--success);
          }

          .no-alerts p {
            margin: 0;
            font-size: 1rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="card alerts-table">
      <h3>⚠️ {t.alerts}</h3>
      
      <div className="alerts-list">
        {displayedAlerts.map((alert) => (
          <div 
            key={alert.id || alert.key} 
            className={`alert-item ${alert.type || 'info'}`}
            style={{ borderRightColor: getAlertColor(alert.type) }}
          >
            <div 
              className="alert-icon"
              style={{ color: getAlertColor(alert.type) }}
            >
              <i className={`fas ${getAlertIcon(alert.type)}`}></i>
            </div>
            
            <div className="alert-content">
              <p className="alert-message">{alert.message || 'تنبيه غير معروف'}</p>
              <div className="alert-meta">
                <span className="alert-sensor">
                  <i className="fas fa-microchip"></i>
                  {alert.sensor || 'غير محدد'}
                </span>
                <span className="alert-value">
                  <i className="fas fa-chart-line"></i>
                  {alert.value || 'N/A'}
                </span>
                <span className="alert-time">
                  <i className="fas fa-clock"></i>
                  {formatTime(alert.time || alert.timestamp)}
                </span>
                <span 
                  className="alert-status"
                  style={{ color: getStatusColor(alert.status) }}
                >
                  <i className="fas fa-circle"></i>
                  {alert.status === 'resolved' ? t.resolved : t.active}
                </span>
              </div>
            </div>
            
            <div className="alert-actions">
              {alert.status !== 'resolved' && (
                <button 
                  className="btn-action resolve-btn"
                  onClick={() => handleResolveAlert(alert.id)}
                  title={t.markResolved}
                >
                  <i className="fas fa-check"></i>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .alerts-table {
          flex: 1;
          max-height: 500px;
          overflow-y: auto;
        }

        .alerts-table h3 {
          color: var(--text-dark);
          margin-bottom: 20px;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .alert-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 15px;
          background: var(--soft-bg);
          border-radius: 8px;
          border-right: 4px solid #e5e7eb;
          transition: all 0.3s ease;
          position: relative;
        }

        .alert-item:hover {
          transform: translateX(-5px);
          box-shadow: var(--shadow-soft);
        }

        .alert-icon {
          font-size: 1.2rem;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .alert-content {
          flex: 1;
          min-width: 0;
        }

        .alert-message {
          color: var(--text-dark);
          margin-bottom: 8px;
          font-size: 0.9rem;
          line-height: 1.4;
          font-weight: 500;
        }

        .alert-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 0.75rem;
        }

        .alert-sensor,
        .alert-value,
        .alert-time,
        .alert-status {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--text-gray);
          background: rgba(255, 255, 255, 0.7);
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .alert-sensor i,
        .alert-value i,
        .alert-time i,
        .alert-status i {
          font-size: 0.7rem;
        }

        .alert-status i {
          font-size: 0.5rem;
        }

        .alert-actions {
          display: flex;
          gap: 5px;
          flex-shrink: 0;
        }

        .btn-action {
          background: none;
          border: none;
          color: var(--text-gray);
          cursor: pointer;
          padding: 6px;
          border-radius: 4px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-action:hover {
          background: #e5e7eb;
          color: var(--text-dark);
        }

        .resolve-btn {
          color: var(--success);
        }

        .resolve-btn:hover {
          background: var(--success);
          color: white;
        }

        /* تخصيص حسب نوع التنبيه */
        .alert-item.critical {
          background: #fef2f2;
        }

        .alert-item.warning {
          background: #fffbeb;
        }

        .alert-item.info {
          background: #eff6ff;
        }

        @media (max-width: 768px) {
          .alert-meta {
            flex-direction: column;
            gap: 6px;
          }

          .alert-item {
            flex-direction: column;
            gap: 10px;
          }

          .alert-actions {
            align-self: flex-end;
          }

          .alert-content {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .alerts-table {
            max-height: 400px;
          }

          .alert-sensor,
          .alert-value,
          .alert-time,
          .alert-status {
            font-size: 0.7rem;
            padding: 3px 6px;
          }
        }
      `}</style>
    </div>
  );
}