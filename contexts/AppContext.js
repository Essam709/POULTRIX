// contexts/AppContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { firebaseService } from '../hooks/useFirebase';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export function AppProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [currentDevice, setCurrentDevice] = useState(null);
  const [deviceData, setDeviceData] = useState(null);
  const [sensorData, setSensorData] = useState({});
  const [currentSensor, setCurrentSensor] = useState('temperature');
  const [language, setLanguage] = useState('ar');
  const [historicalData, setHistoricalData] = useState({});
  const [devicesList, setDevicesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [farms, setFarms] = useState([]);
  const [currentFarm, setCurrentFarm] = useState(null);
  const [unitsConfig, setUnitsConfig] = useState({});
  const [isSettingsMode, setIsSettingsMode] = useState(false);

  // معلومات المستشعرات
  const SENSOR_INFO = {
    temperature: {
      name: language === 'ar' ? 'درجة الحرارة' : 'Temperature',
      icon: 'fa-temperature-full',
      unit: '°C',
      defaultMin: 25,
      defaultMax: 35,
      color: '#FF6384',
      backgroundColor: 'rgba(255, 99, 132, 0.2)'
    },
    humidity: {
      name: language === 'ar' ? 'الرطوبة' : 'Humidity',
      icon: 'fa-droplet',
      unit: '%',
      defaultMin: 60,
      defaultMax: 75,
      color: '#36A2EB',
      backgroundColor: 'rgba(54, 162, 235, 0.2)'
    },
    ammonia: {
      name: language === 'ar' ? 'الأمونيا' : 'Ammonia',
      icon: 'fa-wind',
      unit: 'ppm',
      defaultMin: 15,
      defaultMax: 20,
      color: '#FFCE56',
      backgroundColor: 'rgba(255, 206, 86, 0.2)'
    },
    airQuality: {
      name: language === 'ar' ? 'جودة الهواء' : 'Air Quality',
      icon: 'fa-smog',
      unit: 'AQI',
      defaultMin: 100,
      defaultMax: 150,
      color: '#4BC0C0',
      backgroundColor: 'rgba(75, 192, 192, 0.2)'
    }
  };

  // أنواع الوحدات
  const UNIT_TYPES = {
    fan: { 
      icon: 'fa-fan', 
      name: language === 'ar' ? 'مروحة' : 'Fan', 
      color: '#2196F3' 
    },
    heater: { 
      icon: 'fa-fire', 
      name: language === 'ar' ? 'تدفئة' : 'Heater', 
      color: '#FF5722' 
    },
    cooler: { 
      icon: 'fa-snowflake', 
      name: language === 'ar' ? 'تبريد' : 'Cooler', 
      color: '#03A9F4' 
    },
    light: { 
      icon: 'fa-lightbulb', 
      name: language === 'ar' ? 'إنارة' : 'Light', 
      color: '#FFC107' 
    }
  };

  // تحميل الإعدادات المحلية
  useEffect(() => {
    const savedDevice = localStorage.getItem('selectedDevice');
    const savedLanguage = localStorage.getItem('dashboardLang') || 'ar';
    const savedSettingsMode = localStorage.getItem('settingsMode') === 'true';
    const savedFarms = localStorage.getItem('savedFarms');
    const savedFarm = localStorage.getItem('selectedFarm');

    if (savedLanguage) setLanguage(savedLanguage);
    if (savedSettingsMode) setIsSettingsMode(savedSettingsMode);
    if (savedFarms) {
      try {
        setFarms(JSON.parse(savedFarms));
      } catch (e) {
        console.error('Error parsing saved farms:', e);
      }
    }
    if (savedFarm) setCurrentFarm(savedFarm);
    if (savedDevice) setCurrentDevice(savedDevice);
  }, []);

  // حفظ الإعدادات عند التغيير
  useEffect(() => {
    if (currentDevice) localStorage.setItem('selectedDevice', currentDevice);
  }, [currentDevice]);

  useEffect(() => {
    localStorage.setItem('dashboardLang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('settingsMode', isSettingsMode);
  }, [isSettingsMode]);

  useEffect(() => {
    localStorage.setItem('savedFarms', JSON.stringify(farms));
  }, [farms]);

  useEffect(() => {
    if (currentFarm) localStorage.setItem('selectedFarm', currentFarm);
  }, [currentFarm]);

  // التحقق من اتصال Firebase
  useEffect(() => {
    if (!firebaseService) return;

    const unsubscribe = firebaseService.isConnected((connected) => {
      setIsConnected(connected);
    });

    return () => unsubscribe();
  }, []);

  // 🔍 useEffect تشخيصي لتتبع حالة التحميل
  useEffect(() => {
    console.log('🔍 [DEBUG] AppContext Loading State:', {
      user: user?.uid,
      currentDevice,
      authLoading,
      appLoading: loading,
      unitsCount: Object.keys(unitsConfig).length,
      hasFirebase: !!firebaseService
    });
  }, [user, currentDevice, authLoading, loading, unitsConfig]);

  // 🔍 useEffect لتتبع تغييرات user بالتفصيل
  useEffect(() => {
    console.log('👤 [DEBUG] User State Changed:', {
      user: user ? {
        uid: user.uid,
        email: user.email,
        isAuthenticated: true
      } : 'No user',
      authLoading,
      timestamp: new Date().toISOString()
    });
  }, [user, authLoading]);

  // ✅ تحميل قائمة أجهزة المستخدم - مع تحسينات التحميل
  useEffect(() => {
    if (authLoading) {
      console.log('⏳ [DEVICES] Auth still loading, waiting...');
      return;
    }

    if (!firebaseService || !user) {
      console.log('❌ [DEVICES] Missing firebaseService or user for devices:', {
        hasFirebase: !!firebaseService,
        hasUser: !!user,
        userId: user?.uid,
        authLoading
      });
      setLoading(false);
      return;
    }

    console.log('📋 [DEVICES] Loading user devices for:', user.uid);
    
    const unsubscribe = firebaseService.getUserDevices(
      user.uid, 
      (snapshot) => {
        const data = snapshot.val();
        console.log('📱 [DEVICES] User devices data received:', data);
        
        if (data) {
          const devices = Object.keys(data);
          console.log('✅ [DEVICES] Devices list loaded:', devices);
          setDevicesList(devices);
          
          // إذا لم يكن هناك جهاز محدد، اختر الأول
          if (!currentDevice && devices.length > 0) {
            console.log('🎯 [DEVICES] Auto-selecting first device:', devices[0]);
            setCurrentDevice(devices[0]);
          }
        } else {
          console.log('⚠️ [DEVICES] No devices found for user');
          setDevicesList([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error('❌ [DEVICES] Error loading user devices:', error);
        setLoading(false);
      }
    );

    return () => {
      console.log('🧹 [DEVICES] Unsubscribing from user devices');
      unsubscribe();
    };
  }, [user, currentDevice, authLoading]);

  // ✅ تحميل بيانات الجهاز الحالي - مع تحسينات التحميل
  useEffect(() => {
    if (authLoading) {
      console.log('⏳ [DEVICE DATA] Auth still loading, waiting...');
      return;
    }

    if (!currentDevice || !firebaseService || !user) {
      console.log('❌ [DEVICE DATA] Missing data for device subscription:', {
        currentDevice,
        firebaseService: !!firebaseService,
        user: !!user,
        userId: user?.uid,
        authLoading
      });
      return;
    }

    console.log('📡 [DEVICE DATA] Subscribing to device data:', currentDevice);
    
    const unsubscribe = firebaseService.listenToData(
      user.uid, 
      `devices/${currentDevice}`, 
      (snapshot) => {
        const data = snapshot.val();
        console.log('📊 [DEVICE DATA] Device data received:', data);
        
        setDeviceData(data);
        
        if (data && data.sensors) {
          console.log('🎯 [DEVICE DATA] Sensor data updated:', data.sensors);
          setSensorData(data.sensors);
        } else {
          console.log('⚠️ [DEVICE DATA] No sensor data in device data');
          setSensorData({});
        }
      },
      (error) => {
        console.error('❌ [DEVICE DATA] Error in device data subscription:', error);
      }
    );

    return () => {
      console.log('🧹 [DEVICE DATA] Unsubscribing from device data');
      unsubscribe();
    };
  }, [user, currentDevice, authLoading]);

  // ✅ الإصلاح النهائي: تحميل إعدادات الوحدات مع تأخير ذكي
  useEffect(() => {
    console.log('🎯 [UNITS] useEffect triggered:', {
      user: user?.uid,
      currentDevice,
      authLoading,
      hasFirebase: !!firebaseService
    });

    if (authLoading) {
      console.log('⏳ [UNITS] Auth still loading, waiting...');
      return;
    }

    if (!user) {
      console.log('❌ [UNITS] No user available, skipping subscription');
      setUnitsConfig({});
      return;
    }

    if (!currentDevice) {
      console.log('❌ [UNITS] No device selected, skipping subscription');
      setUnitsConfig({});
      return;
    }

    if (!firebaseService) {
      console.log('❌ [UNITS] Firebase service not available');
      setUnitsConfig({});
      return;
    }

    console.log('🚀 [UNITS] Starting subscription for:', {
      userId: user.uid,
      deviceId: currentDevice
    });

    let unsubscribe = null;
    let subscriptionActive = true;

    const startSubscription = () => {
      if (!subscriptionActive) return;

      console.log('📡 [UNITS] Setting up Firebase subscription...');
      
      unsubscribe = firebaseService.getDeviceUnits(
        user.uid,
        currentDevice,
        (snapshot) => {
          if (!subscriptionActive) return;
          
          const data = snapshot.val();
          console.log('✅ [UNITS] Subscription data received:', {
            dataExists: !!data,
            unitsCount: data ? Object.keys(data).length : 0,
            units: data ? Object.keys(data) : []
          });
          
          setUnitsConfig(data || {});
        },
        (error) => {
          if (!subscriptionActive) return;
          console.error('❌ [UNITS] Subscription error:', error);
          setUnitsConfig({});
        }
      );
    };

    // بدء الاشتراك بعد تأخير بسيط للتأكد من استقرار الحالة
    const timer = setTimeout(startSubscription, 100);

    return () => {
      console.log('🧹 [UNITS] Cleaning up subscription');
      subscriptionActive = false;
      if (unsubscribe) {
        unsubscribe();
      }
      clearTimeout(timer);
    };
  }, [user, currentDevice, authLoading]);

  // 🔥 الإصلاح: تحميل البيانات التاريخية للمستشعر الحالي
  useEffect(() => {
    console.log('📈 [HISTORICAL] useEffect triggered:', {
      currentSensor,
      currentDevice,
      user: user?.uid,
      authLoading
    });

    if (authLoading) {
      console.log('⏳ [HISTORICAL] Auth still loading, waiting...');
      return;
    }

    if (!currentDevice || !currentSensor || !firebaseService || !user) {
      console.log('❌ [HISTORICAL] Missing data for subscription:', {
        currentDevice: !!currentDevice,
        currentSensor,
        firebaseService: !!firebaseService,
        user: !!user
      });
      return;
    }

    console.log('🚀 [HISTORICAL] Setting up subscription for sensor:', currentSensor);

    const unsubscribe = firebaseService.listenToHistoricalData(
      user.uid,
      currentDevice,
      currentSensor,
      (snapshot) => {
        const data = snapshot.val();
        console.log('✅ [HISTORICAL] Data received for sensor:', currentSensor, {
          dataExists: !!data,
          dataPoints: data ? Object.keys(data).length : 0,
          sampleData: data ? Object.values(data).slice(0, 3) : []
        });
        
        if (data) {
          setHistoricalData(prev => ({
            ...prev,
            [currentSensor]: data
          }));
        } else {
          console.log('⚠️ [HISTORICAL] No data found for sensor:', currentSensor);
          // ✅ الإصلاح: تعيين بيانات فارغة حتى لا تبقى البيانات القديمة
          setHistoricalData(prev => ({
            ...prev,
            [currentSensor]: {}
          }));
        }
      },
      (error) => {
        console.error('❌ [HISTORICAL] Subscription error for sensor:', currentSensor, error);
      }
    );

    return () => {
      console.log('🧹 [HISTORICAL] Cleaning up subscription for sensor:', currentSensor);
      unsubscribe();
    };
  }, [user, currentDevice, currentSensor, authLoading]);

  // 🔍 إضافة useEffect تشخيصي للبيانات التاريخية
  useEffect(() => {
    console.log('📊 [HISTORICAL DIAGNOSTICS]', {
      currentSensor,
      availableSensors: Object.keys(historicalData),
      currentSensorData: historicalData[currentSensor] ? Object.keys(historicalData[currentSensor]).length : 0,
      allHistoricalData: historicalData
    });
  }, [historicalData, currentSensor]);

  // إضافة useEffect لمراقبة تغييرات unitsConfig
  useEffect(() => {
    console.log('🔄 [UNITS CONFIG] unitsConfig updated:', {
      count: Object.keys(unitsConfig).length,
      units: Object.keys(unitsConfig)
    });
  }, [unitsConfig]);

  // إضافة useEffect لمراقبة تغييرات sensorData
  useEffect(() => {
    console.log('🔄 [SENSOR DATA] sensorData updated:', {
      count: Object.keys(sensorData).length,
      sensors: Object.keys(sensorData),
      values: sensorData
    });
  }, [sensorData]);

  // دوال إدارة المزارع
  const addFarm = async (deviceId) => {
    if (!deviceId.trim() || !user) return;

    const trimmedId = deviceId.trim();
    
    // منع التكرار
    if (farms.includes(trimmedId)) {
      alert(language === 'ar' ? 'المزرعة موجودة بالفعل!' : 'Farm already exists!');
      return;
    }

    // التحقق من ترخيص الجهاز وملكيته للمستخدم
    try {
      const authorization = await firebaseService.checkDeviceAuthorization(trimmedId);
      if (authorization && authorization.clientId === user.uid) {
        const newFarms = [...farms, trimmedId];
        setFarms(newFarms);
        setCurrentFarm(trimmedId);
        
        // إذا كان الجهاز موجوداً في القائمة، حدده
        if (devicesList.includes(trimmedId)) {
          setCurrentDevice(trimmedId);
        }

        const successMessage = language === 'ar' 
          ? `تم إضافة المزرعة ${trimmedId} بنجاح` 
          : `Farm ${trimmedId} added successfully`;
        alert(successMessage);
      } else {
        const errorMessage = language === 'ar'
          ? `الجهاز ${trimmedId} غير مصرح به أو لا ينتمي لحسابك`
          : `Device ${trimmedId} is not authorized or does not belong to your account`;
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error adding farm:', error);
      const errorMessage = language === 'ar'
        ? 'حدث خطأ أثناء إضافة المزرعة'
        : 'Error adding farm';
      alert(errorMessage);
    }
  };

  const removeFarm = (deviceId) => {
    const newFarms = farms.filter(farm => farm !== deviceId);
    setFarms(newFarms);
    
    if (currentFarm === deviceId) {
      setCurrentFarm(newFarms.length > 0 ? newFarms[0] : null);
    }
  };

  const selectFarm = (farmId) => {
    setCurrentFarm(farmId);
    
    // إذا كان الجهاز موجوداً في القائمة، حدده
    if (devicesList.includes(farmId)) {
      setCurrentDevice(farmId);
    }
  };

  // دوال إدارة الوحدات
  const addUnit = async (unitId, unitData) => {
    if (!currentDevice || !firebaseService || !user) return;

    try {
      await firebaseService.addUnit(user.uid, currentDevice, unitId, unitData);
    } catch (error) {
      console.error('Error adding unit:', error);
      throw error;
    }
  };

  const updateUnit = async (unitId, updates) => {
    if (!currentDevice || !firebaseService || !user) return;

    try {
      await firebaseService.updateUnit(user.uid, currentDevice, unitId, updates);
    } catch (error) {
      console.error('Error updating unit:', error);
      throw error;
    }
  };

  const deleteUnit = async (unitId) => {
    if (!currentDevice || !firebaseService || !user) return;

    try {
      await firebaseService.deleteUnit(user.uid, currentDevice, unitId);
    } catch (error) {
      console.error('Error deleting unit:', error);
      throw error;
    }
  };

  // دالة للتحقق من ملكية الجهاز
  const checkDeviceOwnership = async (deviceId) => {
    if (!user || !deviceId) return false;
    
    try {
      return await firebaseService.checkUserDevice(user.uid, deviceId);
    } catch (error) {
      console.error('Error checking device ownership:', error);
      return false;
    }
  };

  // دالة لتحميل الأجهزة المعلقة
  const loadPendingDevices = (callback) => {
    if (!firebaseService) return () => {};
    
    return firebaseService.getPendingDevices(callback);
  };

  // دالة للموافقة على جهاز معلق
  const approvePendingDevice = async (deviceId, customName = null) => {
    if (!user || !deviceId) return;

    try {
      await firebaseService.approveDevice(user.uid, deviceId, customName);
      
      // إضافة الجهاز إلى قائمة المزارع بعد الموافقة
      addFarm(deviceId);
      
      return true;
    } catch (error) {
      console.error('Error approving device:', error);
      throw error;
    }
  };

  // ✅ دالة لتحديث الوحدات يدوياً
  const refreshUnits = async () => {
    if (!currentDevice || !firebaseService || !user) {
      console.log('❌ [REFRESH] Cannot refresh units: missing data');
      return;
    }

    console.log('🔄 [REFRESH] Manual units refresh triggered');
    try {
      const unitsRef = firebaseService.getRef(`clients/${user.uid}/devices/${currentDevice}/units`);
      const snapshot = await firebaseService.get(unitsRef);
      const data = snapshot.val();
      console.log('🔄 [REFRESH] Manual refresh data:', data);
      setUnitsConfig(data || {});
      return data;
    } catch (error) {
      console.error('❌ [REFRESH] Manual refresh error:', error);
      throw error;
    }
  };

  // ✅ دالة لتحديث البيانات التاريخية يدوياً
  const refreshHistoricalData = async () => {
    if (!currentDevice || !currentSensor || !firebaseService || !user) {
      console.log('❌ [HISTORICAL REFRESH] Missing data for refresh');
      return;
    }

    console.log('🔄 [HISTORICAL REFRESH] Manual refresh for sensor:', currentSensor);
    
    try {
      const historyRef = firebaseService.getRef(`clients/${user.uid}/devices/${currentDevice}/history/${currentSensor}`);
      const snapshot = await firebaseService.get(historyRef);
      const data = snapshot.val();
      
      console.log('✅ [HISTORICAL REFRESH] Refresh completed:', {
        sensor: currentSensor,
        dataPoints: data ? Object.keys(data).length : 0
      });
      
      setHistoricalData(prev => ({
        ...prev,
        [currentSensor]: data || {}
      }));
      
      return data;
    } catch (error) {
      console.error('❌ [HISTORICAL REFRESH] Refresh failed:', error);
      throw error;
    }
  };

  // دوال مساعدة
  const toggleSettingsMode = () => {
    setIsSettingsMode(prev => !prev);
  };

  const selectSensor = (sensorType) => {
    setCurrentSensor(sensorType);
  };

  const value = {
    // إضافة debugging info
    _debug: {
      unitsCount: Object.keys(unitsConfig).length,
      sensorsCount: Object.keys(sensorData).length,
      hasDeviceData: !!deviceData,
      currentDevice,
      user: user?.uid,
      authLoading
    },
    
    // القيم الأساسية
    user,
    currentDevice,
    deviceData,
    sensorData,
    currentSensor,
    language,
    historicalData,
    devicesList,
    loading: loading || authLoading,
    isConnected,
    farms,
    currentFarm,
    unitsConfig,
    isSettingsMode,
    SENSOR_INFO,
    UNIT_TYPES,
    
    // الدوال
    setCurrentDevice,
    setDeviceData,
    setSensorData,
    setCurrentSensor,
    setLanguage,
    setHistoricalData,
    setDevicesList,
    addFarm,
    removeFarm,
    selectFarm,
    addUnit,
    updateUnit,
    deleteUnit,
    checkDeviceOwnership,
    loadPendingDevices,
    approvePendingDevice,
    toggleSettingsMode,
    selectSensor,
    refreshUnits,
    refreshHistoricalData // ✅ الإضافة: دالة تحديث البيانات التاريخية
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export { AppContext };