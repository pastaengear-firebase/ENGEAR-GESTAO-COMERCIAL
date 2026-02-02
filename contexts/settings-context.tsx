// contexts/settings-context.tsx
"use client";
import type React from 'react';
import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useFirestore } from '../firebase/provider';
import { useDoc } from '../firebase/firestore/use-doc';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { AppSettings, SettingsContextType } from '@/lib/types';

const defaultSettings: AppSettings = {
  enableSalesEmailNotifications: true,
  salesNotificationEmails: [],
  enableProposalsEmailNotifications: true,
  proposalsNotificationEmails: [],
};

const SETTINGS_DOC_ID = 'global';

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const firestore = useFirestore();

  const settingsDocRef = useMemo(() => {
      if (firestore) {
          return doc(firestore, 'settings', SETTINGS_DOC_ID);
      }
      return null;
  }, [firestore]);

  const { data: firestoreSettings, loading: loadingFirestoreSettings } = useDoc<AppSettings>(settingsDocRef);
  
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  
  useEffect(() => {
    if (firestoreSettings) {
        setSettings(prevSettings => ({ ...prevSettings, ...firestoreSettings }));
    }
  }, [firestoreSettings]);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
      if (!settingsDocRef) throw new Error("Firestore not available");
      await setDoc(settingsDocRef, {
          ...newSettings, 
          updatedAt: serverTimestamp() 
      }, { merge: true });
  }, [settingsDocRef]);

  const loadingSettings = loadingFirestoreSettings;

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loadingSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
