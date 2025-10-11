// contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  auth,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from '../hooks/useFirebase';

const googleProvider = new GoogleAuthProvider();
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // التحقق من توفر auth قبل الاشتراك
    if (!auth) {
      console.error('Firebase Auth is not available');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, 
      (user) => {
        setUser(user);
        setLoading(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setError(getAuthErrorMessage(error.code));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email, password) => {
    try {
      setError('');
      setLoading(true);
      
      if (!auth) {
        throw new Error('خدمة المصادقة غير متاحة حالياً');
      }
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signupWithEmail = async (email, password, displayName) => {
    try {
      setError('');
      setLoading(true);
      
      if (!auth) {
        throw new Error('خدمة المصادقة غير متاحة حالياً');
      }
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
      }
      
      return result;
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setError('');
      setLoading(true);
      
      if (!auth) {
        throw new Error('خدمة المصادقة غير متاحة حالياً');
      }
      
      const result = await signInWithPopup(auth, googleProvider);
      return result;
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError('');
      
      if (!auth) {
        throw new Error('خدمة المصادقة غير متاحة حالياً');
      }
      
      await signOut(auth);
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const resetPassword = async (email) => {
    try {
      setError('');
      setLoading(true);
      
      if (!auth) {
        throw new Error('خدمة المصادقة غير متاحة حالياً');
      }
      
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError('');
  };

  const getAuthErrorMessage = (errorCode) => {
    const messages = {
      'auth/invalid-email': 'البريد الإلكتروني غير صحيح',
      'auth/user-disabled': 'هذا الحساب معطل',
      'auth/user-not-found': 'لم يتم العثور على حساب بهذا البريد الإلكتروني',
      'auth/wrong-password': 'كلمة المرور غير صحيحة',
      'auth/email-already-in-use': 'هذا البريد الإلكتروني مستخدم بالفعل',
      'auth/weak-password': 'كلمة المرور ضعيفة، يجب أن تكون 6 أحرف على الأقل',
      'auth/network-request-failed': 'خطأ في الشبكة، يرجى المحاولة مرة أخرى',
      'auth/too-many-requests': 'محاولات تسجيل دخول كثيرة، يرجى المحاولة لاحقاً',
      'auth/operation-not-allowed': 'طريقة التسجيل هذه غير مسموحة',
      'auth/popup-closed-by-user': 'تم إغلاق نافذة التسجيل',
      'auth/popup-blocked': 'تم حظر نافذة التسجيل، يرجى السماح بالنوافذ المنبثقة',
      'app/no-app': 'خطأ في تهيئة النظام، يرجى إعادة تحميل الصفحة'
    };
    
    const englishMessages = {
      'auth/invalid-email': 'Invalid email address',
      'auth/user-disabled': 'This account has been disabled',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/email-already-in-use': 'Email already in use',
      'auth/weak-password': 'Password is too weak, must be at least 6 characters',
      'auth/network-request-failed': 'Network error, please try again',
      'auth/too-many-requests': 'Too many login attempts, please try again later',
      'auth/operation-not-allowed': 'This sign-in method is not allowed',
      'auth/popup-closed-by-user': 'Sign-in window was closed',
      'auth/popup-blocked': 'Sign-in window was blocked, please allow popups',
      'app/no-app': 'System initialization error, please reload the page'
    };

    const userLanguage = navigator.language.startsWith('ar') ? 'ar' : 'en';
    const messageMap = userLanguage === 'ar' ? messages : englishMessages;
    
    return messageMap[errorCode] || (userLanguage === 'ar' 
      ? 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى' 
      : 'An unexpected error occurred, please try again');
  };

  const value = {
    user,
    loading,
    error,
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    logout,
    resetPassword,
    clearError,
    isAuthAvailable: !!auth
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};