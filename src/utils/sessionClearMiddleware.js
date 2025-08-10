// src/utils/sessionClearMiddleware.js

/**
 * Middleware para manejar la limpieza de sesión en acceso directo por eventos
 */
export const sessionClearMiddleware = () => (next) => (action) => {
  // Verificar si es una acción de rehydratación y si debemos limpiar la sesión
  if (action.type === 'persist/REHYDRATE') {
    const shouldClear = sessionStorage.getItem('clearSessionOnRehydrate');
    
    if (shouldClear === 'true') {
      console.log('🧹 Clearing session on rehydrate due to direct event access');
      
      // Limpiar el flag
      sessionStorage.removeItem('clearSessionOnRehydrate');
      
      // Crear una acción de rehydratación vacía (limpia)
      const cleanAction = {
        ...action,
        payload: {
          // Mantener solo configuraciones críticas si es necesario
          _persist: action.payload?._persist || { version: -1, rehydrated: true }
        }
      };
      
      return next(cleanAction);
    }
  }
  
  return next(action);
};
