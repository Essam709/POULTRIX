// components/dashboard/WelcomeScreen.js
import React, { useContext, useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { firebaseService } from '../../hooks/useFirebase';

export default function WelcomeScreen() {
  const { language, devicesList, setCurrentDevice, currentUser } = useApp();
  const { user, userData } = useAuth();
  const [devicesData, setDevicesData] = useState({});
  const [loading, setLoading] = useState(true);

  // تحميل بيانات تفصيلية للأجهزة
  useEffect(() => {
    if (!user || !devicesList.length) {
      setLoading(false);
      return;
    }

    const loadDevicesData = async () => {
      try {
        const devicesInfo = {};
        
        for (const deviceId of devicesList) {
          try {
            // ✅ استخدام المسار الصحيح مع userId
            const deviceInfo = await firebaseService.getData(user.uid, `devices/${deviceId}/info`);
            if (deviceInfo) {
              devicesInfo[deviceId] = deviceInfo;
            } else {
              devicesInfo[deviceId] = {
                name: deviceId,
                status: 'unknown',
                lastSeen: null
              };
            }
          } catch (error) {
            console.error(`Error loading device ${deviceId} data:`, error);
            devicesInfo[deviceId] = {
              name: deviceId,
              status: 'error',
              lastSeen: null
            };
          }
        }
        
        setDevicesData(devicesInfo);
      } catch (error) {
        console.error('Error loading devices data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDevicesData();
  }, [user, devicesList]);

  const translations = {
    ar: {
      title: "مرحباً بك في نظام مراقبة مزارع الدواجن",
      subtitle: "اختر جهازاً للبدء في المراقبة",
      selectDevice: "اختر جهاز المراقبة",
      noDevices: "لا توجد أجهزة متاحة حالياً",
      addFirstDevice: "أضف جهازك الأول",
      deviceStatus: {
        active: "نشط",
        inactive: "غير نشط",
        unknown: "غير معروف",
        error: "خطأ في الاتصال"
      },
      lastSeen: "آخر ظهور",
      never: "أبداً",
      welcomeUser: "أهلاً بك",
      farmManagement: "إدارة المزرعة الذكية",
      features: {
        monitoring: "مراقبة حية",
        automation: "أتمتة ذكية",
        alerts: "تنبيهات فورية",
        reports: "تقارير مفصلة"
      }
    },
    en: {
      title: "Welcome to Poultry Farm Monitoring System",
      subtitle: "Select a device to start monitoring",
      selectDevice: "Select Monitoring Device",
      noDevices: "No devices available at the moment",
      addFirstDevice: "Add your first device",
      deviceStatus: {
        active: "Active",
        inactive: "Inactive",
        unknown: "Unknown",
        error: "Connection Error"
      },
      lastSeen: "Last seen",
      never: "Never",
      welcomeUser: "Welcome back",
      farmManagement: "Smart Farm Management",
      features: {
        monitoring: "Live Monitoring",
        automation: "Smart Automation",
        alerts: "Instant Alerts",
        reports: "Detailed Reports"
      }
    }
  };

  const t = translations[language];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return 'fa-check-circle';
      case 'inactive': return 'fa-pause-circle';
      case 'error': return 'fa-exclamation-circle';
      default: return 'fa-question-circle';
    }
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return t.never;
    
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (language === 'ar') {
      if (diffMins < 1) return 'الآن';
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      return `منذ ${diffDays} يوم`;
    } else {
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    }
  };

  const handleAddDevice = () => {
    // فتح نافذة إضافة جهاز عبر Header component
    const addFarmBtn = document.querySelector('.add-farm-btn');
    if (addFarmBtn) addFarmBtn.click();
  };

  return (
    <div className="welcome-screen" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="welcome-container">
        {/* قسم الترحيب والميزات */}
        <div className="welcome-hero">
          <div className="hero-content">
            <div className="user-greeting">
              <h1>{t.welcomeUser}, <span className="user-name">{userData?.name || user?.email?.split('@')[0]}</span></h1>
              <p className="hero-subtitle">{t.farmManagement}</p>
            </div>
            
            <div className="features-grid">
              <div className="feature-card">
                <i className="fas fa-chart-line"></i>
                <h3>{t.features.monitoring}</h3>
                <p>
                  {language === 'ar' 
                    ? 'مراقبة مستمرة لدرجة الحرارة والرطوبة وجودة الهواء'
                    : 'Continuous monitoring of temperature, humidity and air quality'
                  }
                </p>
              </div>
              
              <div className="feature-card">
                <i className="fas fa-robot"></i>
                <h3>{t.features.automation}</h3>
                <p>
                  {language === 'ar' 
                    ? 'تحكم آلي في التهوية والتدفئة والتبريد'
                    : 'Automatic control of ventilation, heating and cooling'
                  }
                </p>
              </div>
              
              <div className="feature-card">
                <i className="fas fa-bell"></i>
                <h3>{t.features.alerts}</h3>
                <p>
                  {language === 'ar' 
                    ? 'تنبيهات فورية عند تجاوز الحدود المسموحة'
                    : 'Instant alerts when thresholds are exceeded'
                  }
                </p>
              </div>
              
              <div className="feature-card">
                <i className="fas fa-file-chart-line"></i>
                <h3>{t.features.reports}</h3>
                <p>
                  {language === 'ar' 
                    ? 'تقارير أداء مفصلة وإحصائيات تاريخية'
                    : 'Detailed performance reports and historical statistics'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* قسم الأجهزة */}
        <div className="devices-section">
          <div className="section-header">
            <h2>{t.title}</h2>
            <p>{t.subtitle}</p>
          </div>

          {loading ? (
            <div className="loading-devices">
              <div className="loading-spinner"></div>
              <p>{language === 'ar' ? 'جاري تحميل الأجهزة...' : 'Loading devices...'}</p>
            </div>
          ) : devicesList.length > 0 ? (
            <div className="devices-grid">
              {devicesList.map(deviceId => {
                const device = devicesData[deviceId] || { 
                  name: deviceId, 
                  status: 'unknown',
                  lastSeen: null
                };
                
                return (
                  <div 
                    key={deviceId} 
                    className="device-card"
                    onClick={() => setCurrentDevice(deviceId)}
                  >
                    <div className="device-header">
                      <div className="device-icon">
                        <i className="fas fa-microchip"></i>
                      </div>
                      <div className="device-status" style={{ color: getStatusColor(device.status) }}>
                        <i className={`fas ${getStatusIcon(device.status)}`}></i>
                        <span>{t.deviceStatus[device.status]}</span>
                      </div>
                    </div>
                    
                    <div className="device-info">
                      <h3>{device.customName || device.name || deviceId}</h3>
                      <p className="device-id">ID: {deviceId}</p>
                      
                      {device.lastSeen && (
                        <div className="last-seen">
                          <i className="fas fa-clock"></i>
                          <span>{t.lastSeen}: {formatLastSeen(device.lastSeen)}</span>
                        </div>
                      )}
                    </div>

                    <div className="device-actions">
                      <button className="connect-btn">
                        <i className="fas fa-play"></i>
                        {language === 'ar' ? 'اتصال' : 'Connect'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-devices">
              <div className="no-devices-content">
                <i className="fas fa-microchip"></i>
                <h3>{t.noDevices}</h3>
                <p>
                  {language === 'ar' 
                    ? 'لم تقم بإضافة أي أجهزة بعد. ابدأ بإضافة جهازك الأول للمراقبة.'
                    : 'You haven\'t added any devices yet. Start by adding your first device for monitoring.'
                  }
                </p>
                <button className="btn btn-primary" onClick={handleAddDevice}>
                  <i className="fas fa-plus"></i>
                  {t.addFirstDevice}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .welcome-screen {
          min-height: 100vh;
          background: linear-gradient(135deg, var(--soft-bg) 0%, #f8fafc 100%);
          padding: 20px;
        }

        .welcome-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .welcome-hero {
          background: var(--white-card);
          border-radius: 16px;
          padding: 40px;
          margin-bottom: 30px;
          box-shadow: var(--shadow-soft);
        }

        .user-greeting {
          text-align: center;
          margin-bottom: 40px;
        }

        .user-greeting h1 {
          color: var(--text-dark);
          font-size: 2.5rem;
          margin-bottom: 10px;
          font-weight: 700;
        }

        .user-name {
          color: var(--primary);
        }

        .hero-subtitle {
          color: var(--text-gray);
          font-size: 1.2rem;
          margin: 0;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .feature-card {
          background: var(--soft-bg);
          padding: 25px;
          border-radius: 12px;
          text-align: center;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .feature-card:hover {
          border-color: var(--primary);
          transform: translateY(-4px);
          box-shadow: var(--shadow-medium);
        }

        .feature-card i {
          font-size: 2.5rem;
          color: var(--primary);
          margin-bottom: 15px;
        }

        .feature-card h3 {
          color: var(--text-dark);
          margin-bottom: 10px;
          font-size: 1.1rem;
        }

        .feature-card p {
          color: var(--text-gray);
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0;
        }

        .devices-section {
          background: var(--white-card);
          border-radius: 16px;
          padding: 40px;
          box-shadow: var(--shadow-soft);
        }

        .section-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .section-header h2 {
          color: var(--text-dark);
          margin-bottom: 10px;
          font-size: 2rem;
        }

        .section-header p {
          color: var(--text-gray);
          font-size: 1.1rem;
          margin: 0;
        }

        .loading-devices {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          color: var(--text-gray);
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .devices-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .device-card {
          background: var(--soft-bg);
          padding: 25px;
          border-radius: 12px;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        .device-card:hover {
          border-color: var(--primary);
          transform: translateY(-4px);
          box-shadow: var(--shadow-medium);
        }

        .device-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }

        .device-icon {
          font-size: 2rem;
          color: var(--primary);
        }

        .device-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .device-info {
          flex: 1;
          margin-bottom: 20px;
        }

        .device-info h3 {
          color: var(--text-dark);
          margin-bottom: 5px;
          font-size: 1.2rem;
        }

        .device-id {
          color: var(--text-gray);
          font-size: 0.8rem;
          margin-bottom: 10px;
        }

        .last-seen {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-gray);
          font-size: 0.8rem;
        }

        .device-actions {
          margin-top: auto;
        }

        .connect-btn {
          width: 100%;
          background: var(--primary);
          color: white;
          border: none;
          padding: 10px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .connect-btn:hover {
          background: var(--primary-dark);
        }

        .no-devices {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px;
        }

        .no-devices-content {
          text-align: center;
          max-width: 400px;
        }

        .no-devices-content i {
          font-size: 4rem;
          color: var(--text-gray);
          margin-bottom: 20px;
        }

        .no-devices-content h3 {
          color: var(--text-dark);
          margin-bottom: 10px;
          font-size: 1.5rem;
        }

        .no-devices-content p {
          color: var(--text-gray);
          margin-bottom: 25px;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .welcome-hero,
          .devices-section {
            padding: 20px;
          }

          .user-greeting h1 {
            font-size: 2rem;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .devices-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .welcome-screen {
            padding: 10px;
          }

          .user-greeting h1 {
            font-size: 1.5rem;
          }

          .section-header h2 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}