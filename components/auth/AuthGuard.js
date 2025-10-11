// components/auth/AuthGuard.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // إذا كان المستخدم مسجل الدخول وهو في صفحة الدخول، أعد توجيهه للرئيسية
        if (router.pathname === '/login') {
          router.push('/');
        }
      } else {
        // إذا لم يكن المستخدم مسجل الدخول وهو ليس في صفحة الدخول، أعد توجيهه للدخول
        if (router.pathname !== '/login') {
          router.push('/login');
        }
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span>جاري التحميل...</span>
      </div>
    );
  }

  // إذا كان المستخدم مسجل الدخول أو كان في صفحة الدخول، اعرض المحتوى
  if (user || router.pathname === '/login') {
    return children;
  }

  // في حالات أخرى، لا تعرض شيئاً (سيتم التوجيه)
  return null;
}