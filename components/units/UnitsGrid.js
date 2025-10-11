// components/units/UnitsGrid.js
import React, { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import UnitCard from './UnitCard';

const UnitsGrid = () => {
  const { unitsConfig, language, isSettingsMode } = useContext(AppContext);

  const translations = {
    ar: {
      noUnits: "لا توجد وحدات مضافة",
      addUnitMessage: "انقر على زر 'إضافة وحدة جديدة' لبدء إضافة الوحدات الذكية",
      settingsModeHint: "تفعيل وضع الإعدادات الهيكلية يسمح لك بإضافة وتعديل الوحدات",
      unitsCount: "عدد الوحدات:",
      activeUnits: "الوحدات النشطة:",
      inactiveUnits: "الوحدات المتوقفة:"
    },
    en: {
      noUnits: "No units added",
      addUnitMessage: "Click on 'Add New Unit' button to start adding smart units",
      settingsModeHint: "Enabling structural settings mode allows you to add and modify units",
      unitsCount: "Units Count:",
      activeUnits: "Active Units:",
      inactiveUnits: "Inactive Units:"
    }
  };

  const t = translations[language];

  // حساب الإحصائيات
  const calculateStats = () => {
    if (!unitsConfig || Object.keys(unitsConfig).length === 0) {
      return { total: 0, active: 0, inactive: 0 };
    }

    const units = Object.values(unitsConfig);
    const active = units.filter(unit => unit.status === true || unit.status === 'on').length;
    
    return {
      total: units.length,
      active: active,
      inactive: units.length - active
    };
  };

  const stats = calculateStats();

  if (!unitsConfig || Object.keys(unitsConfig).length === 0) {
    return (
      <div className="units-grid-container">
        <div className="no-units-state">
          <div className="no-units-icon">
            <i className="fas fa-fan"></i>
          </div>
          <h3>{t.noUnits}</h3>
          <p>{t.addUnitMessage}</p>
          {!isSettingsMode && (
            <div className="settings-hint">
              <i className="fas fa-info-circle"></i>
              <span>{t.settingsModeHint}</span>
            </div>
          )}
        </div>

        <style jsx>{`
          .units-grid-container {
            padding: 20px 0;
          }

          .no-units-state {
            text-align: center;
            padding: 60px 20px;
            background: var(--white-card);
            border-radius: 12px;
            box-shadow: var(--shadow-soft);
            border: 2px dashed #e0e0e0;
          }

          .no-units-icon {
            font-size: 4rem;
            color: var(--primary);
            opacity: 0.5;
            margin-bottom: 20px;
          }

          .no-units-state h3 {
            color: var(--text-dark);
            margin-bottom: 10px;
            font-size: 1.5rem;
          }

          .no-units-state p {
            color: var(--text-gray);
            margin-bottom: 20px;
            font-size: 1rem;
            line-height: 1.5;
          }

          .settings-hint {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 20px;
            background: #fff3cd;
            color: #856404;
            border-radius: 8px;
            border: 1px solid #ffeaa7;
            font-size: 0.9rem;
          }

          .settings-hint i {
            color: #f39c12;
          }

          @media (max-width: 768px) {
            .no-units-state {
              padding: 40px 15px;
            }

            .no-units-icon {
              font-size: 3rem;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="units-grid-container">
      {/* إحصائيات الوحدات */}
      <div className="units-stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <i className="fas fa-layer-group"></i>
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">{t.unitsCount}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon active">
            <i className="fas fa-play-circle"></i>
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">{t.activeUnits}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon inactive">
            <i className="fas fa-pause-circle"></i>
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.inactive}</div>
            <div className="stat-label">{t.inactiveUnits}</div>
          </div>
        </div>
      </div>

      {/* شبكة الوحدات */}
      <div className="units-grid">
        {Object.keys(unitsConfig).map(unitId => (
          <UnitCard
            key={unitId}
            unitId={unitId}
            unitData={unitsConfig[unitId]}
          />
        ))}
      </div>

      <style jsx>{`
        .units-grid-container {
          padding: 20px 0;
        }

        .units-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: var(--white-card);
          padding: 20px;
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
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .stat-icon.total {
          background: rgba(59, 130, 246, 0.1);
          color: #3B82F6;
        }

        .stat-icon.active {
          background: rgba(34, 197, 94, 0.1);
          color: #22C55E;
        }

        .stat-icon.inactive {
          background: rgba(107, 114, 128, 0.1);
          color: #6B7280;
        }

        .stat-info {
          flex: 1;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: var(--text-dark);
          line-height: 1;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 0.9rem;
          color: var(--text-gray);
        }

        .units-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 25px;
        }

        @media (max-width: 1200px) {
          .units-grid {
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .units-stats {
            grid-template-columns: 1fr;
          }

          .units-grid {
            grid-template-columns: 1fr;
          }

          .stat-card {
            padding: 15px;
          }

          .stat-value {
            font-size: 1.5rem;
          }

          .stat-icon {
            width: 50px;
            height: 50px;
            font-size: 1.2rem;
          }
        }

        @media (max-width: 480px) {
          .units-grid-container {
            padding: 10px 0;
          }

          .units-grid {
            gap: 20px;
          }

          .stat-card {
            flex-direction: column;
            text-align: center;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default UnitsGrid;