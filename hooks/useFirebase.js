// hooks/useFirebase.js
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

// خدمة Firebase الأساسية
const firebaseService = {
  // === البيانات في الوقت الحقيقي ===
  listenToData: (path, callback) => {
    const dataRef = ref(database, path);
    onValue(dataRef, (snapshot) => {
      callback(snapshot);
    });
    return () => off(dataRef);
  },

  // === البيانات التاريخية ===
  listenToHistoricalData: (deviceId, sensorType, callback) => {
    const historyRef = ref(database, `devices/${deviceId}/history/${sensorType}`);
    onValue(historyRef, (snapshot) => {
      callback(snapshot);
    });
    return () => off(historyRef);
  },

  // === بيانات المستشعرات في الوقت الحقيقي ===
  listenToSensorData: (deviceId, sensorType, callback) => {
    const sensorRef = ref(database, `devices/${deviceId}/sensors/${sensorType}`);
    onValue(sensorRef, (snapshot) => {
      callback(snapshot);
    });
    return () => off(sensorRef);
  },

  // === الحصول على بيانات مرة واحدة ===
  getData: async (path) => {
    const dataRef = ref(database, path);
    const snapshot = await get(dataRef);
    return snapshot.val();
  },

  // === تعيين بيانات ===
  setData: async (path, data) => {
    const dataRef = ref(database, path);
    await set(dataRef, data);
  },

  // === تحديث بيانات ===
  updateData: async (path, updates) => {
    const dataRef = ref(database, path);
    await update(dataRef, updates);
  },

  // === إضافة بيانات جديدة ===
  pushData: async (path, data) => {
    const dataRef = ref(database, path);
    const result = await push(dataRef, data);
    return result.key;
  },

  // === حذف بيانات ===
  removeData: async (path) => {
    const dataRef = ref(database, path);
    await remove(dataRef);
  },

  // === التحقق من اتصال Firebase ===
  checkConnection: (callback) => {
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
      const authDeviceRef = ref(database, `authorizedDevices/${deviceId}`);
      const snapshot = await get(authDeviceRef);
      return snapshot.exists();
    } catch (error) {
      console.error('Error checking device authorization:', error);
      return false;
    }
  },

  // التحقق من وجود بيانات الجهاز
  checkDeviceData: async (deviceId) => {
    try {
      const deviceRef = ref(database, `devices/${deviceId}`);
      const snapshot = await get(deviceRef);
      return snapshot.exists();
    } catch (error) {
      console.error('Error checking device data:', error);
      return false;
    }
  },

  // الحصول على معلومات المزرعة
  getFarmInfo: async (deviceId) => {
    try {
      const [authSnapshot, dataSnapshot] = await Promise.all([
        get(ref(database, `authorizedDevices/${deviceId}`)),
        get(ref(database, `devices/${deviceId}`))
      ]);

      return {
        isAuthorized: authSnapshot.exists(),
        hasData: dataSnapshot.exists(),
        data: dataSnapshot.val()
      };
    } catch (error) {
      console.error('Error getting farm info:', error);
      return { isAuthorized: false, hasData: false, data: null };
    }
  },

  // === نظام الوحدات الذكية ===

  // إضافة وحدة جديدة
  addUnit: async (deviceId, unitId, unitData) => {
    try {
      const unitRef = ref(database, `devices/${deviceId}/units/${unitId}`);
      await set(unitRef, unitData);
      return unitId;
    } catch (error) {
      console.error('Error adding unit:', error);
      throw error;
    }
  },

  // تحديث وحدة
  updateUnit: async (deviceId, unitId, updates) => {
    try {
      const unitRef = ref(database, `devices/${deviceId}/units/${unitId}`);
      await update(unitRef, updates);
    } catch (error) {
      console.error('Error updating unit:', error);
      throw error;
    }
  },

  // حذف وحدة
  deleteUnit: async (deviceId, unitId) => {
    try {
      const unitRef = ref(database, `devices/${deviceId}/units/${unitId}`);
      await remove(unitRef);
    } catch (error) {
      console.error('Error deleting unit:', error);
      throw error;
    }
  },

  // الحصول على إعدادات الوحدة
  getUnitSettings: async (deviceId, unitId) => {
    try {
      const unitRef = ref(database, `devices/${deviceId}/units/${unitId}`);
      const snapshot = await get(unitRef);
      return snapshot.val();
    } catch (error) {
      console.error('Error getting unit settings:', error);
      throw error;
    }
  },

  // === نظام الأتمتة ===

  // تحديث إعدادات الأتمتة
  updateAutomation: async (deviceId, automationType, settings) => {
    try {
      const automationRef = ref(database, `devices/${deviceId}/automation/${automationType}`);
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

  // إضافة تنبيه جديد
  addAlert: async (deviceId, alertData) => {
    try {
      const alertsRef = ref(database, `devices/${deviceId}/alerts`);
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
  updateAlertStatus: async (deviceId, alertId, status) => {
    try {
      const alertRef = ref(database, `devices/${deviceId}/alerts/${alertId}`);
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

  // الحصول على إحصائيات الجهاز
  getDeviceStats: async (deviceId, timeRange = '24h') => {
    try {
      const statsRef = ref(database, `devices/${deviceId}/stats`);
      const snapshot = await get(statsRef);
      const stats = snapshot.val() || {};

      // تصفية حسب النطاق الزمني إذا لزم الأمر
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

    // تطبيق التصفية على البيانات
    const filteredStats = {};
    Object.keys(stats).forEach(key => {
      if (stats[key].timestamp >= timeLimit) {
        filteredStats[key] = stats[key];
      }
    });

    return filteredStats;
  },

  // === دوال مساعدة ===

  // تنظيف البيانات القديمة
  cleanupOldData: async (deviceId, olderThanDays = 30) => {
    try {
      const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
      
      // تنظيف البيانات التاريخية القديمة
      const historyRef = ref(database, `devices/${deviceId}/history`);
      const historySnapshot = await get(historyRef);
      const historyData = historySnapshot.val() || {};

      const cleanupPromises = [];

      Object.keys(historyData).forEach(sensorType => {
        Object.keys(historyData[sensorType]).forEach(timestamp => {
          if (parseInt(timestamp) < cutoffTime) {
            const dataRef = ref(database, `devices/${deviceId}/history/${sensorType}/${timestamp}`);
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
  backupData: async (deviceId, backupPath) => {
    try {
      const deviceRef = ref(database, `devices/${deviceId}`);
      const snapshot = await get(deviceRef);
      const data = snapshot.val();

      const backupRef = ref(database, `${backupPath}/${deviceId}_${Date.now()}`);
      await set(backupRef, data);

      return backupRef.key;
    } catch (error) {
      console.error('Error backing up data:', error);
      throw error;
    }
  }
};

// تصدير كائنات Firebase للاستخدام في الملفات الأخرى
export { app, database, auth };

// تصدير دوال Firebase المفردة للتوافق مع الكود الحالي
export const firebaseDatabase = database;
export const firebaseRef = ref;
export const firebaseSet = set;
export const firebasePush = push;
export const firebaseRemove = remove;
export const firebaseUpdate = update;
export const firebaseOnValue = onValue;
export const firebaseGet = get;
export const firebaseOff = off;

// تصدير دوال المصادقة
export {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
};

// تصدير الخدمة الأساسية
export { firebaseService };
export default firebaseService;