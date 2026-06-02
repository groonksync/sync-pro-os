// ─── HOOK CENTRAL DE CONFIGURACIÓN ──────────────────────────
// Persiste en localStorage bajo 'sovereign_settings'
// Se usa en TODA la aplicación para leer/escribir settings

const STORAGE_KEY = 'sovereign_settings';

const DEFAULTS = {
  // Apariencia
  appearanceMode: 'darkGray',  // 'lightGray' | 'black' | 'darkGray'
  sidebarColor: 'same',        // 'same' | 'black' | 'lightGray' | 'darkGray'
  accentColor: '#ffffff',
  backgroundImage: null,
  backgroundBlur: 80,
  backgroundOverlayOpacity: 30,
  interfaceDensity: 'normal',  // 'compact' | 'normal' | 'comfortable'
  baseFontSize: 12,
  language: 'es',
  dateFormat: 'DD/MM/AAAA',
  timezone: 'America/La_Paz',
  currencySymbol: 'Bs.',
  currencyPosition: 'before',
  enableAnimations: true,
  highContrast: false,
  zoomLevel: 100,

  // Seguridad
  pinCode: '',
  autoLockMinutes: 0,  // 0 = off
  hideSensitiveData: false,
  
  // Préstamos
  loanDefaultInterest: 5,
  loanDefaultTerm: 6,
  loanDefaultCurrency: 'BOB',
  loanReminderDays: 3,
  loanMoraRate: 5,
  loanDefaultType: 'mensual',
  loanBankAccount: '',
  loanQrImage: null,

  // Flujo de Trabajo
  workDefaultFont: 'Inter',
  workDefaultSize: 14,
  workDefaultMargins: 'normal',
  workDefaultOrientation: 'vertical',
  workDefaultPageColor: 'dark',
  workAutosave: true,
  workAutosaveInterval: 5,

  // Editor de Video
  videoTemplatesPath: 'public/plantillas_adobe/',
  videoFolderNames: ['01_Premiere Pro', '02_After Effects', '03_Assets'],
  videoDefaultResolution: '1080p',

  // Dashboard
  dashboardWidgets: ['ingresos', 'prestamos', 'cobros', 'recordatorios', 'egresos', 'movimientos'],
  defaultView: 'dashboard',

  // Calendario
  calendarDefaultView: 'month',
  calendarWeekStart: 'monday',
  calendarShowPayments: true,

  // Notificaciones
  notificationsDesktop: true,
  notificationsSound: true,
  notificationsSoundType: 'chime',
  toastPosition: 'top-right',
  toastDuration: 4000,

  // Empresa
  businessName: '',
  businessNit: '',
  businessAddress: '',
  businessPhone: '',

  // IA
  aiProvider: 'gemini',
  geminiKey: '',
  deepseekKey: '',
  openrouterKey: '',
  openrouterModel: 'google/gemini-2.5-flash',
  aiTemperature: 0.7,
  aiMaxTokens: 2048,

  // Sistema
  isMobileMode: false,
  interfaceDensityLegacy: 'normal',
  currencyRates: { USD: 10.50, EUR: 11.20, BRL: 2.10 },
  studioName: 'Inefable Studio',
};

let cachedSettings = null;

function loadSettings() {
  if (cachedSettings) return cachedSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { cachedSettings = { ...DEFAULTS }; return cachedSettings; }
    cachedSettings = { ...DEFAULTS, ...JSON.parse(raw) };
    return cachedSettings;
  } catch {
    cachedSettings = { ...DEFAULTS };
    return cachedSettings;
  }
}

function saveSettings(settings) {
  cachedSettings = settings;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Error saving settings:', e);
  }
}

// ─── HOOK REACT ─────────────────────────────────────────────
import { useState, useCallback, useEffect } from 'react';

export function useSettings() {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateSettings = useCallback((partial) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({ ...DEFAULTS });
  }, []);

  const exportSettings = useCallback(() => {
    return JSON.stringify(settings, null, 2);
  }, [settings]);

  const importSettings = useCallback((jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const merged = { ...DEFAULTS, ...parsed };
      setSettings(merged);
      return true;
    } catch { return false; }
  }, []);

  return {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
    DEFAULTS,
  };
}

// ─── FUNCIONES SIN REACT (para usar fuera de componentes) ──
export function getSettingsSync() {
  return loadSettings();
}

export function setSettingsSync(partial) {
  const current = loadSettings();
  const merged = { ...current, ...partial };
  saveSettings(merged);
  return merged;
}

export { DEFAULTS };