// src/pages/index.js
import React, { useContext } from 'react';
import Head from 'next/head';
import { useApp } from '../../contexts/AppContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import WelcomeScreen from '../../components/dashboard/WelcomeScreen';
import EnvironmentalMonitoring from '../../components/dashboard/EnvironmentalMonitoring';
import SensorChart from '../../components/dashboard/SensorChart';
import AutomationControls from '../../components/dashboard/AutomationControls';
import AlertsTable from '../../components/dashboard/AlertsTable';
import FarmOverview from '../../components/dashboard/FarmOverview';

export default function DashboardPage() {
  const { 
    currentDevice, 
    deviceData, 
    sensorData, 
    currentSensor, 
    language,
    setCurrentSensor 
  } = useApp();

  const translations = {
    ar: {
      pageTitle: "لوحة تحكم المزرعة الذكية",
      environmentalMonitoring: "المراقبة البيئية",
      sensorCharts: "الرسوم البيانية للمستشعرات",
      automation: "نظام الأتمتة",
      alerts: "التنبيهات",
      farmOverview: "نظرة عامة على المزرعة",
      noDeviceSelected: "لم يتم اختيار جهاز"
    },
    en: {
      pageTitle: "Smart Farm Dashboard",
      environmentalMonitoring: "Environmental Monitoring",
      sensorCharts: "Sensor Charts",
      automation: "Automation System",
      alerts: "Alerts",
      farmOverview: "Farm Overview",
      noDeviceSelected: "No device selected"
    }
  };

  const t = translations[language];

  // إذا لم يكن هناك جهاز محدد، عرض شاشة الترحيب
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
        {/* المراقبة البيئية */}
        <section className="dashboard-section">
          <EnvironmentalMonitoring 
            sensorData={sensorData}
            currentSensor={currentSensor}
            onSensorClick={handleSensorClick}
          />
        </section>

        {/* الرسم البياني (كامل العرض) */}
        <section className="dashboard-section chart-section">
          <SensorChart 
            sensorType={currentSensor}
            deviceId={currentDevice}
          />
        </section>

        {/* التحكم الآلي والتنبيهات (جنباً إلى جنب) */}
        <div className="automation-alerts-grid">
          <section className="dashboard-section automation-section">
            <AutomationControls 
              automation={deviceData?.automation}
              deviceId={currentDevice}
            />
          </section>

          <section className="dashboard-section alerts-section">
            <AlertsTable alerts={deviceData?.alerts} />
          </section>
        </div>

        {/* نظرة عامة على المزرعة */}
        <section className="dashboard-section">
          <FarmOverview />
        </section>
      </div>

      <style jsx>{`
        .dashboard-page {
          padding: 0;
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
        }

        /* تحسينات للهواتف المحمولة */
        @media (max-width: 768px) {
          .dashboard-page {
            padding: 0 10px;
          }
          
          .dashboard-section {
            margin-bottom: 20px;
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
        }

        /* تحسينات للشاشات الصغيرة جداً */
        @media (max-width: 480px) {
          .dashboard-page {
            padding: 0 5px;
          }
          
          .dashboard-section {
            margin-bottom: 15px;
          }

          .automation-section,
          .alerts-section {
            min-height: 280px;
          }

          .chart-section {
            min-height: 320px;
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