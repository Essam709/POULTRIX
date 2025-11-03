// contexts/AppContext.js
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
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
  
  // 🔥 الحالة الجديدة: يبدأ الهيدر مخفيًا
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(true);

  // =============================================
  // 🔥 نظام مراقبة حالة الأجهزة - الإضافات الجديدة
  // =============================================
  const [deviceConnectivity, setDeviceConnectivity] = useState({});
  const [globalNotifications, setGlobalNotifications] = useState([]);

  // 🔥 استخدام useRef لمنع التحديثات غير الضرورية
  const lastSensorDataRef = useRef({});
  const lastConnectivityDataRef = useRef({});
  const activeSubscriptionsRef = useRef(new Set());
  const notificationTimeoutRef = useRef({});

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

  // 🔥 الدالة الجديدة: تبديل حالة الهيدر
  const toggleHeader = () => {
    setIsHeaderCollapsed(!isHeaderCollapsed);
  };

  // 🔥 دالة لعرض الإشعارات العالمية - محسنة
  const showGlobalNotification = useCallback((message, type = 'info') => {
    const notificationId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const notification = {
      id: notificationId,
      message,
      type,
      timestamp: new Date().toISOString()
    };
    
    setGlobalNotifications(prev => {
      // 🔥 تحديد عدد الإشعارات المسموح به
      const maxNotifications = 5;
      const updatedNotifications = [...prev, notification];
      
      if (updatedNotifications.length > maxNotifications) {
        return updatedNotifications.slice(updatedNotifications.length - maxNotifications);
      }
      
      return updatedNotifications;
    });
    
    // 🔥 تنظيف أي timeout سابق لنفس الرسالة (إن وجد)
    if (notificationTimeoutRef.current[notificationId]) {
      clearTimeout(notificationTimeoutRef.current[notificationId]);
    }
    
    // إزالة الإشعار بعد 5 ثواني
    notificationTimeoutRef.current[notificationId] = setTimeout(() => {
      setGlobalNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
      delete notificationTimeoutRef.current[notificationId];
    }, 5000);
  }, []);

  // 🔥 الحصول على حالة جهاز معين
  const getDeviceConnectivity = useCallback((deviceId) => {
    return deviceConnectivity[deviceId] || { 
      isConnected: false, 
      lastSeen: null, 
      status: 'unknown',
      minutesSinceLastSeen: null
    };
  }, [deviceConnectivity]);

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

  // ✅ تحميل بيانات الجهاز الحالي - مع تحسينات الأداء
  useEffect(() => {
    if (authLoading) {
      console.log('⏳ [DEVICE DATA] Auth still loading, waiting...');
      return;
    }

    if (!currentDevice || !firebaseService || !user) {
      console.log('❌ [DEVICE DATA] Missing data for device subscription');
      return;
    }

    console.log('📡 [DEVICE DATA] Subscribing to device data:', currentDevice);
    
    const unsubscribe = firebaseService.listenToData(
      user.uid, 
      `devices/${currentDevice}`, 
      (snapshot) => {
        const data = snapshot.val();
        
        // 🔥 منع التحديثات غير الضرورية
        const dataString = JSON.stringify(data);
        if (dataString === lastSensorDataRef.current) {
          console.log('🔄 [DEVICE DATA] Data unchanged, skipping update');
          return;
        }
        
        lastSensorDataRef.current = dataString;
        console.log('📊 [DEVICE DATA] Device data received:', data);
        
        setDeviceData(data);
        
        if (data && data.sensors) {
          console.log('🎯 [DEVICE DATA] Sensor data updated');
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
      lastSensorDataRef.current = {};
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

  // =============================================
  // 🔥 نظام مراقبة حالة الأجهزة - الاستخدام المحسن
  // =============================================

  // 🔥 مراقبة حالة الجهاز الحالي في الوقت الحقيقي - نسخة محسنة
  useEffect(() => {
    console.log('🎯 [DEVICE STATUS] useEffect triggered:', {
      currentDevice,
      user: user?.uid,
      authLoading
    });

    if (authLoading) {
      console.log('⏳ [DEVICE STATUS] Auth still loading, waiting...');
      return;
    }

    if (!currentDevice || !firebaseService || !user) {
      console.log('❌ [DEVICE STATUS] Missing data for status subscription');
      return;
    }

    // 🔥 منع الاشتراك المزدوج
    if (activeSubscriptionsRef.current.has(currentDevice)) {
      console.log('⚠️ [DEVICE STATUS] Already subscribed to:', currentDevice);
      return;
    }

    console.log('🚀 [DEVICE STATUS] Starting status subscription for:', currentDevice);

    let unsubscribe = null;
    let subscriptionActive = true;

    const startStatusSubscription = () => {
      if (!subscriptionActive) return;

      activeSubscriptionsRef.current.add(currentDevice);
      
      unsubscribe = firebaseService.listenToDeviceConnectivity(
        user.uid,
        currentDevice,
        (status) => {
          if (!subscriptionActive) return;
          
          // 🔥 منع التحديثات غير الضرورية
          const statusString = JSON.stringify(status);
          const lastStatus = lastConnectivityDataRef.current[currentDevice];
          
          if (lastStatus === statusString) {
            console.log('🔄 [DEVICE STATUS] Status unchanged for:', currentDevice);
            return;
          }
          
          lastConnectivityDataRef.current[currentDevice] = statusString;
          
          setDeviceConnectivity(prevState => {
            const previousStatus = prevState[currentDevice];
            const newState = {
              ...prevState,
              [currentDevice]: status
            };

            // 🔥 إشعار فوري عند تغيير الحالة
            if (previousStatus?.isConnected !== status.isConnected) {
              const message = status.isConnected 
                ? `✅ الجهاز ${currentDevice} متصل الآن`
                : `❌ الجهاز ${currentDevice} غير متصل`;
              
              showGlobalNotification(message, status.isConnected ? 'success' : 'error');
            }

            return newState;
          });
        },
        (error) => {
          if (!subscriptionActive) return;
          console.error('❌ [DEVICE STATUS] Subscription error:', error);
          activeSubscriptionsRef.current.delete(currentDevice);
        }
      );
    };

    const timer = setTimeout(startStatusSubscription, 200);

    return () => {
      console.log('🧹 [DEVICE STATUS] Cleaning up status subscription');
      subscriptionActive = false;
      activeSubscriptionsRef.current.delete(currentDevice);
      
      if (unsubscribe) {
        unsubscribe();
      }
      clearTimeout(timer);
    };
  }, [user, currentDevice, authLoading, showGlobalNotification]);

  // 🔥 مراقبة حالة جميع أجهزة المستخدم - نسخة محسنة
  useEffect(() => {
    if (!user || !firebaseService || authLoading || devicesList.length === 0) {
      console.log('⏳ [ALL DEVICES STATUS] Skipping - missing dependencies');
      return;
    }

    console.log('🎯 [ALL DEVICES STATUS] Monitoring all devices:', devicesList);

    const unsubscribers = [];
    const activeSubscriptions = new Set();

    devicesList.forEach(deviceId => {
      // 🔥 منع الاشتراك المزدوج في نفس الجهاز
      if (activeSubscriptions.has(deviceId)) {
        console.log('⚠️ [ALL DEVICES STATUS] Already subscribed to:', deviceId);
        return;
      }

      activeSubscriptions.add(deviceId);

      const unsubscribe = firebaseService.listenToDeviceConnectivity(
        user.uid,
        deviceId,
        (status) => {
          setDeviceConnectivity(prevState => {
            const previousStatus = prevState[deviceId];
            
            // 🔥 منع التحديثات غير الضرورية
            if (JSON.stringify(previousStatus) === JSON.stringify(status)) {
              return prevState;
            }

            const newState = {
              ...prevState,
              [deviceId]: status
            };

            // 🔥 إشعار فوري عند تغيير الحالة لأي جهاز
            if (previousStatus?.isConnected !== status.isConnected) {
              const message = status.isConnected 
                ? `✅ الجهاز ${deviceId} متصل الآن`
                : `❌ الجهاز ${deviceId} غير متصل`;
              
              showGlobalNotification(message, status.isConnected ? 'success' : 'error');
            }

            return newState;
          });
        },
        (error) => {
          console.error(`❌ [ALL DEVICES STATUS] Error for device ${deviceId}:`, error);
          activeSubscriptions.delete(deviceId);
        }
      );

      unsubscribers.push(() => {
        unsubscribe();
        activeSubscriptions.delete(deviceId);
      });
    });

    return () => {
      console.log('🧹 [ALL DEVICES STATUS] Cleaning up all subscriptions');
      unsubscribers.forEach(unsubscribe => unsubscribe());
      activeSubscriptions.clear();
    };
  }, [user, devicesList, authLoading, showGlobalNotification]);

  // 🔥 دالة لتحديث حالة الجهاز يدوياً
  const refreshDeviceStatus = useCallback(async (deviceId = null) => {
    const targetDevice = deviceId || currentDevice;
    
    if (!targetDevice || !firebaseService || !user) {
      console.log('❌ [STATUS REFRESH] Cannot refresh: missing data');
      return null;
    }

    console.log('🔄 [STATUS REFRESH] Manual refresh for device:', targetDevice);
    
    try {
      const status = await firebaseService.getDeviceConnectivity(user.uid, targetDevice);
      
      console.log('✅ [STATUS REFRESH] Manual refresh result:', status);
      
      setDeviceConnectivity(prev => ({
        ...prev,
        [targetDevice]: status
      }));
      
      return status;
    } catch (error) {
      console.error('❌ [STATUS REFRESH] Manual refresh failed:', error);
      throw error;
    }
  }, [user, currentDevice]);

  // 🔥 تنظيف الاشتراكات عند فك التثبيت
  useEffect(() => {
    return () => {
      console.log('🧹 [CLEANUP] Cleaning up all subscriptions and timeouts');
      
      // تنظيف جميع الاشتراكات النشطة
      activeSubscriptionsRef.current.clear();
      
      // تنظيف جميع الـ timeouts
      Object.values(notificationTimeoutRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      notificationTimeoutRef.current = {};
    };
  }, []);

  // 🔍 إضافة useEffect تشخيصي للبيانات التاريخية
  useEffect(() => {
    console.log('📊 [HISTORICAL DIAGNOSTICS]', {
      currentSensor,
      availableSensors: Object.keys(historicalData),
      currentSensorData: historicalData[currentSensor] ? Object.keys(historicalData[currentSensor]).length : 0
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
      sensors: Object.keys(sensorData)
    });
  }, [sensorData]);

  // 🔥 إضافة useEffect لمراقبة حالة الأجهزة
  useEffect(() => {
    console.log('🔌 [CONNECTIVITY SUMMARY] Device connectivity status:', {
      currentDevice,
      currentDeviceStatus: deviceConnectivity[currentDevice],
      allDevices: Object.keys(deviceConnectivity).map(id => ({
        device: id,
        status: deviceConnectivity[id]?.isConnected ? 'online' : 'offline',
        lastSeen: deviceConnectivity[id]?.lastSeen
      }))
    });
  }, [deviceConnectivity, currentDevice]);

  // دوال إدارة المزارع
  const addFarm = async (deviceId) => {
    if (!deviceId.trim() || !user) return;

    const trimmedId = deviceId.trim();
    
    // منع التكرار
    if (farms.includes(trimmedId)) {
      const message = language === 'ar' ? 'المزرعة موجودة بالفعل!' : 'Farm already exists!';
      showGlobalNotification(message, 'warning');
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
        showGlobalNotification(successMessage, 'success');
      } else {
        const errorMessage = language === 'ar'
          ? `الجهاز ${trimmedId} غير مصرح به أو لا ينتمي لحسابك`
          : `Device ${trimmedId} is not authorized or does not belong to your account`;
        showGlobalNotification(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error adding farm:', error);
      const errorMessage = language === 'ar'
        ? 'حدث خطأ أثناء إضافة المزرعة'
        : 'Error adding farm';
      showGlobalNotification(errorMessage, 'error');
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
    
    // 🔥 الحالة الجديدة
    isHeaderCollapsed,
    toggleHeader,
    
    // 🔥 نظام مراقبة حالة الأجهزة
    deviceConnectivity,
    getDeviceConnectivity,
    refreshDeviceStatus,
    globalNotifications,
    showGlobalNotification,
    
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
    refreshHistoricalData
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