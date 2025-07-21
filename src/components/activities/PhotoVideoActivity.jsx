// src/components/activities/PhotoVideoActivity.jsx
import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { enqueueUpload } from "../../services/uploadQueue";

import iconPhoto from "../../assets/icono_equipo_foto.png";

const PhotoVideoActivity = ({ activity, onComplete, timeExpired }) => {
	const { t } = useTranslation();
	const [isCapturing, setIsCapturing] = useState(false);
	const [capturedMedia, setCapturedMedia] = useState(null);
	const [stream, setStream] = useState(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState(null);
	const videoRef = useRef(null);
	const canvasRef = useRef(null);
	const mediaRecorderRef = useRef(null);
	const fileInputRef = useRef(null);
	const [recordedChunks, setRecordedChunks] = useState([]);

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
			// Tiempo agotado, completar la actividad como fallida
			onComplete(false, null);
		}
	}, [timeExpired, onComplete]);

	const handlePhotoClick = async () => {
		// Intentar acceder a la cámara primero
		try {
			const mediaStream = await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: isVideo,
			});
			setStream(mediaStream);
			if (videoRef.current) {
				videoRef.current.srcObject = mediaStream;
			}
			setIsCapturing(true);
		} catch (error) {
			console.error("Error accessing camera:", error);
			// Si no hay cámara, abrir selector de archivos directamente
			fileInputRef.current?.click();
		}
	};

	const stopCamera = () => {
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
			setStream(null);
		}
		setIsCapturing(false);
	};

	const capturePhoto = () => {
		if (videoRef.current && canvasRef.current) {
			const canvas = canvasRef.current;
			const video = videoRef.current;
			const context = canvas.getContext("2d");

			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			context.drawImage(video, 0, 0);

			// Convertir a blob
			canvas.toBlob((blob) => {
				setCapturedMedia(blob);
				stopCamera();
			}, "image/jpeg", 0.8);
		}
	};

	const startVideoRecording = () => {
		if (stream) {
			const mediaRecorder = new MediaRecorder(stream);
			mediaRecorderRef.current = mediaRecorder;
			setRecordedChunks([]);

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					setRecordedChunks((prev) => [...prev, event.data]);
				}
			};

			mediaRecorder.onstop = () => {
				const blob = new Blob(recordedChunks, { type: "video/webm" });
				setCapturedMedia(blob);
				stopCamera();
			};

			mediaRecorder.start();
		}
	};

	const stopVideoRecording = () => {
		if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
			mediaRecorderRef.current.stop();
		}
	};

	const handleCapture = () => {
		if (isVideo) {
			if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
				stopVideoRecording();
			} else {
				startVideoRecording();
			}
		} else {
			capturePhoto();
		}
	};

	const handleSubmit = async () => {
		if (!capturedMedia) return;

		try {
			setIsUploading(true);
			setUploadError(null);
			
			// Construir ruta del archivo siguiendo el patrón exacto de teamPage
			const timestamp = Date.now();
			const event_path = "event_" + String(event.id);
			const team_path = "team_" + String(selectedTeam.id);
			const fileExtension = isVideo ? 'webm' : 'jpeg';
			const file_name = `activity_${activity.id}.${fileExtension}`;
			const file_path = event_path + "@" + team_path + "@" + file_name;
			
			const uploadUrl = `/${file_path}/upload`;
			
			// Convertir Blob a base64 usando exactamente el mismo patrón que teamPage
			const reader = new FileReader();
			reader.onload = async () => {
				const base64Data = reader.result;
				
				try {
					// Usar el mismo sistema de cola que teamPage
					await enqueueUpload({
						file: base64Data,
						url: uploadUrl,
						metadata: {
							activityId: activity.id,
							timestamp: timestamp,
							type: isVideo ? 'video' : 'photo',
							source: 'camera'
						},
					});
					
					// Construir la URL completa del archivo subido para guardar en data
					const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
					const fileUrl = `${baseUrl}/uploads/events/event_${event.id}/team_${selectedTeam.id}/${file_name}`;
					
					// Completar actividad con éxito
					onComplete(true, {
						type: isVideo ? 'video' : 'photo',
						path: file_path,
						uploadedAt: timestamp,
						source: 'camera',
						data: fileUrl
					});
					
				} catch (error) {
					console.error('Error uploading captured media:', error);
					setUploadError(t('upload_failed'));
					setIsUploading(false);
				}
			};
			
			reader.readAsDataURL(capturedMedia);
			
		} catch (error) {
			console.error('Error processing captured media:', error);
			setUploadError(t('upload_failed'));
			setIsUploading(false);
		}
	};

	const handleRetake = () => {
		setCapturedMedia(null);
		setUploadError(null);
		// No reinicias automáticamente la cámara, vuelves al estado inicial
	};

	const handleFileUpload = (e) => {
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

		// Usar exactamente el mismo patrón que teamPage
		const reader = new FileReader();
		reader.onload = async () => {
			const base64Data = reader.result;
			
			try {
				setIsUploading(true);
				setUploadError(null);
				
				// Construir ruta del archivo siguiendo el patrón de teamPage
				const timestamp = Date.now();
				const event_path = "event_" + String(event.id);
				const team_path = "team_" + String(selectedTeam.id);
				const fileExtension = file.type.split('/')[1] || (isVideo ? 'mp4' : 'jpg');
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
						source: 'upload'
					},
				});
				
				// Construir la URL completa del archivo subido para guardar en data
				const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
				const fileUrl = `${baseUrl}/uploads/events/event_${event.id}/team_${selectedTeam.id}/${file_name}`;
				
				// Completar actividad con éxito
				onComplete(true, {
					type: isVideo ? 'video' : 'photo',
					path: file_path,
					uploadedAt: timestamp,
					originalFile: file.name,
					source: 'upload',
					data: fileUrl
				});
				
			} catch (error) {
				console.error('Error uploading file:', error);
				setUploadError(t('upload_failed'));
				setIsUploading(false);
			}
		};
		
		reader.readAsDataURL(file);
	};

	return (
		<div className="photo-video-activity">
			{description && (
				<div className="activity-description">
					<p>{description}</p>
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
				{capturedMedia ? (
					<div className="captured-media">
						{isVideo ? (
							<video
								controls
								src={URL.createObjectURL(capturedMedia)}
								className="captured-video"
							/>
						) : (
							<img
								src={URL.createObjectURL(capturedMedia)}
								alt="Captured"
								className="captured-photo"
							/>
						)}
						<div className="captured-actions">
							<button 
								onClick={handleRetake} 
								className="btn btn-secondary"
								disabled={isUploading}
							>
								{t("retake")}
							</button>
							<button 
								onClick={handleSubmit} 
								className="btn btn-primary"
								disabled={isUploading}
							>
								{isUploading ? t("uploading") : t("submit")}
							</button>
						</div>
						{uploadError && (
							<div className="upload-error">
								<p>{uploadError}</p>
							</div>
						)}
					</div>
				) : isCapturing ? (
					<div className="camera-view">
						<video
							ref={videoRef}
							autoPlay
							playsInline
							muted
							className="camera-video"
						/>
						<canvas ref={canvasRef} style={{ display: "none" }} />
						<div className="camera-controls">
							<button onClick={stopCamera} className="btn btn-secondary">
								{t("cancel")}
							</button>
							<button onClick={handleCapture} className="btn btn-primary capture-btn">
								{isVideo
									? mediaRecorderRef.current?.state === "recording"
										? t("stop_recording")
										: t("start_recording")
									: t("take_photo")}
							</button>
						</div>
					</div>
				) : (
					<div className="photo-selector">
						<img
							src={iconPhoto}
							alt="icono foto/video"
							className="team-detail-icon"
							onClick={handlePhotoClick}
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
				onChange={handleFileUpload}
				ref={fileInputRef}
				style={{ display: "none" }}
				capture="environment"
			/>
		</div>
	);
};

export default PhotoVideoActivity;
