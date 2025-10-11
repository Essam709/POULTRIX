// components/dashboard/EnvironmentalMonitoring.js
import React, { useContext } from 'react';
import { useApp } from '../../contexts/AppContext';

export default function EnvironmentalMonitoring({ sensorData, currentSensor, onSensorClick }) {
  const { language } = useApp();

  const SENSOR_INFO = {
    temperature: {
      name: language === 'ar' ? 'درجة الحرارة' : 'Temperature',
      icon: 'fa-temperature-full',
      unit: '°C',
      color: '#FF6384',
      optimal: { min: 20, max: 25 }
    },
    humidity: {
      name: language === 'ar' ? 'الرطوبة' : 'Humidity',
      icon: 'fa-droplet',
      unit: '%',
      color: '#36A2EB',
      optimal: { min: 50, max: 70 }
    },
    ammonia: {
      name: language === 'ar' ? 'الأمونيا' : 'Ammonia',
      icon: 'fa-wind',
      unit: 'ppm',
      color: '#FFCE56',
      optimal: { min: 0, max: 25 }
    },
    airQuality: {
      name: language === 'ar' ? 'جودة الهواء' : 'Air Quality',
      icon: 'fa-smog',
      unit: 'AQI',
      color: '#4BC0C0',
      optimal: { min: 0, max: 50 }
    }
  };

  const getSensorStatus = (sensorType, value) => {
    const info = SENSOR_INFO[sensorType];
    if (!info || value === undefined) return 'unknown';
    
    if (value < info.optimal.min) return 'low';
    if (value > info.optimal.max) return 'high';
    return 'optimal';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'optimal': return '#10B981';
      case 'low': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    const texts = {
      ar: { optimal: 'مثالي', low: 'منخفض', high: 'مرتفع', unknown: 'غير معروف' },
      en: { optimal: 'Optimal', low: 'Low', high: 'High', unknown: 'Unknown' }
    };
    return texts[language][status];
  };

  return (
    <div className="environmental-monitoring">
      <h2 className="section-title">
        {language === 'ar' ? 'المراقبة البيئية' : 'Environmental Monitoring'}
      </h2>
      
      <div className="sensors-grid">
        {Object.entries(SENSOR_INFO).map(([sensorType, info]) => {
          const value = sensorData[sensorType];
          const status = getSensorStatus(sensorType, value);
          const isActive = currentSensor === sensorType;

          return (
            <div
              key={sensorType}
              className={`sensor-card ${isActive ? 'active' : ''}`}
              onClick={() => onSensorClick(sensorType)}
            >
              <div className="sensor-header">
                <div className="sensor-icon" style={{ color: info.color }}>
                  <i className={`fas ${info.icon}`}></i>
                </div>
                <div className="sensor-info">
                  <h3>{info.name}</h3>
                  <div 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(status) }}
                  >
                    {getStatusText(status)}
                  </div>
                </div>
              </div>

              <div className="sensor-value">
                <span className="value">
                  {value !== undefined ? value.toFixed(1) : '--'}
                </span>
                <span className="unit">{info.unit}</span>
              </div>

              <div className="sensor-range">
                <span className="range-label">
                  {language === 'ar' ? 'المدى الأمثل:' : 'Optimal Range:'}
                </span>
                <span className="range-value">
                  {info.optimal.min} - {info.optimal.max} {info.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .environmental-monitoring {
          margin-bottom: 30px;
        }

        .section-title {
          color: var(--text-dark);
          margin-bottom: 20px;
          font-size: 1.5rem;
        }

        .sensors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .sensor-card {
          background: var(--white-card);
          padding: 20px;
          border-radius: 12px;
          box-shadow: var(--shadow-soft);
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .sensor-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-medium);
        }

        .sensor-card.active {
          border-color: var(--primary);
        }

        .sensor-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 15px;
        }

        .sensor-icon {
          font-size: 2rem;
        }

        .sensor-info h3 {
          color: var(--text-dark);
          margin-bottom: 5px;
          font-size: 1.1rem;
        }

        .status-badge {
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .sensor-value {
          text-align: center;
          margin: 20px 0;
        }

        .value {
          font-size: 2.5rem;
          font-weight: bold;
          color: var(--text-dark);
        }

        .unit {
          font-size: 1rem;
          color: var(--text-gray);
          margin-right: 5px;
        }

        .sensor-range {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
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

        @media (max-width: 768px) {
          .sensors-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}