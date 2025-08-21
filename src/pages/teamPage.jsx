// src/pages/teamPage.jsx
import React, { useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import BackgroundLayout from "../components/backgroundLayout";
import BackButton from "../components/backButton";
import { TeamPhoto } from "../components/OptimizedImage";
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

import { enqueueUpload, enqueueMultipleVersions, generateVersionUrls } from "../services/uploadQueue";
import { createImageVersions, isImageFile, COMPRESSION_CONFIGS, blobToBase64 } from "../utils/imageCompressionUtils";

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
				const event_path = "event_" + String(event.id);
				const team_path = "team_" + String(team.id);
				const file_name = "photo.jpeg";
				const basePath = `/${event_path}@${team_path}@photo`;
				
				try {
					// Convertir base64 a Blob para procesamiento
					const response = await fetch(photo);
					const photoBlob = await response.blob();
					
					// Verificar si es imagen y crear versiones comprimidas
					if (isImageFile(photoBlob)) {
						// Crear versiones comprimidas de la imagen
						const imageVersions = await createImageVersions(photoBlob, [
							COMPRESSION_CONFIGS.MOBILE
						]);
						
						// Subir todas las versiones (agregando extensión jpeg)
						await enqueueMultipleVersions(imageVersions, basePath, 'jpeg', {
							teamId: team.id,
							eventId: event.id,
							type: 'team_photo',
							timestamp: Date.now()
						});
						
						// Usar path base para el estado (compatible con código existente)
						img_path = `${event_path}@${team_path}@photo.jpeg`;
						
					} else {
						// Fallback al método original si no es imagen válida
						img_path = event_path + "@" + team_path + "@" + file_name;
						const uploadUrl = `/${img_path}/upload`;

						await enqueueUpload({
							file: photo,
							url: uploadUrl,
							metadata: {
								teamId: team.id,
								eventId: event.id,
								type: 'team_photo'
							},
						});
					}
					
				} catch (compressionError) {
					console.warn('Error en compresión de foto de equipo, usando método original:', compressionError);
					// Fallback al método original si falla la compresión
					img_path = event_path + "@" + team_path + "@" + file_name;
					const uploadUrl = `/${img_path}/upload`;

					await enqueueUpload({
						file: photo,
						url: uploadUrl,
						metadata: {
							teamId: team.id,
							eventId: event.id,
							type: 'team_photo'
						},
					});
				}
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
				{/* Si hay foto seleccionada (preview), mostrarla */}
				{photo ? (
					<img src={photo} alt="team" className="team-preview" onClick={handlePhotoClick} />
				) : (
					/* Si el equipo tiene foto guardada, usar componente optimizado */
					team.photo && team.photo !== "default_team_photo" ? (
						<TeamPhoto
							eventId={event.id}
							teamId={team.id}
							alt="Foto del equipo"
							onClick={handlePhotoClick}
							style={{ cursor: 'pointer' }}
						/>
					) : (
						/* Icono por defecto si no hay foto */
						<img
							src={iconPhoto}
							alt="icono equipo"
							className="team-detail-icon"
							onClick={handlePhotoClick}
						/>
					)
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