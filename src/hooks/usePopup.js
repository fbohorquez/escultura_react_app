// src/hooks/usePopup.js

import { useDispatch } from "react-redux";
import { addToQueue, closeCurrentPopup, clearQueue } from "../features/popup/popupSlice";

export const usePopup = () => {
  const dispatch = useDispatch();

  const openPopup = (config) => {
    dispatch(addToQueue(config));
  };

  const closePopup = () => {
    dispatch(closeCurrentPopup());
  };

  const clearPopupQueue = () => {
    dispatch(clearQueue());
  };

  return {
    openPopup,
    closePopup,
    clearPopupQueue,
  };
};
