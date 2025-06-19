// src/hooks/useDebugMode.js
import { useState, useEffect } from 'react';

/**
 * Hook personalizado para manejar el modo debug
 * @returns {Object} - Objeto con estado y funciones del modo debug
 */
export const useDebugMode = () => {
  // Obtener el valor inicial del modo debug desde variables de entorno
  const [isDebugMode, setIsDebugMode] = useState(() => {
    const envDebugMode = import.meta.env.VITE_DEBUG_MODE;
    return envDebugMode === 'true' || envDebugMode === true;
  });

  // Función para alternar el modo debug
  const toggleDebugMode = () => {
    setIsDebugMode(prev => {
      const newMode = !prev;
      console.log(`🔧 Debug mode ${newMode ? 'ACTIVADO' : 'DESACTIVADO'}`);
      return newMode;
    });
  };

  // Función para activar el modo debug
  const enableDebugMode = () => {
    setIsDebugMode(true);
    console.log('🔧 Debug mode ACTIVADO');
  };

  // Función para desactivar el modo debug
  const disableDebugMode = () => {
    setIsDebugMode(false);
    console.log('🔧 Debug mode DESACTIVADO');
  };

  // Log del estado actual cuando cambie
  useEffect(() => {
    console.log(`🔧 Debug Mode Status: ${isDebugMode ? 'ENABLED' : 'DISABLED'}`);
  }, [isDebugMode]);

  // Atajo de teclado para activar/desactivar modo debug (Ctrl + Shift + D)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        toggleDebugMode();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return {
    isDebugMode,
    toggleDebugMode,
    enableDebugMode,
    disableDebugMode
  };
};

export default useDebugMode;
