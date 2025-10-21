// components/dashboard/FarmOverview.js
import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { firebaseService } from '../../hooks/useFirebase';

export default function FarmOverview({ deviceId, userId }) {
  const { user } = useAuth();
  const { language } = useApp();
  const [farmStats, setFarmStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // تحميل إحصائيات المزرعة من Firebase
  useEffect(() => {
    if (!deviceId || !userId) {
      setLoading(false);
      return;
    }

    const loadFarmStats = async () => {
      setLoading(true);
      try {
        // ✅ استخدام المسارات المحدثة مع userId
        const statsData = await firebaseService.getData(userId, `devices/${deviceId}/stats`);
        const farmData = await firebaseService.getData(userId, `devices/${deviceId}/info`);
        
        const processedStats = processFarmStats(statsData, farmData);
        setFarmStats(processedStats);
        setLastUpdate(new Date().toISOString());
      } catch (error) {
        console.error('Error loading farm stats:', error);
        // استخدام بيانات افتراضية في حالة الخطأ
        setFarmStats(getDefaultStats());
      } finally {
        setLoading(false);
      }
    };

    loadFarmStats();

    // ✅ الاشتراك في تحديثات البيانات باستخدام المسار الصحيح
    const unsubscribe = firebaseService.listenToData(
      userId,
      `devices/${deviceId}/sensors`,
      (snapshot) => {
        const sensorData = snapshot.val();
        if (sensorData) {
          // تحديث الإحصائيات بناءً على بيانات المستشعرات الجديدة
          updateStatsFromSensors(sensorData);
        }
      }
    );

    return () => unsubscribe();
  }, [deviceId, userId]);

  // معالجة بيانات الإحصائيات
  const processFarmStats = (statsData, farmData) => {
    const defaultStats = getDefaultStats();
    
    if (!statsData && !farmData) {
      return defaultStats;
    }

    // دمج البيانات الحقيقية مع البيانات الافتراضية
    return defaultStats.map(stat => {
      switch (stat.id) {
        case 'birds':
          return {
            ...stat,
            value: farmData?.totalBirds ? `${farmData.totalBirds.toLocaleString()}` : stat.value,
            change: farmData?.growthRate ? `+${farmData.growthRate}%` : stat.change,
            trend: farmData?.growthRate > 0 ? 'up' : 'down'
          };
        
        case 'weight':
          return {
            ...stat,
            value: statsData?.avgWeight ? `${statsData.avgWeight} كجم` : stat.value,
            change: statsData?.weightChange ? `${statsData.weightChange > 0 ? '+' : ''}${statsData.weightChange}%` : stat.change,
            trend: statsData?.weightChange > 0 ? 'up' : 'down'
          };
        
        case 'feed':
          return {
            ...stat,
            value: statsData?.dailyFeed ? `${statsData.dailyFeed} كجم/يوم` : stat.value,
            change: statsData?.feedChange ? `${statsData.feedChange > 0 ? '+' : ''}${statsData.feedChange}%` : stat.change,
            trend: statsData?.feedChange > 0 ? 'up' : 'down'
          };
        
        case 'water':
          return {
            ...stat,
            value: statsData?.dailyWater ? `${statsData.dailyWater} لتر/يوم` : stat.value,
            change: statsData?.waterChange ? `${statsData.waterChange > 0 ? '+' : ''}${statsData.waterChange}%` : stat.change,
            trend: statsData?.waterChange > 0 ? 'up' : 'down'
          };
        
        case 'production':
          return {
            ...stat,
            value: statsData?.dailyProduction ? `${statsData.dailyProduction} بيضة/يوم` : stat.value,
            change: statsData?.productionChange ? `${statsData.productionChange > 0 ? '+' : ''}${statsData.productionChange}%` : stat.change,
            trend: statsData?.productionChange > 0 ? 'up' : 'down'
          };
        
        case 'efficiency':
          return {
            ...stat,
            value: statsData?.feedEfficiency ? `${statsData.feedEfficiency} : 1` : stat.value,
            change: statsData?.efficiencyChange ? `${statsData.efficiencyChange > 0 ? '+' : ''}${statsData.efficiencyChange}%` : stat.change,
            trend: statsData?.efficiencyChange > 0 ? 'up' : 'down'
          };
        
        default:
          return stat;
      }
    });
  };

  // تحديث الإحصائيات من بيانات المستشعرات
  const updateStatsFromSensors = (sensorData) => {
    setFarmStats(prevStats => 
      prevStats.map(stat => {
        if (stat.id === 'temperature' && sensorData.temperature) {
          return {
            ...stat,
            value: `${sensorData.temperature}°C`,
            status: getTemperatureStatus(sensorData.temperature)
          };
        }
        if (stat.id === 'humidity' && sensorData.humidity) {
          return {
            ...stat,
            value: `${sensorData.humidity}%`,
            status: getHumidityStatus(sensorData.humidity)
          };
        }
        return stat;
      })
    );
  };

  // بيانات الإحصائيات الافتراضية
  const getDefaultStats = () => [
    {
      id: 'birds',
      icon: 'fa-egg',
      label: { ar: 'عدد الطيور', en: 'Total Birds' },
      value: '2,450',
      change: '+5%',
      trend: 'up',
      description: { ar: 'إجمالي عدد الطيور في المزرعة', en: 'Total number of birds in the farm' }
    },
    {
      id: 'weight',
      icon: 'fa-weight-scale',
      label: { ar: 'متوسط الوزن', en: 'Average Weight' },
      value: '2.3 كجم',
      change: '+0.2%',
      trend: 'up',
      description: { ar: 'متوسط وزن الطيور', en: 'Average bird weight' }
    },
    {
      id: 'feed',
      icon: 'fa-utensils',
      label: { ar: 'استهلاك العلف', en: 'Feed Consumption' },
      value: '120 كجم/يوم',
      change: '-2%',
      trend: 'down',
      description: { ar: 'متوسط استهلاك العلف اليومي', en: 'Average daily feed consumption' }
    },
    {
      id: 'water',
      icon: 'fa-droplet',
      label: { ar: 'استهلاك الماء', en: 'Water Consumption' },
      value: '250 لتر/يوم',
      change: '+3%',
      trend: 'up',
      description: { ar: 'متوسط استهلاك الماء اليومي', en: 'Average daily water consumption' }
    },
    {
      id: 'production',
      icon: 'fa-chart-line',
      label: { ar: 'معدل الإنتاج', en: 'Production Rate' },
      value: '95%',
      change: '+1.5%',
      trend: 'up',
      description: { ar: 'معدل إنتاج البيض اليومي', en: 'Daily egg production rate' }
    },
    {
      id: 'efficiency',
      icon: 'fa-chart-pie',
      label: { ar: 'كفاءة العلف', en: 'Feed Efficiency' },
      value: '2.1 : 1',
      change: '+0.1%',
      trend: 'up',
      description: { ar: 'نسبة تحويل العلف إلى وزن', en: 'Feed conversion ratio' }
    }
  ];

  const getTemperatureStatus = (temp) => {
    if (temp < 20) return 'low';
    if (temp > 30) return 'high';
    return 'optimal';
  };

  const getHumidityStatus = (humidity) => {
    if (humidity < 50) return 'low';
    if (humidity > 75) return 'high';
    return 'optimal';
  };

  const getTrendColor = (trend) => {
    return trend === 'up' ? '#10B981' : '#EF4444';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'optimal': return '#10B981';
      case 'high': return '#EF4444';
      case 'low': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const translations = {
    ar: {
      title: '📊 نظرة عامة على المزرعة',
      loading: 'جاري تحميل البيانات...',
      noDevice: 'لم يتم اختيار جهاز',
      lastUpdate: 'آخر تحديث',
      liveData: 'بيانات مباشرة',
      optimal: 'مثالي',
      high: 'مرتفع',
      low: 'منخفض'
    },
    en: {
      title: '📊 Farm Overview',
      loading: 'Loading data...',
      noDevice: 'No device selected',
      lastUpdate: 'Last update',
      liveData: 'Live Data',
      optimal: 'Optimal',
      high: 'High',
      low: 'Low'
    }
  };

  const t = translations[language];

  if (!deviceId || !userId) {
    return (
      <div className="farm-overview">
        <h2>{t.title}</h2>
        <div className="no-device-message">
          <i className="fas fa-microchip"></i>
          <span>{t.noDevice}</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="farm-overview">
        <h2>{t.title}</h2>
        <div className="loading-stats">
          <div className="loading-spinner"></div>
          <p>{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="farm-overview">
      <div className="overview-header">
        <h2>{t.title}</h2>
        <div className="header-info">
          {lastUpdate && (
            <div className="last-update">
              <i className="fas fa-clock"></i>
              <span>{t.lastUpdate}: {new Date(lastUpdate).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
            </div>
          )}
          <div className="live-indicator">
            <div className="live-dot"></div>
            <span>{t.liveData}</span>
          </div>
        </div>
      </div>
      
      <div className="stats-grid">
        {farmStats.map((stat, index) => (
          <div key={stat.id} className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">
                <i className={`fas ${stat.icon}`}></i>
              </div>
              
              <div className="stat-change" style={{ color: getTrendColor(stat.trend) }}>
                <i className={`fas ${stat.trend === 'up' ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
                {stat.change}
              </div>
            </div>
            
            <div className="stat-content">
              <h3>{stat.value}</h3>
              <p className="stat-label">{stat.label[language]}</p>
              <p className="stat-description">{stat.description[language]}</p>
            </div>

            {stat.status && (
              <div 
                className="stat-status"
                style={{ backgroundColor: getStatusColor(stat.status) }}
              >
                {t[stat.status]}
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .farm-overview {
          margin-top: 30px;
        }

        .overview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .farm-overview h2 {
          color: var(--text-dark);
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .header-info {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .last-update {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-gray);
          font-size: 0.8rem;
        }

        .last-update i {
          font-size: 0.7rem;
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--success);
          font-size: 0.8rem;
          font-weight: 500;
          background: #f0fdf4;
          padding: 4px 8px;
          border-radius: 12px;
          border: 1px solid #bbf7d0;
        }

        .live-dot {
          width: 6px;
          height: 6px;
          background: var(--success);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .stat-card {
          background: var(--white-card);
          padding: 24px;
          border-radius: 12px;
          box-shadow: var(--shadow-soft);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-medium);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }

        .stat-icon {
          font-size: 2rem;
          color: var(--primary);
          width: 60px;
          height: 60px;
          background: var(--soft-bg);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-change {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.8rem;
          font-weight: 600;
          background: rgba(16, 185, 129, 0.1);
          padding: 4px 8px;
          border-radius: 12px;
        }

        .stat-change[style*="#EF4444"] {
          background: rgba(239, 68, 68, 0.1);
        }

        .stat-content {
          flex: 1;
        }

        .stat-content h3 {
          color: var(--text-dark);
          margin-bottom: 8px;
          font-size: 1.8rem;
          font-weight: bold;
          line-height: 1.2;
        }

        .stat-label {
          color: var(--text-dark);
          margin-bottom: 6px;
          font-size: 1rem;
          font-weight: 600;
        }

        .stat-description {
          color: var(--text-gray);
          margin: 0;
          font-size: 0.8rem;
          line-height: 1.4;
        }

        .stat-status {
          position: absolute;
          top: 15px;
          right: 15px;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .no-device-message,
        .loading-stats {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          background: var(--white-card);
          border-radius: 12px;
          box-shadow: var(--shadow-soft);
          color: var(--text-gray);
          gap: 15px;
        }

        .no-device-message i,
        .loading-stats i {
          font-size: 3rem;
          opacity: 0.5;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .overview-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-info {
            width: 100%;
            justify-content: space-between;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .stat-card {
            padding: 20px;
          }

          .stat-content h3 {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .stat-header {
            flex-direction: column;
            gap: 10px;
          }

          .stat-change {
            align-self: flex-start;
          }

          .header-info {
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

// القيم الافتراضية للخصائص
FarmOverview.defaultProps = {
  deviceId: '',
  userId: ''
};