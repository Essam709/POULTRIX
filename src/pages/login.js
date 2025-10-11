// src/pages/login.js
import React, { useState, useContext, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../../contexts/AuthContext';
import { AppContext } from '../../contexts/AppContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { loginWithEmail, signupWithEmail, loginWithGoogle, user } = useAuth();
  const { language } = useContext(AppContext);

  // إعادة التوجيه إذا كان المستخدم مسجل الدخول بالفعل
  useEffect(() => {
    if (user) {
      window.location.href = '/';
    }
  }, [user]);

  const translations = {
    ar: {
      title: "تسجيل الدخول",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      login: "تسجيل الدخول",
      signup: "إنشاء حساب",
      googleLogin: "الدخول بحساب جوجل",
      noAccount: "ليس لديك حساب؟",
      haveAccount: "لديك حساب بالفعل؟",
      switchToSignup: "إنشاء حساب جديد",
      switchToLogin: "تسجيل الدخول",
      loading: "جاري المعالجة...",
      error: "خطأ"
    },
    en: {
      title: "Login",
      email: "Email",
      password: "Password",
      login: "Login",
      signup: "Sign Up",
      googleLogin: "Sign in with Google",
      noAccount: "Don't have an account?",
      haveAccount: "Already have an account?",
      switchToSignup: "Create new account",
      switchToLogin: "Sign in",
      loading: "Processing...",
      error: "Error"
    }
  };

  const t = translations[language];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
        // إعادة التوجيه اليدوي بعد الدخول الناجح
        window.location.href = '/';
      } else {
        await signupWithEmail(email, password);
        window.location.href = '/';
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await loginWithGoogle();
      // إعادة التوجيه اليدوي بعد الدخول الناجح
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Head>
        <title>{t.title} - Smart Poultry Farm</title>
      </Head>

      <div className="login-card">
        <div className="login-header">
          <i className="fas fa-tractor"></i>
          <h1>Smart Poultry Farm</h1>
          <h2>{isLogin ? t.login : t.signup}</h2>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <div className="input-group">
            <label>{t.email}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>{t.password}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                {t.loading}
              </>
            ) : (
              isLogin ? t.login : t.signup
            )}
          </button>
        </form>

        <div className="divider">
          <span>{language === 'ar' ? 'أو' : 'OR'}</span>
        </div>

        <button 
          className="btn btn-google"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <i className="fab fa-google"></i>
          {t.googleLogin}
        </button>

        <div className="switch-auth">
          <p>
            {isLogin ? t.noAccount : t.haveAccount}
            <button 
              type="button" 
              className="switch-btn"
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
            >
              {isLogin ? t.switchToSignup : t.switchToLogin}
            </button>
          </p>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          background: var(--soft-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .login-card {
          background: var(--white-card);
          padding: 40px;
          border-radius: 12px;
          box-shadow: var(--shadow-soft);
          width: 100%;
          max-width: 400px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .login-header i {
          font-size: 3rem;
          color: var(--primary);
          margin-bottom: 15px;
        }

        .login-header h1 {
          color: var(--text-dark);
          margin-bottom: 10px;
          font-size: 1.5rem;
        }

        .login-header h2 {
          color: var(--text-gray);
          font-size: 1.2rem;
          font-weight: normal;
        }

        .login-form {
          margin-bottom: 25px;
        }

        .error-message {
          background: #fff5f5;
          color: var(--danger);
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #fed7d7;
        }

        .input-group {
          margin-bottom: 20px;
        }

        .input-group label {
          display: block;
          margin-bottom: 8px;
          color: var(--text-dark);
          font-weight: 500;
        }

        .input-group input {
          width: 100%;
          padding: 12px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .input-group input:focus {
          outline: none;
          border-color: var(--primary);
        }

        .input-group input:disabled {
          background: #f8f9fa;
          cursor: not-allowed;
        }

        .login-btn {
          width: 100%;
          padding: 12px;
          font-size: 1rem;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-left: 8px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .divider {
          text-align: center;
          margin: 25px 0;
          position: relative;
        }

        .divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #e0e0e0;
        }

        .divider span {
          background: var(--white-card);
          padding: 0 15px;
          color: var(--text-gray);
        }

        .btn-google {
          width: 100%;
          padding: 12px;
          background: white;
          color: var(--text-dark);
          border: 1px solid #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 1rem;
        }

        .btn-google:hover {
          background: #f8f9fa;
        }

        .switch-auth {
          text-align: center;
          margin-top: 25px;
          color: var(--text-gray);
        }

        .switch-btn {
          background: none;
          border: none;
          color: var(--primary);
          cursor: pointer;
          margin-right: 5px;
          text-decoration: underline;
        }

        .switch-btn:hover {
          color: var(--primary-dark);
        }

        .switch-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}