// src/pages/login.js
import React, { useState, useContext, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { AppContext } from '../../contexts/AppContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot-password'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { 
    loginWithEmail, 
    signupWithEmail, 
    loginWithGoogle, 
    resetPassword,
    user, 
    userData 
  } = useAuth();
  
  const { language } = useContext(AppContext);
  const router = useRouter();

  // إعادة التوجيه إذا كان المستخدم مسجل الدخول بالفعل
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const translations = {
    ar: {
      // النصوص الحالية
      title: "تسجيل الدخول",
      email: "البريد الإلكتروني",
      password: "كلمة المرور", 
      name: "الاسم الكامل",
      login: "تسجيل الدخول",
      signup: "إنشاء حساب",
      googleLogin: "الدخول بحساب جوجل",
      noAccount: "ليس لديك حساب؟",
      haveAccount: "لديك حساب بالفعل؟", 
      switchToSignup: "إنشاء حساب جديد",
      switchToLogin: "تسجيل الدخول",
      loading: "جاري المعالجة...",
      error: "خطأ",
      welcomeBack: "مرحباً بعودتك!",
      createAccount: "أنشئ حسابك الآن",
      farmManagement: "نظام إدارة المزارع الذكية",
      passwordRequirements: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
      nameRequired: "الاسم مطلوب",
      emailRequired: "البريد الإلكتروني مطلوب",
      
      // نصوص جديدة لنسيت كلمة المرور
      forgotPassword: "نسيت كلمة المرور؟",
      resetPassword: "إعادة تعيين كلمة المرور", 
      resetInstructions: "أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور",
      backToLogin: "العودة لتسجيل الدخول",
      resetSuccess: "تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني",
      sendResetLink: "إرسال رابط الإعادة"
    },
    en: {
      // Existing texts
      title: "Login",
      email: "Email",
      password: "Password",
      name: "Full Name", 
      login: "Login",
      signup: "Sign Up",
      googleLogin: "Sign in with Google",
      noAccount: "Don't have an account?",
      haveAccount: "Already have an account?",
      switchToSignup: "Create new account",
      switchToLogin: "Sign in", 
      loading: "Processing...",
      error: "Error",
      welcomeBack: "Welcome Back!",
      createAccount: "Create Your Account",
      farmManagement: "Smart Farm Management System",
      passwordRequirements: "Password must be at least 6 characters",
      nameRequired: "Name is required",
      emailRequired: "Email is required",
      
      // New texts for forgot password
      forgotPassword: "Forgot Password?",
      resetPassword: "Reset Password",
      resetInstructions: "Enter your email and we'll send you a reset link",
      backToLogin: "Back to Login", 
      resetSuccess: "Reset link has been sent to your email",
      sendResetLink: "Send Reset Link"
    }
  };

  const t = translations[language];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    // التحقق من صحة البيانات
    if (!email) {
      setError(t.emailRequired);
      setLoading(false);
      return;
    }

    if (mode === 'register' && !name) {
      setError(t.nameRequired);
      setLoading(false);
      return;
    }

    if ((mode === 'login' || mode === 'register') && !password) {
      setError('كلمة المرور مطلوبة');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else if (mode === 'register') {
        await signupWithEmail(email, password, { name });
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
    setSuccessMessage('');

    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError(t.emailRequired);
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await resetPassword(email);
      setSuccessMessage(t.resetSuccess);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
    setSuccessMessage('');
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetForm();
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'login': return t.welcomeBack;
      case 'register': return t.createAccount;
      case 'forgot-password': return t.resetPassword;
      default: return t.welcomeBack;
    }
  };

  const getModeDescription = () => {
    switch (mode) {
      case 'login': 
        return language === 'ar' ? 'سجل دخولك للمتابعة' : 'Sign in to continue';
      case 'register':
        return language === 'ar' ? 'أنشئ حسابك لبدء الاستخدام' : 'Create your account to get started';
      case 'forgot-password':
        return t.resetInstructions;
      default: 
        return language === 'ar' ? 'سجل دخولك للمتابعة' : 'Sign in to continue';
    }
  };

  return (
    <div className="login-container" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Head>
        <title>
          {mode === 'login' ? t.login : 
           mode === 'register' ? t.signup : 
           t.resetPassword} - Smart Poultry Farm
        </title>
      </Head>

      <div className="login-wrapper">
        {/* الجزء الأيسر - الصورة والشعار */}
        <div className="login-hero">
          <div className="hero-content">
            <div className="logo">
              <i className="fas fa-tractor"></i>
              <h1>Smart Poultry Farm</h1>
            </div>
            <h2>{t.farmManagement}</h2>
            <p className="hero-description">
              {language === 'ar' 
                ? 'نظام متكامل لإدارة مزارع الدواجن الذكية باستخدام أحدث التقنيات'
                : 'Integrated system for smart poultry farm management using latest technologies'
              }
            </p>
            <div className="features">
              <div className="feature">
                <i className="fas fa-microchip"></i>
                <span>{language === 'ar' ? 'مراقبة ذكية' : 'Smart Monitoring'}</span>
              </div>
              <div className="feature">
                <i className="fas fa-robot"></i>
                <span>{language === 'ar' ? 'أتمتة متكاملة' : 'Integrated Automation'}</span>
              </div>
              <div className="feature">
                <i className="fas fa-chart-line"></i>
                <span>{language === 'ar' ? 'تقارير مفصلة' : 'Detailed Reports'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* الجزء الأيمن - نموذج المصادقة */}
        <div className="login-card">
          <div className="login-header">
            <h2>{getModeTitle()}</h2>
            <p>{getModeDescription()}</p>
          </div>

          {/* رسائل النجاح والخطأ */}
          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="success-message">
              <i className="fas fa-check-circle"></i>
              <span>{successMessage}</span>
            </div>
          )}

          {/* نموذج تسجيل الدخول */}
          {(mode === 'login' || mode === 'register') && (
            <form onSubmit={handleSubmit} className="login-form">
              {mode === 'register' && (
                <div className="input-group">
                  <label htmlFor="name">{t.name}</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={mode === 'register'}
                    disabled={loading}
                    placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                  />
                </div>
              )}

              <div className="input-group">
                <label htmlFor="email">{t.email}</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder={language === 'ar' ? 'example@email.com' : 'example@email.com'}
                />
              </div>

              {mode !== 'forgot-password' && (
                <div className="input-group">
                  <label htmlFor="password">{t.password}</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={mode !== 'forgot-password'}
                    disabled={loading}
                    minLength={6}
                    placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
                  />
                  {mode === 'register' && (
                    <small className="password-hint">{t.passwordRequirements}</small>
                  )}
                </div>
              )}

              {/* رابط نسيت كلمة المرور (في وضع login فقط) */}
              {mode === 'login' && (
                <div className="forgot-password-link">
                  <button 
                    type="button"
                    className="forgot-btn"
                    onClick={() => switchMode('forgot-password')}
                    disabled={loading}
                  >
                    {t.forgotPassword}
                  </button>
                </div>
              )}

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
                  mode === 'login' ? t.login : t.signup
                )}
              </button>
            </form>
          )}

          {/* نموذج نسيت كلمة المرور */}
          {mode === 'forgot-password' && (
            <div className="forgot-password-form">
              <div className="input-group">
                <label htmlFor="forgot-email">{t.email}</label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder={language === 'ar' ? 'example@email.com' : 'example@email.com'}
                />
              </div>

              <button 
                className="btn btn-primary login-btn"
                onClick={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    {t.loading}
                  </>
                ) : (
                  t.sendResetLink
                )}
              </button>

              <button 
                type="button"
                className="btn btn-secondary back-btn"
                onClick={() => switchMode('login')}
                disabled={loading}
              >
                {t.backToLogin}
              </button>
            </div>
          )}

          {/* زر جوجل (في وضعي login و register فقط) */}
          {(mode === 'login' || mode === 'register') && (
            <>
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
            </>
          )}

          {/* روابط التبديل بين الأنماط */}
          <div className="switch-auth">
            {mode === 'login' && (
              <p>
                {t.noAccount}
                <button 
                  type="button" 
                  className="switch-btn"
                  onClick={() => switchMode('register')}
                  disabled={loading}
                >
                  {t.switchToSignup}
                </button>
              </p>
            )}

            {mode === 'register' && (
              <p>
                {t.haveAccount}
                <button 
                  type="button" 
                  className="switch-btn"
                  onClick={() => switchMode('login')}
                  disabled={loading}
                >
                  {t.switchToLogin}
                </button>
              </p>
            )}
          </div>
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

        .login-wrapper {
          display: flex;
          max-width: 1000px;
          width: 100%;
          background: var(--white-card);
          border-radius: 16px;
          box-shadow: var(--shadow-soft);
          overflow: hidden;
          min-height: 600px;
        }

        .login-hero {
          flex: 1;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          color: white;
          padding: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-content {
          text-align: center;
          max-width: 400px;
        }

        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin-bottom: 30px;
        }

        .logo i {
          font-size: 3rem;
        }

        .logo h1 {
          font-size: 1.8rem;
          margin: 0;
          color: white;
        }

        .hero-content h2 {
          font-size: 1.4rem;
          margin-bottom: 20px;
          font-weight: 600;
        }

        .hero-description {
          font-size: 1rem;
          margin-bottom: 30px;
          line-height: 1.6;
          opacity: 0.9;
        }

        .features {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1rem;
        }

        .feature i {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.9);
        }

        .login-card {
          flex: 1;
          padding: 50px 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          max-width: 400px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .login-header h2 {
          color: var(--text-dark);
          margin-bottom: 10px;
          font-size: 1.8rem;
          font-weight: 700;
        }

        .login-header p {
          color: var(--text-gray);
          font-size: 1rem;
          line-height: 1.5;
        }

        .login-form {
          margin-bottom: 20px;
        }

        .forgot-password-form {
          margin-bottom: 20px;
        }

        .error-message {
          background: #fff5f5;
          color: var(--danger);
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #fed7d7;
          font-size: 0.9rem;
        }

        .success-message {
          background: #f0fdf4;
          color: var(--success);
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #bbf7d0;
          font-size: 0.9rem;
        }

        .input-group {
          margin-bottom: 20px;
        }

        .input-group label {
          display: block;
          margin-bottom: 8px;
          color: var(--text-dark);
          font-weight: 600;
          font-size: 0.9rem;
        }

        .input-group input {
          width: 100%;
          padding: 14px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: #fafafa;
        }

        .input-group input:focus {
          outline: none;
          border-color: var(--primary);
          background: white;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .input-group input:disabled {
          background: #f8f9fa;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .password-hint {
          display: block;
          margin-top: 5px;
          color: var(--text-gray);
          font-size: 0.8rem;
        }

        .forgot-password-link {
          text-align: center;
          margin-bottom: 20px;
        }

        .forgot-btn {
          background: none;
          border: none;
          color: var(--primary);
          cursor: pointer;
          font-size: 0.9rem;
          text-decoration: underline;
        }

        .forgot-btn:hover {
          color: var(--primary-dark);
        }

        .forgot-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-btn {
          width: 100%;
          padding: 14px;
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 15px;
        }

        .back-btn {
          width: 100%;
          padding: 12px;
          font-size: 1rem;
          background: var(--text-gray);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .back-btn:hover {
          background: #5a6268;
        }

        .loading-spinner {
          width: 18px;
          height: 18px;
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
          margin: 20px 0;
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
          font-size: 0.9rem;
        }

        .btn-google {
          width: 100%;
          padding: 14px;
          background: white;
          color: var(--text-dark);
          border: 2px solid #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.3s ease;
          margin-bottom: 25px;
        }

        .btn-google:hover {
          background: #f8f9fa;
          border-color: #d0d0d0;
        }

        .btn-google:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .switch-auth {
          text-align: center;
          color: var(--text-gray);
          font-size: 0.9rem;
        }

        .switch-btn {
          background: none;
          border: none;
          color: var(--primary);
          cursor: pointer;
          margin-right: 5px;
          font-weight: 600;
          text-decoration: underline;
          font-size: 0.9rem;
        }

        .switch-btn:hover {
          color: var(--primary-dark);
        }

        .switch-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .login-wrapper {
            flex-direction: column;
            min-height: auto;
          }

          .login-hero {
            padding: 30px 20px;
            display: none;
          }

          .login-card {
            padding: 30px 20px;
            max-width: none;
          }

          .logo h1 {
            font-size: 1.5rem;
          }

          .hero-content h2 {
            font-size: 1.2rem;
          }
        }

        @media (max-width: 480px) {
          .login-container {
            padding: 10px;
          }

          .login-card {
            padding: 25px 15px;
          }

          .login-header h2 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}