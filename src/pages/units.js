// src/pages/units.js
import React, { useContext, useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useAuth } from '../../contexts/AuthContext';
import { AppContext } from '../../contexts/AppContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import UnitCard from '../../components/units/UnitCard';
import { firebaseService } from '../../hooks/useFirebase';

export default function UnitsPage() {
  const { user } = useAuth();
  const { 
    currentDevice, 
    language, 
    unitsConfig, 
    isSettingsMode,
    refreshUnits
  } = useContext(AppContext);

  const [loading, setLoading] = useState(false);
  const [showAddUnitForm, setShowAddUnitForm] = useState(false);
  const [newUnitType, setNewUnitType] = useState('fan');
  const [newUnitName, setNewUnitName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedUnits, setSelectedUnits] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');

  // الترجمات المحسنة
  const translations = {
    ar: {
      pageTitle: "الإدارة الذكية للوحدات",
      noDevice: "يرجى اختيار جهاز أولاً",
      addUnit: "إضافة وحدة جديدة",
      manageUnits: "الإدارة الذكية للوحدات",
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
      addUnitError: "حدث خطأ أثناء إضافة الوحدة",
      loginRequired: "يجب تسجيل الدخول أولاً",
      deviceNotAuthorized: "الجهاز غير مصرح به",
      totalUnits: "إجمالي الوحدات",
      activeUnits: "نشطة",
      inactiveUnits: "غير نشطة",
      searchPlaceholder: "ابحث في الوحدات...",
      filterAll: "جميع الوحدات",
      filterActive: "النشطة فقط",
      filterInactive: "غير النشطة",
      sortByName: "حسب الاسم",
      sortByType: "حسب النوع",
      sortByStatus: "حسب الحالة",
      sortByDate: "حسب التاريخ",
      stats: "الإحصائيات",
      quickActions: "الإجراءات السريعة",
      refresh: "تحديث البيانات",
      addNewUnit: "إضافة وحدة جديدة",
      gridView: "عرض شبكي",
      listView: "عرض قائمة",
      selectAll: "تحديد الكل",
      clearSelection: "إلغاء التحديد",
      bulkActions: "إجراءات جماعية",
      turnOn: "تشغيل",
      turnOff: "إيقاف",
      delete: "حذف",
      selected: "محدد",
      units: "الوحدات",
      lastUpdate: "آخر تحديث",
      created: "تم الإنشاء",
      status: "الحالة",
      actions: "الإجراءات",
      confirmDelete: "تأكيد الحذف",
      deleteConfirmMessage: "هل أنت متأكد من حذف الوحدات المحددة؟",
      deleteSuccess: "تم الحذف بنجاح",
      noResults: "لا توجد نتائج تطابق البحث",
      unitManagement: "إدارة الوحدات",
      automation: "الأتمتة",
      settings: "الإعدادات",
      apply: "تطبيق" // ✅ الإضافة المفقودة
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
      addUnitError: "Error adding unit",
      loginRequired: "Please login first",
      deviceNotAuthorized: "Device not authorized",
      totalUnits: "Total Units",
      activeUnits: "Active",
      inactiveUnits: "Inactive",
      searchPlaceholder: "Search units...",
      filterAll: "All Units",
      filterActive: "Active Only",
      filterInactive: "Inactive Only",
      sortByName: "By Name",
      sortByType: "By Type",
      sortByStatus: "By Status",
      sortByDate: "By Date",
      stats: "Statistics",
      quickActions: "Quick Actions",
      refresh: "Refresh Data",
      addNewUnit: "Add New Unit",
      gridView: "Grid View",
      listView: "List View",
      selectAll: "Select All",
      clearSelection: "Clear Selection",
      bulkActions: "Bulk Actions",
      turnOn: "Turn On",
      turnOff: "Turn Off",
      delete: "Delete",
      selected: "Selected",
      units: "Units",
      lastUpdate: "Last Update",
      created: "Created",
      status: "Status",
      actions: "Actions",
      confirmDelete: "Confirm Delete",
      deleteConfirmMessage: "Are you sure you want to delete the selected units?",
      deleteSuccess: "Deleted successfully",
      noResults: "No results match your search",
      unitManagement: "Unit Management",
      automation: "Automation",
      settings: "Settings",
      apply: "Apply" // ✅ الإضافة المفقودة
    }
  };

  const t = translations[language];

  const UNIT_TYPES = {
    fan: { 
      icon: 'fa-fan', 
      name: t.fan, 
      color: '#2196F3', 
      bgColor: 'rgba(33, 150, 243, 0.1)',
      description: language === 'ar' ? 'التحكم في التهوية والتبريد' : 'Ventilation and cooling control'
    },
    heater: { 
      icon: 'fa-fire', 
      name: t.heater, 
      color: '#FF5722', 
      bgColor: 'rgba(255, 87, 34, 0.1)',
      description: language === 'ar' ? 'التحكم في التدفئة' : 'Heating control'
    },
    cooler: { 
      icon: 'fa-snowflake', 
      name: t.cooler, 
      color: '#03A9F4', 
      bgColor: 'rgba(3, 169, 244, 0.1)',
      description: language === 'ar' ? 'التحكم في التبريد' : 'Cooling control'
    },
    light: { 
      icon: 'fa-lightbulb', 
      name: t.light, 
      color: '#FFC107', 
      bgColor: 'rgba(255, 193, 7, 0.1)',
      description: language === 'ar' ? 'التحكم في الإضاءة' : 'Lighting control'
    }
  };

  // ✅ حساب الإحصائيات المحسنة باستخدام useMemo
  const { units, activeUnits, inactiveUnits, unitsByType } = useMemo(() => {
    const unitsArray = Object.entries(unitsConfig || {});
    const active = unitsArray.filter(([_, unitData]) => unitData.status === true || unitData.status === 'on');
    const inactive = unitsArray.filter(([_, unitData]) => !unitData.status || unitData.status === 'off');
    
    const byType = unitsArray.reduce((acc, [unitId, unitData]) => {
      const type = unitData.type || 'fan';
      if (!acc[type]) acc[type] = [];
      acc[type].push({ unitId, ...unitData });
      return acc;
    }, {});

    return {
      units: unitsArray,
      activeUnits: active,
      inactiveUnits: inactive,
      unitsByType: byType
    };
  }, [unitsConfig]);

  // ✅ تصفية وترتيب الوحدات
  const filteredAndSortedUnits = useMemo(() => {
    return units
      .filter(([unitId, unitData]) => {
        // التصفية حسب البحث
        const matchesSearch = !searchTerm || 
          unitData.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          unitId.toLowerCase().includes(searchTerm.toLowerCase());
        
        // التصفية حسب النوع
        const matchesType = filterType === 'all' || unitData.type === filterType;
        
        // التصفية حسب الحالة
        const matchesStatus = filterStatus === 'all' || 
          (filterStatus === 'active' && (unitData.status === true || unitData.status === 'on')) ||
          (filterStatus === 'inactive' && (!unitData.status || unitData.status === 'off'));
        
        return matchesSearch && matchesType && matchesStatus;
      })
      .sort(([idA, dataA], [idB, dataB]) => {
        // الترتيب
        switch (sortBy) {
          case 'name':
            return (dataA.name || '').localeCompare(dataB.name || '');
          case 'type':
            return (dataA.type || '').localeCompare(dataB.type || '');
          case 'status':
            return (dataB.status ? 1 : 0) - (dataA.status ? 1 : 0);
          case 'date':
            return new Date(dataB.createdAt || 0) - new Date(dataA.createdAt || 0);
          default:
            return 0;
        }
      });
  }, [units, searchTerm, filterType, filterStatus, sortBy]);

  // ✅ إدارة التحديد الجماعي
  const handleSelectAll = () => {
    if (selectedUnits.size === filteredAndSortedUnits.length) {
      setSelectedUnits(new Set());
    } else {
      setSelectedUnits(new Set(filteredAndSortedUnits.map(([unitId]) => unitId)));
    }
  };

  const handleUnitSelect = (unitId) => {
    const newSelected = new Set(selectedUnits);
    if (newSelected.has(unitId)) {
      newSelected.delete(unitId);
    } else {
      newSelected.add(unitId);
    }
    setSelectedUnits(newSelected);
  };

  // ✅ الإجراءات الجماعية
  const handleBulkAction = async () => {
    if (!bulkAction || selectedUnits.size === 0) return;

    setLoading(true);
    try {
      const updates = [];
      
      for (const unitId of selectedUnits) {
        switch (bulkAction) {
          case 'turnOn':
            updates.push(
              firebaseService.updateUnit(user.uid, currentDevice, unitId, {
                status: true,
                lastUpdate: new Date().toISOString()
              })
            );
            break;
          case 'turnOff':
            updates.push(
              firebaseService.updateUnit(user.uid, currentDevice, unitId, {
                status: false,
                lastUpdate: new Date().toISOString()
              })
            );
            break;
          case 'delete':
            // ✅ التأكيد قبل الحذف
            const confirmMessage = language === 'ar' 
              ? 'هل أنت متأكد من حذف الوحدات المحددة؟'
              : 'Are you sure you want to delete the selected units?';
            
            if (!window.confirm(confirmMessage)) {
              continue;
            }
            
            updates.push(
              firebaseService.deleteUnit(user.uid, currentDevice, unitId)
            );
            break;
        }
      }

      await Promise.all(updates);
      setSelectedUnits(new Set());
      setBulkAction('');
      
      if (bulkAction === 'delete') {
        alert(t.deleteSuccess);
      }
      
    } catch (error) {
      console.error('Bulk action error:', error);
      alert(language === 'ar' ? 'حدث خطأ في الإجراء الجماعي' : 'Bulk action failed');
    } finally {
      setLoading(false);
    }
  };

  // ✅ التحقق من تسجيل الدخول
  if (!user) {
    return (
      <DashboardLayout>
        <div className="no-device-container">
          <div className="card no-device">
            <i className="fas fa-user-lock"></i>
            <h2>{t.loginRequired}</h2>
            <p>{language === 'ar' ? 'يرجى تسجيل الدخول للوصول إلى هذه الصفحة' : 'Please login to access this page'}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ✅ إذا لم يكن هناك جهاز محدد
  if (!currentDevice) {
    return (
      <DashboardLayout>
        <div className="no-device-container">
          <div className="card no-device">
            <i className="fas fa-fan"></i>
            <h2>{t.noDevice}</h2>
            <p>{language === 'ar' ? 'يرجى اختيار جهاز من القائمة أعلاه' : 'Please select a device from the menu above'}</p>
          </div>
        </div>
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

    try {
      const isAuthorized = await firebaseService.checkUserDevice(user.uid, currentDevice);
      if (!isAuthorized) {
        alert(t.deviceNotAuthorized);
        return;
      }
    } catch (error) {
      console.error('Error checking device authorization:', error);
      alert(t.addUnitError);
      return;
    }

    setLoading(true);

    try {
      // ✅ النظام الجديد: ترقيم تسلسلي ذكي
      const getNextAvailableUnitId = () => {
      const existingUnits = Object.keys(unitsConfig || {});
      
      // استخراج جميع الأرقام المستخدمة
      const usedNumbers = existingUnits.map(unitId => {
        const match = unitId.match(/^unit_(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      }).filter(num => num > 0);

      console.log('🔢 Used unit numbers:', usedNumbers);

      // إذا لم توجد وحدات، نبدأ من 1
      if (usedNumbers.length === 0) {
        return 'unit_1';
      }

      // البحث عن أول رقم مفقود في التسلسل
      for (let i = 1; i <= Math.max(...usedNumbers) + 1; i++) {
        if (!usedNumbers.includes(i)) {
          console.log(`🎯 Found available unit number: ${i}`);
          return `unit_${i}`;
        }
      }

      // إذا لم توجد فجوات، نستخدم الرقم التالي
      const nextNumber = Math.max(...usedNumbers) + 1;
      console.log(`📈 Using next sequential number: ${nextNumber}`);
      return `unit_${nextNumber}`;
    };

    const newUnitId = getNextAvailableUnitId(); // ← السطر الجديد
    console.log(`🆕 New unit ID: ${newUnitId}`);

      const defaultUnitSettings = {
        name: newUnitName.trim(),
        type: newUnitType,
        status: false,
        mode: 'manual',
        sensors: ['temperature'],
        thresholds: {
          temperature: { min: 25, max: 35 }
        },
        startTime: '06:00',
        endTime: '18:00',
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        createdByEmail: user.email,
        lastUpdate: new Date().toISOString()
      };

      await firebaseService.addUnit(user.uid, currentDevice, newUnitId, defaultUnitSettings);
      
      setShowAddUnitForm(false);
      setNewUnitName('');
      alert(t.addUnitSuccess);
      
    } catch (error) {
      console.error('❌ Error creating unit:', error);
      alert(t.addUnitError);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddUnitForm(false);
    setNewUnitName('');
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshUnits();
    } catch (error) {
      console.error('Error refreshing units:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderUnitsGrid = () => {
    if (filteredAndSortedUnits.length === 0) {
      return (
        <div className="no-units-message">
          <i className="fas fa-search"></i>
          <h3>{searchTerm ? t.noResults : t.noUnits}</h3>
          <p>{searchTerm ? 
            (language === 'ar' ? 'جرب استخدام مصطلحات بحث أخرى' : 'Try using different search terms') 
            : t.addUnitMessage}
          </p>
        </div>
      );
    }

    if (viewMode === 'grid') {
      return (
        <div className="units-grid">
          {filteredAndSortedUnits.map(([unitId, unitData]) => (
            <UnitCard
              key={unitId}
              unitId={unitId}
              unitData={unitData}
              userId={user.uid}
              isSelected={selectedUnits.has(unitId)}
              onSelect={() => handleUnitSelect(unitId)}
              showCheckbox={selectedUnits.size > 0}
            />
          ))}
        </div>
      );
    }

    // عرض القائمة
    return (
      <div className="units-list">
        <div className="list-header">
          <div className="list-checkbox"></div>
          <div className="list-name">{t.unitName}</div>
          <div className="list-type">{t.unitType}</div>
          <div className="list-status">{t.status}</div>
          <div className="list-date">{t.created}</div>
          <div className="list-actions">{t.actions}</div>
        </div>
        {filteredAndSortedUnits.map(([unitId, unitData]) => (
          <div key={unitId} className={`list-item ${selectedUnits.has(unitId) ? 'selected' : ''}`}>
            <div className="list-checkbox">
              <input
                type="checkbox"
                checked={selectedUnits.has(unitId)}
                onChange={() => handleUnitSelect(unitId)}
              />
            </div>
            <div className="list-name">
              <i className={`fas ${UNIT_TYPES[unitData.type]?.icon}`} 
                 style={{ color: UNIT_TYPES[unitData.type]?.color }}></i>
              <span>{unitData.name}</span>
            </div>
            <div className="list-type">
              <span className="type-badge" 
                    style={{ backgroundColor: UNIT_TYPES[unitData.type]?.bgColor,
                            color: UNIT_TYPES[unitData.type]?.color }}>
                {UNIT_TYPES[unitData.type]?.name}
              </span>
            </div>
            <div className="list-status">
              <span className={`status-badge ${unitData.status ? 'active' : 'inactive'}`}>
                {unitData.status ? t.activeUnits : t.inactiveUnits}
              </span>
            </div>
            <div className="list-date">
              {unitData.createdAt ? new Date(unitData.createdAt).toLocaleDateString() : '-'}
            </div>
            <div className="list-actions">
              <button className="btn-icon" title={t.settings}>
                <i className="fas fa-cog"></i>
              </button>
              <button className="btn-icon" title={t.automation}>
                <i className="fas fa-robot"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ✅ حساب إذا كان التحديد غير مكتمل (لإصلاح التحذير)
  const isIndeterminate = selectedUnits.size > 0 && selectedUnits.size < filteredAndSortedUnits.length;

  return (
    <DashboardLayout>
      <Head>
        <title>{t.pageTitle}</title>
      </Head>

      <div className="units-page">
        {/* رأس الصفحة المحسن */}
        <div className="page-header">
          <div className="header-info">
            <div className="breadcrumb">
              <span>{t.unitManagement}</span>
              <i className="fas fa-chevron-left"></i>
              <span className="current">{t.manageUnits}</span>
            </div>
            <h1>{t.manageUnits}</h1>
            <div className="device-info">
              <i className="fas fa-microchip"></i>
              <span>{currentDevice}</span>
            </div>
          </div>
          
          <div className="header-actions">
            <div className="view-toggle">
              <button 
                className={`btn-view ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title={t.gridView}
              >
                <i className="fas fa-th"></i>
              </button>
              <button 
                className={`btn-view ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title={t.listView}
              >
                <i className="fas fa-list"></i>
              </button>
            </div>
            <button 
              className="btn btn-secondary"
              onClick={handleRefresh}
              disabled={loading}
            >
              <i className="fas fa-sync-alt"></i>
              {t.refresh}
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleAddUnitClick}
              disabled={loading}
            >
              <i className="fas fa-plus"></i>
              {t.addNewUnit}
            </button>
          </div>
        </div>

        {/* بطاقات الإحصائيات المحسنة */}
        <div className="stats-cards">
          <div className="stat-card total">
            <div className="stat-icon">
              <i className="fas fa-layer-group"></i>
            </div>
            <div className="stat-content">
              <h3>{units.length}</h3>
              <p>{t.totalUnits}</p>
            </div>
            <div className="stat-trend">
              <i className="fas fa-arrow-up"></i>
            </div>
          </div>
          
          <div className="stat-card active">
            <div className="stat-icon">
              <i className="fas fa-play-circle"></i>
            </div>
            <div className="stat-content">
              <h3>{activeUnits.length}</h3>
              <p>{t.activeUnits}</p>
              <span className="stat-percent">
                {units.length > 0 ? Math.round((activeUnits.length / units.length) * 100) : 0}%
              </span>
            </div>
          </div>
          
          <div className="stat-card inactive">
            <div className="stat-icon">
              <i className="fas fa-pause-circle"></i>
            </div>
            <div className="stat-content">
              <h3>{inactiveUnits.length}</h3>
              <p>{t.inactiveUnits}</p>
            </div>
          </div>

          {/* إحصائيات حسب النوع */}
          {Object.entries(unitsByType).map(([type, typeUnits]) => (
            <div key={type} className="stat-card type" 
                 style={{ borderLeftColor: UNIT_TYPES[type]?.color }}>
              <div className="stat-icon">
                <i className={`fas ${UNIT_TYPES[type]?.icon}`} 
                   style={{ color: UNIT_TYPES[type]?.color }}></i>
              </div>
              <div className="stat-content">
                <h3>{typeUnits.length}</h3>
                <p>{UNIT_TYPES[type]?.name}</p>
              </div>
            </div>
          ))}
        </div>

        {/* أدوات التحكم في التصفية والترتيب */}
        <div className="controls-section">
          <div className="search-controls">
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="clear-search" onClick={() => setSearchTerm('')}>
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>
          
          <div className="filter-controls">
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">{t.filterAll}</option>
              {Object.keys(UNIT_TYPES).map(type => (
                <option key={type} value={type}>{UNIT_TYPES[type].name}</option>
              ))}
            </select>
            
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">{t.filterAll}</option>
              <option value="active">{t.filterActive}</option>
              <option value="inactive">{t.filterInactive}</option>
            </select>
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="name">{t.sortByName}</option>
              <option value="type">{t.sortByType}</option>
              <option value="status">{t.sortByStatus}</option>
              <option value="date">{t.sortByDate}</option>
            </select>
          </div>
        </div>

        {/* الإجراءات الجماعية */}
        {selectedUnits.size > 0 && (
          <div className="bulk-actions-bar">
            <div className="bulk-info">
              <span>
                {selectedUnits.size} {t.selected} {t.units.toLowerCase()}
              </span>
              <button className="btn-link" onClick={() => setSelectedUnits(new Set())}>
                {t.clearSelection}
              </button>
            </div>
            <div className="bulk-actions">
              <select 
                value={bulkAction} 
                onChange={(e) => setBulkAction(e.target.value)}
                className="bulk-select"
              >
                <option value="">{t.bulkActions}</option>
                <option value="turnOn">{t.turnOn}</option>
                <option value="turnOff">{t.turnOff}</option>
                <option value="delete">{t.delete}</option>
              </select>
              <button 
                className="btn btn-primary"
                onClick={handleBulkAction}
                disabled={!bulkAction || loading}
              >
                {t.apply} {/* ✅ تم إصلاحه */}
              </button>
            </div>
          </div>
        )}

        {/* معلومات التحديد */}
        <div className="selection-info">
          <div className="select-all">
            <input
              type="checkbox"
              checked={selectedUnits.size === filteredAndSortedUnits.length && filteredAndSortedUnits.length > 0}
              onChange={handleSelectAll}
              ref={(el) => {
                // ✅ إصلاح مشكلة indeterminate باستخدام ref
                if (el) {
                  el.indeterminate = isIndeterminate;
                }
              }}
            />
            <span onClick={handleSelectAll}>
              {selectedUnits.size === filteredAndSortedUnits.length ? t.clearSelection : t.selectAll}
            </span>
          </div>
          <div className="results-count">
            {filteredAndSortedUnits.length} {t.units.toLowerCase()}
          </div>
        </div>

        {/* نموذج إضافة وحدة جديدة */}
        {showAddUnitForm && (
          <div className="add-unit-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>{t.addUnit}</h3>
                <button className="btn-close" onClick={handleCancelAdd}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="form-group">
                <label>{t.unitName}</label>
                <input
                  type="text"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل اسم الوحدة' : 'Enter unit name'}
                  disabled={loading}
                  autoFocus
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
                      <div className="type-icon" style={{ backgroundColor: info.bgColor }}>
                        <i className={`fas ${info.icon}`} style={{ color: info.color }}></i>
                      </div>
                      <div className="type-info">
                        <div className="type-name">{info.name}</div>
                        <div className="type-desc">{info.description}</div>
                      </div>
                      {newUnitType === type && (
                        <div className="type-check">
                          <i className="fas fa-check"></i>
                        </div>
                      )}
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
          max-width: 1400px;
          margin: 0 auto;
        }

        /* رأس الصفحة المحسن */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e0e0e0;
          flex-wrap: wrap;
          gap: 20px;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-gray);
          font-size: 0.9rem;
          margin-bottom: 8px;
        }

        .breadcrumb i {
          font-size: 0.7rem;
          opacity: 0.6;
        }

        .breadcrumb .current {
          color: var(--primary);
          font-weight: 600;
        }

        .page-header h1 {
          color: var(--text-dark);
          margin: 0 0 12px 0;
          font-size: 2rem;
          font-weight: 700;
        }

        .device-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-gray);
          font-size: 0.9rem;
          background: var(--primary-light);
          padding: 6px 12px;
          border-radius: 8px;
          width: fit-content;
        }

        .device-info i {
          color: var(--primary);
        }

        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .view-toggle {
          display: flex;
          background: #f8f9fa;
          border-radius: 8px;
          padding: 4px;
        }

        .btn-view {
          padding: 8px 12px;
          border: none;
          background: none;
          border-radius: 6px;
          cursor: pointer;
          color: var(--text-gray);
          transition: all 0.3s ease;
        }

        .btn-view.active {
          background: white;
          color: var(--primary);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        /* بطاقات الإحصائيات المحسنة */
        .stats-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 15px;
          border-left: 4px solid var(--primary);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          position: relative;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }

        .stat-card.total { border-left-color: #2196F3; }
        .stat-card.active { border-left-color: #4CAF50; }
        .stat-card.inactive { border-left-color: #FF9800; }

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
        }

        .stat-card.total .stat-icon { background: rgba(33, 150, 243, 0.1); color: #2196F3; }
        .stat-card.active .stat-icon { background: rgba(76, 175, 80, 0.1); color: #4CAF50; }
        .stat-card.inactive .stat-icon { background: rgba(255, 152, 0, 0.1); color: #FF9800; }
        .stat-card.type .stat-icon { background: rgba(0,0,0,0.05); }

        .stat-content h3 {
          margin: 0;
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-dark);
        }

        .stat-content p {
          margin: 4px 0 0 0;
          color: var(--text-gray);
          font-size: 0.9rem;
          font-weight: 500;
        }

        .stat-percent {
          font-size: 0.8rem;
          color: #4CAF50;
          font-weight: 600;
          margin-top: 4px;
        }

        .stat-trend {
          position: absolute;
          top: 20px;
          right: 20px;
          color: #4CAF50;
        }

        /* أدوات التحكم */
        .controls-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          gap: 20px;
          flex-wrap: wrap;
        }

        .search-box {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-box i {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-gray);
        }

        .search-box input {
          width: 100%;
          padding: 12px 15px 12px 45px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .search-box input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
        }

        .clear-search {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-gray);
          cursor: pointer;
          padding: 4px;
        }

        .filter-controls {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .filter-select,
        .sort-select {
          padding: 10px 15px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 0.9rem;
          background: white;
          cursor: pointer;
          min-width: 140px;
        }

        .filter-select:focus,
        .sort-select:focus {
          outline: none;
          border-color: var(--primary);
        }

        /* الإجراءات الجماعية */
        .bulk-actions-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #e3f2fd;
          padding: 15px 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid #bbdefb;
        }

        .bulk-info {
          display: flex;
          align-items: center;
          gap: 15px;
          color: var(--text-dark);
          font-weight: 500;
        }

        .btn-link {
          background: none;
          border: none;
          color: var(--primary);
          cursor: pointer;
          text-decoration: underline;
        }

        .bulk-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .bulk-select {
          padding: 8px 12px;
          border: 1px solid #bbdefb;
          border-radius: 6px;
          background: white;
          cursor: pointer;
        }

        /* معلومات التحديد */
        .selection-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 12px 0;
          border-bottom: 1px solid #e0e0e0;
        }

        .select-all {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .select-all input {
          cursor: pointer;
        }

        .select-all span {
          color: var(--text-gray);
          font-size: 0.9rem;
        }

        .results-count {
          color: var(--text-gray);
          font-size: 0.9rem;
        }

        /* عرض القائمة */
        .units-list {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .list-header {
          display: grid;
          grid-template-columns: 50px 2fr 1fr 1fr 1fr 100px;
          gap: 15px;
          padding: 15px 20px;
          background: #f8f9fa;
          border-bottom: 1px solid #e0e0e0;
          font-weight: 600;
          color: var(--text-dark);
          font-size: 0.9rem;
        }

        .list-item {
          display: grid;
          grid-template-columns: 50px 2fr 1fr 1fr 1fr 100px;
          gap: 15px;
          padding: 15px 20px;
          border-bottom: 1px solid #f0f0f0;
          align-items: center;
          transition: background-color 0.2s ease;
        }

        .list-item:hover {
          background: #f8f9fa;
        }

        .list-item.selected {
          background: #e3f2fd;
        }

        .list-checkbox {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .list-name {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 500;
        }

        .list-name i {
          font-size: 1.2rem;
        }

        .type-badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .status-badge.active {
          background: rgba(76, 175, 80, 0.1);
          color: #4CAF50;
        }

        .status-badge.inactive {
          background: rgba(255, 152, 0, 0.1);
          color: #FF9800;
        }

        .list-date {
          color: var(--text-gray);
          font-size: 0.9rem;
        }

        .list-actions {
          display: flex;
          gap: 8px;
        }

        .btn-icon {
          padding: 6px;
          border: none;
          background: none;
          color: var(--text-gray);
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .btn-icon:hover {
          background: #f0f0f0;
          color: var(--primary);
        }

        /* بقية الأنماط */
        .units-container {
          margin-top: 20px;
        }

        .no-units-message {
          text-align: center;
          padding: 80px 20px;
          color: var(--text-gray);
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .no-units-message i {
          font-size: 4rem;
          margin-bottom: 20px;
          color: var(--primary);
          opacity: 0.3;
        }

        .no-units-message h3 {
          margin-bottom: 15px;
          color: var(--text-dark);
          font-size: 1.5rem;
        }

        .no-units-message p {
          margin: 0;
          font-size: 1.1rem;
          max-width: 400px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .units-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
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
          background: white;
          padding: 0;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 25px 30px 0;
          margin-bottom: 25px;
        }

        .modal-header h3 {
          margin: 0;
          color: var(--text-dark);
          font-size: 1.5rem;
          font-weight: 600;
        }

        .btn-close {
          background: none;
          border: none;
          color: var(--text-gray);
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          transition: background-color 0.2s ease;
        }

        .btn-close:hover {
          background: #f0f0f0;
        }

        .form-group {
          padding: 0 30px;
          margin-bottom: 25px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: var(--text-dark);
          font-weight: 600;
          font-size: 0.95rem;
        }

        .form-group input {
          width: 100%;
          padding: 14px 15px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
        }

        .type-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 10px;
        }

        .type-option {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          border: 2px solid #f0f0f0;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .type-option:hover {
          border-color: var(--primary);
          transform: translateY(-1px);
        }

        .type-option.selected {
          border-color: var(--primary);
          background: rgba(33, 150, 243, 0.05);
        }

        .type-icon {
          width: 50px;
          height: 50px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .type-info {
          flex: 1;
        }

        .type-name {
          font-weight: 600;
          color: var(--text-dark);
          margin-bottom: 4px;
        }

        .type-desc {
          font-size: 0.85rem;
          color: var(--text-gray);
        }

        .type-check {
          color: var(--primary);
          font-size: 1.1rem;
        }

        .modal-actions {
          display: flex;
          gap: 15px;
          justify-content: flex-end;
          padding: 20px 30px;
          background: #f8f9fa;
          border-top: 1px solid #e0e0e0;
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

        /* تحسينات للاستجابة */
        @media (max-width: 768px) {
          .units-page {
            padding: 15px;
          }

          .page-header {
            flex-direction: column;
            gap: 15px;
          }

          .header-actions {
            width: 100%;
            justify-content: space-between;
          }

          .stats-cards {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
          }

          .controls-section {
            flex-direction: column;
            align-items: stretch;
          }

          .filter-controls {
            flex-wrap: wrap;
          }

          .list-header,
          .list-item {
            grid-template-columns: 40px 1fr 1fr;
            gap: 10px;
          }

          .list-date,
          .list-actions {
            display: none;
          }

          .bulk-actions-bar {
            flex-direction: column;
            gap: 15px;
            align-items: stretch;
          }

          .modal-content {
            margin: 10px;
          }

          .type-option {
            padding: 12px;
          }

          .type-icon {
            width: 40px;
            height: 40px;
            font-size: 1.2rem;
          }
        }

        @media (max-width: 480px) {
          .stats-cards {
            grid-template-columns: 1fr;
          }

          .units-grid {
            grid-template-columns: 1fr;
          }

          .filter-controls {
            flex-direction: column;
          }

          .filter-select,
          .sort-select {
            width: 100%;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}