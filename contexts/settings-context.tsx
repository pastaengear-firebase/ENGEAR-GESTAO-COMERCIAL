'use client';
import type React from 'react';
import { createContext, useCallback, useMemo } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '../firebase/provider';
import { useDoc } from '../firebase/firestore/use-doc';
import type { AppSettings, SettingsContextType } from '../lib/types';

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

  const settingsDocRef = useMemo(() => firestore ? doc(firestore, 'settings', SETTINGS_DOC_ID) : null, [firestore]);
  const { data: firestoreSettings, loading: loadingFirestoreSettings } = useDoc<AppSettings>(settingsDocRef);
  
  const settings = useMemo(() => ({
    ...defaultSettings,
    ...(firestoreSettings || {})
  }), [firestoreSettings]);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
      if (!settingsDocRef) throw new Error("Firestore indisponível.");
      await setDoc(settingsDocRef, { ...newSettings, updatedAt: serverTimestamp() }, { merge: true });
  }, [settingsDocRef]);

  const contextValue = useMemo(() => ({
    settings, 
    updateSettings, 
    loadingSettings: loadingFirestoreSettings
  }), [settings, updateSettings, loadingFirestoreSettings]);

  return <SettingsContext.Provider value={contextValue}>{children}</SettingsContext.Provider>;
};