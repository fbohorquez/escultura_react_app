require('dotenv').config();
const express = require('express');
const cors = require('cors');
const subscriptionRoutes = require('./src/controllers/subscriptionController');
const notificationRoutes = require('./src/controllers/notificationController');
const logger = require('./src/utils/logger');
const cleanup = require('./src/utils/cleanup');

const app = express();
const PORT = process.env.PORT || 3089;

// Middleware básico
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'https://escultura.dev2bit.com'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Logging de requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Rutas principales
app.use('/api', subscriptionRoutes);
app.use('/api', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Inicializar servidor
app.listen(PORT, () => {
  logger.info(`Servidor de notificaciones iniciado en puerto ${PORT}`);
  
  // Inicializar limpieza automática
  cleanup.startCleanupSchedule();
  
  // Cargar backup si existe
  cleanup.loadBackup();
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  logger.info('Cerrando servidor...');
  cleanup.saveBackup();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Cerrando servidor...');
  cleanup.saveBackup();
  process.exit(0);
});
