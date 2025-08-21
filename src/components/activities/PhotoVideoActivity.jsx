// src/components/activities/PhotoVideoActivity.jsx
import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { enqueueUpload } from "../../services/uploadQueue";

import iconPhoto from "../../assets/icono_equipo_foto.png";

const PhotoVideoActivity = ({ activity, onComplete, timeExpired }) => {
	const { t } = useTranslation();
	const [selectedMedia, setSelectedMedia] = useState(null);
	const [mediaPreview, setMediaPreview] = useState(null);
	const [showPreview, setShowPreview] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState(null);
	const fileInputRef = useRef(null);

	// Obtener datos del equipo y evento desde Redux
	const selectedTeam = useSelector((state) => state.session.selectedTeam);
	const event = useSelector((state) => state.event.event);

	// Parsear type_data
	const typeData = JSON.parse(activity.type_data);
	const isVideo = typeData.type === "1";
	const description = typeData.description;

	// Efecto para manejar cuando se agota el tiempo
	useEffect(() => {
		if (timeExpired) {
			// Limpiar recursos antes de completar
			if (mediaPreview) {
				URL.revokeObjectURL(mediaPreview);
			}
			// Tiempo agotado, completar la actividad como fallida
			onComplete(false, null);
		}
	}, [timeExpired, onComplete, mediaPreview]);

	// Efecto de limpieza al desmontar el componente
	useEffect(() => {
		return () => {
			// Limpiar URLs de objeto para evitar memory leaks
			if (mediaPreview) {
				URL.revokeObjectURL(mediaPreview);
			}
		};
	}, [mediaPreview]);

	// Función para abrir el selector de archivos/cámara
	const handleMediaClick = () => {
		setUploadError(null);
		fileInputRef.current?.click();
	};

	// Función para manejar la selección de archivo
	const handleFileSelection = (e) => {
		const file = e.target.files[0];
		if (!file) return;

		// Verificar que el tipo de archivo sea correcto
		const isValidFile = isVideo 
			? file.type.startsWith('video/') 
			: file.type.startsWith('image/');
		
		if (!isValidFile) {
			setUploadError(isVideo ? t("invalid_video_file") : t("invalid_image_file"));
			return;
		}

		// Establecer el archivo seleccionado y crear preview
		setSelectedMedia(file);
		setMediaPreview(URL.createObjectURL(file));
		setShowPreview(true);
		setUploadError(null);
	};

	// Función para confirmar y subir el medio seleccionado
	const handleConfirm = async () => {
		if (!selectedMedia) return;

		try {
			setIsUploading(true);
			setUploadError(null);
			
			// Convertir archivo a base64 usando exactamente el mismo patrón que teamPage
			const reader = new FileReader();
			reader.onload = async () => {
				const base64Data = reader.result;
				
				try {
					// Construir ruta del archivo siguiendo el patrón de teamPage
					const timestamp = Date.now();
					const event_path = "event_" + String(event.id);
					const team_path = "team_" + String(selectedTeam.id);
					const fileExtension = selectedMedia.type.split('/')[1] || (isVideo ? 'mp4' : 'jpg');
					const file_name = `activity_${activity.id}.${fileExtension}`;
					const file_path = event_path + "@" + team_path + "@" + file_name;
					
					const uploadUrl = `/${file_path}/upload`;
					
					// Usar el mismo sistema de cola que teamPage
					await enqueueUpload({
						file: base64Data,
						url: uploadUrl,
						metadata: {
							activityId: activity.id,
							timestamp: timestamp,
							type: isVideo ? 'video' : 'photo',
							source: 'device'
						},
					});
					
					// Construir la URL completa del archivo subido para guardar en data
					const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
					const fileUrl = `${baseUrl}/uploads/events/event_${event.id}/team_${selectedTeam.id}/${file_name}`;
					
					// Limpiar recursos antes de completar
					URL.revokeObjectURL(mediaPreview);
					
					// Completar actividad con éxito
					onComplete(true, {
						type: isVideo ? 'video' : 'photo',
						path: file_path,
						uploadedAt: timestamp,
						originalFile: selectedMedia.name,
						source: 'device',
						data: fileUrl
					});
					
				} catch (error) {
					console.error('Error uploading selected media:', error);
					setUploadError(t('upload_failed'));
					setIsUploading(false);
				}
			};
			
			reader.readAsDataURL(selectedMedia);
			
		} catch (error) {
			console.error('Error processing selected media:', error);
			setUploadError(t('upload_failed'));
			setIsUploading(false);
		}
	};

	// Función para volver a tomar (limpiar selección actual)
	const handleRetake = () => {
		// Limpiar URL de objeto para evitar memory leaks
		if (mediaPreview) {
			URL.revokeObjectURL(mediaPreview);
		}
		
		// Resetear todos los estados
		setSelectedMedia(null);
		setMediaPreview(null);
		setShowPreview(false);
		setUploadError(null);
		
		// Limpiar el input file para permitir seleccionar el mismo archivo de nuevo
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};



	return (
		<div className="photo-video-activity">
			{description && (
				<div className="activity-description">
					<div dangerouslySetInnerHTML={{ __html: description }} />
				</div>
			)}

			<div className="activity-instructions">
				<p>
					{isVideo
						? t("video_instruction")
						: t("photo_instruction")}
				</p>
			</div>

		<div className="capture-area">
			{showPreview && selectedMedia ? (
				<div className="media-preview">
					{isVideo ? (
						<video
							src={mediaPreview}
							controls
							className="preview-video"
							style={{ 
								width: '100%', 
								maxHeight: '400px',
								backgroundColor: '#000'
							}}
						/>
					) : (
						<img
							src={mediaPreview}
							alt="Preview"
							className="preview-image"
							style={{ 
								width: '100%', 
								maxHeight: '400px',
								objectFit: 'contain'
							}}
						/>
					)}
					<div className="preview-actions" style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '10px', marginBottom: '10px' }}>
						<button 
							onClick={handleRetake} 
							className="btn btn-secondary"
							disabled={isUploading}
						>
							{t("retake")}
						</button>
						<button 
							onClick={handleConfirm} 
							className="btn btn-primary"
							disabled={isUploading}
						>
							{isUploading ? t("uploading") : t("confirm")}
						</button>
					</div>
					{uploadError && (
						<div className="upload-error">
							<p>{uploadError}</p>
						</div>
					)}
				</div>
			) : (
				<div className="media-selector">
					<img
						src={iconPhoto}
						alt="icono foto/video"
						className="team-detail-icon"
						onClick={handleMediaClick}
					/>
					{uploadError && (
						<div className="upload-error">
							<p>{uploadError}</p>
						</div>
					)}
				</div>
			)}
		</div>

		{/* Hidden file input */}
		<input
			type="file"
			accept={isVideo ? "video/*" : "image/*"}
			onChange={handleFileSelection}
			ref={fileInputRef}
			style={{ display: "none" }}
			capture="environment"
		/>
		</div>
	);
};

export default PhotoVideoActivity;
