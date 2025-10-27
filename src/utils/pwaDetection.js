// utils/pwaDetection.js

/**
 * Detecta si la aplicación está ejecutándose como PWA (instalada)
 * @returns {boolean} true si la app está instalada como PWA
 */
export const isPWA = () => {
  // Verificar si está en standalone mode (instalada)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone === true ||
                       document.referrer.includes('android-app://');

  // Verificar si está en fullscreen mode (otra forma de PWA)
  const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;

  return isStandalone || isFullscreen;
};

/**
 * Detecta el sistema operativo del usuario
 * @returns {string} 'ios', 'android', 'desktop' o 'unknown'
 */
export const getOperatingSystem = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  // iOS detection
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'ios';
  }

  // Android detection
  if (/android/i.test(userAgent)) {
    return 'android';
  }

  // Desktop detection (Windows, macOS, Linux)
  if (/Windows NT|Macintosh|Linux/.test(userAgent)) {
    return 'desktop';
  }

  return 'unknown';
};

/**
 * Obtiene las instrucciones específicas para instalar la PWA según el OS
 * @returns {object} Objeto con título e instrucciones para instalar
 */
export const getInstallInstructions = () => {
  const os = getOperatingSystem();

  switch (os) {
    case 'ios':
      return {
        title: 'Instalar aplicación en iOS',
        instructions: [
          '1. Toca el botón de compartir (el cuadrado con una flecha hacia arriba)',
          '2. Desplázate hacia abajo y selecciona "Agregar a pantalla de inicio"',
          '3. Toca "Agregar" en la esquina superior derecha',
          '4. La aplicación aparecerá en tu pantalla de inicio'
        ]
      };

    case 'android':
      return {
        title: 'Instalar aplicación en Android',
        instructions: [
          '1. Toca el menú (tres puntos) en la esquina superior derecha de Chrome',
          '2. Selecciona "Agregar a pantalla de inicio" o "Instalar aplicación"',
          '3. Toca "Agregar" o "Instalar" cuando aparezca el mensaje',
          '4. La aplicación aparecerá en tu pantalla de inicio'
        ]
      };

    case 'desktop':
      return {
        title: 'Instalar aplicación en escritorio',
        instructions: [
          '1. Busca el icono de instalación en la barra de direcciones del navegador',
          '2. Haz clic en el icono o en el menú (tres puntos) del navegador',
          '3. Selecciona "Instalar [nombre de la aplicación]"',
          '4. La aplicación se instalará como una aplicación nativa'
        ]
      };

    default:
      return {
        title: 'Instalar aplicación',
        instructions: [
          '1. Busca la opción "Agregar a pantalla de inicio" o "Instalar aplicación" en tu navegador',
          '2. Sigue las instrucciones que aparezcan en pantalla',
          '3. La aplicación quedará instalada en tu dispositivo'
        ]
      };
  }
};
