// src/components/popupExample.jsx

import React from "react";
import { usePopup } from "../hooks/usePopup";

const PopupExample = () => {
  const { openPopup, closePopup, clearPopupQueue } = usePopup();

  const handleSimplePopup = () => {
    openPopup({
      titulo: "Popup Simple",
      texto: "Este es un ejemplo de popup básico.",
      array_botones: [
        {
          titulo: "Aceptar",
          callback: () => console.log("Aceptar presionado")
        }
      ]
    });
  };

  const handleConfirmPopup = () => {
    openPopup({
      titulo: "Confirmar Acción",
      texto: "¿Está seguro de que desea continuar?",
      array_botones: [
        {
          titulo: "Cancelar",
          callback: () => console.log("Cancelado")
        },
        {
          titulo: "Confirmar",
          callback: () => console.log("Confirmado")
        }
      ],
      layout: "center"
    });
  };

  const handleTopPopup = () => {
    openPopup({
      titulo: "Popup Superior",
      texto: "Este popup aparece en la parte superior.",
      layout: "top",
      claseCss: "custom-popup"
    });
  };

  const handleBottomPopup = () => {
    openPopup({
      titulo: "Popup Inferior",
      texto: "Este popup aparece en la parte inferior.",
      layout: "bottom",
      close_button: false,
      array_botones: [
        {
          titulo: "Cerrar",
          callback: () => console.log("Cerrado desde botón")
        }
      ]
    });
  };

  const handleMultiplePopups = () => {
    openPopup({
      titulo: "Primer Popup",
      texto: "Este es el primer popup de la cola.",
      array_botones: [{ titulo: "Siguiente", callback: () => {} }]
    });
    
    openPopup({
      titulo: "Segundo Popup",
      texto: "Este es el segundo popup que aparecerá después.",
      array_botones: [{ titulo: "Finalizar", callback: () => {} }]
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Ejemplos de Popup</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "300px" }}>
        <button onClick={handleSimplePopup}>Popup Simple</button>
        <button onClick={handleConfirmPopup}>Popup de Confirmación</button>
        <button onClick={handleTopPopup}>Popup Superior</button>
        <button onClick={handleBottomPopup}>Popup Inferior</button>
        <button onClick={handleMultiplePopups}>Múltiples Popups</button>
        <button onClick={closePopup}>Cerrar Popup Actual</button>
        <button onClick={clearPopupQueue}>Limpiar Cola</button>
      </div>
    </div>
  );
};

export default PopupExample;
