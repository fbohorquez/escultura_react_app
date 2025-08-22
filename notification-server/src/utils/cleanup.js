const fs = require('fs').promises;
const path = require('path');
const subscriptionService = require('../services/subscriptionService');
const logger = require('./logger');

const BACKUP_FILE = path.join(__dirname, '../../backup.json');
const BACKUP_INTERVAL_HOURS = parseInt(process.env.BACKUP_INTERVAL_HOURS) || 1;
const CLEANUP_INTERVAL_HOURS = parseInt(process.env.CLEANUP_INTERVAL_HOURS) || 24;

let backupInterval = null;
let cleanupInterval = null;

/**
 * Guardar backup a archivo JSON
 */
async function saveBackup() {
  try {
    if (process.env.BACKUP_ENABLED !== 'true') {
      return false;
    }

    const data = subscriptionService.exportData();
    await fs.writeFile(BACKUP_FILE, JSON.stringify(data, null, 2));
    
    logger.info(`Backup guardado: ${data.subscriptions.length} suscripciones`);
    return true;
  } catch (error) {
    logger.error(`Error guardando backup: ${error.message}`);
    return false;
  }
}

/**
 * Cargar backup desde archivo JSON
 */
async function loadBackup() {
  try {
    if (process.env.BACKUP_ENABLED !== 'true') {
      return false;
    }

    // Verificar si el archivo existe
    try {
      await fs.access(BACKUP_FILE);
    } catch {
      logger.info('No se encontró archivo de backup');
      return false;
    }

    const fileContent = await fs.readFile(BACKUP_FILE, 'utf8');
    const data = JSON.parse(fileContent);
    
    const success = subscriptionService.importData(data);
    
    if (success) {
      logger.info('Backup cargado exitosamente');
    } else {
      logger.warn('Error cargando backup');
    }
    
    return success;
  } catch (error) {
    logger.error(`Error cargando backup: ${error.message}`);
    return false;
  }
}

/**
 * Limpiar suscripciones expiradas
 */
function performCleanup() {
  try {
    const cleaned = subscriptionService.cleanupExpiredSubscriptions();
    
    if (cleaned > 0) {
      // Guardar backup después de la limpieza
      saveBackup();
    }
    
    return cleaned;
  } catch (error) {
    logger.error(`Error en limpieza automática: ${error.message}`);
    return 0;
  }
}

/**
 * Iniciar programación de limpieza automática
 */
function startCleanupSchedule() {
  // Limpieza de suscripciones expiradas
  cleanupInterval = setInterval(() => {
    logger.info('Ejecutando limpieza automática...');
    performCleanup();
  }, CLEANUP_INTERVAL_HOURS * 60 * 60 * 1000);

  // Backup automático
  if (process.env.BACKUP_ENABLED === 'true') {
    backupInterval = setInterval(() => {
      logger.info('Ejecutando backup automático...');
      saveBackup();
    }, BACKUP_INTERVAL_HOURS * 60 * 60 * 1000);
  }

  logger.info(`Limpieza automática programada cada ${CLEANUP_INTERVAL_HOURS} horas`);
  
  if (process.env.BACKUP_ENABLED === 'true') {
    logger.info(`Backup automático programado cada ${BACKUP_INTERVAL_HOURS} horas`);
  }
}

/**
 * Detener programación automática
 */
function stopCleanupSchedule() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  
  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;
  }
  
  logger.info('Programación automática detenida');
}

/**
 * Eliminar archivo de backup
 */
async function deleteBackup() {
  try {
    await fs.unlink(BACKUP_FILE);
    logger.info('Archivo de backup eliminado');
    return true;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.error(`Error eliminando backup: ${error.message}`);
    }
    return false;
  }
}

module.exports = {
  saveBackup,
  loadBackup,
  performCleanup,
  startCleanupSchedule,
  stopCleanupSchedule,
  deleteBackup
};
