// src/components/GadgetSelector.jsx
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
	setSelectedGadget,
	setShowGadgetSelector,
	setShowTeamSelector,
} from "../features/gadgets/gadgetsSlice";

const GadgetSelector = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	
	const { availableGadgets, showGadgetSelector } = useSelector((state) => state.gadgets);

	const handleGadgetSelect = (gadgetId) => {
		dispatch(setSelectedGadget(gadgetId));
		dispatch(setShowGadgetSelector(false));
		dispatch(setShowTeamSelector(true));
	};

	const handleClose = () => {
		dispatch(setShowGadgetSelector(false));
	};

	if (!showGadgetSelector || !availableGadgets) return null;

	return (
		<div className="gadget-selector-overlay">
			<div className="gadget-selector-modal">
				<div className="gadget-selector-header">
					<h3>{t("gadgets.select_gadget", "Seleccionar Gadget")}</h3>
					<button 
						className="gadget-close-btn"
						onClick={handleClose}
						aria-label={t("close", "Cerrar")}
					>
						&times;
					</button>
				</div>
				
				<div className="gadget-selector-content">
					<p className="gadget-selector-description">
						{t("gadgets.select_description", "Elige el gadget que quieres enviar a otro equipo:")}
					</p>
					
					<div className="gadgets-list">
						{Object.values(availableGadgets).map((gadget) => (
							<div
								key={gadget.id}
								className="gadget-option"
								onClick={() => handleGadgetSelect(gadget.id)}
							>
								<div className="gadget-info">
									<h4 className="gadget-name">{gadget.name}</h4>
									<p className="gadget-description">{gadget.description}</p>
									{/* <small className="gadget-cooldown">
										{t("gadgets.cooldown", "Cooldown")}: {gadget.cooldownMinutes} min
									</small> */}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default GadgetSelector;
