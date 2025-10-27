import React, { useMemo } from "react";
import { Marker } from "@react-google-maps/api";
import { useSelector } from "react-redux";
import { usePopup } from "../hooks/usePopup";
import { useTranslation } from "react-i18next";
import { isTeamActive } from "../utils/keepaliveUtils";
import { getPreferredVersionUrl } from "../services/uploadQueue";
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
  const statusRaw = keepaliveTeams?.[team.id]?.status;
  const online = isTeamActive(lastSeen) || statusRaw === 'sleep';

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

  const opacity = online || keepaliveTeams?.[team.id]?.status === "sleep" ? 1 : 0.5;

  // Foto del equipo (o placeholder)
  const photoUrl = useMemo(() => {
    if (team.photo && team.photo !== "default_team_photo") {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace("/api", "");
        const photoPath = team.photo.replace(/@/g, "/");
        const originalUrl = `${baseUrl}/uploads/events/${photoPath}`;
        
        // Obtener URL de versión comprimida con fallback a original
        const { url: optimizedUrl } = getPreferredVersionUrl(originalUrl, 'compressed');
        return optimizedUrl;
      } catch {
        return defaultTeamPhoto;
      }
    }
    return defaultTeamPhoto;
  }, [team.photo]);

  const handleClick = () => {
    const completedActivities = (team.activities_data || []).filter(a => a.complete && !a.del).length;
    let statusText;
    if (statusRaw === 'sleep') {
      statusText = t("session.screen_locked", "Pantalla bloqueada");
    } else if (online) {
      statusText = t("session.connected", "Conectado");
    } else {
      statusText = t("session.disconnected", "Desconectado");
    }

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
