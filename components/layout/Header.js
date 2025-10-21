import React, { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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

  const { user, logout, userData } = useAuth();
  const [isUnitsPage, setIsUnitsPage] = useState(false);
  const [isPendingPage, setIsPendingPage] = useState(false);
  const [pendingDevices, setPendingDevices] = useState([]);
  const [pendingDevicesCount, setPendingDevicesCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const path = router.pathname;
    setIsUnitsPage(path === '/units');
    setIsPendingPage(path === '/devices/pending');
    
    // تحميل الأجهزة المعلقة إذا كان المستخدم مسجل الدخول
    if (user) {
      loadPendingDevices();
      loadPendingDevicesCount();
    }
  }, [user, router.pathname]);

  // تحميل الأجهزة المعلقة
  const loadPendingDevices = () => {
    return firebaseService.getPendingDevices((snapshot) => {
      const pendingData = snapshot.val();
      if (pendingData) {
        const devices = Object.keys(pendingData).map(deviceId => ({
          id: deviceId,
          ...pendingData[deviceId]
        }));
        setPendingDevices(devices);
      } else {
        setPendingDevices([]);
      }
    });
  };

  // تحميل عدد الأجهزة المعلقة
  const loadPendingDevicesCount = () => {
    return firebaseService.getPendingDevicesCount((count) => {
      setPendingDevicesCount(count);
    });
  };

  const handleDeviceChange = (deviceId) => {
    setCurrentDevice(deviceId);
  };

  const handleAddFarm = async () => {
    if (!user) {
      const message = language === 'ar' 
        ? 'يجب تسجيل الدخول أولاً' 
        : 'Please login first';
      alert(message);
      return;
    }

    // عرض خيارات إضافة مزرعة
    const options = language === 'ar' 
      ? ['إضافة جهاز جديد', 'الموافقة على جهاز معلق', 'إدخال معرف جهاز يدوياً']
      : ['Add New Device', 'Approve Pending Device', 'Enter Device ID Manually'];
    
    const choice = prompt(
      language === 'ar' 
        ? `اختر طريقة الإضافة:\n1. ${options[0]}\n2. ${options[1]}\n3. ${options[2]}\n\nأدخل الرقم (1, 2, 3):`
        : `Choose addition method:\n1. ${options[0]}\n2. ${options[1]}\n3. ${options[2]}\n\nEnter number (1, 2, 3):`
    );

    if (!choice) return;

    try {
      let deviceId;

      switch (choice.trim()) {
        case '1':
          // إضافة جهاز جديد (سيظهر في الأجهزة المعلقة)
          deviceId = prompt(
            language === 'ar' 
              ? 'أدخل معرف الجهاز الجديد (مثال: ESP32_FARM_001):' 
              : 'Enter new device ID (e.g., ESP32_FARM_001):'
          );
          if (!deviceId) return;

          const deviceData = {
            name: deviceId,
            model: 'ESP32-S3',
            createdBy: user.uid,
            createdAt: new Date().toISOString()
          };

          await firebaseService.addPendingDevice(deviceId.trim(), deviceData);
          
          const successMessage = language === 'ar'
            ? `تم إضافة الجهاز ${deviceId} وقيد الانتظار للموافقة`
            : `Device ${deviceId} added and pending approval`;
          alert(successMessage);
          return;

        case '2':
          // الموافقة على جهاز معلق
          if (pendingDevices.length === 0) {
            const noPendingMessage = language === 'ar'
              ? 'لا توجد أجهزة معلقة'
              : 'No pending devices';
            alert(noPendingMessage);
            return;
          }

          const deviceList = pendingDevices.map((device, index) => 
            `${index + 1}. ${device.id} - ${device.name || device.model}`
          ).join('\n');

          const deviceChoice = prompt(
            language === 'ar'
              ? `الأجهزة المعلقة:\n${deviceList}\n\nأدخل رقم الجهاز للموافقة:`
              : `Pending Devices:\n${deviceList}\n\nEnter device number to approve:`
          );

          if (!deviceChoice) return;

          const selectedIndex = parseInt(deviceChoice) - 1;
          if (selectedIndex >= 0 && selectedIndex < pendingDevices.length) {
            const selectedDevice = pendingDevices[selectedIndex];
            const customName = prompt(
              language === 'ar'
                ? `أدخل اسم مخصص للجهاز ${selectedDevice.id} (اختياري):`
                : `Enter custom name for device ${selectedDevice.id} (optional):`
            );

            await firebaseService.approveDevice(user.uid, selectedDevice.id, customName);
            
            const approvedMessage = language === 'ar'
              ? `تمت الموافقة على الجهاز ${selectedDevice.id} بنجاح`
              : `Device ${selectedDevice.id} approved successfully`;
            alert(approvedMessage);
            
            // إضافة المزرعة إلى القائمة
            addFarm(selectedDevice.id);
          }
          return;

        case '3':
          // إدخال معرف جهاز يدوياً (للأجهزة المصرح بها مسبقاً)
          deviceId = prompt(
            language === 'ar' 
              ? 'أدخل معرف الجهاز المصرح به:' 
              : 'Enter authorized device ID:'
          );
          if (!deviceId) return;

          const trimmedId = deviceId.trim();
          
          // التحقق من ترخيص الجهاز وملكيته للمستخدم
          const authorization = await firebaseService.checkDeviceAuthorization(trimmedId);
          if (authorization && authorization.clientId === user.uid) {
            addFarm(trimmedId);
            const successMessage = language === 'ar' 
              ? `تم إضافة المزرعة ${trimmedId} بنجاح` 
              : `Farm ${trimmedId} added successfully`;
            alert(successMessage);
          } else {
            const errorMessage = language === 'ar'
              ? `الجهاز ${trimmedId} غير مصرح به أو لا ينتمي لحسابك`
              : `Device ${trimmedId} is not authorized or does not belong to your account`;
            alert(errorMessage);
          }
          return;

        default:
          const invalidMessage = language === 'ar'
            ? 'اختيار غير صحيح'
            : 'Invalid choice';
          alert(invalidMessage);
      }
    } catch (error) {
      console.error('Error in handleAddFarm:', error);
      const errorMessage = language === 'ar'
        ? 'حدث خطأ أثناء إضافة المزرعة'
        : 'Error adding farm';
      alert(errorMessage);
    }
  };

  // 🔥 الإصلاح الرئيسي: دالة إضافة الوحدة محسنة
  const handleAddUnit = async () => {
    if (!user) {
      const message = language === 'ar' 
        ? 'يجب تسجيل الدخول أولاً' 
        : 'Please login first';
      alert(message);
      return;
    }

    if (!currentDevice) {
      const message = language === 'ar' 
        ? 'يرجى اختيار جهاز أولاً' 
        : 'Please select a device first';
      alert(message);
      return;
    }

     // ✅ النظام الجديد: ترقيم تسلسلي ذكي
    const getNextAvailableUnitId = () => {
      const existingUnits = Object.keys(unitsConfig || {});
      
      // استخراج جميع الأرقام المستخدمة
      const usedNumbers = existingUnits.map(unitId => {
        const match = unitId.match(/^unit_(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      }).filter(num => num > 0);

      console.log('🔢 Used unit numbers:', usedNumbers);

      // إذا لم توجد وحدات، نبدأ من 1
      if (usedNumbers.length === 0) {
        return 'unit_1';
      }

      // البحث عن أول رقم مفقود في التسلسل
      for (let i = 1; i <= Math.max(...usedNumbers) + 1; i++) {
        if (!usedNumbers.includes(i)) {
          console.log(`🎯 Found available unit number: ${i}`);
          return `unit_${i}`;
        }
      }

      // إذا لم توجد فجوات، نستخدم الرقم التالي
      const nextNumber = Math.max(...usedNumbers) + 1;
      console.log(`📈 Using next sequential number: ${nextNumber}`);
      return `unit_${nextNumber}`;
    };

    const newUnitId = getNextAvailableUnitId(); // ← السطر الجديد
    console.log(`🆕 New unit ID: ${newUnitId}`);
    
    const defaultUnitSettings = {
      name: language === 'ar' ? `وحدة جديدة` : `New Unit`,
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
      endTime: '18:00',
      createdAt: new Date().toISOString(),
      createdBy: user.uid,
      lastUpdate: new Date().toISOString()
    };

    try {
      console.log('🚀 Adding unit to Firebase:', {
        userId: user.uid,
        deviceId: currentDevice,
        unitId: newUnitId,
        unitData: defaultUnitSettings
      });

      await firebaseService.addUnit(user.uid, currentDevice, newUnitId, defaultUnitSettings);
      
      console.log('✅ Unit added successfully');
      
      const successMessage = language === 'ar'
        ? `تم إضافة الوحدة الجديدة بنجاح`
        : `New unit added successfully`;
      alert(successMessage);

      // إعادة توجيه إلى صفحة الوحدات إذا لم نكن فيها
      if (!isUnitsPage) {
        router.push('/units');
      }

    } catch (error) {
      console.error('❌ Error adding unit:', error);
      const errorMessage = language === 'ar'
        ? 'حدث خطأ أثناء إضافة الوحدة'
        : 'Error adding unit';
      alert(errorMessage);
    }
  };

  const handleNavigation = (page) => {
    if (!user) {
      const message = language === 'ar' 
        ? 'يجب تسجيل الدخول أولاً' 
        : 'Please login first';
      alert(message);
      return;
    }

    switch (page) {
      case 'units':
        if (!currentDevice) {
          const message = language === 'ar' 
            ? 'يرجى اختيار جهاز أولاً' 
            : 'Please select a device first';
          alert(message);
          return;
        }
        router.push('/units');
        break;
      case 'pending':
        router.push('/devices/pending');
        break;
      case 'dashboard':
      default:
        router.push('/');
        break;
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
      noFarms: "لا توجد مزارع",
      pendingDevices: "الأجهزة المعلقة",
      pendingDevicesPage: "صفحة الأجهزة المعلقة",
      approveDevice: "موافقة على جهاز",
      userWelcome: "مرحباً",
      managePending: "إدارة الأجهزة المعلقة",
      // 🔥 إضافة ترجمات جديدة
      smartUnits: "الوحدات الذكية",
      goToUnits: "الذهاب للوحدات",
      addNewUnit: "إضافة وحدة جديدة"
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
      noFarms: "No farms",
      pendingDevices: "Pending Devices",
      pendingDevicesPage: "Pending Devices Page",
      approveDevice: "Approve Device",
      userWelcome: "Welcome",
      managePending: "Manage Pending Devices",
      // 🔥 إضافة ترجمات جديدة
      smartUnits: "Smart Units",
      goToUnits: "Go to Units",
      addNewUnit: "Add New Unit"
    }
  };

  const t = translations[language];

  // تحديد عنوان الصفحة الحالية
  const getPageTitle = () => {
    if (isUnitsPage) return t.smartUnits;
    if (isPendingPage) return t.pendingDevicesPage;
    return t.pageTitle;
  };

  return (
    <div className="header">
      <div className="header-main">
        <h1>
          <i className="fas fa-tractor"></i>
          {getPageTitle()}
        </h1>
        
        <div className="user-section">
          <div className="user-info">
            <span className="welcome-text">
              {t.userWelcome}, <strong>{userData?.name || user?.email?.split('@')[0]}</strong>
            </span>
          </div>
          
          <button 
            className="nav-btn secondary logout-btn"
            onClick={handleLogout}
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>{t.logout}</span>
          </button>
        </div>
      </div>
      
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
        
        {/* زر إضافة مزرعة مع مؤشر للأجهزة المعلقة */}
        <button className="nav-btn add-farm-btn" onClick={handleAddFarm}>
          <i className="fas fa-plus"></i>
          <span>{t.addFarm}</span>
          {pendingDevicesCount > 0 && (
            <span className="pending-badge">{pendingDevicesCount}</span>
          )}
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
          {isPendingPage ? (
            // في صفحة الأجهزة المعلقة - عرض زر العودة فقط
            <button 
              className="nav-btn secondary"
              onClick={() => handleNavigation('dashboard')}
            >
              <i className="fas fa-arrow-left"></i>
              <span>{t.backToDashboard}</span>
            </button>
          ) : isUnitsPage ? (
            // في صفحة الوحدات
            <>
              <button 
                className="nav-btn secondary"
                onClick={() => handleNavigation('dashboard')}
              >
                <i className="fas fa-arrow-left"></i>
                <span>{t.backToDashboard}</span>
              </button>
              <button 
                className="nav-btn"
                onClick={handleAddUnit}
              >
                <i className="fas fa-plus"></i>
                <span>{t.addNewUnit}</span>
              </button>
            </>
          ) : (
            // في الصفحة الرئيسية
            <>
              <button 
                className="nav-btn"
                onClick={() => handleNavigation('units')}
              >
                <i className="fas fa-fan"></i>
                <span>{t.goToUnits}</span>
              </button>
              
              {/* 🔥 الإصلاح: زر إضافة وحدة في الصفحة الرئيسية أيضًا */}
              {currentDevice && (
                <button 
                  className="nav-btn"
                  onClick={handleAddUnit}
                >
                  <i className="fas fa-plus"></i>
                  <span>{t.addNewUnit}</span>
                </button>
              )}
              
              {/* زر الأجهزة المعلقة */}
              <button 
                className="nav-btn pending-btn"
                onClick={() => handleNavigation('pending')}
              >
                <i className="fas fa-clock"></i>
                <span>{t.pendingDevices}</span>
                {pendingDevicesCount > 0 && (
                  <span className="nav-badge">{pendingDevicesCount}</span>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .header {
          background: var(--white-card);
          border-radius: 12px;
          padding: 20px 30px;
          margin-bottom: 25px;
          box-shadow: var(--shadow-soft);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .header-main {
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

        .user-section {
          display: flex;
          align-items: center;
          gap: 15px;
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

        .welcome-text strong {
          color: var(--primary);
        }

        .controls {
          display: flex;
          align-items: center;
          gap: 15px;
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
          position: relative;
        }

        .nav-btn:hover {
          background: var(--primary-dark);
          transform: translateY(-1px);
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

        .nav-btn.pending-btn {
          background: #f59e0b;
        }

        .nav-btn.pending-btn:hover {
          background: #d97706;
        }

        .nav-btn.settings.active {
          background: var(--warning);
          box-shadow: 0 0 0 2px rgba(255, 165, 0, 0.3);
          animation: glow 2s infinite;
        }

        .add-farm-btn {
          position: relative;
        }

        .pending-badge,
        .nav-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: var(--danger);
          color: white;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .nav-badge {
          background: #f59e0b;
        }

        .logout-btn {
          background: var(--danger);
        }

        .logout-btn:hover {
          background: #c82333;
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

        @media (max-width: 1200px) {
          .header-main {
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

          .user-section {
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