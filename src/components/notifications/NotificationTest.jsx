import { useState } from 'react';
import { useSelector } from 'react-redux';
import './NotificationTest.css';

const NOTIFICATION_SERVER_URL = import.meta.env.VITE_NOTIFICATIONS_SERVER_URL || 'http://localhost:3089';

/**
 * Componente para testing de notificaciones (solo desarrollo)
 * Permite enviar notificaciones de prueba
 */
export default function NotificationTest() {
  const { user } = useSelector(state => state.auth);
  const { currentEventId } = useSelector(state => state.events);
  const { isSubscribed } = useSelector(state => state.notifications);

  const [testType, setTestType] = useState('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Solo mostrar en desarrollo
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  // Solo mostrar si está suscrito
  if (!isSubscribed || !user?.uid || !currentEventId) {
    return (
      <div className="notification-test">
        <h4>🧪 Test de Notificaciones</h4>
        <p>Debes estar suscrito a notificaciones para usar esta función.</p>
      </div>
    );
  }

  const sendTestNotification = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      let response;
      
      if (testType === 'chat') {
        // Test de notificación de chat
        response = await fetch(`${NOTIFICATION_SERVER_URL}/api/send-chat-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventId: currentEventId,
            chatId: 'test-chat',
            senderId: 'test-sender',
            senderName: 'Usuario de Prueba',
            senderType: 'user',
            message: 'Este es un mensaje de prueba para notificaciones push',
            chatName: 'Chat de Prueba'
          })
        });
      } else {
        // Test de notificación directa
        response = await fetch(`${NOTIFICATION_SERVER_URL}/api/send-test-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.uid,
            eventId: currentEventId,
            title: 'Notificación de Prueba',
            body: 'Esta es una notificación de prueba directa'
          })
        });
      }

      const data = await response.json();
      
      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          details: data
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Error desconocido',
          details: data
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error.message,
        details: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getServerStats = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${NOTIFICATION_SERVER_URL}/api/stats`);
      const data = await response.json();
      
      if (response.ok) {
        setResult({
          success: true,
          message: 'Estadísticas del servidor',
          details: data
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Error obteniendo estadísticas',
          details: data
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error.message,
        details: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="notification-test">
      <h4>🧪 Test de Notificaciones</h4>
      <p>Herramientas de desarrollo para probar notificaciones</p>
      
      <div className="test-controls">
        <div className="test-type-selector">
          <label>
            <input
              type="radio"
              value="chat"
              checked={testType === 'chat'}
              onChange={(e) => setTestType(e.target.value)}
            />
            Notificación de Chat
          </label>
          <label>
            <input
              type="radio"
              value="direct"
              checked={testType === 'direct'}
              onChange={(e) => setTestType(e.target.value)}
            />
            Notificación Directa
          </label>
        </div>
        
        <div className="test-actions">
          <button
            onClick={sendTestNotification}
            disabled={isLoading}
            className="test-btn primary"
          >
            {isLoading ? 'Enviando...' : 'Enviar Prueba'}
          </button>
          
          <button
            onClick={getServerStats}
            disabled={isLoading}
            className="test-btn secondary"
          >
            {isLoading ? 'Cargando...' : 'Ver Estadísticas'}
          </button>
        </div>
      </div>
      
      {result && (
        <div className={`test-result ${result.success ? 'success' : 'error'}`}>
          <h5>{result.success ? '✅' : '❌'} {result.message}</h5>
          {result.details && (
            <pre>{JSON.stringify(result.details, null, 2)}</pre>
          )}
        </div>
      )}
      
      <div className="test-info">
        <h5>Información de Contexto</h5>
        <ul>
          <li><strong>Usuario:</strong> {user.uid}</li>
          <li><strong>Evento:</strong> {currentEventId}</li>
          <li><strong>Servidor:</strong> {NOTIFICATION_SERVER_URL}</li>
          <li><strong>Suscrito:</strong> {isSubscribed ? 'Sí' : 'No'}</li>
        </ul>
      </div>
    </div>
  );
}
