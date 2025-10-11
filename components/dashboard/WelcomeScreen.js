// components/dashboard/WelcomeScreen.js
import React, { useContext } from 'react';
import { useApp } from '../../contexts/AppContext';

export default function WelcomeScreen() {
  const { language, devicesList, setCurrentDevice } = useApp();

  const translations = {
    ar: {
      title: "مرحباً بك في نظام مراقبة مزارع الدواجن",
      subtitle: "اختر جهازاً للبدء في المراقبة",
      selectDevice: "اختر جهاز المراقبة",
      noDevices: "لا توجد أجهزة متاحة حالياً"
    },
    en: {
      title: "Welcome to Poultry Farm Monitoring System",
      subtitle: "Select a device to start monitoring",
      selectDevice: "Select Monitoring Device",
      noDevices: "No devices available at the moment"
    }
  };

  const t = translations[language];

  return (
    <div className="welcome-screen" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="welcome-card">
        <div className="welcome-icon">
          <i className="fas fa-tractor"></i>
        </div>
        
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>

        {devicesList.length > 0 ? (
          <div className="devices-grid">
            {devicesList.map(device => (
              <div 
                key={device.id} 
                className="device-card"
                onClick={() => setCurrentDevice(device.id)}
              >
                <i className="fas fa-microchip"></i>
                <h3>{device.name || device.id}</h3>
                <p>{device.location || 'موقع غير محدد'}</p>
                <span className="connect-btn">اتصال</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-devices">
            <i className="fas fa-exclamation-circle"></i>
            <p>{t.noDevices}</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .welcome-screen {
          min-height: 100vh;
          background: var(--soft-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .welcome-card {
          background: var(--white-card);
          padding: 40px;
          border-radius: 16px;
          box-shadow: var(--shadow-medium);
          text-align: center;
          max-width: 800px;
          width: 100%;
        }

        .welcome-icon {
          font-size: 4rem;
          color: var(--primary);
          margin-bottom: 20px;
        }

        .welcome-card h1 {
          color: var(--text-dark);
          margin-bottom: 16px;
          font-size: 2rem;
        }

        .welcome-card p {
          color: var(--text-gray);
          margin-bottom: 40px;
          font-size: 1.2rem;
        }

        .devices-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-top: 30px;
        }

        .device-card {
          background: var(--soft-bg);
          padding: 24px;
          border-radius: 12px;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
        }

        .device-card:hover {
          border-color: var(--primary);
          transform: translateY(-4px);
          box-shadow: var(--shadow-medium);
        }

        .device-card i {
          font-size: 2.5rem;
          color: var(--primary);
          margin-bottom: 16px;
        }

        .device-card h3 {
          color: var(--text-dark);
          margin-bottom: 8px;
          font-size: 1.2rem;
        }

        .device-card p {
          color: var(--text-gray);
          margin-bottom: 16px;
          font-size: 0.9rem;
        }

        .connect-btn {
          background: var(--primary);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .no-devices {
          padding: 40px;
          color: var(--text-gray);
        }

        .no-devices i {
          font-size: 3rem;
          margin-bottom: 16px;
          color: var(--warning);
        }

        @media (max-width: 768px) {
          .welcome-card {
            padding: 20px;
          }
          
          .devices-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}