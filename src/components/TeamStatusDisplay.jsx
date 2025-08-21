import React from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { getActiveTeams, formatLastSeen } from '../utils/keepaliveUtils';
import '../styles/TeamStatusDisplay.css';

const TeamStatusDisplay = () => {
  const { t } = useTranslation();
  const teams = useSelector(state => state.keepalive.teams);
  const activeTeams = getActiveTeams(teams);

  if (activeTeams.length === 0) {
    return null;
  }

  return (
    <div className="team-status-display">
      <h3 className="team-status-title">
        {t('teams.status.title', 'Estado de equipos')} ({activeTeams.length})
      </h3>
      <div className="team-status-list">
        {activeTeams.map(team => (
          <div key={team.teamId} className="team-status-item">
            <div className="team-status-info">
              <span className="team-id">Equipo {team.teamId}</span>
              <span className="team-state">{team.appStateLabel}</span>
            </div>
            <div className="team-status-meta">
              <span className="team-last-seen">{formatLastSeen(team.lastSeen)}</span>
              <div className="team-status-indicator online"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamStatusDisplay;
