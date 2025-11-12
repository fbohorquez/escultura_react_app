// src/components/activities/PhotoVideoActivity.jsx
import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
// import { enqueueMultipleVersions, generateVersionUrls } from "../../services/uploadQueue";
// import { createImageVersions, isImageFile, COMPRESSION_CONFIGS } from "../../utils/imageCompressionUtils";
import { 
	enqueueMediaTask, 
	retryPendingUploads, 
	makeUploadedKey, 
	subscribeToUpload 
} from "../../services/mediaQueueService"; // ⬅️ ACTUALIZADO


// Remux MOV/quicktime -> MP4 completo (sin recomprimir) para PREVIEW
// async function remuxMovToMp4ForPreview(file) {
// 	const m = await import("@ffmpeg/ffmpeg");

// 	// Shim para soportar v0.12+ (FFmpeg class) y v0.10/0.11 (createFFmpeg)
// 	let ff, FS, run;

// 	if (m.FFmpeg) {
// 		// API nueva
// 		const inst = new m.FFmpeg();
// 		await inst.load();
// 		ff = inst;
// 		FS = (op, ...args) => {
// 			switch (op) {
// 				case "writeFile":
// 					return ff.writeFile(args[0], args[1]);
// 				case "readFile":
// 					return ff.readFile(args[0]);
// 				case "unlink":
// 					return ff.unlink ? ff.unlink(args[0]) : undefined;
// 				default:
// 					throw new Error(`FS op no soportada: ${op}`);
// 			}
// 		};
// 		run = (...argv) => ff.exec(argv);
// 	} else {
// 		// API antigua
// 		const create = m.createFFmpeg || m.default?.createFFmpeg;
// 		if (!create)
// 			throw new Error("No se encontró FFmpeg (createFFmpeg/FFmpeg).");
// 		const inst = create({ log: false });
// 		await inst.load();
// 		ff = inst;
// 		FS = (...args) => ff.FS(...args);
// 		run = (...argv) => ff.run(...argv);
// 	}

// 	// Escribir entrada (no uses fetchFile: no hace falta y evitamos dependencias)
// 	const inputU8 = new Uint8Array(await file.arrayBuffer());
// 	await FS("writeFile", "input.mov", inputU8);

// 	// Remux sin recomprimir + moov al inicio + etiqueta HEVC compatible 
// 	await run(
// 		"-hide_banner",
// 		"-loglevel", "error",
// 		"-i", "input.mov",
// 		"-ignore_unknown",
// 		"-map", "0:v:0",
// 		"-map", "0:a:0?",   // audio opcional
// 		"-c", "copy",
// 		"-movflags", "+faststart",
// 		"-map_metadata", "-1",
// 		"out.mp4"
// 	);
// 	const out = await FS("readFile", "out.mp4");

// 	// Limpieza del FS virtual (memoria en iOS)
// 	try {
// 		await FS("unlink", "input.mov");
// 	} catch {}
// 	try {
// 		await FS("unlink", "out.mp4");
// 	} catch {}

// 	// ⬅️ Importante: crear el Blob con la *vista* (Uint8Array), no con data.buffer
// 	return new Blob([out], { type: "video/mp4" });
// }
import iconPhoto from "../../assets/icono_equipo_foto.png";

const PhotoVideoActivity = ({ activity, onComplete, timeExpired }) => {
	const { t } = useTranslation();
	const [selectedMedia, setSelectedMedia] = useState(null);
	const [mediaPreview, setMediaPreview] = useState(null);
	const [showPreview, setShowPreview] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState(null);
	const fileInputRef = useRef(null);
	const videoRef = useRef(null);
	const unsubscribeRef = useRef(null); // ⬅️ Para limpiar suscripciones

	// Obtener datos del equipo y evento desde Redux
	const selectedTeam = useSelector((state) => state.session.selectedTeam);
	const event = useSelector((state) => state.event.event);

	// Parsear type_data
	const typeData = JSON.parse(activity.type_data);
	const isVideo = typeData.type === "1";
	const description = typeData.description;

	useEffect(() => {
		retryPendingUploads().catch(() => {});
	}, []);

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
			// Limpiar suscripciones de eventos
			if (unsubscribeRef.current) {
				unsubscribeRef.current();
				unsubscribeRef.current = null;
			}
		};
	}, [mediaPreview]);


	// Función para abrir el selector de archivos/cámara
	const handleMediaClick = () => {
		setUploadError(null);
		fileInputRef.current?.click();
	};

	const confirmVideoImmediately = async (file) => {
		let res = null;
		try {
			setIsUploading(true);
			setUploadError(null);

			res = await enqueueMediaTask({
				file,
				isVideo: true,
				eventId: event.id,
				teamId: selectedTeam.id,
				activityId: activity.id,
			});

			if (res?.success) {
				// Subida exitosa inmediata
				onComplete(true, res.payload);
			} else if (res?.queued) {
				// Encolada: suscribirse al evento de finalización
				const uploadId = makeUploadedKey({
					file,
					eventId: event.id,
					teamId: selectedTeam.id,
					activityId: activity.id,
					kind: "video",
				});

				// Limpiar suscripción anterior si existe
				if (unsubscribeRef.current) {
					unsubscribeRef.current();
				}

				// Suscribirse al evento de completación
				unsubscribeRef.current = subscribeToUpload(uploadId, (result) => {
					if (result.success) {
						// Subida completada exitosamente en background
						onComplete(true, result.payload);
					} else {
						// Falló definitivamente
						setUploadError(t("upload_failed"));
						setIsUploading(false);
					}
				});

				// Nota: NO llamamos a onComplete aquí
				// La actividad permanece abierta hasta que se complete la subida
				// Mantenemos isUploading=true para mostrar "Subiendo..."
			} else {
				setUploadError(t("upload_failed"));
				setIsUploading(false);
			}
		} catch (e) {
			console.error("Auto-confirm video error:", e);
			setUploadError(t("upload_failed"));
			setIsUploading(false);
		} finally {
			// permite volver a elegir el mismo fichero si hace falta
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};


	// Función para manejar la selección de archivo
	const handleFileSelection = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const isValidFile = isVideo
			? file.type.startsWith("video/")
			: file.type.startsWith("image/");
		if (!isValidFile) {
			setUploadError(
				isVideo ? t("invalid_video_file") : t("invalid_image_file")
			);
			return;
		}

		setUploadError(null);

		if (isVideo) {
			// 🚀 Vídeo: sin preview. Confirmación inmediata.
			await confirmVideoImmediately(file);
			return;
		}

		// 📷 Foto: mantenemos el flujo con preview
		try {
			setSelectedMedia(file);
			const url = URL.createObjectURL(file);
			setMediaPreview(url);
			setShowPreview(true);
		} catch {
			setSelectedMedia(file);
			setMediaPreview(null);
			setShowPreview(true);
		}
	};



	// Función para confirmar y subir el medio seleccionado
	const handleConfirm = async () => {
		if (!selectedMedia) return;
		let res = null;
		try {
			setIsUploading(true);
			setUploadError(null);

			res = await enqueueMediaTask({
				file: selectedMedia,
				isVideo,
				eventId: event.id,
				teamId: selectedTeam.id,
				activityId: activity.id,
			});

			if (res?.success) {
				// Subida exitosa inmediata
				if (mediaPreview && mediaPreview.startsWith("blob:")) {
					URL.revokeObjectURL(mediaPreview);
				}
				onComplete(true, res.payload);
			} else if (res?.queued) {
				// Encolada: suscribirse al evento de finalización
				const uploadId = makeUploadedKey({
					file: selectedMedia,
					eventId: event.id,
					teamId: selectedTeam.id,
					activityId: activity.id,
					kind: isVideo ? "video" : "photo",
				});

				// Guardar referencia al preview para limpiar después
				const previewToClean = mediaPreview;

				// Limpiar suscripción anterior si existe
				if (unsubscribeRef.current) {
					unsubscribeRef.current();
				}

				// Suscribirse al evento de completación
				unsubscribeRef.current = subscribeToUpload(uploadId, (result) => {
					// Limpiar preview cuando se complete
					if (previewToClean && previewToClean.startsWith("blob:")) {
						URL.revokeObjectURL(previewToClean);
					}

					if (result.success) {
						// Subida completada exitosamente en background
						onComplete(true, result.payload);
					} else {
						// Falló definitivamente
						setUploadError(t("upload_failed"));
						setIsUploading(false);
					}
				});

				// Nota: NO llamamos a onComplete aquí
				// La actividad permanece abierta hasta que se complete la subida
				// Mantenemos isUploading=true para mostrar "Subiendo..."
			} else {
				setUploadError(t("upload_failed"));
				setIsUploading(false);
			}
		} catch (e) {
			console.error("Error en confirm:", e);
			setUploadError(t("upload_failed"));
			setIsUploading(false);
		}
	};

	// Función auxiliar para subir solo la versión original (fallback)
	// const handleOriginalUploadFallback = async () => {
	// 	const reader = new FileReader();
	// 	reader.onload = async () => {
	// 		const base64Data = reader.result;

	// 		try {
	// 			// Construir ruta del archivo siguiendo el patrón original
	// 			const timestamp = Date.now();
	// 			const event_path = "event_" + String(event.id);
	// 			const team_path = "team_" + String(selectedTeam.id);
	// 			const fileExtension = selectedMedia.type.split('/')[1] || (isVideo ? 'mp4' : 'jpg');
	// 			const file_name = `activity_${activity.id}.${fileExtension}`;
	// 			const file_path = event_path + "@" + team_path + "@" + file_name;

	// 			const uploadUrl = `/${file_path}/upload`;

	// 			// Usar el método original de enqueue (compatibilidad)
	// 			const { enqueueUpload } = await import("../../services/uploadQueue");
	// 			await enqueueUpload({
	// 				file: base64Data,
	// 				url: uploadUrl,
	// 				metadata: {
	// 					activityId: activity.id,
	// 					timestamp: timestamp,
	// 					type: isVideo ? 'video' : 'photo',
	// 					source: 'device'
	// 				},
	// 			});

	// 			// Construir la URL completa del archivo subido para guardar en data
	// 			const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
	// 			const fileUrl = `${baseUrl}/uploads/events/event_${event.id}/team_${selectedTeam.id}/${file_name}`;

	// 			// Limpiar recursos antes de completar
	// 			URL.revokeObjectURL(mediaPreview);

	// 			// Completar actividad con éxito (método original)
	// 			onComplete(true, {
	// 				type: isVideo ? 'video' : 'photo',
	// 				path: file_path,
	// 				uploadedAt: timestamp,
	// 				originalFile: selectedMedia.name,
	// 				source: 'device',
	// 				data: fileUrl,
	// 				hasCompression: false // Indicar que no se comprimió
	// 			});

	// 		} catch (error) {
	// 			console.error('Error uploading selected media:', error);
	// 			setUploadError(t('upload_failed'));
	// 			setIsUploading(false);
	// 		}
	// 	};

	// 	reader.readAsDataURL(selectedMedia);
	// };

	// Función para volver a tomar (limpiar selección actual)
	const handleRetake = () => {
		// Limpiar URL de objeto para evitar memory leaks
		if (mediaPreview) {
			URL.revokeObjectURL(mediaPreview);
		}

		// Limpiar suscripciones de eventos si existen
		if (unsubscribeRef.current) {
			unsubscribeRef.current();
			unsubscribeRef.current = null;
		}

		// Resetear todos los estados
		setSelectedMedia(null);
		setMediaPreview(null);
		setShowPreview(false);
		setUploadError(null);
		setIsUploading(false);

		// Limpiar el input file para permitir seleccionar el mismo archivo de nuevo
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
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
				<p>{isVideo ? t("video_instruction") : t("photo_instruction")}</p>
			</div>

			<div className="capture-area">
				{showPreview && selectedMedia ? (
					<div className="media-preview">
						{isUploading ? (
							<div className="uploading-indicator" style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								width: "100%",
								minHeight: "400px",
								backgroundColor: "#f0f0f0"
							}}>
								<p style={{ fontSize: "1.2em", fontWeight: "bold" }}>{t("uploading")}</p>
							</div>
						) : isVideo ? (
							<video
								ref={videoRef}
								key={mediaPreview}
								src={mediaPreview} // ⬅️ único cambio relevante
								controls
								autoPlay
								muted
								playsInline
								preload="auto"
								className="preview-video"
								style={{
									width: "100%",
									maxHeight: "400px",
									backgroundColor: "#000",
								}}
							>
								{t?.(
									"video_not_supported",
									"Tu navegador no soporta la reproducción de vídeo"
								)}
							</video>
						) : (
							<img
								src={mediaPreview}
								alt="Preview"
								className="preview-image"
								style={{
									width: "100%",
									maxHeight: "400px",
									objectFit: "contain",
								}}
							/>
						)}
						<div
							className="preview-actions"
							style={{
								display: "flex",
								justifyContent: "space-between",
								gap: "10px",
								marginTop: "10px",
								marginBottom: "10px",
							}}
						>
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
						{isUploading ? (
							<div className="uploading-indicator">
								<p>{t("uploading")}</p>
							</div>
						) : (
							<img
								src={iconPhoto}
								alt="icono foto/video"
								className="team-detail-icon"
								onClick={handleMediaClick}
							/>
						)}
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
				disabled={isUploading}
			/>
		</div>
	);
};

export default PhotoVideoActivity;



















