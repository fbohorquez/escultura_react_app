// src/pages/mediaListPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import BackgroundLayout from "../components/backgroundLayout";
import BackButton from "../components/backButton";
import { listUploadedMedia, reuploadAllUploadedMedia } from "../services/mediaQueueService";

const MediaListPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { eventId } = useParams();
	
	const event = useSelector((state) => state.event.event);
	
	const [mediaList, setMediaList] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isReuploading, setIsReuploading] = useState(false);
	const [reuploadProgress, setReuploadProgress] = useState(null);

	const handleBack = () => {
		if (eventId) {
			navigate(`/event/${eventId}/ranking`);
		}
	};

	const loadMediaList = async () => {
		try {
			setIsLoading(true);
			const media = await listUploadedMedia();
			setMediaList(media);
		} catch (error) {
			console.error("Error loading media list:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadMediaList();
	}, []);

	const handleReuploadAll = async () => {
		if (isReuploading) return;
		
		const confirmed = window.confirm(
			t("media_list.confirm_reupload", "¿Estás seguro de que quieres resubir todos los medios? Esta operación puede tardar varios minutos.")
		);
		
		if (!confirmed) return;

		try {
			setIsReuploading(true);
			setReuploadProgress({ total: 0, processed: 0, ok: 0, fail: 0 });

			const result = await reuploadAllUploadedMedia({
				onProgress: (progress) => {
					setReuploadProgress(progress);
				}
			});

			alert(
				t("media_list.reupload_complete", 
					`Resubida completada: {{ok}} éxitos, {{fail}} fallos de {{total}} archivos`,
					{ ok: result.ok, fail: result.fail, total: result.total }
				)
			);
		} catch (error) {
			console.error("Error reuploading media:", error);
			alert(t("media_list.reupload_error", "Error durante la resubida de medios"));
		} finally {
			setIsReuploading(false);
			setReuploadProgress(null);
		}
	};

	const formatDate = (timestamp) => {
		if (!timestamp) return "--";
		return new Date(timestamp).toLocaleString();
	};

	const formatFileSize = (size) => {
		if (!size) return "--";
		if (size < 1024) return `${size} B`;
		if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
		return `${(size / (1024 * 1024)).toFixed(1)} MB`;
	};

	const getMediaTypeIcon = (kind) => {
		switch (kind) {
			case 'photo':
				return '📸';
			case 'video':
				return '🎥';
			default:
				return '📄';
		}
	};

	if (isLoading) {
		return (
			<BackgroundLayout
				title={t("media_list.title", "Listado de Medios")}
				subtitle={event?.name}
			>
				<BackButton onClick={handleBack} />
				<div className="loading-container">
					<p>{t("media_list.loading", "Cargando listado de medios...")}</p>
				</div>
			</BackgroundLayout>
		);
	}

	return (
		<BackgroundLayout
			title={t("media_list.title", "Listado de Medios")}
			subtitle={event?.name}
		>
			<BackButton onClick={handleBack} />
			
			<div className="media-list-container">
				{/* Header con estadísticas y botón de resubida */}
				<div className="media-list-header">
					<div className="media-stats">
						<div className="stat-item">
							<span className="stat-number">{mediaList.length}</span>
							<span className="stat-label">{t("media_list.total_media", "Total de archivos")}</span>
						</div>
						<div className="stat-item">
							<span className="stat-number">
								{mediaList.filter(m => m.kind === 'photo').length}
							</span>
							<span className="stat-label">{t("media_list.photos", "Fotos")}</span>
						</div>
						<div className="stat-item">
							<span className="stat-number">
								{mediaList.filter(m => m.kind === 'video').length}
							</span>
							<span className="stat-label">{t("media_list.videos", "Videos")}</span>
						</div>
					</div>

					<button 
						className={`reupload-button ${isReuploading ? 'loading' : ''}`}
						onClick={handleReuploadAll}
						disabled={isReuploading || mediaList.length === 0}
					>
						{isReuploading ? (
							<>
								<span className="loading-spinner">⏳</span>
								{t("media_list.reuploading", "Resubiendo...")}
							</>
						) : (
							<>
								<span className="reupload-icon">🔄</span>
								{t("media_list.reupload_all", "Resubir Todo")}
							</>
						)}
					</button>
				</div>

				{/* Progreso de resubida */}
				{isReuploading && reuploadProgress && (
					<div className="reupload-progress">
						<div className="progress-info">
							<span>
								{t("media_list.progress", "Progreso: {{processed}}/{{total}} - Éxitos: {{ok}}, Fallos: {{fail}}", reuploadProgress)}
							</span>
						</div>
						<div className="progress-bar">
							<div 
								className="progress-fill"
								style={{
									width: `${reuploadProgress.total > 0 ? (reuploadProgress.processed / reuploadProgress.total) * 100 : 0}%`
								}}
							/>
						</div>
					</div>
				)}

				{/* Lista de medios */}
				{mediaList.length === 0 ? (
					<div className="no-media">
						<div className="empty-icon">📱</div>
						<h3>{t("media_list.no_media", "No hay medios subidos")}</h3>
						<p>{t("media_list.no_media_desc", "Aún no se han subido fotos o videos desde este dispositivo")}</p>
					</div>
				) : (
					<div className="media-grid">
						{mediaList.map((media) => (
							<div key={media.id} className="media-item">
								<div className="media-header">
									<div className="media-type">
										<span className="type-icon">{getMediaTypeIcon(media.kind)}</span>
										<span className="type-text">
											{media.kind === 'photo' ? 
												t("media_list.photo", "Foto") : 
												t("media_list.video", "Video")
											}
										</span>
									</div>
									<div className="media-activity">
										{t("media_list.activity", "Actividad: {{id}}", { id: media.activityId })}
									</div>
								</div>

								<div className="media-details">
									<div className="detail-row">
										<span className="detail-label">{t("media_list.filename", "Archivo")}:</span>
										<span className="detail-value" title={media.originalFileName}>
											{media.originalFileName || t("media_list.unknown", "Desconocido")}
										</span>
									</div>
									<div className="detail-row">
										<span className="detail-label">{t("media_list.size", "Tamaño")}:</span>
										<span className="detail-value">{formatFileSize(media.file?.size)}</span>
									</div>
									<div className="detail-row">
										<span className="detail-label">{t("media_list.uploaded", "Subido")}:</span>
										<span className="detail-value">{formatDate(media.uploadedAt)}</span>
									</div>
									{media.lastReuploadAt && (
										<div className="detail-row">
											<span className="detail-label">{t("media_list.last_reupload", "Última resubida")}:</span>
											<span className="detail-value">{formatDate(media.lastReuploadAt)}</span>
										</div>
									)}
								</div>

								<div className="media-urls">
									{media.urls?.original && (
										<div className="url-item">
											<span className="url-label">{t("media_list.original_url", "URL original")}:</span>
											<a 
												href={media.urls.original} 
												target="_blank" 
												rel="noopener noreferrer" 
												className="url-link"
											>
												{t("media_list.view", "Ver archivo")} ↗
											</a>
										</div>
									)}
									{media.urls?.compressed && (
										<div className="url-item">
											<span className="url-label">{t("media_list.compressed_url", "URL comprimida")}:</span>
											<a 
												href={media.urls.compressed} 
												target="_blank" 
												rel="noopener noreferrer" 
												className="url-link"
											>
												{t("media_list.view_compressed", "Ver comprimida")} ↗
											</a>
										</div>
									)}
								</div>

								<div className="media-metadata">
									<div className="metadata-row">
										<span className="metadata-label">{t("media_list.event", "Evento")}:</span>
										<span className="metadata-value">{media.eventId}</span>
									</div>
									<div className="metadata-row">
										<span className="metadata-label">{t("media_list.team", "Equipo")}:</span>
										<span className="metadata-value">{media.teamId}</span>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</BackgroundLayout>
	);
};

export default MediaListPage;