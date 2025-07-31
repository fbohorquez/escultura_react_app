// src/hooks/useTheme.js
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

const DEFAULT_PRIMARY_COLOR = 'rgb(192, 0, 31)';

/**
 * Hook personalizado para manejar el tema de colores basado en el evento actual
 * Aplica las variables CSS dinámicamente basándose en el color del evento
 */
export const useTheme = () => {
  const event = useSelector((state) => state.event.event);
  
  useEffect(() => {
    // Obtener el color del evento o usar el color por defecto
    const primaryColor = event?.color || DEFAULT_PRIMARY_COLOR;
    
    // Solo aplicar si hay un cambio real en el color
    const currentColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    if (currentColor && currentColor === primaryColor.replace(/\s/g, '')) {
      return; // No hay cambios, evitar re-aplicar
    }
    
    // Función para convertir color a diferentes formatos
    const parseColor = (color) => {
      // Si es un color en formato rgb(r,g,b)
      const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        const [, r, g, b] = rgbMatch;
        return {
          rgb: `rgb(${r}, ${g}, ${b})`,
          values: [parseInt(r), parseInt(g), parseInt(b)]
        };
      }
      
      // Si es un color en formato hexadecimal
      const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
      if (hexMatch) {
        const [, r, g, b] = hexMatch;
        const rVal = parseInt(r, 16);
        const gVal = parseInt(g, 16);
        const bVal = parseInt(b, 16);
        return {
          rgb: `rgb(${rVal}, ${gVal}, ${bVal})`,
          values: [rVal, gVal, bVal]
        };
      }
      
      // Si no se puede parsear, usar valores por defecto
      return {
        rgb: DEFAULT_PRIMARY_COLOR,
        values: [192, 0, 31]
      };
    };
    
    const colorInfo = parseColor(primaryColor);
    const [r, g, b] = colorInfo.values;
    
    // Aplicar las variables CSS al documento
    const root = document.documentElement;
    
    // Color principal
    root.style.setProperty('--primary-color', colorInfo.rgb);
    root.style.setProperty('--primary-color-values', `${r}, ${g}, ${b}`);
    
    // Variaciones del color principal
    root.style.setProperty('--primary-color-alpha-05', `rgba(${r}, ${g}, ${b}, 0.05)`);
    root.style.setProperty('--primary-color-alpha-1', `rgba(${r}, ${g}, ${b}, 0.1)`);
    root.style.setProperty('--primary-color-alpha-2', `rgba(${r}, ${g}, ${b}, 0.2)`);
    root.style.setProperty('--primary-color-alpha-3', `rgba(${r}, ${g}, ${b}, 0.3)`);
    root.style.setProperty('--primary-color-alpha-5', `rgba(${r}, ${g}, ${b}, 0.5)`);
    root.style.setProperty('--primary-color-alpha-8', `rgba(${r}, ${g}, ${b}, 0.8)`);
    root.style.setProperty('--primary-color-alpha-9', `rgba(${r}, ${g}, ${b}, 0.9)`);
    
    // Color más oscuro para hover (reduce la luminosidad un 10%)
    const darkerR = Math.max(0, Math.round(r * 0.9));
    const darkerG = Math.max(0, Math.round(g * 0.9));
    const darkerB = Math.max(0, Math.round(b * 0.9));
    root.style.setProperty('--primary-color-darker', `rgb(${darkerR}, ${darkerG}, ${darkerB})`);
    
    console.log(`🎨 Tema aplicado: Color principal ${colorInfo.rgb} para evento ${event?.name || 'Sin nombre'}`);
    
  }, [event?.color, event?.name]);
  
  return {
    primaryColor: event?.color || DEFAULT_PRIMARY_COLOR
  };
};

export default useTheme;
