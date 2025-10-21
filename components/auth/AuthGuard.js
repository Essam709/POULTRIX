// components/auth/AuthGuard.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      // الصفحات المسموح الوصول إليها بدون تسجيل دخول
      const publicPaths = ['/login', '/signup', '/reset-password'];
      const isPublicPath = publicPaths.includes(router.pathname);

      if (user) {
        // إذا كان المستخدم مسجل الدخول وهو في صفحة عامة (مثل login)، أعد توجيهه للرئيسية
        if (isPublicPath) {
          router.push('/');
        } else {
          setIsAuthorized(true);
        }
      } else {
        // إذا لم يكن المستخدم مسجل الدخول وهو ليس في صفحة عامة، أعد توجيهه للدخول
        if (!isPublicPath) {
          router.push('/login');
        } else {
          setIsAuthorized(true);
        }
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <span>جاري التحميل...</span>
        
        <style jsx>{`
          .auth-loading {
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
          
          span {
            color: var(--text-gray);
            font-size: 1rem;
          }
        `}</style>
      </div>
    );
  }

  // إذا كان المستخدم مصرحاً له، اعرض المحتوى
  if (isAuthorized) {
    return children;
  }

  // في حالات أخرى، لا تعرض شيئاً (سيتم التوجيه)
  return (
    <div className="auth-redirecting">
      <div className="redirect-message">
        <div className="loading-spinner"></div>
        <span>جاري التوجيه...</span>
      </div>
      
      <style jsx>{`
        .auth-redirecting {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: var(--soft-bg);
        }
        
        .redirect-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
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
        
        span {
          color: var(--text-gray);
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}