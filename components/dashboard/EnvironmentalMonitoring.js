// components/dashboard/EnvironmentalMonitoring.js
import React, { useContext, useMemo, useCallback, useState, useEffect } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { firebaseService } from '../../hooks/useFirebase';

export default function EnvironmentalMonitoring({ 
  sensorData, 
  currentSensor, 
  onSensorClick,
  deviceId,
  userId 
}) {
  const { language, user, currentDevice } = useContext(AppContext);
  const [customRanges, setCustomRanges] = useState({});
  const [showRangeModal, setShowRangeModal] = useState(null);
  const [tempRange, setTempRange] = useState({ min: 0, max: 100 });
  const [saveStatus, setSaveStatus] = useState({ show: false, message: '', type: '' });
  const [animatedValues, setAnimatedValues] = useState({});
  const [iconPulses, setIconPulses] = useState({});

  // تعريف معلومات المستشعرات باستخدام useMemo
  const SENSOR_INFO = useMemo(() => ({
    temperature: {
      name: language === 'ar' ? 'درجة الحرارة' : 'Temperature',
      icon: 'fa-temperature-three-quarters',
      unit: '°C',
      color: '#FF6384',
      gradient: 'linear-gradient(135deg, #FF6384 0%, #FF9F40 100%)',
      defaultRange: { min: 20, max: 25 },
      description: language === 'ar' ? 'مراقبة درجة حرارة المزرعة' : 'Farm temperature monitoring',
      iconStyle: 'flame'
    },
    humidity: {
      name: language === 'ar' ? 'الرطوبة' : 'Humidity',
      icon: 'fa-droplet',
      unit: '%',
      color: '#36A2EB',
      gradient: 'linear-gradient(135deg, #36A2EB 0%, #4BC0C0 100%)',
      defaultRange: { min: 50, max: 70 },
      description: language === 'ar' ? 'مستوى الرطوبة النسبي' : 'Relative humidity level',
      iconStyle: 'water'
    },
    ammonia: {
      name: language === 'ar' ? 'الأمونيا' : 'Ammonia',
      icon: 'fa-wind',
      unit: 'ppm',
      color: '#FFCE56',
      gradient: 'linear-gradient(135deg, #FFCE56 0%, #FF9F40 100%)',
      defaultRange: { min: 0, max: 25 },
      description: language === 'ar' ? 'تركيز غاز الأمونيا' : 'Ammonia gas concentration',
      iconStyle: 'gas'
    },
    airQuality: {
      name: language === 'ar' ? 'جودة الهواء' : 'Air Quality',
      icon: 'fa-smog',
      unit: 'AQI',
      color: '#4BC0C0',
      gradient: 'linear-gradient(135deg, #4BC0C0 0%, #9966FF 100%)',
      defaultRange: { min: 0, max: 50 },
      description: language === 'ar' ? 'مؤشر جودة الهواء العام' : 'Overall air quality index',
      iconStyle: 'cloud'
    }
  }), [language]);

  // تحميل النطاقات المخصصة من Firebase
  useEffect(() => {
    const loadCustomRanges = async () => {
      if (!user?.uid || !currentDevice) return;
      
      try {
        const ranges = await firebaseService.getData(
          user.uid, 
          `devices/${currentDevice}/sensorRanges`
        );
        if (ranges) {
          setCustomRanges(ranges);
        }
      } catch (error) {
        console.error('Error loading custom ranges:', error);
      }
    };

    loadCustomRanges();
  }, [user, currentDevice]);

  // تأثير النبض للأيقونات عند تغيير القيم
  useEffect(() => {
    const newPulses = {};
    Object.entries(sensorData).forEach(([sensorType, value]) => {
      if (value !== undefined && value !== null && value !== animatedValues[sensorType]) {
        newPulses[sensorType] = true;
        setTimeout(() => {
          setIconPulses(prev => ({ ...prev, [sensorType]: false }));
        }, 600);
      }
    });
    setIconPulses(prev => ({ ...prev, ...newPulses }));
  }, [sensorData, animatedValues]);

  // الحصول على النطاق النشط (مخصص أو افتراضي)
  const getActiveRange = useCallback((sensorType) => {
    return customRanges[sensorType] || SENSOR_INFO[sensorType]?.defaultRange;
  }, [customRanges, SENSOR_INFO]);

  // رسوم متحركة للقيم المتغيرة
  useEffect(() => {
    const newAnimatedValues = {};
    Object.entries(sensorData).forEach(([sensorType, value]) => {
      if (value !== undefined && value !== null) {
        newAnimatedValues[sensorType] = value;
      }
    });
    setAnimatedValues(newAnimatedValues);
  }, [sensorData]);

  // دالة تحديد حالة المستشعر باستخدام useCallback
  const getSensorStatus = useCallback((sensorType, value) => {
    const range = getActiveRange(sensorType);
    if (!range || value === undefined || value === null) return 'unknown';
    
    const buffer = (range.max - range.min) * 0.1; // 10% buffer zone
    
    if (value < range.min - buffer) return 'very-low';
    if (value < range.min) return 'low';
    if (value > range.max + buffer) return 'very-high';
    if (value > range.max) return 'high';
    return 'optimal';
  }, [getActiveRange]);

  // حساب النسبة المئوية للقيمة ضمن النطاق
  const getPercentage = useCallback((sensorType, value) => {
    const range = getActiveRange(sensorType);
    if (!range || value === undefined || value === null) return 0;
    
    const clampedValue = Math.max(range.min, Math.min(range.max, value));
    return ((clampedValue - range.min) / (range.max - range.min)) * 100;
  }, [getActiveRange]);

  // ألوان الحالات باستخدام useMemo
  const statusColors = useMemo(() => ({
    optimal: '#10B981',
    low: '#F59E0B',
    high: '#EF4444',
    'very-low': '#DC2626',
    'very-high': '#7C2D12',
    unknown: '#6B7280'
  }), []);

  // نصوص الحالات باستخدام useMemo
  const statusTexts = useMemo(() => ({
    ar: { 
      optimal: 'مثالي', 
      low: 'منخفض قليلاً', 
      high: 'مرتفع قليلاً',
      'very-low': 'منخفض جداً',
      'very-high': 'مرتفع جداً',
      unknown: 'غير متصل' 
    },
    en: { 
      optimal: 'Optimal', 
      low: 'Slightly Low', 
      high: 'Slightly High',
      'very-low': 'Very Low',
      'very-high': 'Very High',
      unknown: 'Offline' 
    }
  }), []);

  const getStatusColor = useCallback((status) => {
    return statusColors[status] || '#6B7280';
  }, [statusColors]);

  const getStatusText = useCallback((status) => {
    return statusTexts[language][status] || statusTexts[language].unknown;
  }, [language, statusTexts]);

  // فتح نافذة تعديل النطاق
  const handleOpenRangeModal = useCallback((sensorType, event) => {
    event.stopPropagation();
    const range = getActiveRange(sensorType);
    setTempRange(range);
    setShowRangeModal(sensorType);
  }, [getActiveRange]);

  // إغلاق نافذة تعديل النطاق
  const handleCloseRangeModal = useCallback(() => {
    setShowRangeModal(null);
    setTempRange({ min: 0, max: 100 });
  }, []);

  // حفظ النطاق المخصص
  const handleSaveRange = useCallback(async () => {
    if (!showRangeModal || !user?.uid || !currentDevice) return;

    try {
      await firebaseService.updateData(
        user.uid,
        `devices/${currentDevice}/sensorRanges`,
        { [showRangeModal]: tempRange }
      );

      setCustomRanges(prev => ({
        ...prev,
        [showRangeModal]: tempRange
      }));

      setSaveStatus({
        show: true,
        message: language === 'ar' ? 'تم حفظ النطاق بنجاح' : 'Range saved successfully',
        type: 'success'
      });

      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, show: false }));
      }, 3000);

      handleCloseRangeModal();
    } catch (error) {
      console.error('Error saving range:', error);
      setSaveStatus({
        show: true,
        message: language === 'ar' ? 'خطأ في حفظ النطاق' : 'Error saving range',
        type: 'error'
      });
    }
  }, [showRangeModal, user, currentDevice, tempRange, language, handleCloseRangeModal]);

  // إعادة التعيين إلى القيم الافتراضية
  const handleResetRange = useCallback(async () => {
    if (!showRangeModal || !user?.uid || !currentDevice) return;

    try {
      await firebaseService.updateData(
        user.uid,
        `devices/${currentDevice}/sensorRanges`,
        { [showRangeModal]: null }
      );

      setCustomRanges(prev => {
        const newRanges = { ...prev };
        delete newRanges[showRangeModal];
        return newRanges;
      });

      setSaveStatus({
        show: true,
        message: language === 'ar' ? 'تم إعادة التعيين إلى القيم الافتراضية' : 'Reset to default values',
        type: 'success'
      });

      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, show: false }));
      }, 3000);

      handleCloseRangeModal();
    } catch (error) {
      console.error('Error resetting range:', error);
    }
  }, [showRangeModal, user, currentDevice, language, handleCloseRangeModal]);

  // دالة التعامل مع النقر على المستشعر
  const handleSensorClick = useCallback((sensorType) => {
    if (onSensorClick) {
      onSensorClick(sensorType);
    }
  }, [onSensorClick]);

  // التحقق من وجود البيانات
  const hasSensorData = useMemo(() => {
    return sensorData && Object.keys(sensorData).length > 0 && 
           Object.values(sensorData).some(value => value !== null && value !== undefined);
  }, [sensorData]);

  // التحقق من اتصال الجهاز والمستخدم بشكل صحيح
  const isDeviceConnected = useMemo(() => {
    const actualDeviceId = deviceId || currentDevice;
    const actualUserId = userId || user?.uid;
    return actualDeviceId && actualUserId && user;
  }, [deviceId, currentDevice, userId, user]);

  const isUserLoggedIn = useMemo(() => !!user, [user]);
  const hasSelectedDevice = useMemo(() => !!(deviceId || currentDevice), [deviceId, currentDevice]);

  const translations = useMemo(() => ({
    ar: {
      title: 'المراقبة البيئية',
      optimalRange: 'المدى الأمثل:',
      noData: 'لا توجد بيانات',
      deviceOffline: 'الجهاز غير متصل',
      selectSensor: 'انقر لاختيار المستشعر',
      liveData: 'بيانات مباشرة',
      noDeviceSelected: 'لم يتم اختيار جهاز',
      pleaseLogin: 'يجب تسجيل الدخول أولاً',
      customizeRange: 'تخصيص النطاق',
      minValue: 'أدنى قيمة',
      maxValue: 'أعلى قيمة',
      save: 'حفظ',
      cancel: 'إلغاء',
      resetToDefault: 'إعادة التعيين',
      customRange: 'نطاق مخصص',
      percentage: 'النسبة',
      withinRange: 'ضمن النطاق'
    },
    en: {
      title: 'Environmental Monitoring',
      optimalRange: 'Optimal Range:',
      noData: 'No data',
      deviceOffline: 'Device offline',
      selectSensor: 'Click to select sensor',
      liveData: 'Live Data',
      noDeviceSelected: 'No device selected',
      pleaseLogin: 'Please login first',
      customizeRange: 'Customize Range',
      minValue: 'Minimum Value',
      maxValue: 'Maximum Value',
      save: 'Save',
      cancel: 'Cancel',
      resetToDefault: 'Reset to Default',
      customRange: 'Custom Range',
      percentage: 'Percentage',
      withinRange: 'Within Range'
    }
  }), []);

  const t = translations[language];

  // عرض حالة التحميل أثناء التحقق
  if (!user) {
    return (
      <div className="environmental-monitoring">
        <div className="section-header">
          <h2 className="section-title">{t.title}</h2>
        </div>
        <div className="no-device-message">
          <i className="fas fa-user-lock"></i>
          <span>{t.pleaseLogin}</span>
        </div>
      </div>
    );
  }

  if (!hasSelectedDevice) {
    return (
      <div className="environmental-monitoring">
        <div className="section-header">
          <h2 className="section-title">{t.title}</h2>
        </div>
        <div className="no-device-message">
          <i className="fas fa-microchip"></i>
          <span>{t.noDeviceSelected}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="environmental-monitoring">
      <div className="section-header">
        <h2 className="section-title">{t.title}</h2>
        {isDeviceConnected && hasSensorData && (
          <div className="live-indicator">
            <div className="live-dot"></div>
            <span>{t.liveData}</span>
          </div>
        )}
      </div>
      
      <div className="sensors-grid">
        {Object.entries(SENSOR_INFO).map(([sensorType, info]) => {
          const value = sensorData?.[sensorType];
          const animatedValue = animatedValues[sensorType];
          const status = getSensorStatus(sensorType, value);
          const isActive = currentSensor === sensorType;
          const hasValue = value !== undefined && value !== null;
          const range = getActiveRange(sensorType);
          const percentage = getPercentage(sensorType, value);
          const isCustomRange = !!customRanges[sensorType];
          const isPulsing = iconPulses[sensorType];

          return (
            <div
              key={sensorType}
              className={`sensor-card ${isActive ? 'active' : ''} ${!hasValue ? 'no-data' : ''} status-${status}`}
              onClick={() => handleSensorClick(sensorType)}
              title={t.selectSensor}
            >
              {/* زر الإعدادات */}
              <button 
                className="settings-btn"
                onClick={(e) => handleOpenRangeModal(sensorType, e)}
                title={t.customizeRange}
              >
                <i className="fas fa-cog"></i>
              </button>

              <div className="sensor-header">
                <div className={`sensor-icon-container ${info.iconStyle} ${isPulsing ? 'pulse' : ''}`}>
                  <div 
                    className="sensor-icon-background"
                    style={{ background: info.gradient }}
                  ></div>
                  <div className="sensor-icon" style={{ color: 'white' }}>
                    <i className={`fas ${info.icon}`}></i>
                  </div>
                  <div className="icon-glow" style={{ background: info.color }}></div>
                </div>
                <div className="sensor-info">
                  <h3>{info.name}</h3>
                  <div 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(status) }}
                  >
                    {getStatusText(status)}
                  </div>
                  {isCustomRange && (
                    <div className="custom-range-indicator">
                      {t.customRange}
                    </div>
                  )}
                </div>
              </div>

              <div className="sensor-value">
                <span className="value animated-value">
                  {hasValue ? animatedValue?.toFixed(1) : '--'}
                </span>
                <span className="unit">{info.unit}</span>
              </div>

              {/* مؤشر النسبة المئوية */}
              {hasValue && (
                <div className="percentage-indicator">
                  <div className="percentage-bar">
                    <div 
                      className="percentage-fill"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: getStatusColor(status)
                      }}
                    ></div>
                  </div>
                  <span className="percentage-text">
                    {t.percentage}: {percentage.toFixed(0)}% ({t.withinRange})
                  </span>
                </div>
              )}

              {hasValue && (
                <div className="sensor-description">
                  <span>{info.description}</span>
                </div>
              )}

              <div className="sensor-range">
                <span className="range-label">
                  {t.optimalRange}
                </span>
                <span className="range-value">
                  {range.min} - {range.max} {info.unit}
                </span>
              </div>

              {/* مؤشر النشاط */}
              <div className="sensor-activity">
                <div 
                  className="activity-dot" 
                  style={{ 
                    backgroundColor: hasValue ? getStatusColor(status) : '#6B7280'
                  }}
                ></div>
                <span className="activity-text">
                  {hasValue ? getStatusText(status) : t.deviceOffline}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* نافذة تعديل النطاق */}
      {showRangeModal && (
        <div className="range-modal-overlay" onClick={handleCloseRangeModal}>
          <div className="range-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {t.customizeRange} - {SENSOR_INFO[showRangeModal]?.name}
              </h3>
              <button className="close-btn" onClick={handleCloseRangeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="range-input-group">
                <label>{t.minValue}</label>
                <input
                  type="number"
                  value={tempRange.min}
                  onChange={(e) => setTempRange(prev => ({ 
                    ...prev, 
                    min: parseFloat(e.target.value) || 0 
                  }))}
                />
                <span>{SENSOR_INFO[showRangeModal]?.unit}</span>
              </div>
              
              <div className="range-input-group">
                <label>{t.maxValue}</label>
                <input
                  type="number"
                  value={tempRange.max}
                  onChange={(e) => setTempRange(prev => ({ 
                    ...prev, 
                    max: parseFloat(e.target.value) || 100 
                  }))}
                />
                <span>{SENSOR_INFO[showRangeModal]?.unit}</span>
              </div>

              <div className="range-preview">
                <span>النطاق الحالي: {tempRange.min} - {tempRange.max} {SENSOR_INFO[showRangeModal]?.unit}</span>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={handleResetRange}>
                {t.resetToDefault}
              </button>
              <button className="btn btn-secondary" onClick={handleCloseRangeModal}>
                {t.cancel}
              </button>
              <button className="btn btn-primary" onClick={handleSaveRange}>
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* إشعار الحفظ */}
      {saveStatus.show && (
        <div className={`save-notification ${saveStatus.type}`}>
          <i className={`fas ${saveStatus.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* رسالة عندما لا توجد بيانات */}
      {!hasSensorData && isDeviceConnected && (
        <div className="no-data-message">
          <i className="fas fa-database"></i>
          <span>{t.noData}</span>
          <small>
            {language === 'ar' 
              ? 'جاري انتظار البيانات من المستشعرات...' 
              : 'Waiting for data from sensors...'
            }
          </small>
        </div>
      )}

      {/* رسالة عندما لا يكون هناك جهاز متصل */}
      {!isDeviceConnected && isUserLoggedIn && hasSelectedDevice && (
        <div className="no-device-message">
          <i className="fas fa-microchip"></i>
          <span>{t.deviceOffline}</span>
        </div>
      )}

      <style jsx>{`
        .environmental-monitoring {
          margin-bottom: 30px;
          position: relative;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .section-title {
          color: var(--text-dark);
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--success);
          font-size: 0.9rem;
          font-weight: 500;
          background: #f0fdf4;
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid #bbf7d0;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          background: var(--success);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .sensors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .sensor-card {
          background: var(--white-card);
          padding: 20px;
          border-radius: 16px;
          box-shadow: var(--shadow-soft);
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .sensor-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: transparent;
          transition: all 0.3s ease;
        }

        .sensor-card.status-optimal::before {
          background: #10B981;
        }

        .sensor-card.status-low::before {
          background: #F59E0B;
          animation: glow-warning 2s infinite;
        }

        .sensor-card.status-high::before {
          background: #EF4444;
          animation: glow-danger 2s infinite;
        }

        .sensor-card.status-very-low::before,
        .sensor-card.status-very-high::before {
          background: #DC2626;
          animation: glow-critical 1s infinite;
        }

        @keyframes glow-warning {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @keyframes glow-danger {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        @keyframes glow-critical {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .sensor-card.active {
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-medium);
        }

        .sensor-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-medium);
        }

        .sensor-card.no-data {
          opacity: 0.7;
          background: #f8f9fa;
        }

        .sensor-card.no-data:hover {
          opacity: 0.9;
        }

        .settings-btn {
          position: absolute;
          top: 15px;
          right: 15px;
          background: rgba(0, 0, 0, 0.1);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          opacity: 0.6;
          z-index: 2;
        }

        .settings-btn:hover {
          background: var(--primary);
          color: white;
          opacity: 1;
          transform: rotate(90deg);
        }

        .sensor-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 15px;
        }

        /* تصميم جديد ومحسّن للأيقونات */
        .sensor-icon-container {
          position: relative;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .sensor-icon-container:hover {
          transform: scale(1.05) rotate(5deg);
        }

        .sensor-icon-container.pulse {
          animation: iconPulse 0.6s ease-in-out;
        }

        @keyframes iconPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }

        .sensor-icon-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          opacity: 0.9;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .sensor-icon {
          font-size: 1.8rem;
          z-index: 1;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
          transition: all 0.3s ease;
        }

        .icon-glow {
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          border-radius: 50%;
          opacity: 0;
          transition: all 0.3s ease;
          animation: glowPulse 2s infinite;
        }

        .sensor-icon-container:hover .icon-glow {
          opacity: 0.3;
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }

        /* تأثيرات خاصة لكل نوع من الأيقونات */
        .sensor-icon-container.flame .sensor-icon {
          animation: flameFlicker 3s infinite alternate;
        }

        @keyframes flameFlicker {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.05) rotate(-2deg); }
          75% { transform: scale(1.03) rotate(2deg); }
        }

        .sensor-icon-container.water .sensor-icon {
          animation: waterDrop 4s infinite;
        }

        @keyframes waterDrop {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }

        .sensor-icon-container.gas .sensor-icon {
          animation: gasFlow 5s infinite;
        }

        @keyframes gasFlow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .sensor-icon-container.cloud .sensor-icon {
          animation: cloudFloat 6s infinite ease-in-out;
        }

        @keyframes cloudFloat {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(3px); }
        }

        .sensor-info {
          flex: 1;
        }

        .sensor-info h3 {
          color: var(--text-dark);
          margin-bottom: 5px;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .status-badge {
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 500;
          display: inline-block;
        }

        .custom-range-indicator {
          background: var(--primary);
          color: white;
          padding: 2px 6px;
          border-radius: 8px;
          font-size: 0.6rem;
          margin-top: 4px;
          display: inline-block;
        }

        .sensor-value {
          text-align: center;
          margin: 20px 0;
        }

        .animated-value {
          font-size: 2.5rem;
          font-weight: bold;
          color: var(--text-dark);
          transition: all 0.5s ease;
        }

        .unit {
          font-size: 1rem;
          color: var(--text-gray);
          margin-left: 5px;
        }

        .percentage-indicator {
          margin: 15px 0;
        }

        .percentage-bar {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .percentage-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .percentage-text {
          font-size: 0.8rem;
          color: var(--text-gray);
          text-align: center;
          display: block;
        }

        .sensor-description {
          text-align: center;
          margin-bottom: 15px;
        }

        .sensor-description span {
          color: var(--text-gray);
          font-size: 0.8rem;
          font-style: italic;
        }

        .sensor-range {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
          margin-bottom: 10px;
        }

        .range-label {
          color: var(--text-gray);
          font-size: 0.8rem;
        }

        .range-value {
          color: var(--text-dark);
          font-size: 0.8rem;
          font-weight: 500;
        }

        .sensor-activity {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 10px;
          border-top: 1px solid #f3f4f6;
        }

        .activity-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .activity-text {
          color: var(--text-gray);
          font-size: 0.7rem;
        }

        /* نافذة تعديل النطاق */
        .range-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .range-modal {
          background: white;
          border-radius: 12px;
          padding: 0;
          max-width: 400px;
          width: 100%;
          box-shadow: var(--shadow-large);
          animation: modal-appear 0.3s ease;
        }

        @keyframes modal-appear {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h3 {
          margin: 0;
          color: var(--text-dark);
          font-size: 1.2rem;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: var(--text-gray);
          padding: 5px;
          border-radius: 4px;
        }

        .close-btn:hover {
          background: #f3f4f6;
          color: var(--text-dark);
        }

        .modal-body {
          padding: 20px;
        }

        .range-input-group {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }

        .range-input-group label {
          min-width: 80px;
          color: var(--text-dark);
          font-weight: 500;
        }

        .range-input-group input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .range-input-group input:focus {
          outline: none;
          border-color: var(--primary);
        }

        .range-input-group span {
          color: var(--text-gray);
          min-width: 40px;
        }

        .range-preview {
          text-align: center;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 6px;
          margin-top: 15px;
          font-size: 0.9rem;
          color: var(--text-dark);
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          justify-content: flex-end;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: var(--primary);
          color: white;
        }

        .btn-primary:hover {
          background: var(--primary-dark);
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background: #4b5563;
        }

        /* إشعار الحفظ */
        .save-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 8px;
          color: white;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 1001;
          animation: slide-in 0.3s ease;
        }

        .save-notification.success {
          background: #10B981;
        }

        .save-notification.error {
          background: #EF4444;
        }

        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .no-data-message,
        .no-device-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: var(--white-card);
          border-radius: 12px;
          box-shadow: var(--shadow-soft);
          color: var(--text-gray);
          gap: 15px;
          text-align: center;
        }

        .no-data-message i,
        .no-device-message i {
          font-size: 3rem;
          opacity: 0.5;
        }

        .no-data-message small {
          font-size: 0.8rem;
          opacity: 0.7;
        }

        @media (max-width: 768px) {
          .sensors-grid {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .sensor-card {
            padding: 15px;
          }

          .sensor-value .animated-value {
            font-size: 2rem;
          }

          .sensor-icon-container {
            width: 60px;
            height: 60px;
          }

          .sensor-icon {
            font-size: 1.5rem;
          }

          .range-modal {
            margin: 10px;
          }

          .modal-actions {
            flex-direction: column;
          }
        }

        @media (max-width: 480px) {
          .sensor-header {
            gap: 10px;
          }

          .sensor-icon-container {
            width: 50px;
            height: 50px;
          }

          .sensor-icon {
            font-size: 1.3rem;
          }

          .sensor-info h3 {
            font-size: 1rem;
          }

          .sensor-value .animated-value {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
}

EnvironmentalMonitoring.defaultProps = {
  sensorData: {},
  currentSensor: 'temperature',
  deviceId: '',
  userId: ''
};