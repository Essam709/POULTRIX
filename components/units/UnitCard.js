// components/units/UnitCard.js
import React, { useState, useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { firebaseService } from '../../hooks/useFirebase';

const UnitCard = ({ unitId, unitData }) => {
  const { currentDevice, isSettingsMode, language, SENSOR_INFO, UNIT_TYPES } = useContext(AppContext);
  const [isEditingName, setIsEditingName] = useState(false);
  const [unitName, setUnitName] = useState(unitData.name || unitId);
  const [loading, setLoading] = useState(false);

  const translations = {
    ar: {
      unitType: "نوع الوحدة:",
      manual: "يدوي",
      sensor: "حسب المستشعر",
      timer: "مؤقت",
      auto: "تلقائي",
      manualControl: "التشغيل اليدوي",
      selectSensors: "اختر المستشعرات:",
      thresholdSettings: "إعدادات العتبات:",
      timerSettings: "إعدادات المؤقت:",
      startTime: "وقت البدء",
      endTime: "وقت التوقف",
      reset: "إعادة تعيين",
      saveSettings: "حفظ الإعدادات",
      noSensorsMessage: "لم يتم اختيار أي مستشعرات نشطة",
      minThreshold: "الحد الأدنى",
      maxThreshold: "الحد الأقصى",
      running: "قيد التشغيل",
      stopped: "متوقف",
      deleteUnit: "حذف الوحدة",
      confirmDelete: "هل أنت متأكد من حذف هذه الوحدة؟",
      settingsModeRequired: "يرجى تفعيل وضع الإعدادات الهيكلية أولاً",
      resetConfirm: "هل تريد إعادة تعيين إعدادات هذه الوحدة؟",
      saveSuccess: "تم حفظ الإعدادات بنجاح",
      error: "حدث خطأ"
    },
    en: {
      unitType: "Unit Type:",
      manual: "Manual",
      sensor: "By Sensor",
      timer: "Timer",
      auto: "Auto",
      manualControl: "Manual Control",
      selectSensors: "Select Sensors:",
      thresholdSettings: "Threshold Settings:",
      timerSettings: "Timer Settings:",
      startTime: "Start Time",
      endTime: "End Time",
      reset: "Reset",
      saveSettings: "Save Settings",
      noSensorsMessage: "No active sensors selected",
      minThreshold: "Min Threshold",
      maxThreshold: "Max Threshold",
      running: "Running",
      stopped: "Stopped",
      deleteUnit: "Delete Unit",
      confirmDelete: "Are you sure you want to delete this unit?",
      settingsModeRequired: "Please enable structural settings mode first",
      resetConfirm: "Do you want to reset this unit's settings?",
      saveSuccess: "Settings saved successfully",
      error: "An error occurred"
    }
  };

  const t = translations[language];

  const handleDeleteUnit = async () => {
    if (!isSettingsMode) {
      alert(t.settingsModeRequired);
      return;
    }

    if (!confirm(t.confirmDelete)) {
      return;
    }

    setLoading(true);
    try {
      await firebaseService.deleteUnit(currentDevice, unitId);
    } catch (error) {
      console.error('Error deleting unit:', error);
      alert(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleNameEdit = () => {
    if (!isSettingsMode) return;
    setIsEditingName(true);
  };

  const handleNameSave = async () => {
    if (!unitName.trim()) return;

    setLoading(true);
    try {
      await firebaseService.updateUnit(currentDevice, unitId, { name: unitName.trim() });
      setIsEditingName(false);
    } catch (error) {
      console.error('Error updating unit name:', error);
      alert(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleNameKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setUnitName(unitData.name || unitId);
      setIsEditingName(false);
    }
  };

  const handleTypeChange = async (newType) => {
    if (!isSettingsMode) {
      alert(t.settingsModeRequired);
      return;
    }

    setLoading(true);
    try {
      await firebaseService.updateUnit(currentDevice, unitId, { type: newType });
    } catch (error) {
      console.error('Error updating unit type:', error);
      alert(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = async (newMode) => {
    setLoading(true);
    try {
      await firebaseService.updateUnit(currentDevice, unitId, { mode: newMode });
    } catch (error) {
      console.error('Error updating unit mode:', error);
      alert(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUnit = async (isOn) => {
    setLoading(true);
    try {
      await firebaseService.updateUnit(currentDevice, unitId, { status: isOn });
    } catch (error) {
      console.error('Error toggling unit:', error);
      alert(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleSensorToggle = async (sensorKey) => {
    const currentSensors = unitData.sensors || [];
    const newSensors = currentSensors.includes(sensorKey)
      ? currentSensors.filter(s => s !== sensorKey)
      : [...currentSensors, sensorKey];

    setLoading(true);
    try {
      await firebaseService.updateUnit(currentDevice, unitId, { sensors: newSensors });
    } catch (error) {
      console.error('Error updating sensors:', error);
      alert(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleThresholdUpdate = async (sensorKey, type, value) => {
    const currentThresholds = unitData.thresholds || {};
    const sensorThresholds = currentThresholds[sensorKey] || {};
    
    const newThresholds = {
      ...currentThresholds,
      [sensorKey]: {
        ...sensorThresholds,
        [type]: parseFloat(value) || 0
      }
    };

    setLoading(true);
    try {
      await firebaseService.updateUnit(currentDevice, unitId, { thresholds: newThresholds });
    } catch (error) {
      console.error('Error updating thresholds:', error);
      alert(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimerUpdate = async (type, value) => {
    setLoading(true);
    try {
      await firebaseService.updateUnit(currentDevice, unitId, { [type]: value });
    } catch (error) {
      console.error('Error updating timer:', error);
      alert(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = async () => {
    if (!confirm(t.resetConfirm)) return;

    const defaultSettings = {
      name: unitId,
      type: 'fan',
      status: false,
      mode: 'manual',
      sensors: ['temperature'],
      thresholds: {
        temperature: {
          min: SENSOR_INFO.temperature.defaultMin,
          max: SENSOR_INFO.temperature.defaultMax
        }
      },
      startTime: '06:00',
      endTime: '18:00'
    };

    setLoading(true);
    try {
      await firebaseService.updateUnit(currentDevice, unitId, defaultSettings);
      setUnitName(unitId);
      setIsEditingName(false);
    } catch (error) {
      console.error('Error resetting unit:', error);
      alert(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = () => {
    alert(t.saveSuccess);
  };

  const renderDynamicThresholds = () => {
    const selectedSensors = unitData.sensors || [];
    const thresholds = unitData.thresholds || {};

    if (selectedSensors.length === 0) {
      return (
        <div className="no-sensors-message">
          <i className="fas fa-info-circle"></i>
          <p>{t.noSensorsMessage}</p>
        </div>
      );
    }

    return selectedSensors.map(sensorKey => {
      const sensorInfo = SENSOR_INFO[sensorKey];
      const sensorThresholds = thresholds[sensorKey] || {};
      const minValue = sensorThresholds.min || sensorInfo.defaultMin;
      const maxValue = sensorThresholds.max || sensorInfo.defaultMax;

      return (
        <div key={sensorKey} className="sensor-threshold-section">
          <h4>
            <i className={`fas ${sensorInfo.icon}`}></i>
            {sensorInfo.name}
          </h4>
          <div className="threshold-inputs">
            <div className="input-group">
              <label>{t.minThreshold} ({sensorInfo.unit})</label>
              <input
                type="number"
                value={minValue}
                onChange={(e) => handleThresholdUpdate(sensorKey, 'min', e.target.value)}
                placeholder={sensorInfo.defaultMin.toString()}
                disabled={loading}
              />
            </div>
            <div className="input-group">
              <label>{t.maxThreshold} ({sensorInfo.unit})</label>
              <input
                type="number"
                value={maxValue}
                onChange={(e) => handleThresholdUpdate(sensorKey, 'max', e.target.value)}
                placeholder={sensorInfo.defaultMax.toString()}
                disabled={loading}
              />
            </div>
          </div>
        </div>
      );
    });
  };

  const unitType = unitData.type || 'fan';
  const isOn = unitData.status === true || unitData.status === 'on';
  const mode = unitData.mode || 'manual';
  const selectedSensors = unitData.sensors || [];
  const startTime = unitData.startTime || '06:00';
  const endTime = unitData.endTime || '18:00';

  return (
    <div className="unit-control-card">
      {/* زر الحذف */}
      <button 
        className={`delete-btn ${!isSettingsMode ? 'hidden' : ''}`}
        onClick={handleDeleteUnit}
        title={t.deleteUnit}
        disabled={loading}
      >
        <i className="fas fa-trash"></i>
      </button>
      
      {/* رأس الوحدة */}
      <div className="unit-header">
        <div className="unit-name-container">
          <i 
            className={`fas ${UNIT_TYPES[unitType]?.icon || 'fa-cube'}`} 
            style={{ color: UNIT_TYPES[unitType]?.color || '#666' }}
          ></i>
          {isEditingName ? (
            <input
              type="text"
              className="unit-name-input"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={handleNameKeyPress}
              disabled={loading}
              autoFocus
            />
          ) : (
            <div 
              className={`unit-name ${!isSettingsMode ? 'read-only' : ''}`}
              onClick={handleNameEdit}
            >
              {unitName}
            </div>
          )}
        </div>
        <div className="unit-status">
          <div className={`status-indicator ${isOn ? 'status-on' : 'status-off'}`}></div>
          <span>{isOn ? t.running : t.stopped}</span>
        </div>
      </div>
      
      {/* نوع الوحدة */}
      <div className="unit-type-selector">
        <h3>{t.unitType}</h3>
        <div className="type-options">
          {Object.entries(UNIT_TYPES).map(([type, info]) => (
            <div
              key={type}
              className={`type-option ${unitType === type ? 'selected' : ''} ${!isSettingsMode ? 'read-only' : ''}`}
              onClick={() => isSettingsMode && handleTypeChange(type)}
            >
              <i className={`fas ${info.icon}`}></i>
              <span>{info.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* أوضاع التشغيل */}
      <div className="control-modes">
        <div 
          className={`mode-btn ${mode === 'manual' ? 'active' : ''}`}
          onClick={() => handleModeChange('manual')}
        >
          {t.manual}
        </div>
        <div 
          className={`mode-btn ${mode === 'sensor' ? 'active' : ''}`}
          onClick={() => handleModeChange('sensor')}
        >
          {t.sensor}
        </div>
        <div 
          className={`mode-btn ${mode === 'timer' ? 'active' : ''}`}
          onClick={() => handleModeChange('timer')}
        >
          {t.timer}
        </div>
        <div 
          className={`mode-btn ${mode === 'auto' ? 'active' : ''}`}
          onClick={() => handleModeChange('auto')}
        >
          {t.auto}
        </div>
      </div>
      
      {/* التحكم اليدوي */}
      {mode === 'manual' && (
        <div className="manual-control">
          <span>{t.manualControl}</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={isOn}
              onChange={(e) => handleToggleUnit(e.target.checked)}
              disabled={loading}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      )}
      
      {/* اختيار المستشعرات */}
      {(mode === 'sensor' || mode === 'auto') && (
        <>
          <div className="sensor-selection">
            <h3>{t.selectSensors}</h3>
            <div className="sensor-grid">
              {Object.entries(SENSOR_INFO).map(([sensorKey, sensorInfo]) => (
                <div
                  key={sensorKey}
                  className={`sensor-option ${selectedSensors.includes(sensorKey) ? 'selected' : ''}`}
                  onClick={() => handleSensorToggle(sensorKey)}
                >
                  <i className={`fas ${sensorInfo.icon}`}></i>
                  {sensorInfo.name}
                </div>
              ))}
            </div>
          </div>
          
          {/* إعدادات العتبات */}
          <div className="threshold-settings">
            <h3>{t.thresholdSettings}</h3>
            <div id={`dynamicThresholds-${unitId}`}>
              {renderDynamicThresholds()}
            </div>
          </div>
        </>
      )}
      
      {/* إعدادات المؤقت */}
      {mode === 'timer' && (
        <div className="timer-settings">
          <h3>{t.timerSettings}</h3>
          <div className="timer-inputs">
            <div className="input-group">
              <label>{t.startTime}</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleTimerUpdate('startTime', e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="input-group">
              <label>{t.endTime}</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => handleTimerUpdate('endTime', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* أزرار الإجراءات */}
      <div className="action-buttons">
        <button 
          className="btn btn-secondary" 
          onClick={handleResetSettings}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="loading-spinner"></div>
              {language === 'ar' ? 'جاري...' : 'Processing...'}
            </>
          ) : (
            t.reset
          )}
        </button>
        <button 
          className="btn btn-primary" 
          onClick={handleSaveSettings}
        >
          {t.saveSettings}
        </button>
      </div>

      <style jsx>{`
        .unit-control-card {
          background: var(--white-card);
          border-radius: 12px;
          padding: 20px;
          box-shadow: var(--shadow-soft);
          border: 2px solid #f0f0f0;
          transition: all 0.3s ease;
          position: relative;
        }

        .unit-control-card:hover {
          box-shadow: var(--shadow-hover);
          border-color: var(--primary);
        }

        .unit-control-card.read-only {
          border-color: #e0e0e0;
        }

        .unit-control-card.read-only:hover {
          box-shadow: var(--shadow-soft);
          border-color: #e0e0e0;
        }

        .delete-btn {
          position: absolute;
          top: 15px;
          left: 15px;
          background: var(--danger);
          color: white;
          border: none;
          border-radius: 6px;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .delete-btn:hover {
          background: #c82333;
          transform: scale(1.1);
        }

        .delete-btn.hidden {
          display: none;
        }

        .delete-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .unit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #f0e0e0;
        }

        .unit-name-container {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }

        .unit-name {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-dark);
          cursor: pointer;
          padding: 5px 10px;
          border-radius: 6px;
          transition: all 0.3s ease;
          border: 1px solid transparent;
        }

        .unit-name:hover {
          background: #f8f9fa;
          border-color: #e0e0e0;
        }

        .unit-name.read-only {
          cursor: default;
        }

        .unit-name.read-only:hover {
          background: transparent;
          border-color: transparent;
        }

        .unit-name-input {
          font-size: 1.3rem;
          font-weight: 700;
          border: 1px solid var(--primary);
          border-radius: 6px;
          padding: 5px 10px;
          width: 100%;
          background: white;
        }

        .unit-name-input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(46, 139, 87, 0.2);
        }

        .unit-name-input:disabled {
          background: #f8f9fa;
          cursor: not-allowed;
        }

        .unit-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }

        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .status-on {
          background: var(--primary);
        }

        .status-off {
          background: var(--text-gray);
        }

        .unit-type-selector {
          margin-bottom: 20px;
        }

        .unit-type-selector h3 {
          font-size: 1rem;
          margin-bottom: 10px;
          color: var(--text-dark);
        }

        .type-options {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .type-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          padding: 10px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
        }

        .type-option:hover {
          border-color: var(--primary);
          background: #f8fff9;
        }

        .type-option.selected {
          border-color: var(--primary);
          background: var(--primary);
          color: white;
        }

        .type-option.read-only {
          cursor: default;
        }

        .type-option.read-only:hover {
          border-color: #e0e0e0;
          background: transparent;
        }

        .type-option i {
          font-size: 1.5rem;
          margin-bottom: 5px;
        }

        .type-option span {
          font-size: 0.8rem;
          font-weight: 500;
        }

        .control-modes {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }

        .mode-btn {
          padding: 10px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          text-align: center;
          font-size: 0.8rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .mode-btn.active {
          border-color: var(--primary);
          background: var(--primary);
          color: white;
        }

        .mode-btn:hover:not(.active) {
          border-color: var(--primary);
          background: #f8fff9;
        }

        .mode-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .manual-control {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 60px;
          height: 30px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 30px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 22px;
          width: 22px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }

        input:checked + .toggle-slider {
          background-color: var(--primary);
        }

        input:checked + .toggle-slider:before {
          transform: translateX(30px);
        }

        input:disabled + .toggle-slider {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .sensor-selection {
          margin-bottom: 20px;
        }

        .sensor-selection h3 {
          font-size: 1rem;
          margin-bottom: 10px;
          color: var(--text-dark);
        }

        .sensor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 10px;
        }

        .sensor-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .sensor-option:hover {
          border-color: var(--primary);
          background: #f8fff9;
        }

        .sensor-option.selected {
          border-color: var(--primary);
          background: var(--primary);
          color: white;
        }

        .sensor-option:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .threshold-settings {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 15px;
        }

        .threshold-settings h3 {
          font-size: 1rem;
          margin-bottom: 15px;
          color: var(--text-dark);
        }

        .sensor-threshold-section {
          background: white;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          margin-bottom: 15px;
        }

        .sensor-threshold-section h4 {
          font-size: 0.9rem;
          margin-bottom: 10px;
          color: var(--text-dark);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .threshold-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .no-sensors-message {
          text-align: center;
          padding: 20px;
          color: var(--text-gray);
          font-style: italic;
        }

        .timer-settings {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 15px;
        }

        .timer-settings h3 {
          font-size: 1rem;
          margin-bottom: 15px;
          color: var(--text-dark);
        }

        .timer-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .input-group label {
          font-size: 0.8rem;
          color: var(--text-gray);
          font-weight: 500;
        }

        .input-group input {
          padding: 8px 12px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .input-group input:focus {
          outline: none;
          border-color: var(--primary);
        }

        .input-group input:disabled {
          background: #f8f9fa;
          cursor: not-allowed;
        }

        .action-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .btn-primary {
          background: var(--primary);
          color: white;
        }

        .btn-primary:hover {
          background: var(--primary-dark);
        }

        .btn-secondary {
          background: #f8f9fa;
          color: var(--text-dark);
          border: 1px solid #e0e0e0;
        }

        .btn-secondary:hover {
          background: #e9ecef;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .type-options {
            grid-template-columns: repeat(2, 1fr);
          }

          .control-modes {
            grid-template-columns: repeat(2, 1fr);
          }

          .threshold-inputs,
          .timer-inputs {
            grid-template-columns: 1fr;
          }

          .sensor-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default UnitCard;