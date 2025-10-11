// components/dashboard/FarmOverview.js
import React from 'react';

export default function FarmOverview() {
  const farmStats = [
    {
      icon: 'fa-egg',
      label: 'عدد الطيور',
      value: '2,450',
      change: '+5%',
      trend: 'up'
    },
    {
      icon: 'fa-weight-scale',
      label: 'متوسط الوزن',
      value: '2.3 كجم',
      change: '+0.2%',
      trend: 'up'
    },
    {
      icon: 'fa-utensils',
      label: 'استهلاك العلف',
      value: '120 كجم/يوم',
      change: '-2%',
      trend: 'down'
    },
    {
      icon: 'fa-droplet',
      label: 'استهلاك الماء',
      value: '250 لتر/يوم',
      change: '+3%',
      trend: 'up'
    }
  ];

  const getTrendColor = (trend) => {
    return trend === 'up' ? '#10B981' : '#EF4444';
  };

  return (
    <div className="farm-overview">
      <h2>📊 نظرة عامة على المزرعة</h2>
      
      <div className="stats-grid">
        {farmStats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon">
              <i className={`fas ${stat.icon}`}></i>
            </div>
            
            <div className="stat-content">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
            
            <div 
              className="stat-change"
              style={{ color: getTrendColor(stat.trend) }}
            >
              <i className={`fas ${stat.trend === 'up' ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .farm-overview {
          margin-top: 30px;
        }

        .farm-overview h2 {
          color: var(--text-dark);
          margin-bottom: 20px;
          font-size: 1.5rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .stat-card {
          background: var(--white-card);
          padding: 24px;
          border-radius: 12px;
          box-shadow: var(--shadow-soft);
          display: flex;
          align-items: center;
          gap: 15px;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-medium);
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

        .stat-content {
          flex: 1;
        }

        .stat-content h3 {
          color: var(--text-dark);
          margin-bottom: 5px;
          font-size: 1.5rem;
          font-weight: bold;
        }

        .stat-content p {
          color: var(--text-gray);
          margin: 0;
          font-size: 0.9rem;
        }

        .stat-change {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .stat-card {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}