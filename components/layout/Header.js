// components/layout/Header.js
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { firebaseService } from '../../hooks/useFirebase';

const Header = () => {
  const {
    currentDevice,
    setCurrentDevice,
    isConnected,
    devicesList,
    language,
    setLanguage,
    isSettingsMode,
    toggleSettingsMode,
    addFarm,
    unitsConfig,
    farms,
    currentFarm,
    selectFarm
  } = useContext(AppContext);

  const { user, logout } = useAuth();
  const [isUnitsPage, setIsUnitsPage] = useState(false);

  useEffect(() => {
    setIsUnitsPage(window.location.pathname === '/units');
  }, []);

  const handleDeviceChange = (deviceId) => {
    setCurrentDevice(deviceId);
  };

  const handleAddFarm = async () => {
    const promptText = language === 'ar' 
      ? 'أدخل معرف الجهاز / المزرعة (مثال: FAN-CTRL-006):' 
      : 'Enter Farm Device ID (e.g., FAN-CTRL-006):';
    
    const deviceId = prompt(promptText);
    if (!deviceId) return;

    const trimmedId = deviceId.trim();
    if (!trimmedId) return;

    try {
      const isAuthorized = await firebaseService.checkDeviceAuthorization(trimmedId);
      if (isAuthorized) {
        addFarm(trimmedId);
        const successMessage = language === 'ar' 
          ? `تم إضافة المزرعة ${trimmedId} بنجاح` 
          : `Farm ${trimmedId} added successfully`;
        alert(successMessage);
      } else {
        const errorMessage = language === 'ar'
          ? `المزرعة ${trimmedId} غير متصلة أو غير مصرح بها`
          : `Farm ${trimmedId} is not connected or not authorized`;
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error adding farm:', error);
      const errorMessage = language === 'ar'
        ? 'حدث خطأ أثناء إضافة المزرعة'
        : 'Error adding farm';
      alert(errorMessage);
    }
  };

  const handleAddUnit = async () => {
    if (!currentDevice) {
      const message = language === 'ar' 
        ? 'يرجى اختيار جهاز أولاً' 
        : 'Please select a device first';
      alert(message);
      return;
    }

    if (!isSettingsMode) {
      const message = language === 'ar'
        ? 'يرجى تفعيل وضع الإعدادات الهيكلية أولاً'
        : 'Please enable structural settings mode first';
      alert(message);
      return;
    }

    let unitNumber = 1;
    let newUnitId = `unit${unitNumber}`;
    
    while (unitsConfig && unitsConfig[newUnitId]) {
      unitNumber++;
      newUnitId = `unit${unitNumber}`;
    }

    const defaultUnitSettings = {
      name: language === 'ar' ? `الوحدة ${unitNumber}` : `Unit ${unitNumber}`,
      type: 'fan',
      status: false,
      mode: 'manual',
      sensors: ['temperature'],
      thresholds: {
        temperature: {
          min: 25,
          max: 35
        }
      },
      startTime: '06:00',
      endTime: '18:00'
    };

    try {
      await firebaseService.addUnit(currentDevice, newUnitId, defaultUnitSettings);
      const successMessage = language === 'ar'
        ? `تم إضافة الوحدة ${newUnitId} بنجاح`
        : `Unit ${newUnitId} added successfully`;
      alert(successMessage);
    } catch (error) {
      console.error('Error adding unit:', error);
      const errorMessage = language === 'ar'
        ? 'حدث خطأ أثناء إضافة الوحدة'
        : 'Error adding unit';
      alert(errorMessage);
    }
  };

  const handleNavigation = (page) => {
    if (page === 'units') {
      if (!currentDevice) {
        const message = language === 'ar' 
          ? 'يرجى اختيار جهاز أولاً' 
          : 'Please select a device first';
        alert(message);
        return;
      }
      window.location.href = '/units';
    } else {
      window.location.href = '/';
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleFarmSelect = (farmId) => {
    selectFarm(farmId);
  };

  const translations = {
    ar: {
      pageTitle: "المزرعة الدواجن الذكية",
      selectDevice: "-- اختر جهاز --",
      connectionStatus: "حالة الاتصال:",
      connected: "متصل",
      disconnected: "غير متصل",
      settingsMode: "وضع الإعدادات الهيكلية",
      unitsControl: "إدارة الوحدات الذكية",
      backToDashboard: "العودة للوحة التحكم",
      saveAllSettings: "حفظ جميع الإعدادات",
      addFarm: "إضافة مزرعة",
      addUnit: "إضافة وحدة جديدة",
      logout: "تسجيل الخروج",
      welcome: "مرحباً",
      selectFarm: "اختر مزرعة",
      farms: "المزارع",
      noFarms: "لا توجد مزارع"
    },
    en: {
      pageTitle: "Smart Poultry Farm",
      selectDevice: "-- Select Device --",
      connectionStatus: "Connection Status:",
      connected: "Connected",
      disconnected: "Disconnected",
      settingsMode: "Structural Settings Mode",
      unitsControl: "Smart Units Management",
      backToDashboard: "Back to Dashboard",
      saveAllSettings: "Save All Settings",
      addFarm: "Add Farm",
      addUnit: "Add New Unit",
      logout: "Logout",
      welcome: "Welcome",
      selectFarm: "Select Farm",
      farms: "Farms",
      noFarms: "No farms"
    }
  };

  const t = translations[language];

  return (
    <div className="header">
      <h1>
        <i className="fas fa-tractor"></i>
        {isUnitsPage ? t.unitsControl : t.pageTitle}
      </h1>
      
      <div className="controls">
        {/* اختيار المزرعة */}
        {farms.length > 0 && (
          <div className="farm-selector">
            <select 
              value={currentFarm || ''}
              onChange={(e) => handleFarmSelect(e.target.value)}
            >
              <option value="">{t.selectFarm}</option>
              {farms.map(farmId => (
                <option key={farmId} value={farmId}>
                  {farmId}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* اختيار الجهاز */}
        <div className="device-selector">
          <select 
            id="deviceSelect"
            value={currentDevice || ''}
            onChange={(e) => handleDeviceChange(e.target.value)}
          >
            <option value="">{t.selectDevice}</option>
            {devicesList.map(deviceId => (
              <option key={deviceId} value={deviceId}>
                {deviceId}
              </option>
            ))}
          </select>
        </div>
        
        {/* زر إضافة مزرعة */}
        <button className="nav-btn" onClick={handleAddFarm}>
          <i className="fas fa-plus"></i>
          <span>{t.addFarm}</span>
        </button>
        
        {/* حالة الاتصال */}
        <div className="connection-status">
          <span>{t.connectionStatus}</span>
          <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
          <span>{isConnected ? t.connected : t.disconnected}</span>
        </div>
        
        {/* اختيار اللغة */}
        <div className="language-selector">
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </div>
        
        {/* أزرار التنقل */}
        <div className="nav-buttons">
          {/* معلومات المستخدم */}
          <div className="user-info">
            <span className="welcome-text">
              {t.welcome}, {user?.email?.split('@')[0]}
            </span>
          </div>
          
          {/* وضع الإعدادات */}
          <button 
            className={`nav-btn settings ${isSettingsMode ? 'active' : ''}`}
            onClick={toggleSettingsMode}
          >
            <i className="fas fa-cog"></i>
            <span>
              {isSettingsMode ? `${t.settingsMode} Active` : t.settingsMode}
            </span>
          </button>
          
          {/* التنقل بين الصفحات */}
          {!isUnitsPage ? (
            <button 
              className="nav-btn"
              onClick={() => handleNavigation('units')}
            >
              <i className="fas fa-fan"></i>
              <span>{t.unitsControl}</span>
            </button>
          ) : (
            <>
              <button 
                className="nav-btn secondary"
                onClick={() => handleNavigation('dashboard')}
              >
                <i className="fas fa-arrow-right"></i>
                <span>{t.backToDashboard}</span>
              </button>
              <button 
                className="nav-btn"
                onClick={handleAddUnit}
              >
                <i className="fas fa-plus"></i>
                <span>{t.addUnit}</span>
              </button>
            </>
          )}
          
          {/* تسجيل الخروج */}
          <button 
            className="nav-btn secondary"
            onClick={handleLogout}
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>{t.logout}</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .header {
          background: var(--white-card);
          border-radius: 12px;
          padding: 15px 30px;
          margin-bottom: 25px;
          box-shadow: var(--shadow-soft);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
        }

        .header h1 {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-dark);
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
        }

        .controls {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .farm-selector select,
        .device-selector select,
        .language-selector select {
          padding: 8px 15px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          background: var(--white-card);
          min-width: 150px;
          cursor: pointer;
        }

        .farm-selector select:focus,
        .device-selector select:focus,
        .language-selector select:focus {
          outline: none;
          border-color: var(--primary);
        }

        .nav-btn {
          padding: 8px 15px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .nav-btn:hover {
          background: var(--primary-dark);
        }

        .nav-btn.secondary {
          background: var(--text-gray);
        }

        .nav-btn.secondary:hover {
          background: #5a6268;
        }

        .nav-btn.settings {
          background: var(--info);
        }

        .nav-btn.settings:hover {
          background: #138496;
        }

        .nav-btn.settings.active {
          background: var(--warning);
          box-shadow: 0 0 0 2px rgba(255, 165, 0, 0.3);
          animation: glow 2s infinite;
        }

        @keyframes glow {
          0% { box-shadow: 0 0 0 0 rgba(255, 165, 0, 0.3); }
          50% { box-shadow: 0 0 0 4px rgba(255, 165, 0, 0.1); }
          100% { box-shadow: 0 0 0 0 rgba(255, 165, 0, 0.3); }
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 15px;
          background: #f8f9fa;
          border-radius: 20px;
          font-size: 14px;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .connected {
          background-color: var(--primary);
        }

        .disconnected {
          background-color: var(--danger);
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .nav-buttons {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .user-info {
          display: flex;
          align-items: center;
          padding: 8px 15px;
          background: #f8f9fa;
          border-radius: 20px;
          font-size: 14px;
        }

        .welcome-text {
          color: var(--text-dark);
          font-weight: 500;
        }

        @media (max-width: 1200px) {
          .header {
            flex-direction: column;
            align-items: stretch;
          }

          .controls {
            justify-content: center;
          }
        }

        @media (max-width: 768px) {
          .header {
            padding: 15px 20px;
          }

          .controls {
            flex-direction: column;
            gap: 15px;
            width: 100%;
          }

          .farm-selector,
          .device-selector,
          .language-selector {
            width: 100%;
          }

          .farm-selector select,
          .device-selector select,
          .language-selector select {
            width: 100%;
            min-width: auto;
          }

          .nav-buttons {
            flex-direction: column;
            width: 100%;
          }

          .nav-btn {
            width: 100%;
            justify-content: center;
          }

          .user-info {
            order: -1;
            width: 100%;
            justify-content: center;
          }

          .connection-status {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Header;