import React from 'react';

/**
 * Componente StatusCard para mostrar métricas individuales
 * Proporciona un layout consistente y reutilizable para todas las métricas del sistema
 */
const StatusCard = ({ 
  title, 
  icon = null, 
  children, 
  className = "",
  size = "normal" // normal, small, large
}) => {
  const sizeClasses = {
    small: "status-card-small",
    normal: "status-card-normal", 
    large: "status-card-large"
  };

  return (
    <div className={`status-card ${sizeClasses[size]} ${className}`}>
      <div className="status-card-header">
        {icon && <span className="status-card-icon">{icon}</span>}
        <h3 className="status-card-title">{title}</h3>
      </div>
      <div className="status-card-content">
        {children}
      </div>
    </div>
  );
};

/**
 * Componente StatusRow para mostrar pares clave-valor dentro de StatusCard
 */
export const StatusRow = ({ 
  label, 
  value, 
  status = null, // success, error, warning, pending, info
  className = "" 
}) => {
  return (
    <div className={`status-row ${className}`}>
      <span className="status-label">{label}</span>
      <div className="status-row-value">
        {status && <StatusBadge status={status} value={value} />}
        {!status && <span className="status-value">{value}</span>}
      </div>
    </div>
  );
};

/**
 * Componente StatusBadge para mostrar estados con colores semánticos
 */
export const StatusBadge = ({ 
  status, // success, error, warning, pending, info
  value,
  icon = null,
  className = "" 
}) => {
  const statusClasses = {
    success: "status-badge-success",
    error: "status-badge-error", 
    warning: "status-badge-warning",
    pending: "status-badge-pending",
    info: "status-badge-info"
  };

  const defaultIcons = {
    success: "🟢",
    error: "🔴",
    warning: "🟡", 
    pending: "⚪",
    info: "🔵"
  };

  const displayIcon = icon || defaultIcons[status] || "";
  const displayValue = typeof value === 'boolean' 
    ? (value ? 'Sí' : 'No')
    : value;

  return (
    <span className={`status-badge ${statusClasses[status] || ""} ${className}`}>
      {displayIcon && <span className="status-badge-icon">{displayIcon}</span>}
      <span className="status-badge-text">{displayValue}</span>
    </span>
  );
};

/**
 * Componente StatusGrid para layouts de múltiples cards
 */
export const StatusGrid = ({ 
  children, 
  columns = "auto", // auto, 1, 2, 3, 4
  gap = "normal", // small, normal, large
  className = "" 
}) => {
  const columnClasses = {
    auto: "status-grid-auto",
    1: "status-grid-1",
    2: "status-grid-2", 
    3: "status-grid-3",
    4: "status-grid-4"
  };

  const gapClasses = {
    small: "status-grid-gap-small",
    normal: "status-grid-gap-normal",
    large: "status-grid-gap-large"
  };

  return (
    <div className={`status-grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Componente MetricValue para mostrar valores numéricos con unidades
 */
export const MetricValue = ({ 
  value, 
  unit = "", 
  precision = 2,
  prefix = "",
  suffix = "",
  className = "" 
}) => {
  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toFixed(precision);
    }
    return val;
  };

  return (
    <span className={`metric-value ${className}`}>
      {prefix}
      <span className="metric-number">{formatValue(value)}</span>
      {unit && <span className="metric-unit">{unit}</span>}
      {suffix}
    </span>
  );
};

export default StatusCard;
