// src/pages/index.js
import React, { useContext } from 'react';
import Head from 'next/head';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import WelcomeScreen from '../../components/dashboard/WelcomeScreen';
import EnvironmentalMonitoring from '../../components/dashboard/EnvironmentalMonitoring';
import SensorChart from '../../components/dashboard/SensorChart';
import AutomationControls from '../../components/dashboard/AutomationControls';
import AlertsTable from '../../components/dashboard/AlertsTable';
import FarmOverview from '../../components/dashboard/FarmOverview';

export default function DashboardPage() {
  const { user } = useAuth();
  const { 
    currentDevice, 
    deviceData, 
    sensorData, 
    currentSensor, 
    language,
    setCurrentSensor,
    devicesList
  } = useApp();

  const translations = {
    ar: {
      pageTitle: "لوحة تحكم المزرعة الذكية",
      environmentalMonitoring: "المراقبة البيئية",
      sensorCharts: "الرسوم البيانية للمستشعرات",
      automation: "نظام الأتمتة",
      alerts: "التنبيهات",
      farmOverview: "نظرة عامة على المزرعة",
      noDeviceSelected: "لم يتم اختيار جهاز",
      welcome: "مرحباً في نظام المزرعة الذكية",
      selectDevice: "اختر جهازاً للبدء",
      noDevices: "لا توجد أجهزة متاحة",
      addFirstDevice: "أضف جهازك الأول",
      deviceNotAuthorized: "الجهاز غير مصرح به"
    },
    en: {
      pageTitle: "Smart Farm Dashboard",
      environmentalMonitoring: "Environmental Monitoring",
      sensorCharts: "Sensor Charts",
      automation: "Automation System",
      alerts: "Alerts",
      farmOverview: "Farm Overview",
      noDeviceSelected: "No device selected",
      welcome: "Welcome to Smart Farm System",
      selectDevice: "Select a device to start",
      noDevices: "No devices available",
      addFirstDevice: "Add your first device",
      deviceNotAuthorized: "Device not authorized"
    }
  };

  const t = translations[language];

  // إذا لم يكن المستخدم مسجل الدخول، عرض شاشة الترحيب
  if (!user) {
    return (
      <DashboardLayout>
        <WelcomeScreen />
      </DashboardLayout>
    );
  }

  // إذا لم يكن هناك أجهزة للمستخدم
  if (devicesList.length === 0) {
    return (
      <DashboardLayout>
        <div className="no-devices-container">
          <div className="no-devices-content">
            <i className="fas fa-microchip"></i>
            <h2>{t.noDevices}</h2>
            <p>{language === 'ar' 
              ? 'لم تقم بإضافة أي أجهزة بعد. ابدأ بإضافة جهازك الأول.' 
              : 'You haven\'t added any devices yet. Start by adding your first device.'
            }</p>
            <button 
              className="btn btn-primary"
              onClick={() => {
                // سيتم التعامل مع إضافة الجهاز عبر Header component
                const addFarmBtn = document.querySelector('.add-farm-btn');
                if (addFarmBtn) addFarmBtn.click();
              }}
            >
              <i className="fas fa-plus"></i>
              {t.addFirstDevice}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // إذا لم يكن هناك جهاز محدد، عرض شاشة الترحيب مع قائمة الأجهزة
  if (!currentDevice) {
    return (
      <DashboardLayout>
        <WelcomeScreen />
      </DashboardLayout>
    );
  }

  const handleSensorClick = (sensorType) => {
    setCurrentSensor(sensorType);
  };

  return (
    <DashboardLayout>
      <Head>
        <title>{t.pageTitle}</title>
      </Head>

      <div className="dashboard-page">
        {/* معلومات المستخدم والجهاز */}
        <div className="user-device-info">
          <div className="info-card">
            <div className="info-item">
              <i className="fas fa-user"></i>
              <div className="info-content">
                <span className="info-label">
                  {language === 'ar' ? 'المستخدم' : 'User'}
                </span>
                <span className="info-value">{user.email}</span>
              </div>
            </div>
            <div className="info-item">
              <i className="fas fa-microchip"></i>
              <div className="info-content">
                <span className="info-label">
                  {language === 'ar' ? 'الجهاز النشط' : 'Active Device'}
                </span>
                <span className="info-value">{currentDevice}</span>
              </div>
            </div>
            <div className="info-item">
              <i className="fas fa-sensor"></i>
              <div className="info-content">
                <span className="info-label">
                  {language === 'ar' ? 'المستشعر النشط' : 'Active Sensor'}
                </span>
                <span className="info-value">
                  {language === 'ar' 
                    ? (currentSensor === 'temperature' ? 'درجة الحرارة' :
                       currentSensor === 'humidity' ? 'الرطوبة' :
                       currentSensor === 'ammonia' ? 'الأمونيا' : 'جودة الهواء')
                    : currentSensor.charAt(0).toUpperCase() + currentSensor.slice(1)
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* المراقبة البيئية */}
        <section className="dashboard-section">
          <EnvironmentalMonitoring 
            sensorData={sensorData}
            currentSensor={currentSensor}
            onSensorClick={handleSensorClick}
            deviceId={currentDevice}
            userId={user.uid}
          />
        </section>

        {/* الرسم البياني (كامل العرض) */}
        <section className="dashboard-section chart-section">
          <SensorChart 
            sensorType={currentSensor}
            deviceId={currentDevice}
            userId={user.uid}
          />
        </section>

        {/* التحكم الآلي والتنبيهات (جنباً إلى جنب) */}
        <div className="automation-alerts-grid">
          <section className="dashboard-section automation-section">
            <AutomationControls 
              automation={deviceData?.automation}
              deviceId={currentDevice}
              userId={user.uid}
            />
          </section>

          <section className="dashboard-section alerts-section">
            <AlertsTable 
              alerts={deviceData?.alerts} 
              deviceId={currentDevice}
              userId={user.uid}
            />
          </section>
        </div>

        {/* نظرة عامة على المزرعة */}
        <section className="dashboard-section">
          <FarmOverview 
            deviceId={currentDevice}
            userId={user.uid}
          />
        </section>
      </div>

      <style jsx>{`
        .dashboard-page {
          padding: 0;
        }

        .user-device-info {
          margin-bottom: 25px;
        }

        .info-card {
          background: var(--white-card);
          padding: 20px;
          border-radius: 12px;
          box-shadow: var(--shadow-soft);
          display: flex;
          gap: 30px;
          flex-wrap: wrap;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 15px;
          flex: 1;
          min-width: 200px;
        }

        .info-item i {
          font-size: 1.5rem;
          color: var(--primary);
          width: 40px;
          text-align: center;
        }

        .info-content {
          display: flex;
          flex-direction: column;
        }

        .info-label {
          font-size: 0.8rem;
          color: var(--text-gray);
          margin-bottom: 4px;
        }

        .info-value {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-dark);
        }

        .no-devices-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          background: var(--white-card);
          border-radius: 12px;
          box-shadow: var(--shadow-soft);
        }

        .no-devices-content {
          text-align: center;
          padding: 40px;
        }

        .no-devices-content i {
          font-size: 4rem;
          color: var(--text-gray);
          margin-bottom: 20px;
        }

        .no-devices-content h2 {
          color: var(--text-dark);
          margin-bottom: 15px;
          font-size: 1.5rem;
        }

        .no-devices-content p {
          color: var(--text-gray);
          margin-bottom: 25px;
          font-size: 1rem;
          line-height: 1.5;
        }

        .dashboard-section {
          margin-bottom: 25px;
        }

        .chart-section {
          min-height: 400px;
        }

        .automation-alerts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 25px;
          margin-bottom: 30px;
        }

        .automation-section,
        .alerts-section {
          height: 100%;
          min-height: 350px;
        }

        /* تحسينات للشاشات المتوسطة */
        @media (max-width: 1200px) {
          .automation-alerts-grid {
            gap: 20px;
          }
          
          .info-card {
            gap: 20px;
          }
        }

        /* تحسينات للهواتف المحمولة */
        @media (max-width: 768px) {
          .dashboard-page {
            padding: 0 10px;
          }
          
          .dashboard-section {
            margin-bottom: 20px;
          }

          .user-device-info {
            margin-bottom: 20px;
          }

          .info-card {
            flex-direction: column;
            gap: 15px;
            padding: 15px;
          }

          .info-item {
            min-width: auto;
          }

          .automation-alerts-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .automation-section,
          .alerts-section {
            min-height: 300px;
          }

          .chart-section {
            min-height: 350px;
          }

          .no-devices-content {
            padding: 20px;
          }

          .no-devices-content i {
            font-size: 3rem;
          }
        }

        /* تحسينات للشاشات الصغيرة جداً */
        @media (max-width: 480px) {
          .dashboard-page {
            padding: 0 5px;
          }
          
          .dashboard-section {
            margin-bottom: 15px;
          }

          .info-card {
            padding: 12px;
          }

          .info-item {
            gap: 10px;
          }

          .info-item i {
            font-size: 1.2rem;
            width: 30px;
          }

          .automation-section,
          .alerts-section {
            min-height: 280px;
          }

          .chart-section {
            min-height: 320px;
          }

          .no-devices-content {
            padding: 15px;
          }

          .no-devices-content i {
            font-size: 2.5rem;
          }

          .no-devices-content h2 {
            font-size: 1.3rem;
          }
        }

        /* تحسينات للشاشات الكبيرة */
        @media (min-width: 1440px) {
          .automation-alerts-grid {
            gap: 30px;
          }

          .automation-section,
          .alerts-section {
            min-height: 400px;
          }

          .chart-section {
            min-height: 450px;
          }
        }

        /* تحسينات للشاشات الكبيرة جداً */
        @media (min-width: 1920px) {
          .automation-alerts-grid {
            gap: 35px;
          }

          .automation-section,
          .alerts-section {
            min-height: 450px;
          }

          .chart-section {
            min-height: 500px;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}