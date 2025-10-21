// components/layout/DashboardLayout.js
import React, { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { firebaseService } from '../../hooks/useFirebase';
import Header from './Header';
import EditModeBanner from '../common/EditModeBanner';

export default function DashboardLayout({ children }) {
  const { user, userData, logout } = useAuth();
  const { 
    language, 
    setLanguage, 
    devicesList, 
    setDevicesList,
    currentDevice, 
    setCurrentDevice, 
    farms, 
    currentFarm, 
    selectFarm,
    addFarm
  } = useApp();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userFarms, setUserFarms] = useState([]);
  const [pendingDevicesCount, setPendingDevicesCount] = useState(0);
  const router = useRouter();

  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setLoading(false);
  }, [user, router]);

  // تحميل أجهزة المستخدم
  useEffect(() => {
    if (!user) return;

    const unsubscribe = firebaseService.getUserDevices(user.uid, (snapshot) => {
      const devicesData = snapshot.val();
      if (devicesData) {
        const devices = Object.keys(devicesData);
        setDevicesList(devices);
        
        // إذا لم يكن هناك جهاز محدد، نحدد الأول تلقائياً
        if (!currentDevice && devices.length > 0) {
          setCurrentDevice(devices[0]);
        }
      } else {
        setDevicesList([]);
      }
    });

    return () => unsubscribe();
  }, [user, currentDevice, setDevicesList, setCurrentDevice]);

  // تحميل عدد الأجهزة المعلقة
  useEffect(() => {
    if (!user) return;

    const unsubscribe = firebaseService.getPendingDevicesCount((count) => {
      setPendingDevicesCount(count);
    });

    return () => unsubscribe();
  }, [user]);

  // تحميل مزارع المستخدم
  useEffect(() => {
    if (!user) return;

    const loadUserFarms = async () => {
      try {
        // استخدام الأجهزة كمزارع مباشرة
        if (devicesList && devicesList.length > 0) {
          setUserFarms(devicesList);
          
          // إذا لم يكن هناك مزرعة محددة، نحدد الأولى تلقائياً
          if (!currentFarm && selectFarm) {
            selectFarm(devicesList[0]);
          }
        } else {
          setUserFarms([]);
        }
      } catch (error) {
        console.error('Error loading farms:', error);
        setUserFarms(devicesList || []);
      }
    };

    loadUserFarms();
  }, [user, devicesList, currentFarm, selectFarm]);

  // تحديث الوقت الحالي
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const translations = {
    ar: {
      dashboard: "لوحة التحكم",
      units: "الوحدات الذكية",
      pendingDevices: "الأجهزة المعلقة",
      reports: "التقارير",
      settings: "الإعدادات",
      live: "مباشر",
      selectDevice: "اختر جهاز المراقبة:",
      language: "اللغة:",
      logout: "تسجيل الخروج",
      connected: "متصل",
      welcome: "مرحباً",
      selectFarm: "اختر مزرعة",
      noFarms: "لا توجد مزارع",
      toggleSidebar: "إظهار/إخفاء القائمة",
      noDevices: "لا توجد أجهزة",
      addFirstDevice: "أضف جهازك الأول",
      loading: "جاري التحميل...",
      userWelcome: "أهلاً بك",
      pendingDevicesTitle: "الأجهزة المعلقة",
      pendingDevicesDesc: "إدارة الأجهزة المنتظرة للموافقة"
    },
    en: {
      dashboard: "Dashboard",
      units: "Smart Units",
      pendingDevices: "Pending Devices",
      reports: "Reports",
      settings: "Settings",
      live: "Live",
      selectDevice: "Select Monitoring Device:",
      language: "Language:",
      logout: "Logout",
      connected: "Connected",
      welcome: "Welcome",
      selectFarm: "Select Farm",
      noFarms: "No farms",
      toggleSidebar: "Show/Hide Menu",
      noDevices: "No devices",
      addFirstDevice: "Add your first device",
      loading: "Loading...",
      userWelcome: "Welcome back",
      pendingDevicesTitle: "Pending Devices",
      pendingDevicesDesc: "Manage devices waiting for approval"
    }
  };

  const t = translations[language];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>{t.loading}</p>
      </div>
    );
  }

  if (!user) {
    return null; // سيتم التوجيه إلى صفحة التسجيل
  }

  return (
    <div className="dashboard-layout" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* الشريط الجانبي */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-content">
          <div className="sidebar-header">
            <div className="logo">
              <i className="fas fa-tractor"></i>
              <h2>{language === 'ar' ? 'المزرعة الذكية' : 'Smart Farm'}</h2>
            </div>
            <button className="sidebar-toggle" onClick={toggleSidebar} title={t.toggleSidebar}>
              <i className={`fas ${language === 'ar' ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
            </button>
          </div>
          
          <nav className="sidebar-nav">
            <a href="/" className="nav-item active">
              <i className="fas fa-home"></i>
              <span>{t.dashboard}</span>
            </a>
            <a href="/units" className="nav-item">
              <i className="fas fa-fan"></i>
              <span>{t.units}</span>
            </a>
            
            {/* رابط الأجهزة المعلقة */}
            <a href="/devices/pending" className="nav-item">
              <i className="fas fa-clock"></i>
              <span>{t.pendingDevices}</span>
              {pendingDevicesCount > 0 && (
                <span className="nav-badge">{pendingDevicesCount}</span>
              )}
            </a>
            
            <a href="#" className="nav-item">
              <i className="fas fa-chart-line"></i>
              <span>{t.reports}</span>
            </a>
            <a href="#" className="nav-item">
              <i className="fas fa-cog"></i>
              <span>{t.settings}</span>
            </a>
          </nav>

          {/* اختيار المزرعة */}
          <div className="farm-selector-section">
            <label>{t.selectFarm}</label>
            {userFarms.length > 0 ? (
              <select 
                value={currentFarm || ''} 
                onChange={(e) => selectFarm && selectFarm(e.target.value)}
                className="farm-select"
              >
                <option value="">{t.selectFarm}</option>
                {userFarms.map(farm => (
                  <option key={farm} value={farm}>
                    {farm}
                  </option>
                ))}
              </select>
            ) : (
              <div className="no-data-message">
                <i className="fas fa-info-circle"></i>
                <span>{t.noFarms}</span>
                <button 
                  className="add-btn-small"
                  onClick={() => {
                    // فتح نافذة إضافة مزرعة
                    const addFarmBtn = document.querySelector('.add-farm-btn');
                    if (addFarmBtn) addFarmBtn.click();
                  }}
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            )}
          </div>

          {/* اختيار الجهاز */}
          <div className="device-selector-section">
            <label>{t.selectDevice}</label>
            {devicesList && devicesList.length > 0 ? (
              <select 
                value={currentDevice || ''} 
                onChange={(e) => setCurrentDevice(e.target.value)}
                className="device-select"
              >
                <option value="">{t.selectDevice}</option>
                {devicesList.map(device => (
                  <option key={device} value={device}>
                    {device}
                  </option>
                ))}
              </select>
            ) : (
              <div className="no-data-message">
                <i className="fas fa-info-circle"></i>
                <span>{t.noDevices}</span>
                <button 
                  className="add-btn-small"
                  onClick={() => {
                    // فتح نافذة إضافة جهاز
                    const addFarmBtn = document.querySelector('.add-farm-btn');
                    if (addFarmBtn) addFarmBtn.click();
                  }}
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            )}
          </div>

          {/* إعدادات اللغة */}
          <div className="language-selector-section">
            <label>{t.language}</label>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="lang-select"
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* معلومات المستخدم */}
          <div className="user-section">
            <div className="user-info">
              <div className="user-avatar">
                <i className="fas fa-user"></i>
              </div>
              <div className="user-details">
                <span className="user-name">{userData?.name || user?.email?.split('@')[0]}</span>
                <span className="user-email">{user?.email}</span>
                <span className="user-status">
                  <div className="status-dot connected"></div>
                  {t.connected}
                </span>
              </div>
            </div>
            <button onClick={handleLogout} className="btn btn-danger logout-btn">
              <i className="fas fa-sign-out-alt"></i>
              <span>{t.logout}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* زر التبديل عندما تكون القائمة مخفية */}
        {sidebarCollapsed && (
          <div className="floating-toggle" onClick={toggleSidebar}>
            <i className="fas fa-bars"></i>
          </div>
        )}

        {/* رأس الصفحة */}
        <Header />

        {/* بانر وضع التحرير */}
        <EditModeBanner />

        {/* المحتوى */}
        <div className="content-wrapper">
          {/* معلومات الوقت والتاريخ */}
          <div className="time-info-card">
            <div className="current-time">
              <i className="fas fa-clock"></i>
              <span>{formatTime(currentTime)}</span>
            </div>
            <div className="current-date">
              <i className="fas fa-calendar"></i>
              <span>{formatDate(currentTime)}</span>
            </div>
            <div className="user-welcome">
              <i className="fas fa-user-check"></i>
              <span>{t.userWelcome}, <strong>{userData?.name || user?.email?.split('@')[0]}</strong></span>
            </div>
            <div className="live-indicator">
              <div className="live-dot"></div>
              <span>{t.live}</span>
            </div>
          </div>

          {/* محتوى الصفحة */}
          {children}
        </div>
      </main>

      <style jsx>{`
        .dashboard-layout {
          display: flex;
          min-height: 100vh;
          background: var(--soft-bg);
          position: relative;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: var(--soft-bg);
          gap: 20px;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .sidebar {
          width: 280px;
          background: var(--sidebar-bg);
          color: white;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-large);
          position: fixed;
          height: 100vh;
          overflow-y: auto;
          z-index: 1000;
          transition: all 0.3s ease;
        }

        /* للغة العربية - الشريط على اليمين */
        [dir="rtl"] .sidebar {
          right: 0;
          transform: translateX(0);
        }

        [dir="rtl"] .sidebar.collapsed {
          transform: translateX(270px);
        }

        /* للغة الإنجليزية - الشريط على اليسار */
        [dir="ltr"] .sidebar {
          left: 0;
          transform: translateX(0);
        }

        [dir="ltr"] .sidebar.collapsed {
          transform: translateX(-270px);
        }

        .sidebar-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          width: 280px;
        }

        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid #4A5568;
          background: rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo i {
          font-size: 1.8rem;
          color: var(--primary-light);
        }

        .logo h2 {
          color: white;
          font-size: 1.1rem;
          margin: 0;
          font-weight: 600;
        }

        .sidebar-toggle {
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 6px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .sidebar-toggle:hover {
          background: var(--primary-dark);
          transform: scale(1.1);
        }

        /* تدوير السهم حسب اللغة والوضع */
        [dir="rtl"] .sidebar:not(.collapsed) .sidebar-toggle i {
          transform: rotate(0deg);
        }

        [dir="rtl"] .sidebar.collapsed .sidebar-toggle i {
          transform: rotate(180deg);
        }

        [dir="ltr"] .sidebar:not(.collapsed) .sidebar-toggle i {
          transform: rotate(180deg);
        }

        [dir="ltr"] .sidebar.collapsed .sidebar-toggle i {
          transform: rotate(0deg);
        }

        .sidebar-nav {
          flex: 1;
          padding: 20px 0;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px 20px;
          color: #E2E8F0;
          text-decoration: none;
          border-radius: 0;
          margin-bottom: 2px;
          transition: all 0.3s ease;
          border-right: 4px solid transparent;
          position: relative;
        }

        [dir="ltr"] .nav-item {
          border-right: none;
          border-left: 4px solid transparent;
        }

        .nav-item:hover,
        .nav-item.active {
          background: var(--primary);
          color: white;
          border-right-color: var(--secondary);
        }

        [dir="ltr"] .nav-item:hover,
        [dir="ltr"] .nav-item.active {
          border-left-color: var(--secondary);
          border-right-color: transparent;
        }

        .nav-item i {
          font-size: 1.1rem;
          width: 20px;
          text-align: center;
        }

        /* تصميم البادج للأجهزة المعلقة */
        .nav-badge {
          background: var(--danger);
          color: white;
          border-radius: 10px;
          padding: 2px 6px;
          font-size: 0.7rem;
          font-weight: 600;
          min-width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          top: 10px;
          right: 15px;
          animation: pulse-badge 2s infinite;
        }

        [dir="ltr"] .nav-badge {
          right: auto;
          left: 15px;
        }

        @keyframes pulse-badge {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        .farm-selector-section,
        .device-selector-section,
        .language-selector-section {
          padding: 15px 20px;
          border-top: 1px solid #4A5568;
        }

        .farm-selector-section label,
        .device-selector-section label,
        .language-selector-section label {
          display: block;
          margin-bottom: 8px;
          color: #E2E8F0;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .farm-select,
        .device-select,
        .lang-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #4A5568;
          border-radius: var(--border-radius);
          background: #4A5568;
          color: white;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .no-data-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: #A0AEC0;
          font-size: 0.8rem;
          justify-content: space-between;
        }

        .add-btn-small {
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 4px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.7rem;
          transition: all 0.3s ease;
        }

        .add-btn-small:hover {
          background: var(--primary-dark);
          transform: scale(1.1);
        }

        .user-section {
          padding: 15px 20px;
          border-top: 1px solid #4A5568;
          background: #2D3748;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 15px;
        }

        .user-avatar {
          width: 35px;
          height: 35px;
          background: var(--primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-avatar i {
          color: white;
          font-size: 0.9rem;
        }

        .user-details {
          flex: 1;
        }

        .user-name {
          display: block;
          color: white;
          font-weight: 500;
          font-size: 0.8rem;
          margin-bottom: 2px;
        }

        .user-email {
          display: block;
          color: #A0AEC0;
          font-size: 0.7rem;
          margin-bottom: 4px;
        }

        .user-status {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--success);
          font-size: 0.7rem;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--success);
        }

        .logout-btn {
          width: 100%;
          padding: 8px;
          font-size: 0.8rem;
          justify-content: center;
        }

        /* المحتوى الرئيسي */
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          transition: all 0.3s ease;
          position: relative;
        }

        /* للمحتوى في اللغة العربية */
        [dir="rtl"] .main-content {
          margin-left: 0;
          margin-right: 280px;
        }

        [dir="rtl"] .main-content.collapsed {
          margin-right: 0;
        }

        /* للمحتوى في اللغة الإنجليزية */
        [dir="ltr"] .main-content {
          margin-left: 280px;
          margin-right: 0;
        }

        [dir="ltr"] .main-content.collapsed {
          margin-left: 0;
        }

        .floating-toggle {
          position: fixed;
          top: 20px;
          z-index: 999;
          width: 45px;
          height: 45px;
          background: var(--primary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: var(--shadow-large);
          transition: all 0.3s ease;
        }

        /* زر العائم في اللغة العربية - الزاوية اليمنى العلوية */
        [dir="rtl"] .floating-toggle {
          right: 20px;
          left: auto;
        }

        /* زر العائم في اللغة الإنجليزية - الزاوية اليسرى العلوية */
        [dir="ltr"] .floating-toggle {
          left: 20px;
          right: auto;
        }

        .floating-toggle:hover {
          background: var(--primary-dark);
          transform: scale(1.1);
        }

        .content-wrapper {
          flex: 1;
          padding: 0 25px 25px 25px;
          overflow-y: auto;
          margin-top: 20px;
        }

        .time-info-card {
          background: var(--white-card);
          padding: 20px;
          border-radius: 12px;
          box-shadow: var(--shadow-soft);
          margin-bottom: 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
        }

        .current-time,
        .current-date,
        .user-welcome {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text-dark);
          font-weight: 500;
        }

        .current-time i,
        .current-date i,
        .user-welcome i {
          color: var(--primary);
          font-size: 1.2rem;
        }

        .current-time span {
          font-size: 1.4rem;
          font-weight: 600;
          font-family: 'Courier New', monospace;
        }

        .current-date span {
          font-size: 1rem;
        }

        .user-welcome span {
          font-size: 1rem;
        }

        .user-welcome strong {
          color: var(--primary);
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--success);
          font-weight: 600;
          padding: 8px 16px;
          background: #f0fdf4;
          border-radius: 20px;
          border: 1px solid #bbf7d0;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          background: var(--success);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 260px;
          }

          [dir="rtl"] .sidebar.collapsed {
            transform: translateX(260px);
          }

          [dir="ltr"] .sidebar.collapsed {
            transform: translateX(-260px);
          }

          [dir="rtl"] .main-content {
            margin-right: 260px;
          }

          [dir="ltr"] .main-content {
            margin-left: 260px;
          }

          .sidebar-content {
            width: 260px;
          }

          .content-wrapper {
            padding: 0 15px 15px 15px;
          }

          .time-info-card {
            flex-direction: column;
            text-align: center;
            gap: 10px;
          }

          .current-time span {
            font-size: 1.2rem;
          }
        }

        @media (max-width: 480px) {
          .sidebar {
            width: 100%;
          }

          [dir="rtl"] .sidebar.collapsed {
            transform: translateX(100%);
          }

          [dir="ltr"] .sidebar.collapsed {
            transform: translateX(-100%);
          }

          [dir="rtl"] .main-content {
            margin-right: 0;
          }

          [dir="ltr"] .main-content {
            margin-left: 0;
          }

          .content-wrapper {
            padding: 0 10px 10px 10px;
          }
        }
      `}</style>
    </div>
  );
}