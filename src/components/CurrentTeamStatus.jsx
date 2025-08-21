import React from 'react';
import { useSelector } from 'react-redux';
import { getAppStateLabel } from '../constants/appStates';
import '../styles/CurrentTeamStatus.css';

const CurrentTeamStatus = () => {
  const { appState, currentActivity } = useSelector(state => state.keepalive);
  const selectedTeam = useSelector(state => state.session.selectedTeam);
  const isAdmin = useSelector(state => state.session.isAdmin);

  // No mostrar para admins
  if (isAdmin || !selectedTeam) {
    return null;
  }

  const stateLabel = getAppStateLabel(appState, currentActivity?.name);

  return (
    <div className="current-team-status">
      <div className="status-icon">
        📍
      </div>
      <div className="status-info">
        <span className="team-name">Equipo {selectedTeam.name}</span>
        <span className="status-label">{stateLabel}</span>
      </div>
    </div>
  );
};

export default CurrentTeamStatus;
