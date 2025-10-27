import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import BackgroundLayout from '../components/backgroundLayout';
import BackButton from '../components/backButton';
import StatusCard, { StatusRow, StatusBadge, StatusGrid } from '../components/systemStatus/StatusCard';
import { runSystemDiagnostic, selectSystemStatus, selectBasicInfo, selectConnections, requestPermissionGeolocation, requestPermissionNotifications, requestPermissionCamera, requestPermissionMicrophone, requestPermissionMotion, startKeepaliveScreenLockTest, finishKeepaliveScreenLockTest } from '../features/systemStatus/systemStatusSlice';
import { checkActivities, getActivitySummary, activityStatusLabel } from '../utils/activityCheck';

const SystemStatusPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Estado para tiempo de sesión
  const [sessionStartTime] = useState(() => {
    const stored = localStorage.getItem('sessionStartTime');
    return stored ? parseInt(stored) : Date.now();
  });
  
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Datos del estado global de la aplicación
  const event = useSelector((state) => state.event.event);
  const selectedTeam = useSelector((state) => state.session.selectedTeam);
  const isAdmin = useSelector((state) => state.session.isAdmin);
  const sessionToken = useSelector((state) => state.session.token);
  
  // Datos del sistema de diagnósticos
  const systemStatus = useSelector(selectSystemStatus);
  const basicInfo = useSelector(selectBasicInfo);
  const connections = useSelector(selectConnections);
  // healthStats ya no necesario para permisos; se usa snapshot directo
  
  // Extraer connectivity de connections para usar en la UI
  const connectivity = connections;

  const [activityCheckState, setActivityCheckState] = useState({
    status: 'idle',
    results: [],
    error: null,
    lastRun: null
  });

  const activities = event?.activities_data;
  const hasActivities = useMemo(() => Array.isArray(activities) && activities.length > 0, [activities]);

  const activityCheckSummary = useMemo(() => getActivitySummary(activityCheckState.results), [activityCheckState.results]);

  const performActivityCheck = useCallback(async () => {
    if (!hasActivities) {
      return { status: 'empty', results: [], error: null };
    }

    try {
      const results = await checkActivities(activities);
      return { status: 'success', results, error: null };
    } catch (error) {
      return {
        status: 'error',
        results: [],
        error: error?.message || 'No se pudieron ejecutar las validaciones'
      };
    }
  }, [activities, hasActivities]);

  // Efecto para inicializar diagnósticos del sistema
  useEffect(() => {
    console.log('🔍 Inicializando diagnósticos del sistema...');
    // Ejecutar diagnóstico inicial
    dispatch(runSystemDiagnostic());
    
    // Guardar tiempo de inicio de sesión
    if (!localStorage.getItem('sessionStartTime')) {
      localStorage.setItem('sessionStartTime', sessionStartTime.toString());
    }
  }, [dispatch, sessionStartTime]);

  // Efecto para actualizar el tiempo cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const runChecks = async () => {
      if (!hasActivities) {
        setActivityCheckState({
          status: 'empty',
          results: [],
          error: null,
          lastRun: Date.now()
        });
        return;
      }

      setActivityCheckState((prev) => ({ ...prev, status: 'loading', error: null }));
      const outcome = await performActivityCheck();

      if (!cancelled) {
        setActivityCheckState({
          status: outcome.status,
          results: outcome.status === 'error' ? [] : outcome.results,
          error: outcome.error,
          lastRun: Date.now()
        });
      }
    };

    runChecks();

    return () => {
      cancelled = true;
    };
  }, [hasActivities, performActivityCheck]);

  const handleActivityCheckRefresh = useCallback(async () => {
    if (!hasActivities) {
      setActivityCheckState({
        status: 'empty',
        results: [],
        error: null,
        lastRun: Date.now()
      });
      return;
    }

    setActivityCheckState((prev) => ({ ...prev, status: 'loading', error: null }));
    const outcome = await performActivityCheck();
    setActivityCheckState({
      status: outcome.status,
      results: outcome.status === 'error' ? [] : outcome.results,
      error: outcome.error,
      lastRun: Date.now()
    });
  }, [hasActivities, performActivityCheck]);

  // Calcular tiempo de sesión activa
  const getSessionDuration = () => {
    const duration = currentTime - sessionStartTime;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleBack = () => {
    if (event?.id) {
      navigate(`/event/${event.id}`);
    } else {
      navigate('/');
    }
  };

  // Función para actualizar diagnósticos
  const handleRefresh = () => {
    if (!systemStatus.loading) {
      dispatch(runSystemDiagnostic());
    }
  };

  // Test de bloqueo de pantalla para keepalive
  const [lockTestRunning, setLockTestRunning] = useState(false);
  const [lockTestRemaining, setLockTestRemaining] = useState(0);
  const LOCK_TEST_DURATION_MS = 5 * 60 * 1000; // 5 minutos
  useEffect(() => {
    let timer;
    if (lockTestRunning) {
      timer = setInterval(() => {
        setLockTestRemaining(prev => Math.max(0, prev - 1000));
      }, 1000);
    }
    return () => timer && clearInterval(timer);
  }, [lockTestRunning]);

  const startLockTest = () => {
    if (lockTestRunning) return;
    dispatch(startKeepaliveScreenLockTest());
    setLockTestRunning(true);
    setLockTestRemaining(LOCK_TEST_DURATION_MS);
    alert('Inicia la prueba: Bloquea el dispositivo ahora y mantenlo bloqueado ~5 minutos. Al volver, pulsa "He vuelto".');
  };

  const finishLockTest = () => {
    dispatch(finishKeepaliveScreenLockTest());
    setLockTestRunning(false);
    dispatch(runSystemDiagnostic());
  };

  const formatMs = (ms) => {
    const m = Math.floor(ms/60000);
    const s = Math.floor((ms%60000)/1000);
    return `${m}:${s.toString().padStart(2,'0')}`;
  };

  return (
    <BackgroundLayout
      title="Información del sistema"
      subtitle={event?.name || "Diagnóstico del sistema"}
    >
      <BackButton onClick={handleBack} />
      
      {/* Botón de refresh */}
              {/* Botón de refresh mejorado */}
        <div className="system-status-actions">
          <button 
            className={`refresh-button ${systemStatus.loading ? 'loading' : ''}`}
            onClick={handleRefresh}
            disabled={systemStatus.loading}
            title="Actualizar diagnósticos del sistema"
          >
            <span className="refresh-icon">🔄</span>
            <span className="refresh-text">
              {systemStatus.loading ? 'Actualizando...' : 'Actualizar'}
            </span>
          </button>
        </div>

      {/* Contenido principal */}
      <div className="system-status-content">
        
        {/* Info de contexto actual */}
        <StatusCard title="Contexto de la Sesión" icon="📍" size="small">
          <StatusGrid columns="3" gap="small">
            <StatusRow 
              label="Evento" 
              value={event?.name || 'No seleccionado'} 
            />
            <StatusRow 
              label="Modo" 
              value={
                <StatusBadge 
                  status={isAdmin ? "info" : "success"}
                  value={isAdmin ? 'Administrador' : 'Equipo'}
                />
              } 
            />
            <StatusRow 
              label="Equipo" 
              value={selectedTeam?.name || 'Ninguno'} 
            />
          </StatusGrid>
        </StatusCard>

        {/* Grid principal de secciones */}
        <StatusGrid columns="2" gap="normal">
          
          {/* Sección: Información del Sistema */}
          <StatusCard title="Información del Sistema" icon="📋">
            <StatusRow 
              label="Versión de la APP" 
              value={basicInfo.versions?.app || 'No definida'} 
            />
            <StatusRow 
              label="Navegador" 
              value={`${basicInfo.versions?.browser || 'Desconocido'} v${basicInfo.versions?.version || '?'}`} 
            />
            <StatusRow 
              label="Sistema Operativo" 
              value={`${basicInfo.versions?.os || 'Desconocido'} ${basicInfo.versions?.osVersion || ''}`} 
            />
            <StatusRow 
              label="Dispositivo" 
              value={basicInfo.versions?.device || 'Desconocido'} 
            />
            <StatusRow 
              label="Pantalla" 
              value={basicInfo.device?.screen ? 
                `${basicInfo.device.screen.width}x${basicInfo.device.screen.height} (${basicInfo.device.viewport?.pixelRatio || 1}x)` : 
                'No disponible'
              } 
            />
          </StatusCard>

          {/* Sección: Información de Sesión */}
          <StatusCard title="Información de Sesión" icon="👤">
            <StatusRow 
              label="Token del dispositivo" 
              value={sessionToken ? `${sessionToken}` : 'No generado'} 
            />
            <StatusRow 
              label="Tiempo activo" 
              value={getSessionDuration()} 
            />
            <StatusRow 
              label="Inicio de sesión" 
              value={new Date(sessionStartTime).toLocaleString()} 
            />
            <StatusRow 
              label="ID del evento" 
              value={event?.id || 'N/A'} 
            />
            <StatusRow 
              label="ID del equipo" 
              value={selectedTeam?.id || 'N/A'} 
            />
          </StatusCard>

          {/* Sección: Conexiones */}
          <StatusCard title="Estado de Conexiones" icon="🌐">
            <StatusRow 
              label="Keepalive" 
              value={(() => {
                const k = connectivity.services?.keepalive || connectivity.keepalive;
                const last = k?.lastHeartbeat ? new Date(k.lastHeartbeat).toLocaleTimeString() : 'N/A';
                const age = k?.age != null ? Math.round(k.age/1000) + 's' : '-';
                const status = k?.status === 'ok' || k?.status === 'connected' ? 'success' : (k?.status === 'pending' ? 'pending' : (k?.status === 'stale' ? 'warning':'error'));
                return <div style={{display:'flex',flexDirection:'column',gap:4}}>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                    <StatusBadge status={status} value={k?.status || 'unknown'} />
                    <small>HB: {k?.heartbeatCount ?? 0}</small>
                    <small>Último: {last}</small>
                    <small>Edad: {age}</small>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    {!lockTestRunning && <button className="mini-btn" onClick={startLockTest}>Test bloqueo 5m</button>}
                    {lockTestRunning && <>
                      <button className="mini-btn warning" onClick={finishLockTest}>He vuelto</button>
                      <small>Tiempo restante: {formatMs(lockTestRemaining)}</small>
                    </>}
                  </div>
                </div>;
              })()} 
            />
            <StatusRow 
              label="Internet" 
              value={
                <StatusBadge 
                  status={connectivity.networkStatus?.online ? "success" : "error"}
                  value={connectivity.networkStatus?.online ? "Conectado" : "Desconectado"}
                />
              } 
            />
            <StatusRow 
              label="Tipo de red" 
              value={(() => {
                const type = connectivity.networkStatus?.type || 'unknown';
                const effectiveType = connectivity.networkStatus?.effectiveType || 'unknown';
                
                // Mapear tipos a descripciones más amigables
                const typeMap = {
                  'ethernet': 'Ethernet (Cable)',
                  'wifi': 'WiFi',
                  'cellular': 'Red Móvil',
                  '4g': 'Red Móvil 4G',
                  '3g': 'Red Móvil 3G',
                  '2g': 'Red Móvil 2G',
                  'bluetooth': 'Bluetooth',
                  'unknown': 'Desconocido'
                };
                
                const speedMap = {
                  'fast': 'Rápida',
                  '4g': '4G',
                  '3g': '3G',
                  '2g': '2G',
                  'slow-2g': '2G Lento',
                  'unknown': ''
                };
                
                const typeName = typeMap[type] || type;
                const speedName = speedMap[effectiveType] || effectiveType;
                
                if (type === 'unknown' && effectiveType === 'unknown') {
                  return 'No detectado';
                } else if (type !== 'unknown' && effectiveType !== 'unknown' && effectiveType !== type) {
                  return `${typeName} (${speedName})`;
                } else {
                  return typeName;
                }
              })()} 
            />
            <StatusRow 
              label="Velocidad estimada" 
              value={(() => {
                const downlink = connectivity.networkStatus?.downlink;
                const rtt = connectivity.networkStatus?.rtt;
                
                if (downlink && downlink > 0) {
                  const speed = downlink >= 10 ? 'Muy rápida' : 
                               downlink >= 4 ? 'Rápida' : 
                               downlink >= 1.5 ? 'Media' : 'Lenta';
                  return `${speed} (${downlink} Mbps)`;
                } else if (rtt) {
                  const quality = rtt < 100 ? 'Excelente' : 
                                 rtt < 300 ? 'Buena' : 
                                 rtt < 1000 ? 'Regular' : 'Lenta';
                  return `${quality} (${rtt}ms)`;
                } else {
                  return 'No disponible';
                }
              })()} 
            />
            <StatusRow 
              label="Firebase" 
              value={
                <StatusBadge 
                  status={
                    connectivity.services?.firebase?.status === 'ok' ? "success" :
                    connectivity.services?.firebase?.status === 'error' ? "error" : "pending"
                  }
                  value={
                    connectivity.services?.firebase?.status === 'ok' ? "Conectado" :
                    connectivity.services?.firebase?.status === 'error' ? "Error" : "Verificando"
                  }
                />
              } 
            />
            <StatusRow 
              label="Subida Backend" 
              value={
                <StatusBadge 
                  status={
                    connectivity.services?.backendUpload?.status === 'ok' ? "success" :
                    connectivity.services?.backendUpload?.status === 'error' ? "error" : "pending"
                  }
                  value={
                    connectivity.services?.backendUpload?.status === 'ok' ? "OK" :
                    connectivity.services?.backendUpload?.status === 'error' ? "Error" : "Verificando"
                  }
                />
              } 
            />
            {connectivity.services?.backendUpload?.status === 'ok' && (
              <StatusRow
                label="Visible en"
                value={
                  connectivity.services?.backendUpload?.availabilityTime != null
                    ? `${connectivity.services.backendUpload.availabilityTime} ms`
                    : 'N/D'
                }
              />
            )}
            <StatusRow 
              label="Servidor Push" 
              value={
                <StatusBadge 
                  status={
                    connectivity.services?.notifications?.status === 'ok' ? "success" :
                    connectivity.services?.notifications?.status === 'error' ? "error" : "pending"
                  }
                  value={
                    connectivity.services?.notifications?.status === 'ok' ? (connectivity.services?.notifications?.endpoint ? `OK ${connectivity.services.notifications.endpoint}` : 'Conectado') :
                    connectivity.services?.notifications?.status === 'error' ? "Error" : "Verificando"
                  }
                />
              } 
            />
          </StatusCard>

          {/* Sección: Capacidades del Sistema */}
          <StatusCard title="Capacidades del Sistema" icon="⚡">
            <StatusRow 
              label="LocalStorage" 
              value={
                <StatusBadge 
                  status={basicInfo.device?.storage?.localStorage?.working ? "success" : "error"}
                  value={basicInfo.device?.storage?.localStorage?.working ? "Funcionando" : "Error"}
                />
              } 
            />
            <StatusRow 
              label="Touch Support" 
              value={
                <StatusBadge 
                  status={basicInfo.device?.hasTouch ? "success" : "info"}
                  value={basicInfo.device?.hasTouch ? `Sí (${basicInfo.device?.maxTouchPoints || 0} puntos)` : "No"}
                />
              } 
            />
            <StatusRow 
              label="Cores CPU" 
              value={basicInfo.versions?.hardwareConcurrency || 'Desconocido'} 
            />
            <StatusRow 
              label="Orientación" 
              value={basicInfo.device?.orientation?.current || 'Desconocida'} 
            />
            <StatusRow 
              label="Idioma" 
              value={basicInfo.session?.language || navigator.language || 'Desconocido'} 
            />
          </StatusCard>

          {/* Sección: Permisos */}
          <StatusCard title="Permisos del Sistema" icon="🔐">
            {(() => {
              const perms = systemStatus.permissions || {};
              const renderPerm = (label, key, requestFn, extra=null) => {
                const p = perms[key] || {}; const status = p.permission || p.status || 'unknown';
                const mapBadge = (s) => s === 'granted' || s === 'granted_soft' ? 'success' : (s === 'denied' ? 'error' : (s === 'unavailable' || s === 'unsupported' ? 'error' : 'pending'));
                const txt = (s) => {
                  if (s === 'granted') return 'Concedido';
                  if (s === 'prompt' || s === 'default') return 'Pendiente';
                  if (s === 'denied') return 'Denegado';
                  if (s === 'unavailable') return 'No disponible';
                  if (s === 'unsupported') return 'No soportado';
                  return s;
                };
                const showButton = requestFn && p.supported !== false;
                const buttonLabel = (status === 'granted' || status === 'granted_soft') ? 'Solicitar de nuevo' : 'Solicitar';
                return (
                  <StatusRow key={key}
                    label={label}
                    value={<div style={{display:'flex',gap:'0.5rem',alignItems:'center',flexWrap:'wrap'}}>
                      <StatusBadge status={mapBadge(status)} value={txt(status)} />
                      {p.supported === false && <span style={{fontSize:'0.75rem',color:'#c33'}}>No soportado</span>}
                      {showButton && <button className="mini-btn" onClick={()=>dispatch(requestFn())}>{buttonLabel}</button>}
                      {extra}
                    </div>}
                  />
                );
              };
              return <>
                {renderPerm('Geolocalización','geolocation', requestPermissionGeolocation)}
                {renderPerm('Notificaciones','notifications', requestPermissionNotifications)}
                {renderPerm('Cámara','camera', requestPermissionCamera, perms.camera?.devices>=0 && <small>{perms.camera.devices} dispositivo(s)</small>)}
                {renderPerm('Micrófono','microphone', requestPermissionMicrophone, perms.microphone?.devices>=0 && <small>{perms.microphone.devices} dispositivo(s)</small>)}
                {renderPerm('Movimiento','motion', requestPermissionMotion)}
                <StatusRow label="Service Worker" value={<StatusBadge status={systemStatus.capabilities?.serviceWorker?.supported? 'success':'error'} value={systemStatus.capabilities?.serviceWorker?.supported? 'Soportado':'No soportado'} />} />
                <StatusRow label="Cookies" value={<StatusBadge status={basicInfo.versions?.cookieEnabled ? 'success':'error'} value={basicInfo.versions?.cookieEnabled ? 'Habilitadas':'Deshabilitadas'} />} />
              </>;
            })()}
          </StatusCard>

          {/* Sección: Estado General */}
          <StatusCard title="Estado General del Sistema" icon="📊">
            <StatusRow 
              label="Última actualización" 
              value={systemStatus.lastUpdated ? new Date(systemStatus.lastUpdated).toLocaleTimeString() : 'Nunca'} 
            />
            <StatusRow 
              label="Estado de carga" 
              value={
                <StatusBadge 
                  status={systemStatus.loading ? "pending" : "success"}
                  value={systemStatus.loading ? "Actualizando..." : "Completado"}
                />
              } 
            />
            <StatusRow 
              label="Errores detectados" 
              value={
                <StatusBadge 
                  status={systemStatus.error ? "error" : "success"}
                  value={systemStatus.error ? "Hay errores" : "Sin errores"}
                />
              } 
            />
            <StatusRow 
              label="Engine del navegador" 
              value={basicInfo.versions?.engine || 'Desconocido'} 
            />
          </StatusCard>

          <StatusCard
            title="Validación de Actividades"
            icon="🧪"
            size="large"
            className="activity-check-card status-card-span-2"
          >
            <div className="activity-check-actions">
              <span className="activity-check-last-run">
                {activityCheckState.lastRun
                  ? `Última ejecución: ${new Date(activityCheckState.lastRun).toLocaleTimeString()}`
                  : 'Sin validaciones registradas'}
              </span>
              <button
                className="mini-btn"
                onClick={handleActivityCheckRefresh}
                disabled={activityCheckState.status === 'loading'}
              >
                {activityCheckState.status === 'loading' ? 'Revisando…' : 'Revisar actividades'}
              </button>
            </div>

            {activityCheckState.status === 'loading' && (
              <p className="activity-check-loading">Analizando actividades…</p>
            )}

            {activityCheckState.status === 'error' && activityCheckState.error && (
              <p className="activity-check-error">{activityCheckState.error}</p>
            )}

            {activityCheckState.status === 'empty' && (
              <p className="activity-check-empty">No hay actividades para validar en este evento.</p>
            )}

            {activityCheckState.results.length > 0 && (
              <>
                <div className="activity-check-summary">
                  <StatusBadge status="success" value={`OK: ${activityCheckSummary.success ?? 0}`} />
                  <StatusBadge status="warning" value={`Avisos: ${activityCheckSummary.warning ?? 0}`} />
                  <StatusBadge status="error" value={`Errores: ${activityCheckSummary.error ?? 0}`} />
                </div>

                <div className="activity-check-list">
                  {activityCheckState.results.map((result) => {
                    const metadataEntries = [];
                    if (result.metadata?.pieces != null) {
                      metadataEntries.push(`Piezas: ${result.metadata.pieces}`);
                    }
                    if (result.metadata?.imageCount != null) {
                      metadataEntries.push(`Imágenes: ${result.metadata.imageCount}`);
                    }
                    if (result.metadata?.totalPairs != null) {
                      metadataEntries.push(`Parejas: ${result.metadata.totalPairs}`);
                    }
                    if (result.metadata?.openQuestions != null) {
                      metadataEntries.push(`Preguntas abiertas: ${result.metadata.openQuestions}`);
                    }

                    return (
                      <div key={result.id ?? result.name} className="activity-check-item">
                        <div className="activity-check-item-header">
                          <div>
                            <div className="activity-check-name">{result.name}</div>
                            <div className="activity-check-meta">
                              {result.typeName}
                              {result.id ? ` · ID ${result.id}` : ''}
                            </div>
                          </div>
                          <StatusBadge
                            status={result.status === 'error' ? 'error' : result.status === 'warning' ? 'warning' : 'success'}
                            value={activityStatusLabel(result.status)}
                          />
                        </div>

                        {metadataEntries.length > 0 && (
                          <div className="activity-check-metadata">{metadataEntries.join(' · ')}</div>
                        )}

                        {result.errors.length > 0 && (
                          <ul className="activity-check-errors">
                            {result.errors.map((error, index) => (
                              <li key={`error-${result.id ?? 'unknown'}-${index}`}>{error}</li>
                            ))}
                          </ul>
                        )}

                        {result.warnings.length > 0 && (
                          <ul className="activity-check-warnings">
                            {result.warnings.map((warning, index) => (
                              <li key={`warning-${result.id ?? 'unknown'}-${index}`}>{warning}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </StatusCard>

        </StatusGrid>
      </div>
    </BackgroundLayout>
  );
};

export default SystemStatusPage;
