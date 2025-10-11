// src/pages/units.js
import React, { useContext, useState, useEffect } from 'react';
import Head from 'next/head';
import { AppContext } from '../../contexts/AppContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import UnitCard from '../../components/units/UnitCard';
import { firebaseService } from '../../hooks/useFirebase';

export default function UnitsPage() {
  const { 
    currentDevice, 
    language, 
    unitsConfig, 
    isSettingsMode,
    addUnit 
  } = useContext(AppContext);

  const [loading, setLoading] = useState(false);
  const [showAddUnitForm, setShowAddUnitForm] = useState(false);
  const [newUnitType, setNewUnitType] = useState('fan');
  const [newUnitName, setNewUnitName] = useState('');

  const translations = {
    ar: {
      pageTitle: "إدارة الوحدات الذكية",
      noDevice: "يرجى اختيار جهاز أولاً",
      addUnit: "إضافة وحدة جديدة",
      manageUnits: "إدارة الوحدات الذكية",
      noUnits: "لا توجد وحدات مضافة",
      addUnitMessage: "انقر على زر 'إضافة وحدة جديدة' لبدء إضافة الوحدات الذكية",
      unitName: "اسم الوحدة",
      unitType: "نوع الوحدة",
      cancel: "إلغاء",
      create: "إنشاء",
      settingsModeRequired: "يرجى تفعيل وضع الإعدادات الهيكلية أولاً",
      fan: "مروحة",
      heater: "تدفئة",
      cooler: "تبريد",
      light: "إنارة",
      addUnitSuccess: "تم إضافة الوحدة بنجاح",
      addUnitError: "حدث خطأ أثناء إضافة الوحدة"
    },
    en: {
      pageTitle: "Smart Units Management",
      noDevice: "Please select a device first",
      addUnit: "Add New Unit",
      manageUnits: "Smart Units Management",
      noUnits: "No units added",
      addUnitMessage: "Click on 'Add New Unit' button to start adding smart units",
      unitName: "Unit Name",
      unitType: "Unit Type",
      cancel: "Cancel",
      create: "Create",
      settingsModeRequired: "Please enable structural settings mode first",
      fan: "Fan",
      heater: "Heater",
      cooler: "Cooler",
      light: "Light",
      addUnitSuccess: "Unit added successfully",
      addUnitError: "Error adding unit"
    }
  };

  const t = translations[language];

  const UNIT_TYPES = {
    fan: { icon: 'fa-fan', name: t.fan, color: '#2196F3' },
    heater: { icon: 'fa-fire', name: t.heater, color: '#FF5722' },
    cooler: { icon: 'fa-snowflake', name: t.cooler, color: '#03A9F4' },
    light: { icon: 'fa-lightbulb', name: t.light, color: '#FFC107' }
  };

  // إذا لم يكن هناك جهاز محدد
  if (!currentDevice) {
    return (
      <DashboardLayout>
        <div className="no-device-container">
          <div className="card no-device">
            <i className="fas fa-fan" style={{ fontSize: '4rem', marginBottom: '20px', color: 'var(--primary)' }}></i>
            <h2>{t.noDevice}</h2>
            <p>{language === 'ar' ? 'يرجى اختيار جهاز من القائمة أعلاه' : 'Please select a device from the menu above'}</p>
          </div>
        </div>

        <style jsx>{`
          .no-device-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 60vh;
            padding: 20px;
          }
          
          .no-device {
            text-align: center;
            padding: 50px;
            max-width: 500px;
            width: 100%;
          }
        `}</style>
      </DashboardLayout>
    );
  }

  const handleAddUnitClick = () => {
    if (!isSettingsMode) {
      alert(t.settingsModeRequired);
      return;
    }
    setShowAddUnitForm(true);
    setNewUnitName('');
    setNewUnitType('fan');
  };

  const handleCreateUnit = async () => {
    if (!newUnitName.trim()) {
      alert(language === 'ar' ? 'يرجى إدخال اسم للوحدة' : 'Please enter a unit name');
      return;
    }

    setLoading(true);

    try {
      // إنشاء معرف فريد للوحدة
      let unitNumber = 1;
      let newUnitId = `unit${unitNumber}`;
      
      while (unitsConfig && unitsConfig[newUnitId]) {
        unitNumber++;
        newUnitId = `unit${unitNumber}`;
      }

      // إعدادات الوحدة الافتراضية
      const defaultUnitSettings = {
        name: newUnitName.trim(),
        type: newUnitType,
        status: false,
        mode: 'manual',
        sensors: ['temperature'],
        thresholds: {
          temperature: {
            min: 25,
            max: 35
          }
        },
        startTime: '06:00',
        endTime: '18:00',
        createdAt: new Date().toISOString(),
        createdBy: 'user' // يمكن استبدالها بمعلومات المستخدم الحالي
      };

      await addUnit(newUnitId, defaultUnitSettings);
      
      setShowAddUnitForm(false);
      setNewUnitName('');
      alert(t.addUnitSuccess);
      
    } catch (error) {
      console.error('Error creating unit:', error);
      alert(t.addUnitError);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddUnitForm(false);
    setNewUnitName('');
  };

  const renderUnitsGrid = () => {
    if (!unitsConfig || Object.keys(unitsConfig).length === 0) {
      return (
        <div className="no-units-message">
          <i className="fas fa-fan"></i>
          <h3>{t.noUnits}</h3>
          <p>{t.addUnitMessage}</p>
        </div>
      );
    }

    return (
      <div className="units-grid">
        {Object.keys(unitsConfig).map(unitId => (
          <UnitCard
            key={unitId}
            unitId={unitId}
            unitData={unitsConfig[unitId]}
          />
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <Head>
        <title>{t.pageTitle}</title>
      </Head>

      <div className="units-page">
        {/* رأس الصفحة */}
        <div className="page-header">
          <h1>{t.manageUnits}</h1>
          <button 
            className="btn btn-primary"
            onClick={handleAddUnitClick}
            disabled={loading}
          >
            <i className="fas fa-plus"></i>
            {t.addUnit}
          </button>
        </div>

        {/* نموذج إضافة وحدة جديدة */}
        {showAddUnitForm && (
          <div className="add-unit-modal">
            <div className="modal-content">
              <h3>{t.addUnit}</h3>
              
              <div className="form-group">
                <label>{t.unitName}</label>
                <input
                  type="text"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل اسم الوحدة' : 'Enter unit name'}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>{t.unitType}</label>
                <div className="type-options">
                  {Object.entries(UNIT_TYPES).map(([type, info]) => (
                    <div
                      key={type}
                      className={`type-option ${newUnitType === type ? 'selected' : ''}`}
                      onClick={() => setNewUnitType(type)}
                    >
                      <i className={`fas ${info.icon}`} style={{ color: info.color }}></i>
                      <span>{info.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={handleCancelAdd}
                  disabled={loading}
                >
                  {t.cancel}
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleCreateUnit}
                  disabled={loading || !newUnitName.trim()}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      {language === 'ar' ? 'جاري الإنشاء...' : 'Creating...'}
                    </>
                  ) : (
                    t.create
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* شبكة الوحدات */}
        <div className="units-container">
          {renderUnitsGrid()}
        </div>
      </div>

      <style jsx>{`
        .units-page {
          padding: 20px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e0e0e0;
        }

        .page-header h1 {
          color: var(--text-dark);
          margin: 0;
          font-size: 1.8rem;
        }

        .units-container {
          margin-top: 20px;
        }

        .no-units-message {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-gray);
        }

        .no-units-message i {
          font-size: 4rem;
          margin-bottom: 20px;
          color: var(--primary);
          opacity: 0.5;
        }

        .no-units-message h3 {
          margin-bottom: 10px;
          color: var(--text-dark);
        }

        .no-units-message p {
          margin: 0;
          font-size: 1rem;
        }

        .units-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 25px;
        }

        /* نموذج إضافة وحدة جديدة */
        .add-unit-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: var(--white-card);
          padding: 30px;
          border-radius: 12px;
          box-shadow: var(--shadow-large);
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content h3 {
          margin-bottom: 25px;
          color: var(--text-dark);
          text-align: center;
        }

        .form-group {
          margin-bottom: 25px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: var(--text-dark);
          font-weight: 500;
        }

        .form-group input {
          width: 100%;
          padding: 12px 15px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--primary);
        }

        .form-group input:disabled {
          background: #f8f9fa;
          cursor: not-allowed;
        }

        .type-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 10px;
        }

        .type-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 15px 10px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
        }

        .type-option:hover {
          border-color: var(--primary);
          background: #f8fff9;
        }

        .type-option.selected {
          border-color: var(--primary);
          background: var(--primary);
          color: white;
        }

        .type-option i {
          font-size: 1.5rem;
          margin-bottom: 5px;
        }

        .type-option span {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .modal-actions {
          display: flex;
          gap: 15px;
          justify-content: flex-end;
          margin-top: 30px;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .units-page {
            padding: 15px;
          }

          .page-header {
            flex-direction: column;
            gap: 15px;
            align-items: flex-start;
          }

          .page-header h1 {
            font-size: 1.5rem;
          }

          .units-grid {
            grid-template-columns: 1fr;
          }

          .type-options {
            grid-template-columns: 1fr;
          }

          .modal-content {
            padding: 20px;
            margin: 10px;
          }

          .modal-actions {
            flex-direction: column;
          }
        }

        @media (max-width: 480px) {
          .units-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}