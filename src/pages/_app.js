// src/pages/_app.js
import { AuthProvider } from '../../contexts/AuthContext';
import { AppProvider } from '../../contexts/AppContext';
import AuthGuard from '../../components/auth/AuthGuard';
import GlobalNotifications from '../../components/GlobalNotifications';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <AppProvider>
        <AuthGuard>
          {/* 🔥 تحسين: إضافة هيكل الصفحة الرئيسي */}
          <div className="app-container">
            <Component {...pageProps} />
          </div>
          
          {/* 🔥 تحسين: إشعارات عالمية خارج هيكل الصفحة الرئيسي */}
          <GlobalNotifications />
        </AuthGuard>
      </AppProvider>
    </AuthProvider>
  );
}

export default MyApp;