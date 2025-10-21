// components/common/EditModeBanner.js
import React, { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';

const EditModeBanner = () => {
  const { isSettingsMode, language, currentUser } = useContext(AppContext);

  const translations = {
    ar: {
      title: "🛠️ وضع التحرير الهيكلي مفعل",
      message: "يمكنك الآن إضافة، تعديل، أو حذف الوحدات الذكية",
      hint: "استخدم أزرار الإضافة والحذف التي تظهر في الوحدات",
      active: "نشط",
      device: "الجهاز",
      user: "المستخدم"
    },
    en: {
      title: "🛠️ Structural Editing Enabled",
      message: "You can now add, edit, or delete smart units",
      hint: "Use the add and delete buttons that appear on units",
      active: "Active",
      device: "Device",
      user: "User"
    }
  };

  const t = translations[language];

  if (!isSettingsMode) {
    return null;
  }

  return (
    <div className="edit-mode-banner">
      <div className="banner-content">
        <div className="banner-icon">
          <i className="fas fa-tools"></i>
        </div>
        <div className="banner-text">
          <h4>{t.title}</h4>
          <p>{t.message}</p>
          <small>{t.hint}</small>
          
          {/* معلومات إضافية للمستخدم */}
          <div className="banner-meta">
            {currentUser && (
              <span className="meta-item">
                <i className="fas fa-user"></i>
                {t.user}: {currentUser.email?.split('@')[0]}
              </span>
            )}
          </div>
        </div>
        <div className="banner-indicator">
          <div className="pulse-dot"></div>
          <span>{t.active}</span>
        </div>
      </div>

      <style jsx>{`
        .edit-mode-banner {
          background: linear-gradient(135deg, var(--primary), var(--info));
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          margin-bottom: 25px;
          box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
          animation: slideDown 0.3s ease-out;
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
        }

        .edit-mode-banner::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #4ade80, #22d3ee, #4ade80);
          background-size: 200% 100%;
          animation: shimmer 3s infinite linear;
        }

        @keyframes slideDown {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .banner-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .banner-icon {
          font-size: 2rem;
          opacity: 0.9;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-5px);
          }
          60% {
            transform: translateY(-3px);
          }
        }

        .banner-text {
          flex: 1;
        }

        .banner-text h4 {
          margin: 0 0 8px 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .banner-text p {
          margin: 0 0 4px 0;
          font-size: 0.95rem;
          opacity: 0.9;
        }

        .banner-text small {
          font-size: 0.8rem;
          opacity: 0.7;
          display: block;
          margin-bottom: 8px;
        }

        .banner-meta {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.8rem;
          opacity: 0.8;
          background: rgba(255, 255, 255, 0.1);
          padding: 4px 8px;
          border-radius: 6px;
        }

        .meta-item i {
          font-size: 0.7rem;
        }

        .banner-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #4ade80;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .edit-mode-banner {
            padding: 12px 16px;
            margin-bottom: 20px;
          }

          .banner-content {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }

          .banner-icon {
            font-size: 1.5rem;
          }

          .banner-text h4 {
            font-size: 1rem;
          }

          .banner-text p {
            font-size: 0.9rem;
          }

          .banner-meta {
            justify-content: center;
          }

          .banner-indicator {
            padding: 6px 12px;
            font-size: 0.8rem;
          }
        }

        @media (max-width: 480px) {
          .edit-mode-banner {
            padding: 10px 12px;
          }

          .banner-meta {
            flex-direction: column;
            gap: 8px;
            align-items: center;
          }

          .meta-item {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default EditModeBanner;