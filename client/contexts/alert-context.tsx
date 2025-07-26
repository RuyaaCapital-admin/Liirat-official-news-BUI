import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLanguage } from './language-context';

export interface AlertPreference {
  id: string;
  eventType: string;
  eventName: string;
  currency: string;
  importance: number;
  enabled: boolean;
  methods: ('email' | 'whatsapp' | 'browser')[];
  createdAt: Date;
}

export interface ActiveAlert {
  id: string;
  eventName: string;
  message: string;
  timestamp: Date;
  importance: number;
  isRead: boolean;
  eventData?: any;
}

interface AlertContextType {
  alerts: ActiveAlert[];
  preferences: AlertPreference[];
  unreadCount: number;
  addAlert: (alert: Omit<ActiveAlert, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (alertId: string) => void;
  markAllAsRead: () => void;
  clearAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
  addPreference: (preference: Omit<AlertPreference, 'id' | 'createdAt'>) => void;
  removePreference: (preferenceId: string) => void;
  updatePreference: (preferenceId: string, updates: Partial<AlertPreference>) => void;
  checkEventAlerts: (event: any) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

const STORAGE_KEYS = {
  alerts: 'liirat-alerts',
  preferences: 'liirat-alert-preferences'
};

interface AlertProviderProps {
  children: ReactNode;
}

export function AlertProvider({ children }: AlertProviderProps) {
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);
  const [preferences, setPreferences] = useState<AlertPreference[]>([]);
  const { t, language } = useLanguage();

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedAlerts = localStorage.getItem(STORAGE_KEYS.alerts);
      const savedPreferences = localStorage.getItem(STORAGE_KEYS.preferences);
      
      if (savedAlerts) {
        const parsedAlerts = JSON.parse(savedAlerts).map((alert: any) => ({
          ...alert,
          timestamp: new Date(alert.timestamp)
        }));
        setAlerts(parsedAlerts);
      }
      
      if (savedPreferences) {
        const parsedPreferences = JSON.parse(savedPreferences).map((pref: any) => ({
          ...pref,
          createdAt: new Date(pref.createdAt)
        }));
        setPreferences(parsedPreferences);
      }
    } catch (error) {
      console.warn('Failed to load alert data from localStorage:', error);
    }
  }, []);

  // Save alerts to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.alerts, JSON.stringify(alerts));
    } catch (error) {
      console.warn('Failed to save alerts to localStorage:', error);
    }
  }, [alerts]);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save preferences to localStorage:', error);
    }
  }, [preferences]);

  const unreadCount = alerts.filter(alert => !alert.isRead).length;

  const addAlert = (alertData: Omit<ActiveAlert, 'id' | 'timestamp' | 'isRead'>) => {
    const newAlert: ActiveAlert = {
      ...alertData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      isRead: false
    };

    setAlerts(prev => [newAlert, ...prev]);

    // Show browser notification if supported and permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Liirat - ' + (language === 'ar' ? 'تنبيه اقتصادي' : 'Economic Alert'), {
        body: newAlert.message,
        icon: '/favicon.ico',
        tag: newAlert.id
      });
    }
  };

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
  };

  const clearAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const addPreference = (preferenceData: Omit<AlertPreference, 'id' | 'createdAt'>) => {
    const newPreference: AlertPreference = {
      ...preferenceData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date()
    };
    setPreferences(prev => [...prev, newPreference]);
  };

  const removePreference = (preferenceId: string) => {
    setPreferences(prev => prev.filter(pref => pref.id !== preferenceId));
  };

  const updatePreference = (preferenceId: string, updates: Partial<AlertPreference>) => {
    setPreferences(prev => prev.map(pref => 
      pref.id === preferenceId ? { ...pref, ...updates } : pref
    ));
  };

  const checkEventAlerts = (event: any) => {
    // Check if this event matches any user preferences
    const matchingPreferences = preferences.filter(pref => 
      pref.enabled && 
      (pref.eventType === event.event || pref.currency === event.country) &&
      pref.importance <= event.importance
    );

    // Create alerts for matching preferences
    matchingPreferences.forEach(pref => {
      const message = language === 'ar' 
        ? `حدث اقتصادي جديد: ${event.event} - ${event.country} - القيمة الفعلية: ${event.actual}`
        : `New economic event: ${event.event} - ${event.country} - Actual: ${event.actual}`;

      addAlert({
        eventName: event.event,
        message,
        importance: event.importance,
        eventData: event
      });
    });
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <AlertContext.Provider value={{
      alerts,
      preferences,
      unreadCount,
      addAlert,
      markAsRead,
      markAllAsRead,
      clearAlert,
      clearAllAlerts,
      addPreference,
      removePreference,
      updatePreference,
      checkEventAlerts
    }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
}
