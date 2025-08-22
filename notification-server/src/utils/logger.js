/**
 * Sistema de logging simple con timestamps
 */

function getTimestamp() {
  return new Date().toISOString();
}

function formatLog(level, message) {
  return `[${getTimestamp()}] [${level.toUpperCase()}] ${message}`;
}

const logger = {
  info: (message) => {
    console.log(formatLog('info', message));
  },

  warn: (message) => {
    console.warn(formatLog('warn', message));
  },

  error: (message) => {
    console.error(formatLog('error', message));
  },

  debug: (message) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(formatLog('debug', message));
    }
  }
};

module.exports = logger;
