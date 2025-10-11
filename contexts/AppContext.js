// contexts/AppContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { firebaseService } from '../hooks/useFirebase';

const AppContext = createContext();

export function AppProvider({ children }) {
  // الحالات الأساسية
  const [currentDevice, setCurrentDevice] = useState(null);
  const [deviceData, setDeviceData] = useState(null);
  const [sensorData, setSensorData] = useState({});
  const [currentSensor, setCurrentSensor] = useState('temperature');
  const [language, setLanguage] = useState('ar');
  const [historicalData, setHistoricalData] = useState({});
  const [devicesList, setDevicesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // نظام المزارع الجديد
  const [farms, setFarms] = useState([]);
  const [currentFarm, setCurrentFarm] = useState(null);

  // نظام الوحدات الذكية
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

    const unsubscribe = firebaseService.checkConnection((connected) => {
      setIsConnected(connected);
    });

    return () => unsubscribe();
  }, []);

  // تحميل قائمة الأجهزة
  useEffect(() => {
    if (!firebaseService) {
      setLoading(false);
      return;
    }

    const unsubscribe = firebaseService.listenToData('devices', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const devices = Object.keys(data);
        setDevicesList(devices);
        
        // إذا لم يكن هناك جهاز محدد، اختر الأول
        if (!currentDevice && devices.length > 0) {
          setCurrentDevice(devices[0]);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentDevice]);

  // تحميل بيانات الجهاز الحالي
  useEffect(() => {
    if (!currentDevice || !firebaseService) return;

    const unsubscribe = firebaseService.listenToData(`devices/${currentDevice}`, (snapshot) => {
      const data = snapshot.val();
      setDeviceData(data);
      
      if (data && data.sensors) {
        setSensorData(data.sensors);
      }
    });

    return () => unsubscribe();
  }, [currentDevice]);

  // تحميل إعدادات الوحدات للجهاز الحالي
  useEffect(() => {
    if (!currentDevice || !firebaseService) return;

    const unsubscribe = firebaseService.listenToData(`devices/${currentDevice}/units`, (snapshot) => {
      const data = snapshot.val();
      setUnitsConfig(data || {});
    });

    return () => unsubscribe();
  }, [currentDevice]);

  // تحميل البيانات التاريخية للمستشعر الحالي
  useEffect(() => {
    if (!currentDevice || !currentSensor || !firebaseService) return;

    const unsubscribe = firebaseService.listenToHistoricalData(
      currentDevice,
      currentSensor,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setHistoricalData(prev => ({
            ...prev,
            [currentSensor]: data
          }));
        }
      }
    );

    return () => unsubscribe();
  }, [currentDevice, currentSensor]);

  // دوال إدارة المزارع
  const addFarm = async (deviceId) => {
    if (!deviceId.trim()) return;

    const trimmedId = deviceId.trim();
    
    // منع التكرار
    if (farms.includes(trimmedId)) {
      alert(language === 'ar' ? 'المزرعة موجودة بالفعل!' : 'Farm already exists!');
      return;
    }

    // التحقق من ترخيص الجهاز
    try {
      const isAuthorized = await firebaseService.checkDeviceAuthorization(trimmedId);
      if (isAuthorized) {
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
          ? `المزرعة ${trimmedId} غير متصلة أو غير مصرح بها`
          : `Farm ${trimmedId} is not connected or not authorized`;
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
    if (!currentDevice || !firebaseService) return;

    try {
      await firebaseService.addUnit(currentDevice, unitId, unitData);
    } catch (error) {
      console.error('Error adding unit:', error);
      throw error;
    }
  };

  const updateUnit = async (unitId, updates) => {
    if (!currentDevice || !firebaseService) return;

    try {
      await firebaseService.updateUnit(currentDevice, unitId, updates);
    } catch (error) {
      console.error('Error updating unit:', error);
      throw error;
    }
  };

  const deleteUnit = async (unitId) => {
    if (!currentDevice || !firebaseService) return;

    try {
      await firebaseService.deleteUnit(currentDevice, unitId);
    } catch (error) {
      console.error('Error deleting unit:', error);
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
    // الحالة الأساسية
    currentDevice,
    deviceData,
    sensorData,
    currentSensor,
    language,
    historicalData,
    devicesList,
    loading,
    isConnected,

    // نظام المزارع
    farms,
    currentFarm,

    // نظام الوحدات
    unitsConfig,
    isSettingsMode,

    // الثوابت
    SENSOR_INFO,
    UNIT_TYPES,

    // دوال الأساسية
    setCurrentDevice,
    setDeviceData,
    setSensorData,
    setCurrentSensor,
    setLanguage,
    setHistoricalData,

    // دوال المزارع
    addFarm,
    removeFarm,
    selectFarm,

    // دوال الوحدات
    addUnit,
    updateUnit,
    deleteUnit,

    // دوال مساعدة
    toggleSettingsMode,
    selectSensor
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