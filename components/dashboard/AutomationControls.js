// components/dashboard/AutomationControls.js
import React, { useState } from 'react';
import { firebaseService } from '../../hooks/useFirebase';

export default function AutomationControls({ automation, deviceId }) {
  const [loading, setLoading] = useState(false);

  const handleAutomationToggle = async (controlType, enabled) => {
    if (!deviceId) return;
    
    setLoading(true);
    try {
      await firebaseService.updateData(`devices/${deviceId}/automation/${controlType}`, {
        enabled,
        lastUpdate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating automation:', error);
    } finally {
      setLoading(false);
    }
  };

  const automationConfig = [
    {
      id: 'ventilation',
      name: { ar: 'التهوية التلقائية', en: 'Auto Ventilation' },
      icon: 'fa-fan',
      description: { ar: 'تحكم تلقائي في مراوح التهوية', en: 'Automatic ventilation fans control' }
    },
    {
      id: 'heating',
      name: { ar: 'التدفئة التلقائية', en: 'Auto Heating' },
      icon: 'fa-temperature-arrow-up',
      description: { ar: 'تحكم تلقائي في أنظمة التدفئة', en: 'Automatic heating systems control' }
    },
    {
      id: 'lighting',
      name: { ar: 'الإضاءة التلقائية', en: 'Auto Lighting' },
      icon: 'fa-lightbulb',
      description: { ar: 'تحكم تلقائي في أنظمة الإضاءة', en: 'Automatic lighting systems control' }
    },
    {
      id: 'feeding',
      name: { ar: 'التغذية التلقائية', en: 'Auto Feeding' },
      icon: 'fa-utensils',
      description: { ar: 'تحكم تلقائي في أنظمة التغذية', en: 'Automatic feeding systems control' }
    }
  ];

  return (
    <div className="automation-controls card">
      <h3>🔄 التحكم الآلي</h3>
      
      <div className="automation-grid">
        {automationConfig.map((item) => {
          const isEnabled = automation?.[item.id]?.enabled;
          
          return (
            <div key={item.id} className="automation-item">
              <div className="automation-info">
                <div className="automation-icon">
                  <i className={`fas ${item.icon}`}></i>
                </div>
                <div className="automation-details">
                  <h4>{item.name.ar}</h4>
                  <p>{item.description.ar}</p>
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
                <span className="status-text">
                  {isEnabled ? 'مفعل' : 'معطل'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .automation-controls {
          flex: 1;
        }

        .automation-controls h3 {
          color: var(--text-dark);
          margin-bottom: 20px;
          font-size: 1.2rem;
        }

        .automation-grid {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .automation-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: var(--soft-bg);
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .automation-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .automation-icon {
          font-size: 1.5rem;
          color: var(--primary);
        }

        .automation-details h4 {
          color: var(--text-dark);
          margin-bottom: 4px;
          font-size: 1rem;
        }

        .automation-details p {
          color: var(--text-gray);
          font-size: 0.8rem;
          margin: 0;
        }

        .automation-switch {
          display: flex;
          align-items: center;
          gap: 10px;
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

        .status-text {
          color: var(--text-gray);
          font-size: 0.8rem;
          min-width: 40px;
        }

        @media (max-width: 768px) {
          .automation-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          
          .automation-switch {
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  );
}