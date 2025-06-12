// src/pages/teamPage.jsx
import React, { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import BackgroundLayout from "../components/backgroundLayout";
import BackButton from "../components/backButton";

import iconPhoto from "../assets/icono_equipo_foto.png";
import iconPlay from "../assets/Icon_cohete.png";
import eventDefaultLogo from "../assets/img_log_event.png";

import {
	setSelectedTeam,
	setTeamPhoto,
	setToken,
	setIsAdmin,
	generateTokenUniqueForDevice
} from "../features/session/sessionSlice";

import {updateTeamData} from "../features/teams/teamsSlice";

import { enqueueUpload } from "../services/uploadQueue";

const TeamPage = () => {
	const { t } = useTranslation();
	const { teamId } = useParams();
	const dispatch = useDispatch();
	const navigate = useNavigate();

  const event = useSelector((state) => state.event.event);
	const team = useSelector((state) =>
    state.teams.items.find((team) => Number(team.id) === Number(teamId))
  );
	const photo = useSelector((state) => state.session.teamPhoto);
	const token = useSelector((state) => state.session.token);

	const fileInputRef = useRef();

  const handleBack = () => {
		navigate(`/teams/${event.id}`, { replace: true });
	};

	const handlePhotoClick = () => {
		fileInputRef.current.click();
	};

	const onPhotoChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => {
				dispatch(setTeamPhoto(reader.result));
			};
			reader.readAsDataURL(file);
		}
	};

	const handlePlay = async () => {
		if (!photo) return;
		try {
			
			let event_path = "event_" + String(event.id);
			let team_path = "team_" + String(team.id);
			let file_name = "photo.jpeg"
			let img_path = event_path + "@" + team_path + "@" + file_name

			const uploadUrl = `/${img_path}/upload`;

			await enqueueUpload({
				file: photo,
				url: uploadUrl,
				metadata: {},
			});
			dispatch(setSelectedTeam(team));
			dispatch(setIsAdmin(false));
			let generatedToken = token;
			if (!generatedToken) {
				generatedToken = generateTokenUniqueForDevice();
				dispatch(setToken(generatedToken));
			}
			
			dispatch(
				updateTeamData({
					eventId: event.id,
					teamId: team.id,
					changes: {
						device: generatedToken,
						photo: img_path,
					},
				})
			);
			navigate(`/event/${event.id}`);

		} catch (err) {
			console.error(err);
		}
	};

	if (!team) return <p>{t("teams.notFound")}</p>;

	return (
		<BackgroundLayout>
			<BackButton onClick={handleBack} />
			<div className="team-detail">
				{(photo && <img src={photo} alt="team" className="team-preview" onClick={handlePhotoClick} />) || (
					<img
						src={iconPhoto}
						alt="icono equipo"
						className="team-detail-icon"
						onClick={handlePhotoClick}
					/>
				)}
				<input
					type="file"
					accept="image/*"
					style={{ display: "none" }}
					ref={fileInputRef}
					capture="environment"
					onChange={onPhotoChange}
				/>
				<h2 className="team-title">{team.name}</h2>
        {
          event && event.logo && (
            <img
              src={event.logo}
              alt="logo evento"
              className="team-event-logo"
            />
          ) ||
          (
            <img 
              src={eventDefaultLogo}
              alt="logo evento"
              className="team-event-logo"
            />
          )
        }
				<button onClick={handlePlay} className="play-button">
          <img
            src={iconPlay}
            alt="icono play"
            className="team-detail-icon-play"
          />
					{t("play")}
				</button>
			</div>
		</BackgroundLayout>
	);
};
















export default TeamPage;