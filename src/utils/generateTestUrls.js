// src/utils/generateTestUrls.js

/**
 * Script para generar URLs de prueba con configuración dinámica
 * Ahora la configuración se lee al cargar la página y se guarda en localStorage
 */

const BASE_URL = 'http://localhost:5174';

// Configuraciones de prueba
const testConfigs = {
  // Logo de escultura visible (configuración por defecto)
  showLogo: {
    header: {
      showEsculturaLogo: true
    }
  },
  
  // Logo de escultura oculto
  hideLogo: {
    header: {
      showEsculturaLogo: false
    }
  },
  
  // Título e icono personalizados
  customApp: {
    app: {
      title: 'Mi Evento Personalizado',
      iconUrl: 'https://via.placeholder.com/32x32/blue/white?text=E'
    }
  },
  
  // Configuración completa personalizada
  fullCustom: {
    header: {
      showEsculturaLogo: false
    },
    app: {
      title: 'Evento Corporativo 2025',
      iconUrl: 'https://via.placeholder.com/32x32/green/white?text=C'
    }
  },
  
  // Configuración más compleja para futuras extensiones
  customConfig: {
    header: {
      showEsculturaLogo: false
    },
    app: {
      title: 'Evento Demo',
      iconUrl: 'https://via.placeholder.com/32x32/red/white?text=D'
    },
    // Aquí se pueden agregar más configuraciones en el futuro
    theme: {
      primaryColor: '#ff0000'
    }
  }
};

// Función para codificar configuración en base64
const encodeConfig = (config) => {
  return btoa(JSON.stringify(config));
};

// Generar URLs de prueba
const generateTestUrls = () => {
  console.log('=== URLs de prueba para configuración dinámica ===\n');
  
  // URL sin configuración (usando valores por defecto)
  console.log('1. URL sin configuración (valores por defecto):');
  console.log(`   ${BASE_URL}\n`);
  
  // URL con logo visible explícitamente
  console.log('2. URL con logo de escultura visible:');
  console.log(`   ${BASE_URL}?config=${encodeConfig(testConfigs.showLogo)}\n`);
  
  // URL con logo oculto
  console.log('3. URL con logo de escultura oculto:');
  console.log(`   ${BASE_URL}?config=${encodeConfig(testConfigs.hideLogo)}\n`);
  
  // URL con título e icono personalizados
  console.log('4. URL con título e icono personalizados:');
  console.log(`   ${BASE_URL}?config=${encodeConfig(testConfigs.customApp)}\n`);
  
  // URL con configuración completa personalizada
  console.log('5. URL con configuración completa personalizada:');
  console.log(`   ${BASE_URL}?config=${encodeConfig(testConfigs.fullCustom)}\n`);
  
  // URL con configuración personalizada
  console.log('6. URL con configuración de demostración:');
  console.log(`   ${BASE_URL}?config=${encodeConfig(testConfigs.customConfig)}\n`);
  
  console.log('=== Instrucciones de uso ===');
  console.log('1. Copia una de las URLs anteriores');
  console.log('2. Pégala en el navegador');
  console.log('3. La configuración se aplicará al cargar la página');
  console.log('4. Los parámetros de URL se limpiarán automáticamente');
  console.log('5. La configuración se mantendrá en localStorage hasta ser sobrescrita');
  console.log('6. Observa los cambios en:');
  console.log('   - Título de la pestaña del navegador');
  console.log('   - Icono de la pestaña (favicon)');
  console.log('   - Logo de escultura en el header\n');
  
  console.log('=== Para limpiar configuración ===');
  console.log('Ejecuta en la consola del navegador:');
  console.log('localStorage.removeItem("dynamic_config");\n');
  
  return {
    default: BASE_URL,
    showLogo: `${BASE_URL}?config=${encodeConfig(testConfigs.showLogo)}`,
    hideLogo: `${BASE_URL}?config=${encodeConfig(testConfigs.hideLogo)}`,
    customApp: `${BASE_URL}?config=${encodeConfig(testConfigs.customApp)}`,
    fullCustom: `${BASE_URL}?config=${encodeConfig(testConfigs.fullCustom)}`,
    custom: `${BASE_URL}?config=${encodeConfig(testConfigs.customConfig)}`
  };
};

// Función para verificar configuración actual
const checkCurrentConfig = () => {
  try {
    const stored = localStorage.getItem('dynamic_config');
    if (stored) {
      console.log('Configuración actual en localStorage:');
      console.log(JSON.parse(stored));
    } else {
      console.log('No hay configuración guardada en localStorage');
    }
  } catch (error) {
    console.error('Error al leer configuración:', error);
  }
};

// Exportar funciones para uso en consola
if (typeof window !== 'undefined') {
  window.generateTestUrls = generateTestUrls;
  window.checkCurrentConfig = checkCurrentConfig;
  window.clearDynamicConfig = () => {
    localStorage.removeItem('dynamic_config');
    console.log('Configuración limpiada');
  };
}

export { generateTestUrls, checkCurrentConfig };
