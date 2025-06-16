
// src/contexts/settings-context.tsx
"use client";
import type React from 'react';
import { createContext, useState, useEffect, useCallback } from 'react';
import { LOCAL_STORAGE_SETTINGS_KEY } from '@/lib/constants';
import type { AppSettings, SettingsContextType } from '@/lib/types';

const defaultSettings: AppSettings = {
  enableEmailNotifications: false, // Para novas vendas
  notificationEmails: [],      // Para novas vendas
  enableProposalEmailNotifications: false, // Para novas propostas
  // proposalNotificationEmails: [], // Se for tornar configurável no futuro
};

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    setLoadingSettings(true);
    try {
      const storedSettings = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        // Basic validation to ensure crucial keys exist and merge with defaults
        const validatedSettings: AppSettings = {
          ...defaultSettings, // Start with defaults
          enableEmailNotifications: typeof parsedSettings.enableEmailNotifications === 'boolean' ? parsedSettings.enableEmailNotifications : defaultSettings.enableEmailNotifications,
          notificationEmails: Array.isArray(parsedSettings.notificationEmails) ? parsedSettings.notificationEmails : defaultSettings.notificationEmails,
          enableProposalEmailNotifications: typeof parsedSettings.enableProposalEmailNotifications === 'boolean' ? parsedSettings.enableProposalEmailNotifications : defaultSettings.enableProposalEmailNotifications,
        };
        setSettings(validatedSettings);
      } else {
        localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(defaultSettings));
         setSettings(defaultSettings); // Ensure default settings are applied if nothing is stored
      }
    } catch (error) {
      console.error("SettingsContext: Error loading settings from localStorage", error);
      setSettings(defaultSettings); // Fallback to default settings on error
      localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(defaultSettings));
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prevSettings => {
      const updated = { ...prevSettings, ...newSettings };
      localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loadingSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

