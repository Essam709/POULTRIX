// pages/devices/pending.js
import React, { useState, useEffect, useContext } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import { firebaseService } from '../../../hooks/useFirebase';
import DashboardLayout from '../../../components/layout/DashboardLayout';

export default function PendingDevices() {
  const { user } = useAuth();
  const { language, loadPendingDevices, approvePendingDevice } = useApp();
  const router = useRouter();
  
  const [pendingDevices, setPendingDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const translations = {
    ar: {
      title: "الأجهزة المعلقة",
      subtitle: "إدارة الأجهزة الجديدة التي تنتظر الموافقة",
      noPendingDevices: "لا توجد أجهزة معلقة حالياً",
      deviceId: "معرف الجهاز",
      deviceName: "اسم الجهاز", 
      model: "الموديل",
      status: "الحالة",
      createdAt: "تاريخ الإنشاء",
      actions: "الإجراءات",
      approve: "موافقة",
      reject: "رفض",
      approving: "جاري الموافقة...",
      rejecting: "جاري الرفض...",
      approveSuccess: "تمت الموافقة على الجهاز بنجاح",
      rejectSuccess: "تم رفض الجهاز بنجاح",
      error: "حدث خطأ",
      backToDashboard: "العودة للوحة التحكم",
      pendingDevices: "الأجهزة المعلقة",
      waitingApproval: "بانتظار الموافقة",
      customName: "اسم مخصص",
      enterCustomName: "أدخل اسماً مخصصاً للجهاز",
      cancel: "إلغاء",
      confirmApprove: "تأكيد الموافقة",
      deviceInfo: "معلومات الجهاز",
      createdBy: "تم الإنشاء بواسطة"
    },
    en: {
      title: "Pending Devices",
      subtitle: "Manage new devices waiting for approval",
      noPendingDevices: "No pending devices at the moment",
      deviceId: "Device ID",
      deviceName: "Device Name",
      model: "Model", 
      status: "Status",
      createdAt: "Created At",
      actions: "Actions",
      approve: "Approve",
      reject: "Reject",
      approving: "Approving...",
      rejecting: "Rejecting...",
      approveSuccess: "Device approved successfully",
      rejectSuccess: "Device rejected successfully", 
      error: "Error occurred",
      backToDashboard: "Back to Dashboard",
      pendingDevices: "Pending Devices",
      waitingApproval: "Waiting Approval",
      customName: "Custom Name",
      enterCustomName: "Enter custom name for device",
      cancel: "Cancel",
      confirmApprove: "Confirm Approval",
      deviceInfo: "Device Information",
      createdBy: "Created By"
    }
  };

  const t = translations[language];

  // تحميل الأجهزة المعلقة
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const unsubscribe = loadPendingDevices((snapshot) => {
      const devicesData = snapshot.val();
      if (devicesData) {
        const devices = Object.entries(devicesData).map(([deviceId, deviceData]) => ({
          id: deviceId,
          ...deviceData
        }));
        setPendingDevices(devices);
      } else {
        setPendingDevices([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, router, loadPendingDevices]);

  // الموافقة على جهاز
  const handleApprove = async (deviceId, deviceName) => {
    setActionLoading(deviceId);
    setError('');
    setSuccess('');

    try {
      let customName = deviceName;
      
      // طلب اسم مخصص إذا لم يكن هناك اسم
      if (!customName || customName === deviceId) {
        const userInput = prompt(t.enterCustomName, deviceId);
        if (userInput === null) {
          setActionLoading(null);
          return; // المستخدم ألغى
        }
        customName = userInput.trim() || deviceId;
      }

      await approvePendingDevice(deviceId, customName);
      setSuccess(t.approveSuccess);
      
      // إزالة الجهاز من القائمة بعد الموافقة
      setPendingDevices(prev => prev.filter(device => device.id !== deviceId));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // رفض جهاز
  const handleReject = async (deviceId) => {
    setActionLoading(deviceId);
    setError('');
    setSuccess('');

    try {
      await firebaseService.rejectDevice(deviceId);
      setSuccess(t.rejectSuccess);
      
      // إزالة الجهاز من القائمة بعد الرفض
      setPendingDevices(prev => prev.filter(device => device.id !== deviceId));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <Head>
        <title>{t.title} - Smart Poultry Farm</title>
      </Head>

      <div className="pending-devices-page" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="page-header">
          <div className="header-content">
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
          <button 
            className="btn btn-secondary"
            onClick={() => router.push('/')}
          >
            <i className="fas fa-arrow-left"></i>
            {t.backToDashboard}
          </button>
        </div>

        {/* رسائل النجاح والخطأ */}
        {error && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
            <button onClick={() => setError('')} className="alert-close">
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <i className="fas fa-check-circle"></i>
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="alert-close">
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        {/* محتوى الصفحة */}
        <div className="pending-devices-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>{language === 'ar' ? 'جاري تحميل الأجهزة...' : 'Loading devices...'}</p>
            </div>
          ) : pendingDevices.length > 0 ? (
            <div className="devices-grid">
              {pendingDevices.map((device) => (
                <div key={device.id} className="device-card">
                  <div className="device-header">
                    <div className="device-icon">
                      <i className="fas fa-microchip"></i>
                    </div>
                    <div className="device-status pending">
                      <i className="fas fa-clock"></i>
                      <span>{t.waitingApproval}</span>
                    </div>
                  </div>

                  <div className="device-info">
                    <h3>{device.name || device.id}</h3>
                    
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">{t.deviceId}:</span>
                        <span className="info-value">{device.id}</span>
                      </div>
                      
                      <div className="info-item">
                        <span className="info-label">{t.model}:</span>
                        <span className="info-value">{device.model || 'N/A'}</span>
                      </div>
                      
                      {device.createdAt && (
                        <div className="info-item">
                          <span className="info-label">{t.createdAt}:</span>
                          <span className="info-value">{formatDate(device.createdAt)}</span>
                        </div>
                      )}
                      
                      {device.createdBy && (
                        <div className="info-item">
                          <span className="info-label">{t.createdBy}:</span>
                          <span className="info-value">{device.createdBy}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="device-actions">
                    <button
                      className="btn btn-success approve-btn"
                      onClick={() => handleApprove(device.id, device.name)}
                      disabled={actionLoading === device.id}
                    >
                      {actionLoading === device.id ? (
                        <>
                          <div className="loading-spinner small"></div>
                          {t.approving}
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check"></i>
                          {t.approve}
                        </>
                      )}
                    </button>
                    
                    <button
                      className="btn btn-danger reject-btn"
                      onClick={() => handleReject(device.id)}
                      disabled={actionLoading === device.id}
                    >
                      {actionLoading === device.id ? (
                        <>
                          <div className="loading-spinner small"></div>
                          {t.rejecting}
                        </>
                      ) : (
                        <>
                          <i className="fas fa-times"></i>
                          {t.reject}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="fas fa-inbox"></i>
              </div>
              <h3>{t.noPendingDevices}</h3>
              <p>
                {language === 'ar' 
                  ? 'سيظهر هنا أي جهاز جديد يطلب الإتصال بحسابك'
                  : 'Any new device requesting to connect to your account will appear here'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .pending-devices-page {
          padding: 0;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .header-content h1 {
          color: var(--text-dark);
          margin-bottom: 8px;
          font-size: 2rem;
          font-weight: 700;
        }

        .header-content p {
          color: var(--text-gray);
          margin: 0;
          font-size: 1.1rem;
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-radius: 8px;
          margin-bottom: 25px;
          position: relative;
        }

        .alert-error {
          background: #fff5f5;
          color: var(--danger);
          border: 1px solid #fed7d7;
        }

        .alert-success {
          background: #f0fdf4;
          color: var(--success);
          border: 1px solid #bbf7d0;
        }

        .alert-close {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          margin-left: auto;
          opacity: 0.7;
          transition: opacity 0.3s ease;
        }

        .alert-close:hover {
          opacity: 1;
        }

        .pending-devices-content {
          min-height: 400px;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          color: var(--text-gray);
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        .loading-spinner.small {
          width: 16px;
          height: 16px;
          border-width: 2px;
          margin-bottom: 0;
          margin-right: 8px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .devices-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .device-card {
          background: var(--white-card);
          padding: 25px;
          border-radius: 12px;
          box-shadow: var(--shadow-soft);
          border: 2px solid transparent;
          transition: all 0.3s ease;
        }

        .device-card:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-medium);
        }

        .device-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .device-icon {
          font-size: 2.5rem;
          color: var(--primary);
        }

        .device-status {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .device-status.pending {
          background: #fff7ed;
          color: #ea580c;
          border: 1px solid #fdba74;
        }

        .device-info h3 {
          color: var(--text-dark);
          margin-bottom: 15px;
          font-size: 1.3rem;
          font-weight: 600;
        }

        .info-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .info-label {
          color: var(--text-gray);
          font-size: 0.9rem;
          font-weight: 500;
        }

        .info-value {
          color: var(--text-dark);
          font-size: 0.9rem;
          font-weight: 600;
          text-align: left;
        }

        .device-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .approve-btn,
        .reject-btn {
          flex: 1;
          padding: 10px;
          font-size: 0.9rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 40px;
          text-align: center;
        }

        .empty-icon {
          font-size: 4rem;
          color: var(--text-gray);
          margin-bottom: 20px;
          opacity: 0.5;
        }

        .empty-state h3 {
          color: var(--text-dark);
          margin-bottom: 10px;
          font-size: 1.5rem;
        }

        .empty-state p {
          color: var(--text-gray);
          font-size: 1rem;
          line-height: 1.5;
          max-width: 400px;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: stretch;
          }

          .devices-grid {
            grid-template-columns: 1fr;
          }

          .device-actions {
            flex-direction: column;
          }

          .device-header {
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }

          .device-status {
            align-self: flex-start;
          }
        }

        @media (max-width: 480px) {
          .device-card {
            padding: 20px;
          }

          .info-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .empty-state {
            padding: 40px 20px;
          }

          .empty-icon {
            font-size: 3rem;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}