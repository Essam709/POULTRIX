// components/dashboard/AlertsTable.js
import React, { useState, useContext, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { firebaseService } from '../../hooks/useFirebase';

export default function AlertsTable({ alerts, deviceId, userId }) {
  const { user } = useAuth();
  const { language } = useApp();
  const [displayedAlerts, setDisplayedAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resolvingAlert, setResolvingAlert] = useState(null);

  // تحميل التنبيهات من Firebase
  useEffect(() => {
    console.log('🎯 [ALERTS] Starting alerts subscription:', {
      deviceId,
      userId,
      hasFirebase: !!firebaseService
    });

    if (!deviceId || !userId || !firebaseService) {
      console.log('❌ [ALERTS] Missing required data:', {
        deviceId: !!deviceId,
        userId: !!userId,
        firebaseService: !!firebaseService
      });
      setDisplayedAlerts([]);
      return;
    }

    setLoading(true);

    try {
      // 🔥 الإصلاح: استخدام المسار الصحيح للتنبيهات
      const unsubscribe = firebaseService.listenToData(
        userId,
        `devices/${deviceId}/alerts`,
        (snapshot) => {
          const alertsData = snapshot.val();
          console.log('📥 [ALERTS] Raw alerts data received:', {
            dataExists: !!alertsData,
            dataType: typeof alertsData,
            data: alertsData
          });
          
          const processedAlerts = processAlerts(alertsData);
          console.log('✅ [ALERTS] Processed alerts:', {
            count: processedAlerts.length,
            alerts: processedAlerts
          });
          
          setDisplayedAlerts(processedAlerts);
          setLoading(false);
        },
        (error) => {
          console.error('❌ [ALERTS] Subscription error:', error);
          setLoading(false);
        }
      );

      return () => {
        console.log('🧹 [ALERTS] Unsubscribing from alerts');
        unsubscribe();
      };
    } catch (error) {
      console.error('❌ [ALERTS] Error setting up subscription:', error);
      setLoading(false);
    }
  }, [deviceId, userId]);

  // معالجة البيانات الواردة من Firebase
  const processAlerts = (alertsData) => {
    console.log('🔧 [ALERTS] Processing alerts data:', alertsData);

    if (!alertsData) {
      console.log('⚠️ [ALERTS] No alerts data found in Firebase');
      return [];
    }

    try {
      // 🔥 الإصلاح: معالجة البيانات من Firebase بشكل صحيح
      const alertsArray = Object.entries(alertsData).map(([alertId, alertData]) => {
        console.log(`🔍 [ALERTS] Processing alert ${alertId}:`, alertData);
        
        return {
          id: alertId,
          key: alertId,
          type: alertData.type || 'warning',
          message: alertData.message || 'تنبيه غير معروف',
          timestamp: alertData.timestamp || new Date().toISOString(),
          sensor: alertData.sensorType || 'unknown',
          value: alertData.value || 'N/A',
          status: alertData.resolved === true ? 'resolved' : 'active',
          priority: 'medium'
        };
      });

      // ترتيب التنبيهات حسب الوقت (الأحدث أولاً)
      const sortedAlerts = alertsArray.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeB - timeA;
      });

      console.log('📊 [ALERTS] Final processed alerts:', sortedAlerts);
      return sortedAlerts;

    } catch (error) {
      console.error('❌ [ALERTS] Error processing alerts:', error);
      return [];
    }
  };

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
      info: "معلومات",
      loading: "جاري تحميل التنبيهات...",
      allResolved: "جميع التنبيهات معالجة",
      system: "النظام",
      priority: "الأولوية",
      high: "عالية",
      medium: "متوسطة",
      low: "منخفضة"
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
      info: "Info",
      loading: "Loading alerts...",
      allResolved: "All alerts resolved",
      system: "System",
      priority: "Priority",
      high: "High",
      medium: "Medium",
      low: "Low"
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
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
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return timeString;
    }
  };

  const handleResolveAlert = async (alertId) => {
    if (!deviceId || !userId || !alertId) return;

    console.log('🔄 [ALERTS] Resolving alert:', alertId);
    setResolvingAlert(alertId);
    
    try {
      await firebaseService.updateAlertStatus(
        userId,
        deviceId,
        alertId,
        'resolved'
      );
      
      // تحديث الحالة محلياً
      setDisplayedAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, status: 'resolved', resolvedAt: new Date().toISOString() }
            : alert
        )
      );
      
      console.log('✅ [ALERTS] Alert resolved successfully:', alertId);
    } catch (error) {
      console.error('❌ [ALERTS] Error resolving alert:', error);
      alert(
        language === 'ar' 
          ? 'حدث خطأ أثناء معالجة التنبيه' 
          : 'Error resolving alert'
      );
    } finally {
      setResolvingAlert(null);
    }
  };

  // تصفية التنبيهات النشطة فقط
  const activeAlerts = displayedAlerts.filter(alert => alert.status === 'active');
  const resolvedAlerts = displayedAlerts.filter(alert => alert.status === 'resolved');

  if (!deviceId || !userId) {
    return (
      <div className="card alerts-table">
        <div className="alerts-header">
          <h3>⚠️ {t.alerts}</h3>
        </div>
        <div className="no-device-message">
          <i className="fas fa-microchip"></i>
          <span>{language === 'ar' ? 'لم يتم اختيار جهاز' : 'No device selected'}</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card alerts-table">
        <div className="alerts-header">
          <h3>⚠️ {t.alerts}</h3>
        </div>
        <div className="loading-alerts">
          <div className="loading-spinner"></div>
          <p>{t.loading}</p>
        </div>
      </div>
    );
  }

  const hasActiveAlerts = activeAlerts.length > 0;
  const hasResolvedAlerts = resolvedAlerts.length > 0;

  return (
    <div className="card alerts-table">
      <div className="alerts-header">
        <h3>⚠️ {t.alerts}</h3>
        {hasActiveAlerts && (
          <div className="alerts-badge">
            <span className="active-count">{activeAlerts.length}</span>
            <span>{language === 'ar' ? 'تنبيه نشط' : 'Active alerts'}</span>
          </div>
        )}
      </div>
      
      <div className="alerts-content">
        {!hasActiveAlerts && !hasResolvedAlerts ? (
          <div className="no-alerts">
            <i className="fas fa-check-circle"></i>
            <p>{t.noAlerts}</p>
          </div>
        ) : (
          <>
            {/* التنبيهات النشطة */}
            {hasActiveAlerts && (
              <div className="alerts-section">
                <h4 className="section-title">
                  {language === 'ar' ? 'التنبيهات النشطة' : 'Active Alerts'}
                  <span className="section-count">{activeAlerts.length}</span>
                </h4>
                <div className="alerts-list">
                  {activeAlerts.map((alert) => (
                    <AlertItem 
                      key={alert.id} 
                      alert={alert}
                      onResolve={handleResolveAlert}
                      resolvingAlert={resolvingAlert}
                      language={language}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* التنبيهات المعالجة */}
            {hasResolvedAlerts && (
              <div className="alerts-section">
                <h4 className="section-title">
                  {language === 'ar' ? 'التنبيهات المعالجة' : 'Resolved Alerts'}
                  <span className="section-count">{resolvedAlerts.length}</span>
                </h4>
                <div className="alerts-list">
                  {resolvedAlerts.slice(0, 5).map((alert) => (
                    <AlertItem 
                      key={alert.id} 
                      alert={alert}
                      onResolve={handleResolveAlert}
                      resolvingAlert={resolvingAlert}
                      language={language}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .alerts-table {
          flex: 1;
          display: flex;
          flex-direction: column;
          max-height: 600px;
        }

        .alerts-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .alerts-table h3 {
          color: var(--text-dark);
          margin: 0;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .alerts-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fef2f2;
          color: #dc2626;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .active-count {
          background: #dc2626;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
        }

        .alerts-content {
          flex: 1;
          overflow-y: auto;
        }

        .alerts-section {
          margin-bottom: 25px;
        }

        .section-title {
          color: var(--text-dark);
          font-size: 1rem;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .section-count {
          background: var(--primary);
          color: white;
          border-radius: 12px;
          padding: 2px 8px;
          font-size: 0.7rem;
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .no-alerts,
        .no-device-message,
        .loading-alerts {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: var(--text-gray);
          gap: 15px;
          flex: 1;
        }

        .no-alerts i {
          font-size: 3rem;
          color: var(--success);
        }

        .no-device-message i,
        .loading-alerts i {
          font-size: 3rem;
          opacity: 0.5;
        }

        .loading-spinner {
          width: 30px;
          height: 30px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .alerts-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .alerts-badge {
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

// مكون AlertItem منفصل للأداء الأفضل
const AlertItem = ({ alert, onResolve, resolvingAlert, language, t }) => {
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
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

  const isResolving = resolvingAlert === alert.id;

  return (
    <div 
      className={`alert-item ${alert.type || 'info'} ${alert.status}`}
      style={{ borderRightColor: getAlertColor(alert.type) }}
    >
      <div 
        className="alert-icon"
        style={{ color: getAlertColor(alert.type) }}
      >
        <i className={`fas ${getAlertIcon(alert.type)}`}></i>
      </div>
      
      <div className="alert-content">
        <p className="alert-message">{alert.message || t.noAlerts}</p>
        <div className="alert-meta">
          <span className="alert-sensor">
            <i className="fas fa-microchip"></i>
            {alert.sensor || t.system}
          </span>
          <span className="alert-time">
            <i className="fas fa-clock"></i>
            {formatTime(alert.timestamp)}
          </span>
          {alert.priority && (
            <span 
              className="alert-priority"
              style={{ color: getPriorityColor(alert.priority) }}
            >
              <i className="fas fa-flag"></i>
              {t[alert.priority] || alert.priority}
            </span>
          )}
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
            className={`btn-action resolve-btn ${isResolving ? 'resolving' : ''}`}
            onClick={() => onResolve(alert.id)}
            disabled={isResolving}
            title={t.markResolved}
          >
            {isResolving ? (
              <div className="mini-spinner"></div>
            ) : (
              <i className="fas fa-check"></i>
            )}
          </button>
        )}
      </div>

      <style jsx>{`
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

        .alert-item.resolved {
          opacity: 0.7;
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
          gap: 10px;
          font-size: 0.75rem;
        }

        .alert-sensor,
        .alert-time,
        .alert-priority,
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
        .alert-time i,
        .alert-priority i,
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
          width: 32px;
          height: 32px;
        }

        .btn-action:hover:not(:disabled) {
          background: #e5e7eb;
          color: var(--text-dark);
        }

        .btn-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .resolve-btn {
          color: var(--success);
        }

        .resolve-btn:hover:not(:disabled) {
          background: var(--success);
          color: white;
        }

        .resolve-btn.resolving {
          background: var(--success);
          color: white;
        }

        .mini-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
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
      `}</style>
    </div>
  );
};

// القيم الافتراضية للخصائص
AlertsTable.defaultProps = {
  alerts: [],
  deviceId: '',
  userId: ''
};