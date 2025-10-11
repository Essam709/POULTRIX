// src/pages/_app.js
import { AppProvider } from '../../contexts/AppContext';
import { AuthProvider } from '../../contexts/AuthContext';
import AuthGuard from '../../components/auth/AuthGuard';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <AppProvider>
      <AuthProvider>
        <AuthGuard>
          <Component {...pageProps} />
        </AuthGuard>
      </AuthProvider>
    </AppProvider>
  );
}

export default MyApp;