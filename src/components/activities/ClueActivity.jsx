import React from "react";
import { useTranslation } from "react-i18next";
import "../../styles/ClueActivity.css";

const ClueActivity = ({ activity, onComplete, onExit, timeExpired }) => {
	const { t } = useTranslation();

	const handleComplete = () => {
		// Las actividades tipo Pista siempre son exitosas automáticamente
		onComplete(true, null);
	};

	const getClueContent = () => {
		try {
			const typeData = JSON.parse(activity.type_data || '{}');
			return typeData.description || activity.description || '';
		} catch (error) {
			console.error('Error parsing type_data:', error);
			return activity.description || '';
		}
	};

	return (
		<div className="clue-activity">
			<div className="activity-content">
				<div className="clue-content">
					<div 
						className="clue-description"
						dangerouslySetInnerHTML={{ __html: getClueContent() }}
					/>
				</div>

				<div className="activity-actions">
					{!timeExpired ? (
						<button 
							onClick={handleComplete}
							className="btn btn-primary"
						>
							{t("clue_understood")}
						</button>
					) : (
						<button 
							onClick={() => onComplete(true, null)}
							className="btn btn-primary"
						>
							{t("continue")}
						</button>
					)}
					
					<button 
						onClick={onExit}
						className="btn btn-secondary"
					>
						{t("back")}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ClueActivity;
