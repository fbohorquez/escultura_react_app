// src/components/NativeOverrides.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import Modal from './Modal';

let currentModal = null;

const closeModal = () => {
  if (currentModal) {
    const container = currentModal.container;
    currentModal.root.unmount();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    currentModal = null;
  }
};

export const showAlert = (message) => {
  return new Promise((resolve) => {
    closeModal(); // Cerrar modal existente si hay uno

    const container = document.createElement('div');
    document.body.appendChild(container);
    
    const root = createRoot(container);
    currentModal = { root, container };

    const handleConfirm = (result) => {
      resolve(result);
      closeModal();
    };

    root.render(
      <Modal
        type="alert"
        message={message}
        onConfirm={handleConfirm}
      />
    );
  });
};

export const showConfirm = (message) => {
  return new Promise((resolve) => {
    closeModal(); // Cerrar modal existente si hay uno

    const container = document.createElement('div');
    document.body.appendChild(container);
    
    const root = createRoot(container);
    currentModal = { root, container };

    const handleResult = (result) => {
      resolve(result);
      closeModal();
    };

    root.render(
      <Modal
        type="confirm"
        message={message}
        onConfirm={handleResult}
        onCancel={handleResult}
      />
    );
  });
};
