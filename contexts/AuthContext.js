// contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  auth,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  firebaseService
} from '../hooks/useFirebase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // دالة لتحميل بيانات المستخدم الإضافية
  const loadUserData = async (user) => {
    try {
      if (!user) {
        setUserData(null);
        return;
      }

      console.log('👤 Loading user data for:', user.uid);
      
      // الحصول على بيانات المستخدم من قاعدة البيانات
      const userInfo = await firebaseService.getData(user.uid, 'info');
      if (userInfo) {
        console.log('✅ User data loaded:', userInfo);
        setUserData(userInfo);
      } else {
        // إذا لم توجد بيانات، ننشئها
        console.log('🆕 Creating new user data');
        const userInfoData = {
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        
        await firebaseService.setData(user.uid, 'info', userInfoData);
        setUserData(userInfoData);
        console.log('✅ New user data created');
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
    }
  };

  useEffect(() => {
    // التحقق من توفر auth قبل الاشتراك
    if (!auth) {
      console.error('❌ Firebase Auth is not available');
      setLoading(false);
      return;
    }

    console.log('🔐 Initializing auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth, 
      async (user) => {
        console.log('🔄 Auth state changed:', user ? `User: ${user.uid}` : 'No user');
        setUser(user);
        
        if (user) {
          // تحميل بيانات المستخدم الإضافية
          await loadUserData(user);
        } else {
          setUserData(null);
        }
        
        setLoading(false);
      },
      (error) => {
        console.error('❌ Auth state change error:', error);
        setError(getAuthErrorMessage(error.code));
        setLoading(false);
      }
    );

    return () => {
      console.log('🧹 Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  // إنشاء بيانات المستخدم في قاعدة البيانات
  const createUserInDatabase = async (user, additionalData = {}) => {
    try {
      const userInfo = {
        name: user.displayName || additionalData.name || user.email.split('@')[0],
        email: user.email,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        ...additionalData
      };

      console.log('📝 Creating user in database:', user.uid);
      
      // إنشاء بيانات المستخدم في المسار الجديد
      await firebaseService.setData(user.uid, 'info', userInfo);
      
      // إنشاء الهيكل الأساسي للمستخدم
      await Promise.all([
        firebaseService.setData(user.uid, 'devices', {}),
        firebaseService.setData(user.uid, 'farms', {}),
        firebaseService.setData(user.uid, 'settings', {})
      ]);

      console.log('✅ User created in database successfully');
      return userInfo;
    } catch (error) {
      console.error('❌ Error creating user in database:', error);
      throw error;
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      setError('');
      setLoading(true);
      
      if (!auth) {
        throw new Error('خدمة المصادقة غير متاحة حالياً');
      }
      
      console.log('🔐 Attempting email login:', email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // تحديث وقت آخر تسجيل دخول
      if (result.user) {
        await firebaseService.updateData(result.user.uid, 'info', {
          lastLogin: new Date().toISOString()
        });
        console.log('✅ Email login successful:', result.user.uid);
      }
      
      return result;
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      console.error('❌ Email login error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signupWithEmail = async (email, password, userData = {}) => {
    try {
      setError('');
      setLoading(true);
      
      if (!auth) {
        throw new Error('خدمة المصادقة غير متاحة حالياً');
      }
      
      console.log('👤 Attempting email signup:', email);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (result.user) {
        // تحديث الاسم في Firebase Auth إذا كان موجوداً
        if (userData.name) {
          await updateProfile(result.user, { 
            displayName: userData.name 
          });
        }

        // إنشاء بيانات المستخدم في قاعدة البيانات
        await createUserInDatabase(result.user, userData);
        
        // تحميل بيانات المستخدم الجديدة
        await loadUserData(result.user);
        
        console.log('✅ Email signup successful:', result.user.uid);
      }
      
      return result;
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      console.error('❌ Email signup error:', errorMessage);
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
      
      console.log('🔐 Attempting Google login');
      const result = await signInWithPopup(auth, googleProvider);
      
      if (result.user) {
        // التحقق مما إذا كان المستخدم جديداً
        const isNewUser = result._tokenResponse?.isNewUser;
        
        if (isNewUser) {
          console.log('🆕 New Google user, creating database entry');
          // إنشاء بيانات المستخدم في قاعدة البيانات للمستخدم الجديد
          await createUserInDatabase(result.user);
        } else {
          console.log('👤 Existing Google user, updating login time');
          // تحديث وقت آخر تسجيل دخول للمستخدم الحالي
          await firebaseService.updateData(result.user.uid, 'info', {
            lastLogin: new Date().toISOString()
          });
        }
        
        // تحميل بيانات المستخدم
        await loadUserData(result.user);
        console.log('✅ Google login successful:', result.user.uid);
      }
      
      return result;
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      console.error('❌ Google login error:', errorMessage);
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
      
      console.log('🚪 Attempting logout');
      
      // تحديث وقت آخر تسجيل خروج
      if (user) {
        await firebaseService.updateData(user.uid, 'info', {
          lastLogout: new Date().toISOString()
        });
      }
      
      await signOut(auth);
      setUserData(null);
      console.log('✅ Logout successful');
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      console.error('❌ Logout error:', errorMessage);
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
      
      console.log('📧 Sending password reset email:', email);
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Password reset email sent');
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      console.error('❌ Password reset error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      setError('');
      
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      console.log('✏️ Updating user profile:', user.uid);
      
      // تحديث البيانات في Firebase Auth إذا كان هناك displayName
      if (updates.name) {
        await updateProfile(user, { displayName: updates.name });
      }

      // تحديث البيانات في قاعدة البيانات
      await firebaseService.updateData(user.uid, 'info', {
        ...updates,
        updatedAt: new Date().toISOString()
      });

      // إعادة تحميل بيانات المستخدم
      await loadUserData(user);
      
      console.log('✅ User profile updated successfully');
      
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      console.error('❌ Profile update error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
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
    userData,
    loading,
    error,
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    clearError,
    isAuthAvailable: !!auth,
    refreshUserData: () => loadUserData(user)
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