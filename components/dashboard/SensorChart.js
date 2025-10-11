// components/dashboard/SensorChart.js
import React, { useEffect, useRef, useContext, useMemo, useCallback, useState } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { firebaseService } from '../../hooks/useFirebase';
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

const SensorChart = ({ sensorType, deviceId }) => {
  const { historicalData, setHistoricalData, language, SENSOR_INFO } = useContext(AppContext);
  const chartRef = useRef();
  const unsubscribeRef = useRef(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  // الترجمات باستخدام useMemo
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
      selectTimeRange: "اختر النطاق الزمني"
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
      selectTimeRange: "Select Time Range"
    }
  }), []);

  const t = translations[language];
  const sensorInfo = SENSOR_INFO[sensorType];

  // معالجة البيانات التاريخية
  const processHistoricalData = useCallback((data) => {
    if (!data || typeof data !== 'object') {
      setChartData(null);
      setLoading(false);
      return;
    }

    try {
      const dataArray = Object.entries(data)
        .map(([timestamp, value]) => ({
          timestamp: parseInt(timestamp),
          value: parseFloat(value) || 0
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

      setHistoricalData(prev => ({
        ...prev,
        [sensorType]: dataArray
      }));

      setLoading(false);
    } catch (error) {
      console.error('Error processing historical data:', error);
      setLoading(false);
    }
  }, [sensorType, setHistoricalData]);

  // الاشتراك في بيانات Firebase
  useEffect(() => {
    if (!deviceId || !sensorType || !firebaseService) {
      console.warn('Firebase service not available or missing parameters');
      setLoading(false);
      return;
    }

    setLoading(true);

    // إلغاء الاشتراك السابق إذا كان موجوداً
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    try {
      unsubscribeRef.current = firebaseService.listenToHistoricalData(
        deviceId,
        sensorType,
        (snapshot) => {
          const data = snapshot?.val();
          processHistoricalData(data);
        },
        (error) => {
          console.error(`Error listening to ${sensorType} data:`, error);
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Failed to subscribe to sensor data:', error);
      setLoading(false);
    }

    // تنظيف الاشتراك عند إلغاء التثبيت
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [deviceId, sensorType, processHistoricalData]);

  // تصفية البيانات حسب النطاق الزمني
  const filterDataByTimeRange = useCallback((data, range) => {
    if (!data || !data.length) return [];

    const now = Date.now();
    let timeLimit;

    switch (range) {
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

    return data.filter(item => item.timestamp >= timeLimit);
  }, []);

  // إعداد بيانات الرسم البياني
  useEffect(() => {
    const sensorData = historicalData[sensorType] || [];
    const filteredData = filterDataByTimeRange(sensorData, timeRange);

    if (!filteredData.length) {
      setChartData({
        labels: [t.loading],
        datasets: [
          {
            label: `${sensorInfo?.name || sensorType} (${sensorInfo?.unit || ''})`,
            data: [0],
            borderColor: sensorInfo?.color || '#666666',
            backgroundColor: sensorInfo?.backgroundColor || 'rgba(102, 102, 102, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
          }
        ]
      });
      return;
    }

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
          backgroundColor: sensorInfo?.backgroundColor || 'rgba(102, 102, 102, 0.2)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: sensorInfo?.color || '#666666',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: values.length > 50 ? 2 : 4,
          pointHoverRadius: 6
        }
      ]
    });
  }, [historicalData, sensorType, timeRange, language, sensorInfo, t.loading, filterDataByTimeRange]);

  // إعدادات الرسم البياني باستخدام useMemo
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: sensorInfo?.min === 0,
        suggestedMin: sensorInfo?.min,
        suggestedMax: sensorInfo?.max,
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
          },
          title: function(context) {
            const date = new Date(historicalData[sensorType]?.[context[0].dataIndex]?.timestamp);
            return date.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US');
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animation: {
      duration: 750,
      easing: 'easeOutQuart'
    },
    elements: {
      line: {
        cubicInterpolationMode: 'monotone'
      }
    }
  }), [sensorInfo, historicalData, sensorType, language]);

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  // التحقق من وجود البيانات
  const hasData = historicalData[sensorType]?.length > 0;

  if (!sensorType || !deviceId) {
    return (
      <div className="card">
        <div className="chart-error">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{t.noData}</span>
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
            disabled={loading}
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
            key={`${sensorType}-${deviceId}-${language}-${timeRange}`}
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
        }

        .time-range-selector:focus {
          outline: none;
          border-color: var(--primary);
        }

        .time-range-selector:disabled {
          background: #f8f9fa;
          cursor: not-allowed;
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
        }

        @media (max-width: 768px) {
          .chart-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .chart-actions {
            width: 100%;
          }

          .time-range-selector {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

// القيم الافتراضية للخصائص
SensorChart.defaultProps = {
  sensorType: 'temperature',
  deviceId: ''
};

export default React.memo(SensorChart);