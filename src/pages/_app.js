// src/pages/_app.js
import { AuthProvider } from '../../contexts/AuthContext';
import { AppProvider } from '../../contexts/AppContext';
import AuthGuard from '../../components/auth/AuthGuard';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <AppProvider>
        <AuthGuard>
          <Component {...pageProps} />
        </AuthGuard>
      </AppProvider>
    </AuthProvider>
  );
}

export default MyApp;