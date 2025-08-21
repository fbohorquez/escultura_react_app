// src/utils/imageCompressionUtils.js

/**
 * Configuraciones predefinidas para compresión de imágenes
 */
export const COMPRESSION_CONFIGS = {
  THUMBNAIL: {
    maxWidth: 300,
    maxHeight: 300,
    quality: 0.7,
    format: 'image/jpeg'
  },
  MOBILE: {
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.8,
    format: 'image/jpeg'
  },
  WEB: {
    maxWidth: 1200,
    maxHeight: 900,
    quality: 0.85,
    format: 'image/jpeg'
  }
};

/**
 * Comprime una imagen usando Canvas API
 * @param {File|Blob} imageFile - Archivo de imagen a comprimir
 * @param {Object} options - Opciones de compresión
 * @param {number} options.maxWidth - Ancho máximo en píxeles
 * @param {number} options.maxHeight - Alto máximo en píxeles
 * @param {number} options.quality - Calidad de compresión (0-1)
 * @param {string} options.format - Formato de salida ('image/jpeg', 'image/png', 'image/webp')
 * @returns {Promise<Blob>} - Imagen comprimida como Blob
 */
export async function compressImage(imageFile, options = {}) {
  const {
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.8,
    format = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    // Crear imagen
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calcular nuevas dimensiones manteniendo aspect ratio
        const { width, height } = calculateOptimalDimensions(
          img.naturalWidth,
          img.naturalHeight,
          maxWidth,
          maxHeight
        );

        // Crear canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = width;
        canvas.height = height;

        // Configurar calidad de renderizado
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a Blob con compresión
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Error al comprimir la imagen'));
          }
        }, format, quality);

      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'));
    };

    // Cargar imagen
    if (imageFile instanceof File || imageFile instanceof Blob) {
      img.src = URL.createObjectURL(imageFile);
    } else if (typeof imageFile === 'string') {
      img.src = imageFile;
    } else {
      reject(new Error('Tipo de archivo no soportado'));
    }
  });
}

/**
 * Calcula dimensiones óptimas manteniendo aspect ratio
 * @param {number} originalWidth - Ancho original
 * @param {number} originalHeight - Alto original
 * @param {number} maxWidth - Ancho máximo permitido
 * @param {number} maxHeight - Alto máximo permitido
 * @returns {Object} - Nuevas dimensiones {width, height}
 */
export function calculateOptimalDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
  // Si la imagen ya es más pequeña que los límites, mantener tamaño original
  if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  // Calcular ratios
  const widthRatio = maxWidth / originalWidth;
  const heightRatio = maxHeight / originalHeight;
  
  // Usar el ratio más restrictivo para mantener aspect ratio
  const ratio = Math.min(widthRatio, heightRatio);
  
  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio)
  };
}

/**
 * Convierte un archivo a diferentes versiones comprimidas
 * @param {File|Blob} imageFile - Archivo de imagen original
 * @param {Array} configs - Array de configuraciones de compresión
 * @returns {Promise<Object>} - Objeto con las diferentes versiones
 */
export async function createImageVersions(imageFile, configs = [COMPRESSION_CONFIGS.MOBILE]) {
  const versions = {};
  
  // Siempre incluir versión original
  versions.original = imageFile;
  
  // Generar versiones comprimidas
  for (const config of configs) {
    try {
      const compressedBlob = await compressImage(imageFile, config);
      const versionName = getVersionName(config);
      versions[versionName] = compressedBlob;
    } catch (error) {
      console.warn(`Error creando versión ${JSON.stringify(config)}:`, error);
    }
  }
  
  return versions;
}

/**
 * Genera nombre de versión basado en configuración
 * @param {Object} config - Configuración de compresión
 * @returns {string} - Nombre de la versión
 */
function getVersionName(config) {
  if (config === COMPRESSION_CONFIGS.THUMBNAIL) return 'thumbnail';
  if (config === COMPRESSION_CONFIGS.MOBILE) return 'compressed';
  if (config === COMPRESSION_CONFIGS.WEB) return 'web';
  
  // Generar nombre basado en dimensiones
  return `${config.maxWidth}x${config.maxHeight}`;
}

/**
 * Obtiene información de una imagen
 * @param {File|Blob} imageFile - Archivo de imagen
 * @returns {Promise<Object>} - Información de la imagen
 */
export async function getImageInfo(imageFile) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
        size: imageFile.size
      });
    };
    
    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'));
    };
    
    if (imageFile instanceof File || imageFile instanceof Blob) {
      img.src = URL.createObjectURL(imageFile);
    } else {
      reject(new Error('Tipo de archivo no soportado'));
    }
  });
}

/**
 * Verifica si un archivo es una imagen
 * @param {File} file - Archivo a verificar
 * @returns {boolean} - True si es imagen
 */
export function isImageFile(file) {
  return file && file.type && file.type.startsWith('image/');
}

/**
 * Convierte Blob a base64
 * @param {Blob} blob - Blob a convertir
 * @returns {Promise<string>} - String base64
 */
export async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Genera sufijo para nombre de archivo según la versión
 * @param {string} versionName - Nombre de la versión
 * @param {string} originalFilename - Nombre original del archivo
 * @returns {string} - Nombre de archivo con sufijo
 */
export function generateVersionFilename(versionName, originalFilename) {
  if (versionName === 'original') {
    return originalFilename;
  }
  
  const extension = originalFilename.split('.').pop();
  const nameWithoutExtension = originalFilename.replace(`.${extension}`, '');
  
  return `${nameWithoutExtension}_${versionName}.${extension}`;
}

export default {
  COMPRESSION_CONFIGS,
  compressImage,
  calculateOptimalDimensions,
  createImageVersions,
  getImageInfo,
  isImageFile,
  blobToBase64,
  generateVersionFilename
};
