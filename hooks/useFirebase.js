import { initializeApp } from "firebase/app";
import { 
  getDatabase, 
  ref, 
  set, 
  push, 
  remove, 
  update, 
  onValue, 
  get, 
  off,
  query,
  orderByChild,
  equalTo
} from "firebase/database";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  sendPasswordResetEmail, 
  updateProfile 
} from "firebase/auth";

// تكوين Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDa68LVBloxblkp2atr855T8sbrnM2Lgrg",
  authDomain: "essam-ce413.firebaseapp.com",
  databaseURL: "https://essam-ce413-default-rtdb.firebaseio.com",
  projectId: "essam-ce413",
  storageBucket: "essam-ce413.firebasestorage.app",
  messagingSenderId: "561073174819",
  appId: "1:561073174819:web:4ce340b5cf553d0a4e3496"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// ✅ الإصلاح: إنشاء GoogleAuthProvider
const googleProvider = new GoogleAuthProvider();

// === دوال مساعدة للمسارات ===
const getUserPath = (uid, subPath = '') => `clients/${uid}${subPath ? `/${subPath}` : ''}`;
const getDevicePath = (uid, deviceId, subPath = '') => getUserPath(uid, `devices/${deviceId}${subPath ? `/${subPath}` : ''}`);
const getPendingDevicePath = (deviceId) => `pendingDevices/${deviceId}`;
const getAuthorizedDevicePath = (deviceId) => `authorizedDevices/${deviceId}`;

// خدمة Firebase الأساسية
const firebaseService = {
  // === نظام المصادقة والمستخدمين ===
  
  // إنشاء حساب جديد
  createUserAccount: async (email, password, userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // إنشاء بيانات المستخدم في قاعدة البيانات
      await set(ref(database, getUserPath(user.uid, 'info')), {
        name: userData.name,
        email: user.email,
        createdAt: new Date().toISOString(),
        ...userData
      });
      
      return user;
    } catch (error) {
      console.error('Error creating user account:', error);
      throw error;
    }
  },

  // تحديث بيانات المستخدم
  updateUserProfile: async (uid, updates) => {
    try {
      const userRef = ref(database, getUserPath(uid, 'info'));
      await update(userRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // ✅ الإصلاح: إضافة دوال المصادقة
  signInWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  },

  // === نظام الأجهزة المعلقة ===

  // إضافة جهاز جديد قيد الانتظار
  addPendingDevice: async (deviceId, deviceData) => {
    try {
      const pendingRef = ref(database, getPendingDevicePath(deviceId));
      await set(pendingRef, {
        ...deviceData,
        status: 'waiting_approval',
        createdAt: new Date().toISOString()
      });
      return deviceId;
    } catch (error) {
      console.error('Error adding pending device:', error);
      throw error;
    }
  },

  // الموافقة على جهاز معلق
  approveDevice: async (uid, deviceId, customName = null) => {
    try {
      const pendingRef = ref(database, getPendingDevicePath(deviceId));
      const pendingSnapshot = await get(pendingRef);
      
      if (!pendingSnapshot.exists()) {
        throw new Error('Device not found in pending list');
      }

      const deviceData = pendingSnapshot.val();
      
      // نقل الجهاز إلى أجهزة المستخدم
      const userDeviceRef = ref(database, getDevicePath(uid, deviceId, 'info'));
      await set(userDeviceRef, {
        ...deviceData,
        customName: customName || deviceData.name,
        approvedAt: new Date().toISOString(),
        approvedBy: uid,
        status: 'active'
      });

      // تسجيل الجهاز في القائمة المصرح بها
      const authorizedRef = ref(database, getAuthorizedDevicePath(deviceId));
      await set(authorizedRef, {
        clientId: uid,
        approved: true,
        approvedAt: new Date().toISOString()
      });

      // حذف الجهاز من القائمة المعلقة
      await remove(pendingRef);

      return deviceId;
    } catch (error) {
      console.error('Error approving device:', error);
      throw error;
    }
  },

  // رفض جهاز معلق
  rejectDevice: async (deviceId) => {
    try {
      const pendingRef = ref(database, getPendingDevicePath(deviceId));
      await remove(pendingRef);
    } catch (error) {
      console.error('Error rejecting device:', error);
      throw error;
    }
  },

  // الحصول على الأجهزة المعلقة
  getPendingDevices: (callback, errorCallback = null) => {
    const pendingRef = ref(database, 'pendingDevices');
    const unsubscribe = onValue(pendingRef, 
      (snapshot) => {
        callback(snapshot);
      },
      (error) => {
        console.error('Error in pending devices subscription:', error);
        if (errorCallback) errorCallback(error);
      }
    );
    return () => off(pendingRef);
  },

  // الحصول على عدد الأجهزة المعلقة
  getPendingDevicesCount: (callback) => {
    const pendingRef = ref(database, 'pendingDevices');
    onValue(pendingRef, (snapshot) => {
      const data = snapshot.val();
      const count = data ? Object.keys(data).length : 0;
      callback(count);
    });
    return () => off(pendingRef);
  },

  // الحصول على أجهزة المستخدم
  getUserDevices: (uid, callback, errorCallback = null) => {
    const devicesRef = ref(database, getUserPath(uid, 'devices'));
    const unsubscribe = onValue(devicesRef, 
      (snapshot) => {
        console.log('📱 getUserDevices snapshot:', snapshot.val());
        callback(snapshot);
      },
      (error) => {
        console.error('Error in user devices subscription:', error);
        if (errorCallback) errorCallback(error);
      }
    );
    return () => off(devicesRef);
  },

  // === البيانات في الوقت الحقيقي ===
  listenToData: (uid, path, callback, errorCallback = null) => {
    const dataRef = ref(database, getUserPath(uid, path));
    const unsubscribe = onValue(dataRef, 
      (snapshot) => {
        console.log('📊 listenToData snapshot:', { path, data: snapshot.val() });
        callback(snapshot);
      },
      (error) => {
        console.error('Error in data subscription:', error);
        if (errorCallback) errorCallback(error);
      }
    );
    return () => off(dataRef);
  },

  // === بيانات المستشعرات في الوقت الحقيقي ===
  listenToSensorData: (uid, deviceId, sensorType, callback, errorCallback = null) => {
    const sensorRef = ref(database, getDevicePath(uid, deviceId, `sensors/${sensorType}`));
    const unsubscribe = onValue(sensorRef, 
      (snapshot) => {
        console.log('🎯 Sensor data received:', { sensorType, data: snapshot.val() });
        callback(snapshot);
      },
      (error) => {
        console.error('Error in sensor data subscription:', error);
        if (errorCallback) errorCallback(error);
      }
    );
    return () => off(sensorRef);
  },

  // === البيانات التاريخية ===
  listenToHistoricalData: (uid, deviceId, sensorType, callback, errorCallback = null) => {
    const historyRef = ref(database, getDevicePath(uid, deviceId, `history/${sensorType}`));
    const unsubscribe = onValue(historyRef, 
      (snapshot) => {
        callback(snapshot);
      },
      (error) => {
        console.error('Error in historical data subscription:', error);
        if (errorCallback) errorCallback(error);
      }
    );
    return () => off(historyRef);
  },

  // === الحصول على بيانات مرة واحدة ===
  getData: async (uid, path) => {
    const dataRef = ref(database, getUserPath(uid, path));
    const snapshot = await get(dataRef);
    return snapshot.val();
  },

  // === تعيين بيانات ===
  setData: async (uid, path, data) => {
    const dataRef = ref(database, getUserPath(uid, path));
    await set(dataRef, data);
  },

  // === تحديث بيانات ===
  updateData: async (uid, path, updates) => {
    const dataRef = ref(database, getUserPath(uid, path));
    await update(dataRef, updates);
  },

  // === إضافة بيانات جديدة ===
  pushData: async (uid, path, data) => {
    const dataRef = ref(database, getUserPath(uid, path));
    const result = await push(dataRef, data);
    return result.key;
  },

  // === حذف بيانات ===
  removeData: async (uid, path) => {
    const dataRef = ref(database, getUserPath(uid, path));
    await remove(dataRef);
  },

  // === التحقق من اتصال Firebase ===
  isConnected: (callback) => {
    const connectedRef = ref(database, '.info/connected');
    onValue(connectedRef, (snapshot) => {
      callback(snapshot.val() === true);
    });
    return () => off(connectedRef);
  },

  // === نظام المزارع الجديد ===
  
  // التحقق من ترخيص الجهاز
  checkDeviceAuthorization: async (deviceId) => {
    try {
      const authDeviceRef = ref(database, getAuthorizedDevicePath(deviceId));
      const snapshot = await get(authDeviceRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Error checking device authorization:', error);
      return null;
    }
  },

  // التحقق من وجود بيانات الجهاز للمستخدم الحالي
  checkUserDevice: async (uid, deviceId) => {
    try {
      const deviceRef = ref(database, getDevicePath(uid, deviceId));
      const snapshot = await get(deviceRef);
      return snapshot.exists();
    } catch (error) {
      console.error('Error checking user device:', error);
      return false;
    }
  },

  // الحصول على معلومات المزرعة
  getFarmInfo: async (uid, deviceId) => {
    try {
      const [deviceSnapshot, authSnapshot] = await Promise.all([
        get(ref(database, getDevicePath(uid, deviceId))),
        get(ref(database, getAuthorizedDevicePath(deviceId)))
      ]);

      return {
        isAuthorized: authSnapshot.exists() && authSnapshot.val().clientId === uid,
        hasData: deviceSnapshot.exists(),
        data: deviceSnapshot.val(),
        authorization: authSnapshot.val()
      };
    } catch (error) {
      console.error('Error getting farm info:', error);
      return { isAuthorized: false, hasData: false, data: null, authorization: null };
    }
  },

  // === نظام الوحدات الذكية ===

  // 🔥 الإصلاح الرئيسي: الحصول على وحدات الجهاز
  getDeviceUnits: (uid, deviceId, callback, errorCallback = null) => {
    console.log('🔄 getDeviceUnits called:', { uid, deviceId });
    
    const unitsRef = ref(database, getDevicePath(uid, deviceId, 'units'));
    console.log('📡 Units path:', getDevicePath(uid, deviceId, 'units'));
    
    const unsubscribe = onValue(unitsRef, 
      (snapshot) => {
        const data = snapshot.val();
        console.log('📥 Units data received:', data);
        console.log('🔢 Number of units:', data ? Object.keys(data).length : 0);
        callback(snapshot);
      },
      (error) => {
        console.error('❌ Error in units subscription:', error);
        if (errorCallback) errorCallback(error);
      }
    );
    
    return () => {
      console.log('🧹 Unsubscribing from units');
      off(unitsRef);
    };
  },

  // 🔥 الإصلاح الرئيسي: إضافة وحدة جديدة
  addUnit: async (uid, deviceId, unitId, unitData) => {
    try {
      console.log('🆕 Adding unit:', { uid, deviceId, unitId, unitData });
      
      const unitPath = getDevicePath(uid, deviceId, `units/${unitId}`);
      console.log('📁 Unit path:', unitPath);
      
      const unitRef = ref(database, unitPath);
      await set(unitRef, unitData);
      
      console.log('✅ Unit added successfully to Firebase');
      
      // ✅ الإضافة: التحقق من أن البيانات مخزنة بالاستعلام مرة أخرى
      const verifyRef = ref(database, unitPath);
      const snapshot = await get(verifyRef);
      console.log('🔍 Verification - Unit exists:', snapshot.exists());
      console.log('🔍 Verification - Unit data:', snapshot.val());
      
      // ✅ الإضافة: التحقق من أن الوحدة موجودة في قائمة الوحدات
      const unitsListRef = ref(database, getDevicePath(uid, deviceId, 'units'));
      const unitsSnapshot = await get(unitsListRef);
      console.log('📋 All units after addition:', unitsSnapshot.val());
      
      return unitId;
    } catch (error) {
      console.error('❌ Error adding unit:', error);
      console.error('🔧 Error details:', error.message);
      console.error('🔧 Error stack:', error.stack);
      throw error;
    }
  },

  // تحديث وحدة
  updateUnit: async (uid, deviceId, unitId, updates) => {
    try {
      console.log('✏️ Updating unit:', { uid, deviceId, unitId, updates });
      
      const unitRef = ref(database, getDevicePath(uid, deviceId, `units/${unitId}`));
      await update(unitRef, updates);
      
      console.log('✅ Unit updated successfully');
    } catch (error) {
      console.error('❌ Error updating unit:', error);
      throw error;
    }
  },

  // حذف وحدة
  deleteUnit: async (uid, deviceId, unitId) => {
    try {
      console.log('🗑️ Deleting unit:', { uid, deviceId, unitId });
      
      const unitRef = ref(database, getDevicePath(uid, deviceId, `units/${unitId}`));
      await remove(unitRef);
      
      console.log('✅ Unit deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting unit:', error);
      throw error;
    }
  },

  // الحصول على إعدادات الوحدة
  getUnitSettings: async (uid, deviceId, unitId) => {
    try {
      const unitRef = ref(database, getDevicePath(uid, deviceId, `units/${unitId}`));
      const snapshot = await get(unitRef);
      return snapshot.val();
    } catch (error) {
      console.error('Error getting unit settings:', error);
      throw error;
    }
  },

  // ✅ الإضافة: دالة الحصول على مرجع مباشر
  getRef: (path) => {
    return ref(database, path);
  },

  // ✅ الإضافة: دالة الحصول على البيانات مرة واحدة
  get: (ref) => {
    return get(ref);
  },

  // === نظام الأتمتة ===
  updateAutomation: async (uid, deviceId, automationType, settings) => {
    try {
      const automationRef = ref(database, getDevicePath(uid, deviceId, `automation/${automationType}`));
      await update(automationRef, {
        ...settings,
        lastUpdate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating automation:', error);
      throw error;
    }
  },

  // === نظام التنبيهات ===
  addAlert: async (uid, deviceId, alertData) => {
    try {
      const alertsRef = ref(database, getDevicePath(uid, deviceId, 'alerts'));
      const newAlertRef = push(alertsRef);
      await set(newAlertRef, {
        ...alertData,
        timestamp: new Date().toISOString(),
        id: newAlertRef.key
      });
      return newAlertRef.key;
    } catch (error) {
      console.error('Error adding alert:', error);
      throw error;
    }
  },

  // تحديث حالة التنبيه
  updateAlertStatus: async (uid, deviceId, alertId, status) => {
    try {
      const alertRef = ref(database, getDevicePath(uid, deviceId, `alerts/${alertId}`));
      await update(alertRef, { 
        status,
        resolvedAt: status === 'resolved' ? new Date().toISOString() : null
      });
    } catch (error) {
      console.error('Error updating alert:', error);
      throw error;
    }
  },

  // === نظام التقارير والإحصائيات ===
  getDeviceStats: async (uid, deviceId, timeRange = '24h') => {
    try {
      const statsRef = ref(database, getDevicePath(uid, deviceId, 'stats'));
      const snapshot = await get(statsRef);
      const stats = snapshot.val() || {};
      return this.filterStatsByTimeRange(stats, timeRange);
    } catch (error) {
      console.error('Error getting device stats:', error);
      throw error;
    }
  },

  // تصفية الإحصائيات حسب النطاق الزمني
  filterStatsByTimeRange: (stats, timeRange) => {
    const now = Date.now();
    let timeLimit;

    switch (timeRange) {
      case '1h':
        timeLimit = now - (60 * 60 * 1000);
        break;
      case '6h':
        timeLimit = now - (6 * 60 * 60 * 1000);
        break;
      case '24h':
        timeLimit = now - (24 * 60 * 60 * 1000);
        break;
      case '7d':
        timeLimit = now - (7 * 24 * 60 * 60 * 1000);
        break;
      default:
        timeLimit = now - (24 * 60 * 60 * 1000);
    }

    const filteredStats = {};
    Object.keys(stats).forEach(key => {
      if (stats[key].timestamp >= timeLimit) {
        filteredStats[key] = stats[key];
      }
    });

    return filteredStats;
  },

  // === دوال مساعدة ===
  cleanupOldData: async (uid, deviceId, olderThanDays = 30) => {
    try {
      const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
      
      const historyRef = ref(database, getDevicePath(uid, deviceId, 'history'));
      const historySnapshot = await get(historyRef);
      const historyData = historySnapshot.val() || {};

      const cleanupPromises = [];

      Object.keys(historyData).forEach(sensorType => {
        Object.keys(historyData[sensorType]).forEach(timestamp => {
          if (parseInt(timestamp) < cutoffTime) {
            const dataRef = ref(database, getDevicePath(uid, deviceId, `history/${sensorType}/${timestamp}`));
            cleanupPromises.push(remove(dataRef));
          }
        });
      });

      await Promise.all(cleanupPromises);
      console.log(`Cleaned up old data for device ${deviceId}`);
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      throw error;
    }
  },

  // نسخ إحتياطي للبيانات
  backupData: async (uid, deviceId, backupPath) => {
    try {
      const deviceRef = ref(database, getDevicePath(uid, deviceId));
      const snapshot = await get(deviceRef);
      const data = snapshot.val();

      const backupRef = ref(database, `${backupPath}/${deviceId}_${Date.now()}`);
      await set(backupRef, data);

      return backupRef.key;
    } catch (error) {
      console.error('Error backing up data:', error);
      throw error;
    }
  },

  // =============================================
  // 🔥 نظام مراقبة حالة الأجهزة - الإضافات الجديدة
  // =============================================

  // 🔥 مراقبة حالة الجهاز في الوقت الحقيقي
  listenToDeviceConnectivity: (uid, deviceId, callback, errorCallback = null) => {
    console.log('📡 [CONNECTIVITY] Setting up connectivity listener for:', deviceId);
    
    const connectivityRef = ref(database, getDevicePath(uid, deviceId, 'connectivity'));
    console.log('📍 Connectivity path:', getDevicePath(uid, deviceId, 'connectivity'));
    
    const unsubscribe = onValue(connectivityRef, 
      (snapshot) => {
        const data = snapshot.val();
        console.log('✅ [CONNECTIVITY] Update received:', { deviceId, data });
        
        // حساب إذا كان الجهاز متصل (آخر تحديث منذ أقل من دقيقة)
        const isConnected = data && data.lastSeen ? 
          (Date.now() - new Date(data.lastSeen).getTime()) < 60000 : false;
        
        callback({
          isConnected,
          lastSeen: data?.lastSeen || null,
          status: isConnected ? 'online' : 'offline',
          timestamp: new Date().toISOString()
        });
      },
      (error) => {
        console.error('❌ [CONNECTIVITY] Listener error:', error);
        if (errorCallback) errorCallback(error);
      }
    );
    
    return () => {
      console.log('🧹 [CONNECTIVITY] Unsubscribing');
      off(connectivityRef);
    };
  },

  // 🔥 تحديث حالة الاتصال (للاستخدام من ESP32)
  updateDeviceConnectivity: async (uid, deviceId) => {
    try {
      const connectivityRef = ref(database, getDevicePath(uid, deviceId, 'connectivity'));
      const updateData = {
        lastSeen: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        status: 'online'
      };
      
      await update(connectivityRef, updateData);
      console.log('✅ [CONNECTIVITY] Status updated');
      
      return updateData;
    } catch (error) {
      console.error('❌ [CONNECTIVITY] Update error:', error);
      throw error;
    }
  },

  // 🔥 الحصول على حالة الاتصال الحالية
  getDeviceConnectivity: async (uid, deviceId) => {
    try {
      const connectivityRef = ref(database, getDevicePath(uid, deviceId, 'connectivity'));
      const snapshot = await get(connectivityRef);
      const data = snapshot.val();
      
      console.log('🔍 [CONNECTIVITY] Raw data from Firebase:', { deviceId, data });
      
      if (!data || !data.lastSeen) {
        return { isConnected: false, lastSeen: null, status: 'offline' };
      }
      
      const lastSeenTime = new Date(data.lastSeen).getTime();
      const currentTime = Date.now();
      const timeDiff = currentTime - lastSeenTime;
      const isConnected = timeDiff < 60000; // 60 ثانية
      
      console.log('⏱️ [CONNECTIVITY] Time calculation:', {
        lastSeen: data.lastSeen,
        lastSeenTime,
        currentTime,
        timeDiff,
        isConnected
      });
      
      return {
        isConnected,
        lastSeen: data.lastSeen,
        status: isConnected ? 'online' : 'offline',
        lastUpdate: data.lastUpdate,
        minutesSinceLastSeen: Math.floor(timeDiff / 60000)
      };
    } catch (error) {
      console.error('❌ [CONNECTIVITY] Fetch error:', error);
      return { isConnected: false, lastSeen: null, status: 'error' };
    }
  },

  // 🔥 مراقبة حالة جميع أجهزة المستخدم
  listenToAllDevicesConnectivity: (uid, deviceIds, callback, errorCallback = null) => {
    console.log('📡 [ALL DEVICES] Setting up connectivity for all devices:', deviceIds);
    
    const unsubscribers = deviceIds.map(deviceId => {
      return this.listenToDeviceConnectivity(
        uid,
        deviceId,
        (status) => {
          callback(deviceId, status);
        },
        errorCallback
      );
    });
    
    return () => {
      console.log('🧹 [ALL DEVICES] Unsubscribing from all devices');
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }
};

// ✅ الإصلاح: تصدير GoogleAuthProvider المُنشأ
export { 
  app, 
  database, 
  auth, 
  googleProvider,
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  getUserPath, 
  getDevicePath, 
  getPendingDevicePath, 
  getAuthorizedDevicePath,
  firebaseService 
};

export default firebaseService;