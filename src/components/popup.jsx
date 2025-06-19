// src/components/popup.jsx

import React from "react";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import { closeCurrentPopup } from "../features/popup/popupSlice";
import closeIcon from "../assets/close-button.svg";

const Popup = () => {
  const dispatch = useDispatch();
  const { currentPopup, isOpen } = useSelector((state) => state.popup);

  const handleClose = () => {
    dispatch(closeCurrentPopup());
  };

  const handleButtonClick = (callback) => {
    if (callback && typeof callback === 'function') {
      callback();
    }
    handleClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && currentPopup?.overlay) {
      handleClose();
    }
  };

  if (!isOpen || !currentPopup) {
    return null;
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
            <p className="popup-text">{currentPopup.texto}</p>
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

