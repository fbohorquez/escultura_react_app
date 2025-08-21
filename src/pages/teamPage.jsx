// src/pages/teamPage.jsx
import React, { useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import BackgroundLayout from "../components/backgroundLayout";
import BackButton from "../components/backButton";
import { useLocation } from "react-router-dom";

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
	const {state} = useLocation();

	console.log(state);

  const event = useSelector((state) => state.event.event);
	const team = useSelector((state) =>
    state.teams.items.find((team) => Number(team.id) === Number(teamId))
  );
	const photo = useSelector((state) => state.session.teamPhoto);
	const token = useSelector((state) => state.session.token);

	const fileInputRef = useRef();

	// Effect para verificar si el equipo ya tiene un device y generar token automáticamente
	useEffect(() => {
		
		if (!team || !event) return;

		// Si el equipo ya tiene un device asignado, redirigir a la página de equipos
		if (team.device && team.device !== "" && team.device !== token) {
			console.log('🔒 Team already has a device assigned:', team.device);
			sessionStorage.setItem("autoSelectTeamId", team.id);
			navigate(`/teams/${event.id}`, { replace: true });
			return;
		}

		// Si no hay token en el estado, generar uno nuevo
		if (!token) {
			const generatedToken = generateTokenUniqueForDevice();
			dispatch(setToken(generatedToken));
			dispatch(setSelectedTeam(team));
			dispatch(setIsAdmin(false));
			// Actualizar Firebase inmediatamente con el nuevo token
			console.log('🔑 Generated new device token:', generatedToken);
			dispatch(
				updateTeamData({
					eventId: event.id,
					teamId: team.id,
					changes: {
						device: generatedToken,
					},
				})
			);
		}else if (!team.device || team.device === "") {
			dispatch(setToken(token));
			dispatch(setSelectedTeam(team));
			dispatch(setIsAdmin(false));
			// Si el token ya existe, actualizar Firebase
			dispatch(
				updateTeamData({
					eventId: event.id,
					teamId: team.id,
					changes: {
						device: token,
					},
				})
			);
		}
		if (localStorage.getItem("goToMap") === "true") {
			navigate(`/event/${event.id}`);
			return;
		}
	}, [team, event, token, dispatch, navigate]);

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
		try {
			let img_path = null;
			
			// Solo procesar la foto si el usuario seleccionó una
			if (photo) {
				let event_path = "event_" + String(event.id);
				let team_path = "team_" + String(team.id);
				let file_name = "photo.jpeg"
				img_path = event_path + "@" + team_path + "@" + file_name

				const uploadUrl = `/${img_path}/upload`;

				await enqueueUpload({
					file: photo,
					url: uploadUrl,
					metadata: {},
				});
			} else {
				// Usar imagen por defecto cuando no se selecciona foto
				img_path = "default_team_photo";
			}

			
			
			// El token ya debería existir en el estado (generado automáticamente al entrar)
			if (!token) {
				console.error('❌ No token available - this should not happen');
				return;
			}
			
			// Solo actualizar la foto si se cambió
			if (photo) {
				dispatch(
					updateTeamData({
						eventId: event.id,
						teamId: team.id,
						changes: {
							photo: img_path,
						},
					})
				);
			}
			
			navigate(`/event/${event.id}`);

		} catch (err) {
			console.error(err);
		}
	};

	if (!team) return <p>{t("teams.notFound")}</p>;

	return (
		<BackgroundLayout>
			{!state?.fromAutoSelect && <BackButton onClick={handleBack} />}
			<div className="team-detail">
				{(photo && <img src={photo} alt="team" className="team-preview" onClick={handlePhotoClick} />) || 
				 (team.photo && team.photo !== "default_team_photo" && (
					<img 
						src={`${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace('/api', '')}/uploads/events/event_${event.id}/team_${team.id}/photo.jpeg`} 
						alt="team" 
						className="team-preview" 
						onClick={handlePhotoClick} 
					/>
				 )) || (
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