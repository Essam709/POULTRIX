import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { AppContext } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { firebaseService } from '../../hooks/useFirebase';

const Header = React.memo(() => {
  const {
    currentDevice,
    setCurrentDevice,
    deviceConnectivity,
    getDeviceConnectivity,
    refreshDeviceStatus,
    devicesList,
    language,
    setLanguage,
    isSettingsMode,
    toggleSettingsMode,
    addFarm,
    unitsConfig,
    farms,
    currentFarm,
    selectFarm,
    isHeaderCollapsed,
    toggleHeader,
    showGlobalNotification
  } = useContext(AppContext);

  const { user, logout, userData } = useAuth();
  const [isUnitsPage, setIsUnitsPage] = useState(false);
  const [isPendingPage, setIsPendingPage] = useState(false);
  const [pendingDevices, setPendingDevices] = useState([]);
  const [pendingDevicesCount, setPendingDevicesCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);
  const [addFarmStep, setAddFarmStep] = useState('main');
  const [newDeviceData, setNewDeviceData] = useState({ id: '', name: '' });
  const [selectedPendingDevice, setSelectedPendingDevice] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  // 🔥 الحصول على حالة الجهاز الحالي
  const currentDeviceStatus = getDeviceConnectivity(currentDevice);

  // 🔥 دالة مساعدة لتنسيق وقت آخر تحديث
  const formatLastSeen = useCallback((lastSeen) => {
    if (!lastSeen) return '';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    
    if (diffMinutes < 1) {
      return language === 'ar' ? 'الآن' : 'Now';
    } else if (diffMinutes < 60) {
      return language === 'ar' 
        ? `قبل ${diffMinutes} دقيقة` 
        : `${diffMinutes} min ago`;
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      return language === 'ar' 
        ? `قبل ${diffHours} ساعة` 
        : `${diffHours} hours ago`;
    }
  }, [language]);

  // 🔥 دالة لحساب جودة الاتصال
  const getConnectionQuality = useCallback((lastSeen) => {
    if (!lastSeen) return 'poor';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    
    if (diffMinutes < 2) return 'excellent';
    if (diffMinutes < 5) return 'good';
    if (diffMinutes < 10) return 'fair';
    return 'poor';
  }, []);

  // 🔥 دالة للحصول على لون مؤشر الجودة
  const getQualityColor = useCallback((quality) => {
    switch (quality) {
      case 'excellent': return '#28a745';
      case 'good': return '#20c997';
      case 'fair': return '#ffc107';
      case 'poor': return '#dc3545';
      default: return '#6c757d';
    }
  }, []);

  // 🔥 دالة للحصول على نص الجودة
  const getQualityText = useCallback((quality) => {
    const texts = {
      ar: {
        excellent: 'ممتاز',
        good: 'جيد',
        fair: 'متوسط',
        poor: 'ضعيف'
      },
      en: {
        excellent: 'Excellent',
        good: 'Good',
        fair: 'Fair',
        poor: 'Poor'
      }
    };
    return texts[language][quality] || '';
  }, [language]);

  useEffect(() => {
    const path = router.pathname;
    setIsUnitsPage(path === '/units');
    setIsPendingPage(path === '/devices/pending');
    
    if (user) {
      loadPendingDevices();
      loadPendingDevicesCount();
    }
  }, [user, router.pathname]);

  const loadPendingDevices = useCallback(() => {
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
  }, []);

  const loadPendingDevicesCount = useCallback(() => {
    return firebaseService.getPendingDevicesCount((count) => {
      setPendingDevicesCount(count);
    });
  }, []);

  const handleDeviceChange = useCallback((deviceId) => {
    setCurrentDevice(deviceId);
  }, [setCurrentDevice]);

  // 🔥 دالة التحديث اليدوي مع تحسينات الواجهة
  const handleManualRefresh = useCallback(async () => {
    if (!currentDevice || isRefreshing) return;
    
    setIsRefreshing(true);
    
    try {
      await refreshDeviceStatus();
      showGlobalNotification(
        language === 'ar' ? 'تم تحديث حالة الجهاز' : 'Device status refreshed',
        'success'
      );
    } catch (error) {
      console.error('Error refreshing device status:', error);
      showGlobalNotification(
        language === 'ar' ? 'فشل تحديث حالة الجهاز' : 'Failed to refresh device status',
        'error'
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [currentDevice, refreshDeviceStatus, language, showGlobalNotification, isRefreshing]);

  const handleAddFarm = useCallback(async () => {
    if (!user) {
      const message = language === 'ar' 
        ? 'يجب تسجيل الدخول أولاً' 
        : 'Please login first';
      showGlobalNotification(message, 'error');
      return;
    }
    setShowAddFarmModal(true);
    setAddFarmStep('main');
  }, [user, language, showGlobalNotification]);

  const handleAddOption = useCallback((option) => {
    setAddFarmStep(option);
    setNewDeviceData({ id: '', name: '' });
    setSelectedPendingDevice(null);
  }, []);

  const handleAddNewDevice = useCallback(async () => {
    if (!newDeviceData.id.trim()) {
      const message = language === 'ar' 
        ? 'يرجى إدخال معرف الجهاز' 
        : 'Please enter device ID';
      showGlobalNotification(message, 'error');
      return;
    }

    try {
      const deviceData = {
        name: newDeviceData.name || newDeviceData.id,
        model: 'ESP32-S3',
        createdBy: user.uid,
        createdAt: new Date().toISOString()
      };

      await firebaseService.addPendingDevice(newDeviceData.id.trim(), deviceData);
      
      const successMessage = language === 'ar'
        ? `تم إضافة الجهاز ${newDeviceData.id} وقيد الانتظار للموافقة`
        : `Device ${newDeviceData.id} added and pending approval`;
      showGlobalNotification(successMessage, 'success');
      
      setShowAddFarmModal(false);
      loadPendingDevices();
      loadPendingDevicesCount();
    } catch (error) {
      console.error('Error adding new device:', error);
      const errorMessage = language === 'ar'
        ? 'حدث خطأ أثناء إضافة الجهاز'
        : 'Error adding device';
      showGlobalNotification(errorMessage, 'error');
    }
  }, [newDeviceData, user, language, showGlobalNotification, loadPendingDevices, loadPendingDevicesCount]);

  const handleApproveDevice = useCallback(async () => {
    if (!selectedPendingDevice) {
      const message = language === 'ar'
        ? 'يرجى اختيار جهاز للموافقة'
        : 'Please select a device to approve';
      showGlobalNotification(message, 'error');
      return;
    }

    try {
      const customName = newDeviceData.name || selectedPendingDevice.name || selectedPendingDevice.id;
      
      await firebaseService.approveDevice(user.uid, selectedPendingDevice.id, customName);
      
      const approvedMessage = language === 'ar'
        ? `تمت الموافقة على الجهاز ${selectedPendingDevice.id} بنجاح`
        : `Device ${selectedPendingDevice.id} approved successfully`;
      showGlobalNotification(approvedMessage, 'success');
      
      addFarm(selectedPendingDevice.id);
      setShowAddFarmModal(false);
      loadPendingDevices();
      loadPendingDevicesCount();
    } catch (error) {
      console.error('Error approving device:', error);
      const errorMessage = language === 'ar'
        ? 'حدث خطأ أثناء الموافقة على الجهاز'
        : 'Error approving device';
      showGlobalNotification(errorMessage, 'error');
    }
  }, [selectedPendingDevice, newDeviceData, user, language, showGlobalNotification, addFarm, loadPendingDevices, loadPendingDevicesCount]);

  const handleManualAdd = useCallback(async () => {
    if (!newDeviceData.id.trim()) {
      const message = language === 'ar' 
        ? 'يرجى إدخال معرف الجهاز' 
        : 'Please enter device ID';
      showGlobalNotification(message, 'error');
      return;
    }

    try {
      const trimmedId = newDeviceData.id.trim();
      const authorization = await firebaseService.checkDeviceAuthorization(trimmedId);
      
      if (authorization && authorization.clientId === user.uid) {
        addFarm(trimmedId);
        const successMessage = language === 'ar' 
          ? `تم إضافة المزرعة ${trimmedId} بنجاح` 
          : `Farm ${trimmedId} added successfully`;
        showGlobalNotification(successMessage, 'success');
        setShowAddFarmModal(false);
      } else {
        const errorMessage = language === 'ar'
          ? `الجهاز ${trimmedId} غير مصرح به أو لا ينتمي لحسابك`
          : `Device ${trimmedId} is not authorized or does not belong to your account`;
        showGlobalNotification(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error in manual add:', error);
      const errorMessage = language === 'ar'
        ? 'حدث خطأ أثناء إضافة المزرعة'
        : 'Error adding farm';
      showGlobalNotification(errorMessage, 'error');
    }
  }, [newDeviceData, user, showGlobalNotification, addFarm, language]);

  const filteredDevices = devicesList.filter(deviceId =>
    deviceId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUnit = useCallback(async () => {
    if (!user) {
      const message = language === 'ar' 
        ? 'يجب تسجيل الدخول أولاً' 
        : 'Please login first';
      showGlobalNotification(message, 'error');
      return;
    }

    if (!currentDevice) {
      const message = language === 'ar' 
        ? 'يرجى اختيار جهاز أولاً' 
        : 'Please select a device first';
      showGlobalNotification(message, 'error');
      return;
    }

    const getNextAvailableUnitId = () => {
      const existingUnits = Object.keys(unitsConfig || {});
      
      const usedNumbers = existingUnits.map(unitId => {
        const match = unitId.match(/^unit_(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      }).filter(num => num > 0);

      if (usedNumbers.length === 0) {
        return 'unit_1';
      }

      for (let i = 1; i <= Math.max(...usedNumbers) + 1; i++) {
        if (!usedNumbers.includes(i)) {
          return `unit_${i}`;
        }
      }

      const nextNumber = Math.max(...usedNumbers) + 1;
      return `unit_${nextNumber}`;
    };

    const newUnitId = getNextAvailableUnitId();
    
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
      await firebaseService.addUnit(user.uid, currentDevice, newUnitId, defaultUnitSettings);
      
      const successMessage = language === 'ar'
        ? `تم إضافة الوحدة الجديدة بنجاح`
        : `New unit added successfully`;
      showGlobalNotification(successMessage, 'success');

      if (!isUnitsPage) {
        router.push('/units');
      }

    } catch (error) {
      console.error('❌ Error adding unit:', error);
      const errorMessage = language === 'ar'
        ? 'حدث خطأ أثناء إضافة الوحدة'
        : 'Error adding unit';
      showGlobalNotification(errorMessage, 'error');
    }
  }, [user, currentDevice, unitsConfig, language, isUnitsPage, router, showGlobalNotification]);

  const handleNavigation = useCallback((page) => {
    if (!user) {
      const message = language === 'ar' 
        ? 'يجب تسجيل الدخول أولاً' 
        : 'Please login first';
      showGlobalNotification(message, 'error');
      return;
    }

    switch (page) {
      case 'units':
        if (!currentDevice) {
          const message = language === 'ar' 
            ? 'يرجى اختيار جهاز أولاً' 
            : 'Please select a device first';
          showGlobalNotification(message, 'error');
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
  }, [user, currentDevice, language, router, showGlobalNotification]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      showGlobalNotification(
        language === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully',
        'success'
      );
    } catch (error) {
      console.error('Error logging out:', error);
      showGlobalNotification(
        language === 'ar' ? 'حدث خطأ أثناء تسجيل الخروج' : 'Error logging out',
        'error'
      );
    }
  }, [logout, language, showGlobalNotification]);

  const handleFarmSelect = useCallback((farmId) => {
    selectFarm(farmId);
  }, [selectFarm]);

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
      smartUnits: "الوحدات الذكية",
      goToUnits: "الذهاب للوحدات",
      addNewUnit: "إضافة وحدة جديدة",
      showHeader: "إظهار الشريط العلوي",
      hideHeader: "إخفاء الشريط العلوي",
      searchDevices: "ابحث عن أجهزة...",
      addNewDevice: "إضافة جهاز جديد",
      approvePendingDevice: "الموافقة على جهاز معلق",
      enterDeviceManually: "إدخال معرف جهاز يدوياً",
      deviceId: "معرف الجهاز",
      deviceName: "اسم الجهاز (اختياري)",
      approve: "موافقة",
      cancel: "إلغاء",
      back: "رجوع",
      refresh: "تحديث",
      lastUpdate: "آخر تحديث:",
      noDeviceSelected: "لا يوجد جهاز محدد",
      connectionQuality: "جودة الاتصال:"
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
      smartUnits: "Smart Units",
      goToUnits: "Go to Units",
      addNewUnit: "Add New Unit",
      showHeader: "Show Header",
      hideHeader: "Hide Header",
      searchDevices: "Search devices...",
      addNewDevice: "Add New Device",
      approvePendingDevice: "Approve Pending Device",
      enterDeviceManually: "Enter Device ID Manually",
      deviceId: "Device ID",
      deviceName: "Device Name (optional)",
      approve: "Approve",
      cancel: "Cancel",
      back: "Back",
      refresh: "Refresh",
      lastUpdate: "Last update:",
      noDeviceSelected: "No device selected",
      connectionQuality: "Connection Quality:"
    }
  };

  const t = translations[language];

  const getPageTitle = () => {
    if (isUnitsPage) return t.smartUnits;
    if (isPendingPage) return t.pendingDevicesPage;
    return t.pageTitle;
  };

  const AddFarmModal = () => {
    if (!showAddFarmModal) return null;

    const renderMainOptions = () => (
      <div className="modal-options">
        <button 
          className="modal-option-btn"
          onClick={() => handleAddOption('new')}
        >
          <i className="fas fa-plus-circle"></i>
          <span>{t.addNewDevice}</span>
        </button>
        
        <button 
          className="modal-option-btn"
          onClick={() => handleAddOption('pending')}
          disabled={pendingDevices.length === 0}
        >
          <i className="fas fa-clock"></i>
          <span>{t.approvePendingDevice}</span>
          {pendingDevicesCount > 0 && (
            <span className="modal-badge">{pendingDevicesCount}</span>
          )}
        </button>
        
        <button 
          className="modal-option-btn"
          onClick={() => handleAddOption('manual')}
        >
          <i className="fas fa-keyboard"></i>
          <span>{t.enterDeviceManually}</span>
        </button>
      </div>
    );

    const renderNewDeviceForm = () => (
      <div className="modal-form">
        <div className="form-group">
          <label>{t.deviceId}</label>
          <input
            type="text"
            value={newDeviceData.id}
            onChange={(e) => setNewDeviceData(prev => ({ ...prev, id: e.target.value }))}
            placeholder="ESP32_FARM_001"
          />
        </div>
        <div className="form-group">
          <label>{t.deviceName}</label>
          <input
            type="text"
            value={newDeviceData.name}
            onChange={(e) => setNewDeviceData(prev => ({ ...prev, name: e.target.value }))}
            placeholder={language === 'ar' ? 'اسم مخصص للجهاز' : 'Custom device name'}
          />
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={() => setAddFarmStep('main')}>
            {t.back}
          </button>
          <button className="btn-primary" onClick={handleAddNewDevice}>
            {t.addNewDevice}
          </button>
        </div>
      </div>
    );

    const renderPendingDevicesList = () => (
      <div className="modal-form">
        <div className="pending-list">
          {pendingDevices.map(device => (
            <div
              key={device.id}
              className={`pending-item ${selectedPendingDevice?.id === device.id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedPendingDevice(device);
                setNewDeviceData(prev => ({ ...prev, name: device.name || '' }));
              }}
            >
              <div className="device-info">
                <strong>{device.id}</strong>
                <span>{device.name || device.model}</span>
              </div>
              <i className="fas fa-check"></i>
            </div>
          ))}
        </div>
        
        {selectedPendingDevice && (
          <div className="form-group">
            <label>{t.deviceName}</label>
            <input
              type="text"
              value={newDeviceData.name}
              onChange={(e) => setNewDeviceData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={language === 'ar' ? 'اسم مخصص للجهاز' : 'Custom device name'}
            />
          </div>
        )}
        
        <div className="modal-actions">
          <button className="btn-secondary" onClick={() => setAddFarmStep('main')}>
            {t.back}
          </button>
          <button 
            className="btn-primary" 
            onClick={handleApproveDevice}
            disabled={!selectedPendingDevice}
          >
            {t.approve}
          </button>
        </div>
      </div>
    );

    const renderManualForm = () => (
      <div className="modal-form">
        <div className="form-group">
          <label>{t.deviceId}</label>
          <input
            type="text"
            value={newDeviceData.id}
            onChange={(e) => setNewDeviceData(prev => ({ ...prev, id: e.target.value }))}
            placeholder="ESP32_FARM_001"
          />
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={() => setAddFarmStep('main')}>
            {t.back}
          </button>
          <button className="btn-primary" onClick={handleManualAdd}>
            {t.addFarm}
          </button>
        </div>
      </div>
    );

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>{t.addFarm}</h3>
            <button 
              className="modal-close"
              onClick={() => setShowAddFarmModal(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="modal-body">
            {addFarmStep === 'main' && renderMainOptions()}
            {addFarmStep === 'new' && renderNewDeviceForm()}
            {addFarmStep === 'pending' && renderPendingDevicesList()}
            {addFarmStep === 'manual' && renderManualForm()}
          </div>
        </div>
      </div>
    );
  };

  if (!isHeaderCollapsed) {
    return (
      <>
        <div className="header-container">
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
                  aria-label={t.logout}
                >
                  <i className="fas fa-sign-out-alt"></i>
                  <span>{t.logout}</span>
                </button>
              </div>
            </div>
            
            <div className="controls">
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

              <div className="device-selector">
                <div className="search-box">
                  <i className="fas fa-search"></i>
                  <input
                    type="text"
                    placeholder={t.searchDevices}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select 
                  id="deviceSelect"
                  value={currentDevice || ''}
                  onChange={(e) => handleDeviceChange(e.target.value)}
                >
                  <option value="">{t.selectDevice}</option>
                  {filteredDevices.map(deviceId => (
                    <option key={deviceId} value={deviceId}>
                      {deviceId}
                    </option>
                  ))}
                </select>
              </div>
              
              <button className="nav-btn add-farm-btn" onClick={handleAddFarm}>
                <i className="fas fa-plus"></i>
                <span>{t.addFarm}</span>
                {pendingDevicesCount > 0 && (
                  <span className="pending-badge">{pendingDevicesCount}</span>
                )}
              </button>
              
              {/* 🔥 تحديث جزء حالة الاتصال مع إضافة مؤشرات الجودة */}
              {currentDevice ? (
                <div className="connection-status">
                  <span>{t.connectionStatus}</span>
                  
                  {/* 🔥 مؤشر جودة الاتصال */}
                  {currentDeviceStatus.lastSeen && (
                    <div className="quality-indicator">
                      <div 
                        className="quality-bar"
                        style={{
                          backgroundColor: getQualityColor(
                            getConnectionQuality(currentDeviceStatus.lastSeen)
                          )
                        }}
                      ></div>
                      <span className="quality-text">
                        {getQualityText(
                          getConnectionQuality(currentDeviceStatus.lastSeen)
                        )}
                      </span>
                    </div>
                  )}
                  
                  {/* 🔥 مؤشر الحالة مع تأثير الوميض للجهاز المتصل */}
                  <div className={`status-indicator ${currentDeviceStatus.isConnected ? 'connected' : 'disconnected'}`}>
                    <div className="status-dot"></div>
                    {currentDeviceStatus.isConnected && (
                      <div className="pulse-ring"></div>
                    )}
                  </div>
                  
                  <span className="status-text">
                    {currentDeviceStatus.isConnected ? t.connected : t.disconnected}
                  </span>
                  
                  {/* 🔥 زر التحديث اليدوي */}
                  <button 
                    className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    title={t.refresh}
                  >
                    <i className={`fas ${isRefreshing ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i>
                  </button>
                  
                  {/* 🔥 عرض آخر تحديث */}
                  {currentDeviceStatus.lastSeen && (
                    <span className="last-update">
                      {t.lastUpdate} {formatLastSeen(currentDeviceStatus.lastSeen)}
                    </span>
                  )}
                </div>
              ) : (
                <div className="connection-status">
                  <span>{t.connectionStatus}</span>
                  <div className="status-indicator disconnected">
                    <div className="status-dot"></div>
                  </div>
                  <span className="status-text">{t.disconnected}</span>
                  <span className="no-device">
                    {t.noDeviceSelected}
                  </span>
                </div>
              )}
              
              <div className="language-selector">
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>
              
              <div className="nav-buttons">
                <button 
                  className={`nav-btn settings ${isSettingsMode ? 'active' : ''}`}
                  onClick={toggleSettingsMode}
                >
                  <i className="fas fa-cog"></i>
                  <span>
                    {isSettingsMode ? `${t.settingsMode} Active` : t.settingsMode}
                  </span>
                </button>
                
                {isPendingPage ? (
                  <button 
                    className="nav-btn secondary"
                    onClick={() => handleNavigation('dashboard')}
                  >
                    <i className="fas fa-arrow-left"></i>
                    <span>{t.backToDashboard}</span>
                  </button>
                ) : isUnitsPage ? (
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
                  <>
                    <button 
                      className="nav-btn"
                      onClick={() => handleNavigation('units')}
                    >
                      <i className="fas fa-fan"></i>
                      <span>{t.goToUnits}</span>
                    </button>
                    
                    {currentDevice && (
                      <button 
                        className="nav-btn"
                        onClick={handleAddUnit}
                      >
                        <i className="fas fa-plus"></i>
                        <span>{t.addNewUnit}</span>
                      </button>
                    )}
                    
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
          </div>

          <div className="arrow-container">
            <button 
              className="toggle-arrow"
              onClick={toggleHeader}
              title={t.hideHeader}
            >
              <i className="fas fa-chevron-up"></i>
            </button>
          </div>

          <AddFarmModal />
        </div>

        <style jsx>{`
          .header-container {
            position: relative;
            margin-bottom: 10px;
            animation: slideDown 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .header {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border-radius: 20px;
            padding: 25px 35px;
            margin: 15px;
            box-shadow: 
              0 10px 40px rgba(0, 0, 0, 0.1),
              0 2px 10px rgba(0, 0, 0, 0.05),
              inset 0 1px 0 rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            position: relative;
            overflow: hidden;
          }

          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #2E8B57, #3CB371, #20B2AA);
          }

          .header-main {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 20px;
          }

          .header h1 {
            font-size: 1.6rem;
            font-weight: 800;
            background: linear-gradient(135deg, #2E8B57, #3CB371);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            display: flex;
            align-items: center;
            gap: 12px;
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
            padding: 10px 18px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 20px;
            font-size: 14px;
            border: 1px solid rgba(255, 255, 255, 0.5);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }

          .welcome-text {
            color: var(--text-dark);
            font-weight: 600;
          }

          .welcome-text strong {
            background: linear-gradient(135deg, #2E8B57, #3CB371);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .controls {
            display: flex;
            align-items: center;
            gap: 18px;
            flex-wrap: wrap;
          }

          .farm-selector select,
          .device-selector select,
          .language-selector select {
            padding: 10px 16px;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            font-size: 1rem;
            background: var(--white-card);
            min-width: 160px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }

          .farm-selector select:focus,
          .device-selector select:focus,
          .language-selector select:focus {
            outline: none;
            border-color: #2E8B57;
            box-shadow: 0 0 0 3px rgba(46, 139, 87, 0.1);
          }

          .device-selector {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .search-box {
            position: relative;
            display: flex;
            align-items: center;
          }

          .search-box i {
            position: absolute;
            left: 12px;
            color: #6c757d;
            z-index: 1;
          }

          .search-box input {
            padding: 8px 12px 8px 35px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            font-size: 0.9rem;
            width: 200px;
            background: var(--white-card);
            transition: all 0.3s ease;
          }

          .search-box input:focus {
            outline: none;
            border-color: #2E8B57;
            box-shadow: 0 0 0 2px rgba(46, 139, 87, 0.1);
          }

          .nav-btn {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
            border: none;
            border-radius: 12px;
            padding: 12px 20px;
            color: white;
            font-weight: 600;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 8px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(46, 139, 87, 0.3);
          }

          .nav-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.6s;
          }

          .nav-btn:hover::before {
            left: 100%;
          }

          .nav-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(46, 139, 87, 0.4);
          }

          .nav-btn.secondary {
            background: linear-gradient(135deg, #6c757d 0%, #868e96 100%);
            box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
          }

          .nav-btn.secondary:hover {
            background: linear-gradient(135deg, #5a6268 0%, #727b84 100%);
            box-shadow: 0 8px 25px rgba(108, 117, 125, 0.4);
          }

          .nav-btn.settings {
            background: linear-gradient(135deg, #17a2b8 0%, #48d1cc 100%);
            box-shadow: 0 4px 15px rgba(23, 162, 184, 0.3);
          }

          .nav-btn.settings:hover {
            background: linear-gradient(135deg, #138496 0%, #3db9b4 100%);
            box-shadow: 0 8px 25px rgba(23, 162, 184, 0.4);
          }

          .nav-btn.pending-btn {
            background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
            box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
          }

          .nav-btn.pending-btn:hover {
            background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
            box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
          }

          .nav-btn.settings.active {
            background: linear-gradient(135deg, #ffc107 0%, #ffd351 100%);
            box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.3);
            animation: glow 2s infinite;
          }

          .add-farm-btn {
            position: relative;
          }

          .pending-badge,
          .nav-badge {
            position: absolute;
            top: -8px;
            right: -8px;
            background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            font-size: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(220, 53, 69, 0.3);
          }

          .nav-badge {
            background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
          }

          .logout-btn {
            background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);
            box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
          }

          .logout-btn:hover {
            background: linear-gradient(135deg, #c82333 0%, #d91e2f 100%);
            box-shadow: 0 8px 25px rgba(220, 53, 69, 0.4);
          }

          /* 🔥 تحديث تنسيقات حالة الاتصال */
          .connection-status {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 18px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            border: 2px solid transparent;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
            position: relative;
          }

          .connection-status:hover {
            border-color: rgba(46, 139, 87, 0.2);
          }

          /* 🔥 مؤشر جودة الاتصال */
          .quality-indicator {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 4px 8px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 12px;
            border: 1px solid rgba(0, 0, 0, 0.1);
          }

          .quality-bar {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            animation: pulse 2s infinite;
          }

          .quality-text {
            font-size: 11px;
            font-weight: 600;
            color: #2c3e50;
          }

          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }

          .status-indicator {
            position: relative;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            position: relative;
            z-index: 2;
          }

          .status-indicator.connected .status-dot {
            background: #28a745;
            box-shadow: 0 0 10px rgba(40, 167, 69, 0.5);
          }

          .status-indicator.disconnected .status-dot {
            background: #dc3545;
            box-shadow: 0 0 10px rgba(220, 53, 69, 0.5);
          }

          .pulse-ring {
            position: absolute;
            top: 0;
            left: 0;
            width: 20px;
            height: 20px;
            border: 2px solid #28a745;
            border-radius: 50%;
            animation: pulse-ring 2s infinite;
            z-index: 1;
          }

          @keyframes pulse-ring {
            0% { transform: scale(0.8); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
          }

          .status-text {
            min-width: 60px;
          }

          .refresh-btn {
            background: none;
            border: none;
            color: #6c757d;
            cursor: pointer;
            padding: 5px;
            border-radius: 50%;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 30px;
          }

          .refresh-btn:hover:not(:disabled) {
            background: #e9ecef;
            color: #2E8B57;
            transform: rotate(180deg);
          }

          .refresh-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .refresh-btn.refreshing {
            color: #2E8B57;
          }

          .last-update {
            font-size: 12px;
            color: #6c757d;
            font-weight: normal;
            white-space: nowrap;
          }

          .no-device {
            font-size: 12px;
            color: #6c757d;
            font-weight: normal;
            font-style: italic;
          }

          .nav-buttons {
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
          }

          .arrow-container {
            display: flex;
            justify-content: center;
            margin-top: 8px;
          }

          .toggle-arrow {
            background: linear-gradient(135deg, #2E8B57 0%, #3CB371 100%);
            border: none;
            border-radius: 50%;
            width: 45px;
            height: 45px;
            font-size: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            color: white;
            box-shadow: 
              0 6px 20px rgba(46, 139, 87, 0.4),
              0 2px 5px rgba(0, 0, 0, 0.1);
            position: relative;
            overflow: hidden;
          }

          .toggle-arrow::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.6s;
          }

          .toggle-arrow:hover::before {
            left: 100%;
          }

          .toggle-arrow:hover {
            transform: scale(1.15) translateY(-2px);
            box-shadow: 
              0 10px 30px rgba(46, 139, 87, 0.6),
              0 4px 10px rgba(0, 0, 0, 0.15);
          }

          /* Modal Styles */
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(5px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
          }

          .modal-content {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border-radius: 20px;
            padding: 0;
            width: 90%;
            max-width: 500px;
            max-height: 80vh;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid rgba(255, 255, 255, 0.3);
          }

          .modal-header {
            padding: 25px 30px 20px;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          }

          .modal-header h3 {
            margin: 0;
            font-size: 1.4rem;
            font-weight: 700;
            background: linear-gradient(135deg, #2E8B57, #3CB371);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .modal-close {
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            color: #6c757d;
            padding: 5px;
            border-radius: 50%;
            transition: all 0.3s ease;
          }

          .modal-close:hover {
            background: #e9ecef;
            color: #dc3545;
          }

          .modal-body {
            padding: 30px;
            max-height: 60vh;
            overflow-y: auto;
          }

          .modal-options {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .modal-option-btn {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 20px;
            background: white;
            border: 2px solid #e9ecef;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            text-align: left;
          }

          .modal-option-btn:hover {
            border-color: #2E8B57;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(46, 139, 87, 0.1);
          }

          .modal-option-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }

          .modal-option-btn:disabled:hover {
            border-color: #e9ecef;
            box-shadow: none;
          }

          .modal-option-btn i {
            font-size: 1.5rem;
            background: linear-gradient(135deg, #2E8B57, #3CB371);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .modal-option-btn span {
            font-weight: 600;
            color: #2c3e50;
          }

          .modal-badge {
            position: absolute;
            top: -8px;
            right: -8px;
            background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(220, 53, 69, 0.3);
          }

          .modal-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .form-group label {
            font-weight: 600;
            color: #2c3e50;
            font-size: 0.95rem;
          }

          .form-group input {
            padding: 12px 16px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.3s ease;
          }

          .form-group input:focus {
            outline: none;
            border-color: #2E8B57;
            box-shadow: 0 0 0 3px rgba(46, 139, 87, 0.1);
          }

          .pending-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-height: 200px;
            overflow-y: auto;
          }

          .pending-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 15px;
            background: white;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .pending-item:hover {
            border-color: #2E8B57;
          }

          .pending-item.selected {
            border-color: #2E8B57;
            background: rgba(46, 139, 87, 0.05);
          }

          .device-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .device-info strong {
            color: #2c3e50;
            font-size: 0.95rem;
          }

          .device-info span {
            color: #6c757d;
            font-size: 0.85rem;
          }

          .pending-item i {
            color: #2E8B57;
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          .pending-item.selected i {
            opacity: 1;
          }

          .modal-actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            margin-top: 10px;
          }

          .btn-primary {
            background: linear-gradient(135deg, #2E8B57 0%, #3CB371 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(46, 139, 87, 0.4);
          }

          .btn-primary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
          }

          .btn-secondary {
            background: #6c757d;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .btn-secondary:hover {
            background: #5a6268;
            transform: translateY(-2px);
          }

          @keyframes slideDown {
            from { 
              opacity: 0; 
              transform: translateY(-30px) scale(0.95); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0) scale(1); 
            }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideUp {
            from { 
              opacity: 0; 
              transform: translateY(30px) scale(0.95); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0) scale(1); 
            }
          }

          @keyframes glow {
            0% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.3); }
            50% { box-shadow: 0 0 0 6px rgba(255, 193, 7, 0.1); }
            100% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.3); }
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
              padding: 20px;
              margin: 10px;
              border-radius: 16px;
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

            .search-box input {
              width: 100%;
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
              flex-wrap: wrap;
              gap: 8px;
            }

            .last-update,
            .no-device {
              font-size: 11px;
            }

            .toggle-arrow {
              width: 40px;
              height: 40px;
              font-size: 16px;
            }

            .modal-content {
              width: 95%;
              margin: 20px;
            }

            .modal-body {
              padding: 20px;
            }
          }

          @media (max-width: 480px) {
            .header {
              padding: 15px;
              margin: 8px;
            }

            .header h1 {
              font-size: 1.3rem;
            }

            .toggle-arrow {
              width: 38px;
              height: 38px;
              font-size: 15px;
            }

            .modal-content {
              margin: 10px;
            }

            .modal-header {
              padding: 20px 20px 15px;
            }

            .modal-body {
              padding: 15px;
            }
          }
        `}</style>
      </>
    );
  }

  return (
    <div className="header-collapsed">
      <button 
        className="toggle-arrow"
        onClick={toggleHeader}
        title={t.showHeader}
      >
        <i className="fas fa-chevron-down"></i>
      </button>

      <style jsx>{`
        .header-collapsed {
          display: flex;
          justify-content: center;
          margin-bottom: 10px;
          animation: fadeIn 0.3s ease-in-out;
        }

        .toggle-arrow {
          background: linear-gradient(135deg, #2E8B57 0%, #3CB371 100%);
          border: none;
          border-radius: 50%;
          width: 45px;
          height: 45px;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: white;
          box-shadow: 
            0 6px 20px rgba(46, 139, 87, 0.4),
            0 2px 5px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }

        .toggle-arrow::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.6s;
        }

        .toggle-arrow:hover::before {
          left: 100%;
        }

        .toggle-arrow:hover {
          transform: scale(1.15) translateY(-2px);
          box-shadow: 
            0 10px 30px rgba(46, 139, 87, 0.6),
            0 4px 10px rgba(0, 0, 0, 0.15);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 768px) {
          .header-collapsed {
            margin-bottom: 8px;
          }

          .toggle-arrow {
            width: 40px;
            height: 40px;
            font-size: 16px;
          }
        }

        @media (max-width: 480px) {
          .toggle-arrow {
            width: 38px;
            height: 38px;
            font-size: 15px;
          }
        }
      `}</style>
    </div>
  );
});

Header.displayName = 'Header';

export default Header;