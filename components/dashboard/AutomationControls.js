// components/dashboard/AutomationControls.js
import React, { useState, useContext } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { firebaseService } from '../../hooks/useFirebase';

export default function AutomationControls({ automation, deviceId, userId }) {
  const { user } = useAuth();
  const { language } = useApp();
  const [loading, setLoading] = useState(false);
  const [activeControl, setActiveControl] = useState(null);

  const handleAutomationToggle = async (controlType, enabled) => {
    if (!deviceId || !userId) {
      console.error('Device ID or User ID is missing');
      return;
    }
    
    setLoading(true);
    setActiveControl(controlType);
    
    try {
      // ✅ استخدام النظام الجديد مع المسار الصحيح
      await firebaseService.updateData(userId, `devices/${deviceId}/automation/${controlType}`, {
        enabled,
        lastUpdate: new Date().toISOString(),
        updatedBy: user?.email || 'unknown',
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating automation:', error);
      
      // عرض رسالة خطأ للمستخدم
      alert(
        language === 'ar' 
          ? 'حدث خطأ أثناء تحديث الإعدادات' 
          : 'Error updating settings'
      );
    } finally {
      setLoading(false);
      setActiveControl(null);
    }
  };

  const automationConfig = [
    {
      id: 'ventilation',
      name: { ar: 'التهوية التلقائية', en: 'Auto Ventilation' },
      icon: 'fa-fan',
      description: { 
        ar: 'تحكم تلقائي في مراوح التهوية بناءً على درجة الحرارة والرطوبة', 
        en: 'Automatic ventilation fans control based on temperature and humidity' 
      },
      color: '#36A2EB'
    },
    {
      id: 'heating',
      name: { ar: 'التدفئة التلقائية', en: 'Auto Heating' },
      icon: 'fa-temperature-arrow-up',
      description: { 
        ar: 'تحكم تلقائي في أنظمة التدفئة للحفاظ على درجة الحرارة المثالية', 
        en: 'Automatic heating systems control to maintain optimal temperature' 
      },
      color: '#FF6384'
    },
    {
      id: 'lighting',
      name: { ar: 'الإضاءة التلقائية', en: 'Auto Lighting' },
      icon: 'fa-lightbulb',
      description: { 
        ar: 'تحكم تلقائي في أنظمة الإضاءة حسب التوقيت والظروف', 
        en: 'Automatic lighting systems control based on time and conditions' 
      },
      color: '#FFCE56'
    },
    {
      id: 'feeding',
      name: { ar: 'التغذية التلقائية', en: 'Auto Feeding' },
      icon: 'fa-utensils',
      description: { 
        ar: 'تحكم تلقائي في أنظمة التغذية حسب الجدول الزمني', 
        en: 'Automatic feeding systems control based on schedule' 
      },
      color: '#4BC0C0'
    },
    {
      id: 'water',
      name: { ar: 'الري التلقائي', en: 'Auto Watering' },
      icon: 'fa-droplet',
      description: { 
        ar: 'تحكم تلقائي في أنظمة الري والرطوبة', 
        en: 'Automatic watering systems control based on humidity' 
      },
      color: '#9966FF'
    },
    {
      id: 'security',
      name: { ar: 'المراقبة التلقائية', en: 'Auto Security' },
      icon: 'fa-shield-alt',
      description: { 
        ar: 'نظام مراقبة أمنية تلقائي للكشف عن المخالفات', 
        en: 'Automatic security monitoring system for anomaly detection' 
      },
      color: '#FF9F40'
    }
  ];

  const translations = {
    ar: {
      title: '🔄 نظام التحكم الآلي',
      enabled: 'مفعل',
      disabled: 'معطل',
      updating: 'جاري التحديث...',
      noDevice: 'لم يتم اختيار جهاز',
      automationDescription: 'إدارة الأنظمة الآلية للمزرعة'
    },
    en: {
      title: '🔄 Automation Control System',
      enabled: 'Enabled',
      disabled: 'Disabled',
      updating: 'Updating...',
      noDevice: 'No device selected',
      automationDescription: 'Manage farm automation systems'
    }
  };

  const t = translations[language];

  // التحقق من المتطلبات الأساسية
  if (!deviceId || !userId) {
    return (
      <div className="automation-controls card">
        <h3>{t.title}</h3>
        <div className="no-device-message">
          <i className="fas fa-microchip"></i>
          <span>{t.noDevice}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="automation-controls card">
      <div className="automation-header">
        <h3>{t.title}</h3>
        <div className="automation-description">
          {t.automationDescription}
        </div>
      </div>
      
      <div className="automation-grid">
        {automationConfig.map((item) => {
          const isEnabled = automation?.[item.id]?.enabled;
          const isUpdating = loading && activeControl === item.id;
          
          return (
            <div key={item.id} className={`automation-item ${isEnabled ? 'enabled' : 'disabled'}`}>
              <div className="automation-info">
                <div className="automation-icon" style={{ color: item.color }}>
                  <i className={`fas ${item.icon}`}></i>
                </div>
                <div className="automation-details">
                  <h4>{item.name[language]}</h4>
                  <p>{item.description[language]}</p>
                  {automation?.[item.id]?.lastUpdate && (
                    <div className="last-update">
                      <i className="fas fa-clock"></i>
                      <span>
                        {language === 'ar' ? 'آخر تحديث: ' : 'Last update: '}
                        {new Date(automation[item.id].lastUpdate).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="automation-switch">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={isEnabled || false}
                    onChange={(e) => handleAutomationToggle(item.id, e.target.checked)}
                    disabled={loading}
                  />
                  <span className="slider"></span>
                </label>
                <span className={`status-text ${isEnabled ? 'enabled' : 'disabled'}`}>
                  {isUpdating ? t.updating : (isEnabled ? t.enabled : t.disabled)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .automation-controls {
          flex: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .automation-header {
          margin-bottom: 20px;
        }

        .automation-controls h3 {
          color: var(--text-dark);
          margin-bottom: 8px;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .automation-description {
          color: var(--text-gray);
          font-size: 0.9rem;
        }

        .automation-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .automation-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: var(--white-card);
          border-radius: 10px;
          border: 2px solid #e5e7eb;
          transition: all 0.3s ease;
          box-shadow: var(--shadow-soft);
        }

        .automation-item.enabled {
          border-color: var(--success);
          background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
        }

        .automation-item:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-medium);
        }

        .automation-info {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          flex: 1;
        }

        .automation-icon {
          font-size: 1.8rem;
          margin-top: 2px;
        }

        .automation-details {
          flex: 1;
        }

        .automation-details h4 {
          color: var(--text-dark);
          margin-bottom: 6px;
          font-size: 1rem;
          font-weight: 600;
        }

        .automation-details p {
          color: var(--text-gray);
          font-size: 0.8rem;
          margin: 0 0 8px 0;
          line-height: 1.4;
        }

        .last-update {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-light);
          font-size: 0.7rem;
        }

        .last-update i {
          font-size: 0.6rem;
        }

        .automation-switch {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          min-width: 80px;
        }

        .switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 24px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: var(--success);
        }

        input:checked + .slider:before {
          transform: translateX(26px);
        }

        input:disabled + .slider {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .status-text {
          font-size: 0.75rem;
          font-weight: 500;
          text-align: center;
          min-width: 60px;
        }

        .status-text.enabled {
          color: var(--success);
        }

        .status-text.disabled {
          color: var(--text-gray);
        }

        .no-device-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: var(--text-gray);
          gap: 15px;
          flex: 1;
        }

        .no-device-message i {
          font-size: 3rem;
          opacity: 0.5;
        }

        @media (max-width: 768px) {
          .automation-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          .automation-switch {
            align-self: flex-end;
            flex-direction: row;
            min-width: auto;
          }

          .automation-info {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .automation-item {
            padding: 12px;
          }

          .automation-icon {
            font-size: 1.5rem;
          }

          .automation-details h4 {
            font-size: 0.9rem;
          }

          .automation-details p {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}

// القيم الافتراضية للخصائص
AutomationControls.defaultProps = {
  automation: {},
  deviceId: '',
  userId: ''
};