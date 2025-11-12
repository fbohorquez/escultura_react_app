// src/utils/overrideNative.js
import { showAlert, showConfirm } from '../components/NativeOverrides';

// Guardar referencias a las funciones nativas originales
const originalConsoleLog = console.log;
const originalAlert = window.alert;
const originalConfirm = window.confirm;

let isInitialized = false;

/**
 * Función para restaurar las funciones nativas originales
 */
export const restoreNative = () => {
  if (!isInitialized) return;
  
  console.log = originalConsoleLog;
  window.alert = originalAlert;
  window.confirm = originalConfirm;
  
  isInitialized = false;
  console.log('Funciones nativas restauradas');
};

/**
 * Función principal para sobrescribir las funciones nativas
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.isDevelopment - Si está en modo desarrollo (por defecto usa import.meta.env.DEV)
 * @param {boolean} options.overrideConsole - Si sobrescribir console.log (por defecto true)
 * @param {boolean} options.overrideAlert - Si sobrescribir alert (por defecto true)
 * @param {boolean} options.overrideConfirm - Si sobrescribir confirm (por defecto true)
 */
export const overrideNative = (options = {}) => {
  const {
    isDevelopment = import.meta.env.DEV,
    overrideConsole = false,
    overrideAlert = true,
    overrideConfirm = true
  } = options;

  if (isInitialized) {
    console.warn('overrideNative ya ha sido inicializado. Usa restoreNative() primero si quieres reinicializar.');
    return;
  }

  // Override console.log para que solo imprima en desarrollo
  if (overrideConsole) {
    console.log = (...args) => {
      if (isDevelopment) {
        originalConsoleLog.apply(console, args);
      }
    };
  }

  // Override alert con componente React
  if (overrideAlert) {
    window.alert = (message) => {
      return showAlert(message);
    };
  }

  // Override confirm con componente React
  if (overrideConfirm) {
    window.confirm = (message) => {
      return showConfirm(message);
    };
  }

  isInitialized = true;

  if (isDevelopment) {
    originalConsoleLog('overrideNative inicializado:', {
      isDevelopment,
      overrideConsole,
      overrideAlert,
      overrideConfirm
    });
  }
};

// Función de conveniencia para inicializar automáticamente en desarrollo
export const initializeInDevelopment = () => {
  if (import.meta.env.DEV) {
    overrideNative();
  }
};

export default overrideNative;
