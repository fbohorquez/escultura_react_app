// src/pages/teamsPage.jsx
import React, {useEffect} from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

import BackgroundLayout from "../components/backgroundLayout";
import BackButton from "../components/backButton";
import iconTeam from "../assets/icono_equipo.png";
import iconAdmin from "../assets/icon_admin.png";
import { initEventRoot } from "../features/event/eventSlice";

import { setIsAdmin } from "../features/session/sessionSlice";

import { useNavigate } from "react-router-dom";

const TeamsPage = () => {
	const { t } = useTranslation();

  const dispatch = useDispatch();
  const navigate = useNavigate();

	const eventState = useSelector((s) => s.event);
	const teamsState = useSelector((s) => s.teams);

	const teams = teamsState.items;

  const handleAdminClick = () => {
    dispatch(setIsAdmin(true));
		navigate(`/event/${eventState.event.id}`);
  }

  const handleTeamClick = (teamId) => {
    navigate(`/team/${teamId}`);
  }

  const handleBack = () => {
    navigate(`/events`);
  }

	useEffect(() => {
		//sessionStorage.setItem('autoSelectEventId', tokenValidation.eventId);
		let autoSelectEventId = sessionStorage.getItem('autoSelectEventId');
		if (autoSelectEventId) {
			dispatch(initEventRoot({ eventId: autoSelectEventId }));
		}
	}, [dispatch]);

	return (
		<BackgroundLayout
			title={eventState.event?.name}
			subtitle={t("teams.subtitle")}
		>
      <BackButton onClick={handleBack} />
			<div className="eventLabel"></div>
			<div className="grid">
				<div key="0" className="grid-item" onClick={handleAdminClick}>
					<img src={iconAdmin} alt="icono equipo" className="grid-item-img" />
					<div className="grid-item-details">
						<h3 className="grid-item-name">{t("admin")}</h3>
					</div>
				</div>
				{teams.filter((team) => {
          return team.device == "";
        }).map((team) => (
					<div
						key={team.id}
						className="grid-item"
						onClick={() => handleTeamClick (team.id)}
					>
						<img src={iconTeam} alt={team.name} className="grid-item-img" />
						<div className="grid-item-details">
							<h3 className="grid-item-name">{team.name}</h3>
						</div>
					</div>
				))}
			</div>
		</BackgroundLayout>
	);
};

export default TeamsPage;






