// src/components/Modal.jsx
import React from 'react';

const Modal = ({ type, message, onConfirm, onCancel }) => {
  const handleConfirm = () => {
    onConfirm(true);
  };

  const handleCancel = () => {
    if (onCancel) onCancel(false);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <div 
      className="native-override-modal-backdrop" 
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}
    >
      <div 
        className="native-override-modal"
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          minWidth: '300px',
          maxWidth: '500px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div 
          className="native-override-modal-message"
          style={{
            marginBottom: '20px',
            fontSize: '16px',
            lineHeight: '1.4'
          }}
        >
          {message}
        </div>
        
        <div 
          className="native-override-modal-buttons"
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end'
          }}
        >
          {type === 'confirm' && (
            <button
              onClick={handleCancel}
              style={{
                padding: '8px 16px',
                border: '1px solid #ccc',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                cursor: 'pointer',
                color: 'var(--primary-color, #007bff)',
              }}
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleConfirm}
            style={{
              padding: '8px 16px',
              border: 'none',
              backgroundColor: 'var(--primary-color, #007bff)',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {type === 'confirm' ? 'Aceptar' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
