// components/dashboard/SensorChart.js
import React, { useEffect, useRef, useContext, useMemo, useCallback, useState } from 'react';
import { AppContext } from '../../contexts/AppContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// تسجيل مكونات Chart.js مرة واحدة فقط
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SensorChart = ({ sensorType, deviceId, userId }) => {
  const { historicalData, language, SENSOR_INFO, currentSensor } = useContext(AppContext);
  const chartRef = useRef();
  const [timeRange, setTimeRange] = useState('24h');
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // الترجمات
  const translations = useMemo(() => ({
    ar: {
      temperatureChart: "مخطط درجة الحرارة",
      humidityChart: "مخطط الرطوبة", 
      ammoniaChart: "مخطط الأمونيا",
      airQualityChart: "مخطط جودة الهواء",
      live: "مباشر",
      lastHour: "آخر ساعة",
      last6Hours: "آخر 6 ساعات",
      last24Hours: "آخر 24 ساعة",
      last7Days: "آخر 7 أيام",
      noData: "لا توجد بيانات متاحة",
      loading: "جاري تحميل البيانات...",
      selectTimeRange: "اختر النطاق الزمني",
      noDeviceSelected: "لم يتم اختيار جهاز",
      noUser: "يجب تسجيل الدخول أولاً",
      dataError: "خطأ في تحميل البيانات"
    },
    en: {
      temperatureChart: "Temperature Chart",
      humidityChart: "Humidity Chart",
      airQualityChart: "Air Quality Chart", 
      ammoniaChart: "Ammonia Chart",
      live: "Live",
      lastHour: "Last Hour",
      last6Hours: "Last 6 Hours",
      last24Hours: "Last 24 Hours",
      last7Days: "Last 7 Days",
      noData: "No data available",
      loading: "Loading data...",
      selectTimeRange: "Select Time Range",
      noDeviceSelected: "No device selected",
      noUser: "Please login first",
      dataError: "Error loading data"
    }
  }), []);

  const t = translations[language];
  const sensorInfo = SENSOR_INFO[sensorType];

  // 🔥 الإصلاح: تحويل البيانات من Firebase إلى تنسيق الرسم البياني
  const processChartData = useCallback(() => {
    console.log('📊 [CHART] Processing data for sensor:', sensorType, {
      hasHistoricalData: !!historicalData[sensorType],
      dataStructure: historicalData[sensorType] ? typeof historicalData[sensorType] : 'no data'
    });

    if (!historicalData[sensorType] || typeof historicalData[sensorType] !== 'object') {
      console.log('❌ [CHART] No data available for sensor:', sensorType);
      setChartData(null);
      setError(t.noData);
      return;
    }

    try {
      // 🔥 الإصلاح: تحويل البيانات من {timestamp: value} إلى [{timestamp, value}]
      const rawData = historicalData[sensorType];
      let dataArray = [];

      if (Array.isArray(rawData)) {
        // إذا كانت البيانات بالفعل مصفوفة (الشكل القديم)
        dataArray = rawData;
      } else {
        // تحويل من object إلى array
        dataArray = Object.entries(rawData)
          .map(([timestamp, value]) => ({
            timestamp: parseInt(timestamp),
            value: parseFloat(value) || 0
          }))
          .sort((a, b) => a.timestamp - b.timestamp);
      }

      console.log('✅ [CHART] Data processed:', {
        sensor: sensorType,
        dataPoints: dataArray.length,
        sample: dataArray.slice(0, 3)
      });

      if (dataArray.length === 0) {
        setChartData(null);
        setError(t.noData);
        return;
      }

      // تصفية البيانات حسب النطاق الزمني
      const now = Date.now();
      let timeLimit;

      switch (timeRange) {
        case '1h':
          timeLimit = now - (60 * 60 * 1000);
          break;
        case '6h':
          timeLimit = now - (6 * 60 * 60 * 1000);
          break;
        case '24h':
          timeLimit = now - (24 * 60 * 60 * 1000);
          break;
        case '7d':
          timeLimit = now - (7 * 24 * 60 * 60 * 1000);
          break;
        default:
          timeLimit = now - (24 * 60 * 60 * 1000);
      }

      const filteredData = dataArray.filter(item => item.timestamp >= timeLimit);

      if (filteredData.length === 0) {
        setChartData({
          labels: [t.noData],
          datasets: [
            {
              label: `${sensorInfo?.name || sensorType} (${sensorInfo?.unit || ''})`,
              data: [0],
              borderColor: sensorInfo?.color || '#666666',
              backgroundColor: sensorInfo?.backgroundColor || 'rgba(102, 102, 102, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointRadius: 0
            }
          ]
        });
        return;
      }

      // إنشاء التسميات والقيم
      const labels = filteredData.map(item => {
        const date = new Date(item.timestamp);
        
        switch (timeRange) {
          case '1h':
          case '6h':
            return date.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
              hour: '2-digit',
              minute: '2-digit'
            });
          case '24h':
            return date.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
              hour: '2-digit'
            });
          case '7d':
            return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
              month: 'short',
              day: 'numeric'
            });
          default:
            return date.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US');
        }
      });

      const values = filteredData.map(item => item.value);

      setChartData({
        labels,
        datasets: [
          {
            label: `${sensorInfo?.name || sensorType} (${sensorInfo?.unit || ''})`,
            data: values,
            borderColor: sensorInfo?.color || '#666666',
            backgroundColor: sensorInfo?.backgroundColor || 'rgba(102, 102, 102, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: sensorInfo?.color || '#666666',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: values.length > 50 ? 1 : 3,
            pointHoverRadius: 5
          }
        ]
      });

      setError(null);
      
    } catch (error) {
      console.error('❌ [CHART] Error processing chart data:', error);
      setError(t.dataError);
      setChartData(null);
    }
  }, [historicalData, sensorType, timeRange, language, sensorInfo, t]);

  // 🔥 الإصلاح: معالجة البيانات عند تغيير المستشعر أو البيانات
  useEffect(() => {
    console.log('🎯 [CHART] useEffect triggered - Sensor:', sensorType, 'Current Sensor:', currentSensor);
    
    setLoading(true);
    
    // تأخير بسيط لضمان استقرار البيانات
    const timer = setTimeout(() => {
      processChartData();
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [historicalData, sensorType, timeRange, processChartData, currentSensor]);

  // إعدادات الرسم البياني
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: 'var(--text-gray)',
          font: {
            size: 11
          },
          callback: function(value) {
            return value + (sensorInfo?.unit || '');
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: 'var(--text-gray)',
          font: {
            size: 11
          },
          maxTicksLimit: 8
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: sensorInfo?.color || '#666666',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `${context.parsed.y} ${sensorInfo?.unit || ''}`;
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animation: {
      duration: 500
    }
  }), [sensorInfo]);

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  // التحقق من وجود البيانات
  const hasData = historicalData[sensorType] && Object.keys(historicalData[sensorType]).length > 0;

  // عرض حالات الخطأ
  if (error) {
    return (
      <div className="card">
        <div className="chart-error">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!userId || !deviceId) {
    return (
      <div className="card">
        <div className="chart-error">
          <i className="fas fa-info-circle"></i>
          <span>
            {!userId ? t.noUser : t.noDeviceSelected}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="chart-header">
        <div className="chart-title">
          <i className={`fas ${sensorInfo?.icon || 'fa-chart-line'}`}></i>
          <span>
            {t[`${sensorType}Chart`] || `${sensorInfo?.name || sensorType} Chart`}
          </span>
          {hasData && !loading && (
            <div className="live-indicator">
              <div className="live-dot"></div>
              <span>{t.live}</span>
            </div>
          )}
        </div>
        <div className="chart-actions">
          <select 
            className="time-range-selector" 
            onChange={handleTimeRangeChange}
            value={timeRange}
            disabled={loading || !hasData}
          >
            <option value="1h">{t.lastHour}</option>
            <option value="6h">{t.last6Hours}</option>
            <option value="24h">{t.last24Hours}</option>
            <option value="7d">{t.last7Days}</option>
          </select>
        </div>
      </div>
      
      <div className="chart-container">
        {loading ? (
          <div className="chart-loading">
            <div className="loading-spinner"></div>
            <span>{t.loading}</span>
          </div>
        ) : chartData ? (
          <Line 
            ref={chartRef}
            data={chartData} 
            options={chartOptions}
            key={`${sensorType}-${timeRange}-${language}`}
          />
        ) : (
          <div className="chart-no-data">
            <i className="fas fa-chart-line"></i>
            <span>{t.noData}</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .card {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--white-card);
          border-radius: 12px;
          box-shadow: var(--shadow-soft);
          padding: 20px;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .chart-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-dark);
        }

        .chart-title i {
          color: var(--primary);
          font-size: 1.2rem;
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

        .chart-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .time-range-selector {
          padding: 6px 10px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          background: white;
          font-size: 0.8rem;
          color: var(--text-dark);
          cursor: pointer;
        }

        .chart-container {
          flex: 1;
          position: relative;
          min-height: 300px;
        }

        .chart-loading,
        .chart-no-data {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-gray);
          gap: 15px;
        }

        .chart-loading i,
        .chart-no-data i {
          font-size: 3rem;
          opacity: 0.5;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .chart-error {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 40px;
          color: var(--danger);
          text-align: center;
        }

        @media (max-width: 768px) {
          .card {
            padding: 15px;
          }
          .chart-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .chart-container {
            min-height: 250px;
          }
        }
      `}</style>
    </div>
  );
};

export default React.memo(SensorChart);