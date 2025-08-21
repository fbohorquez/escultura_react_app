// src/components/popup.jsx

import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import { closeCurrentPopup } from "../features/popup/popupSlice";
import closeIcon from "../assets/close-button.svg";
import bloqueoImage from "../assets/Bloqueo.png";

const Popup = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { currentPopup, isOpen } = useSelector((state) => state.popup);

  const handleClose = () => {
    // Ejecutar callback personalizado si existe
    if (currentPopup?.onClose && typeof currentPopup.onClose === 'function') {
      currentPopup.onClose();
    }
    dispatch(closeCurrentPopup());
  };

  const handleButtonClick = (callback) => {
    if (callback && typeof callback === 'function') {
      callback();
    }
    handleClose();
  };

  const handleOverlayClick = (e) => {
    // Las actividades (tanto normales como forzadas) no se pueden cerrar con overlay
    if (currentPopup?.claseCss?.includes('popup-activity-')) {
      console.log('🚫 No se puede cerrar una actividad haciendo clic en el overlay');
      return;
    }
    
    if (e.target === e.currentTarget && currentPopup?.overlay) {
      handleClose(); // Esto ahora ejecutará el callback personalizado también
    }
  };

  if (!isOpen || !currentPopup) {
    return null;
  }

  // Verificar si es el popup de evento suspendido
  const isSuspendedEventPopup = currentPopup.titulo === "SUSPENDED_EVENT";

  if (isSuspendedEventPopup) {
    return (
      <div 
        className="popup-overlay popup-overlay-active"
        style={{ zIndex: 10000 }}
      >
        <div className="popup-container popup-layout-center" style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '400px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <img 
              src={bloqueoImage} 
              alt={t("suspend.event_suspended_title")}
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'contain'
              }}
            />
          </div>
          <h2 style={{
            color: '#d32f2f',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            marginTop: 0
          }}>
            {t("suspend.event_suspended_title")}
          </h2>
          <p style={{
            color: '#333',
            fontSize: '1rem',
            lineHeight: '1.5',
            marginBottom: '2rem'
          }}>
            {t(currentPopup.texto)}
          </p>
        </div>
      </div>
    );
  }

  const layoutClass = {
    top: "popup-layout-top",
    center: "popup-layout-center", 
    bottom: "popup-layout-bottom"
  }[currentPopup.layout] || "popup-layout-center";

  return (
    <div 
      className={`popup-overlay ${currentPopup.overlay ? 'popup-overlay-active' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className={`popup-container ${layoutClass} ${currentPopup.claseCss}`}>
        {currentPopup.close_button && (
          <button 
            className="popup-close-button"
            onClick={handleClose}
            aria-label="Cerrar popup"
          >
            <img src={closeIcon} alt="Cerrar" />
          </button>
        )}
        
        {currentPopup.titulo && (
          <div className="popup-header">
            <h2 className="popup-title">{currentPopup.titulo}</h2>
          </div>
        )}
        
        {currentPopup.texto && (
          <div className="popup-body">
            {currentPopup.isHtml ? (
              <div 
                className="popup-text"
                dangerouslySetInnerHTML={{ __html: currentPopup.texto }}
              />
            ) : (
              <p className="popup-text">{currentPopup.texto}</p>
            )}
          </div>
        )}
        
        {currentPopup.array_botones && currentPopup.array_botones.length > 0 && (
          <div className="popup-footer">
            {currentPopup.array_botones.map((boton, index) => (
              <button
                key={index}
                className="popup-button"
                onClick={() => handleButtonClick(boton.callback)}
              >
                {boton.titulo}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

Popup.propTypes = {};

export default Popup;

