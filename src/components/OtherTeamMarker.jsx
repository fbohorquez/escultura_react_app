import React, { useMemo } from "react";
import { Marker } from "@react-google-maps/api";
import { useSelector } from "react-redux";
import { usePopup } from "../hooks/usePopup";
import { useTranslation } from "react-i18next";
import { isTeamActive, formatLastSeen } from "../utils/keepaliveUtils";
import defaultTeamPhoto from "../assets/icono_equpo@2x.png";

// Cargar assets de equipos (Equipo_0.png a Equipo_29.png)
const teamAssets = (() => {
  const assets = {};
  for (let i = 0; i <= 29; i++) {
    try {
      assets[i] = new URL(`../assets/Equipo_${i}.png`, import.meta.url).href;
    } catch {
      // ignorar si no existe
    }
  }
  return assets;
})();

const OtherTeamMarker = ({ team, index, onMarkerLoad }) => {
  const { openPopup } = usePopup();
  const { t } = useTranslation();

  // Estado de conexión vía keepalive
  const keepaliveTeams = useSelector((state) => state.keepalive?.teams || {});
  const lastSeen = keepaliveTeams?.[team.id]?.lastSeen;
  const online = isTeamActive(lastSeen);

  // Datos del evento para contar actividades totales
  const totalActivities = useSelector((state) => state.event.event?.activities_data?.length || 0);

  // Icono del equipo según el número en el nombre
  const iconConfig = useMemo(() => {
    // Extraer número del nombre del equipo
    const teamNumberMatch = team.name?.match(/(\d+)/);
    let teamNumber = teamNumberMatch ? parseInt(teamNumberMatch[1], 10) : null;
    
    // Si encontramos un número válido, usamos el icono correspondiente
    // Los iconos van de Equipo_0.png (equipo 1) a Equipo_29.png (equipo 30)
    let iconIndex;
    if (teamNumber && teamNumber >= 1 && teamNumber <= 30) {
      iconIndex = teamNumber - 1; // Equipo 1 -> Equipo_0.png
    } else {
      iconIndex = index % 30; // Fallback al comportamiento anterior
    }
    
    const baseUrl = teamAssets[iconIndex] || "/icons/marker-team.png";
    return {
      url: baseUrl,
      scaledSize: new window.google.maps.Size(20, 20),
      anchor: new window.google.maps.Point(10, 10),
    };
  }, [team.name, index]);

  const opacity = online ? 1 : 0.5;

  // Foto del equipo (o placeholder)
  const photoUrl = useMemo(() => {
    if (team.photo && team.photo !== "default_team_photo") {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace("/api", "");
        const photoPath = team.photo.replace(/@/g, "/");
        return `${baseUrl}/uploads/events/${photoPath}`;
      } catch {
        return defaultTeamPhoto;
      }
    }
    return defaultTeamPhoto;
  }, [team.photo]);

  const handleClick = () => {
    const completedActivities = (team.activities_data || []).filter(a => a.complete && !a.del).length;
    const statusText = online ? t("session.connected", "Conectado") : t("session.disconnected", "Desconectado");
    const lastSeenText = lastSeen ? formatLastSeen(lastSeen) : t("never", "Nunca");

    openPopup({
      titulo: team.name,
      texto: `
        <div class="team-info-popup">
          ${photoUrl ? `<img src="${photoUrl}" alt="${team.name}" class="team-photo-preview" onerror="this.src='${defaultTeamPhoto}'" />` : ''}
          <div class="team-stats">
            <p><strong>${t("ranking.points", "Puntos")}:</strong> ${team.points || 0}</p>
            <p><strong>${t("team_activities.completed", "Completadas")}:</strong> ${completedActivities}/${totalActivities}</p>
            <p><strong>${t("session.device", "Dispositivo")}:</strong> ${statusText}</p>
          </div>
        </div>
      `,
      isHtml: true,
      array_botones: [
        { titulo: t("close", "Cerrar"), callback: null }
      ],
      overlay: true,
      close_button: true,
      layout: "center"
    });
  };

  return (
    <Marker
      position={{ lat: team.lat, lng: team.lon }}
      icon={iconConfig}
      opacity={opacity}
      onClick={handleClick}
      onLoad={(marker) => onMarkerLoad && onMarkerLoad(marker)}
    />
  );
};

export default React.memo(OtherTeamMarker);
