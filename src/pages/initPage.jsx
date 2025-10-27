// pages/initPage.jsx
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import useDynamicConfig from '../hooks/useDynamicConfig';
import { isPWA, getInstallInstructions } from '../utils/pwaDetection';
import '../styles/initPage.css';

const DEFAULT_COLOR = "#8787A1";

const parseColorToRgb = (color) => {
  if (!color) return null;
  const trimmed = color.trim();

  if (/^#/.test(trimmed)) {
    let hex = trimmed.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((char) => char + char).join('');
    }

    if (hex.length !== 6) return null;

    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    if ([r, g, b].some((value) => Number.isNaN(value))) {
      return null;
    }

    return { r, g, b };
  }

  const rgbMatch = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch.map((value) => parseInt(value, 10));
    if ([r, g, b].some((value) => Number.isNaN(value))) {
      return null;
    }
    return { r, g, b };
  }

  return null;
};

const adjustColorBrightness = ({ r, g, b }, amount) => {
  const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)));

  if (amount === 0) {
    return {
      r: clamp(r),
      g: clamp(g),
      b: clamp(b),
    };
  }

  if (amount > 0) {
    return {
      r: clamp(r + (255 - r) * amount),
      g: clamp(g + (255 - g) * amount),
      b: clamp(b + (255 - b) * amount),
    };
  }

  return {
    r: clamp(r * (1 + amount)),
    g: clamp(g * (1 + amount)),
    b: clamp(b * (1 + amount)),
  };
};

const toCssColor = ({ r, g, b }) => `rgb(${r}, ${g}, ${b})`;

const buildPalette = (baseColor) => {
  const parsed = parseColorToRgb(baseColor) || parseColorToRgb(DEFAULT_COLOR);
  const primary = toCssColor(parsed);
  const light = toCssColor(adjustColorBrightness(parsed, 0.2));
  const dark = toCssColor(adjustColorBrightness(parsed, -0.2));

  return {
    primary,
    light,
    dark,
    gradient: `linear-gradient(135deg, ${light} 0%, ${dark} 100%)`,
  };
};

const InitPage = () => {
  const config = useDynamicConfig();
  const event = useSelector((state) => state.event.event);
  const isPWAInstalled = isPWA();
  const installInstructions = getInstallInstructions();

  const palette = useMemo(() => {
    const eventColor = event?.color;
    const manifestColor = config?.app?.manifestBlob?.background_color || config?.app?.manifestBlob?.theme_color;
    const baseColor = eventColor || manifestColor || DEFAULT_COLOR;
    return buildPalette(baseColor);
  }, [config?.app?.manifestBlob?.background_color, config?.app?.manifestBlob?.theme_color, event?.color]);

  const iconUrl = config?.app?.iconUrl;
  const appTitle = config?.app?.title || 'Escultura Eventos';
  const iconFallbackLetter = appTitle.charAt(0).toUpperCase();

  const handleContinue = () => {
    // Navegar a la ruta raíz manteniendo los mismos parámetros de la URL
    window.location.href = window.location.href.replace(/\/init(.*)/, '/$1');
  };

  return (
    <div
      className="init-page"
      style={{
        '--init-primary': palette.primary,
        '--init-primary-light': palette.light,
        '--init-primary-dark': palette.dark,
        '--init-primary-gradient': palette.gradient,
      }}
    >
      <div className="init-container">
        <div className="init-content">
          {isPWAInstalled ? (
            // Mensaje de bienvenida para PWA instalada
            <div className="welcome-section">
              <div className="event-badge">
                <div className="event-icon" aria-hidden={!iconUrl}>
                  {iconUrl ? (
                    <img src={iconUrl} alt={`Icono del evento ${appTitle}`} />
                  ) : (
                    <span className="event-icon-fallback">{iconFallbackLetter}</span>
                  )}
                </div>
                <div className="event-title-group">
                  <small className="event-label">Evento</small>
                  <span className="event-title">{appTitle}</span>
                </div>
              </div>
              <div className="welcome-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h1>¡Bienvenido!</h1>
              <p>Puedes continuar para acceder al evento</p>
              <button 
                className="continue-button"
                onClick={handleContinue}
              >
                Continuar
              </button>
            </div>
          ) : (
            // Instrucciones de instalación para navegador web
            <div className="install-section">
              <div className="event-badge">
                <div className="event-icon" aria-hidden={!iconUrl}>
                  {iconUrl ? (
                    <img src={iconUrl} alt={`Icono del evento ${appTitle}`} />
                  ) : (
                    <span className="event-icon-fallback">{iconFallbackLetter}</span>
                  )}
                </div>
                <div className="event-title-group">
                  <small className="event-label">Evento</small>
                  <span className="event-title">{appTitle}</span>
                </div>
              </div>
              <div className="install-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
              </div>
              <h1>{installInstructions.title}</h1>
              <p>Para una mejor experiencia, te recomendamos instalar esta aplicación en tu dispositivo:</p>
              
              <div className="instructions-list">
                {installInstructions.instructions.map((instruction, index) => (
                  <div key={index} className="instruction-item">
                    <span className="instruction-number">{index + 1}</span>
                    <span className="instruction-text">{instruction}</span>
                  </div>
                ))}
              </div>

              <div className="action-buttons">
                <button 
                  className="continue-button primary"
                  onClick={handleContinue}
                >
                  Continuar en el navegador
                </button>
                <div className="install-hint">
                  <small>O instala la aplicación siguiendo las instrucciones de arriba</small>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InitPage;

