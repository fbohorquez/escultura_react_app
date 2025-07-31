# Sistema de Temas Dinámicos - Escultura Eventos

## Descripción

Se ha implementado un sistema de temas dinámicos que permite parametrizar el color principal de la aplicación basándose en la propiedad `color` del evento actual. Este sistema reemplaza el color hardcodeado `rgb(192, 0, 31)` por variables CSS que se actualizan dinámicamente.

## Componentes del Sistema

### 1. Hook useTheme (`src/hooks/useTheme.js`)

Hook personalizado que:
- Escucha cambios en el evento actual desde Redux
- Extrae el color del evento (propiedad `color`)
- Parsea diferentes formatos de color (RGB, Hexadecimal)
- Aplica variables CSS dinámicamente al documento
- Genera variaciones automáticas del color (transparencias, tonos más oscuros)

### 2. Variables CSS

Se definen en `src/styles/global.css`:

```css
:root {
  --primary-color: rgb(192, 0, 31);           /* Color principal */
  --primary-color-values: 192, 0, 31;         /* Valores RGB separados */
  --primary-color-alpha-05: rgba(192, 0, 31, 0.05);  /* 5% transparencia */
  --primary-color-alpha-1: rgba(192, 0, 31, 0.1);    /* 10% transparencia */
  --primary-color-alpha-2: rgba(192, 0, 31, 0.2);    /* 20% transparencia */
  --primary-color-alpha-3: rgba(192, 0, 31, 0.3);    /* 30% transparencia */
  --primary-color-alpha-5: rgba(192, 0, 31, 0.5);    /* 50% transparencia */
  --primary-color-alpha-8: rgba(192, 0, 31, 0.8);    /* 80% transparencia */
  --primary-color-alpha-9: rgba(192, 0, 31, 0.9);    /* 90% transparencia */
  --primary-color-darker: rgb(173, 0, 28);    /* Versión más oscura para hover */
}
```

### 3. Archivos CSS Actualizados

Se han actualizado todos los archivos CSS para usar las variables:
- `src/styles/global.css`
- `src/styles/valorate.css`
- `src/styles/QuestionActivity.css`
- `src/styles/photoManagement.css`

## Uso del Sistema

### Configurar Color del Evento

Para aplicar un color personalizado a un evento, simplemente actualiza la propiedad `color` en el objeto evento:

```javascript
// Ejemplo: En el eventSlice o cuando se carga evento desde API
dispatch(setEvent({
  ...eventoData,
  color: "rgb(0, 123, 192)" // Azul personalizado
}));
```

### Formatos de Color Soportados

El sistema acepta dos formatos:

```javascript
// Formato RGB
event.color = "rgb(255, 136, 0)";

// Formato Hexadecimal
event.color = "#FF8800";
```

### Usar Variables en CSS

En cualquier archivo CSS, puedes usar las variables:

```css
.mi-elemento {
  color: var(--primary-color);
  background: var(--primary-color-alpha-1);
  border: 2px solid var(--primary-color);
}

.mi-boton:hover {
  background: var(--primary-color-darker);
}
```

### Usar Variables en Componentes JSX

```javascript
// En estilos inline
<button 
  style={{
    backgroundColor: "var(--primary-color)",
    color: "white"
  }}
>
  Mi Botón
</button>

// En clases CSS que usan las variables
<div className="elemento-con-color-principal">
  Contenido
</div>
```

## Página de Prueba

Se ha creado una página de prueba en `/theme-test` que permite:
- Cambiar el color del evento usando colores predefinidos
- Introducir un color personalizado
- Ver elementos de ejemplo con el nuevo color aplicado

Para acceder: navegue a `http://localhost:puerto/theme-test`

## Beneficios

1. **Flexibilidad**: Cada evento puede tener su propio color distintivo
2. **Consistencia**: Todas las partes de la aplicación usan el mismo color
3. **Mantenibilidad**: Un solo lugar para definir y cambiar colores
4. **Automatización**: Las variaciones de color se generan automáticamente
5. **Compatibilidad**: Funciona con el sistema Redux existente

## Migración de Colores Hardcodeados

Si encuentras colores hardcodeados que no fueron migrados:

1. Reemplaza `rgb(192, 0, 31)` por `var(--primary-color)`
2. Reemplaza `rgba(192, 0, 31, X)` por `var(--primary-color-alpha-X)`
3. Usa `var(--primary-color-darker)` para versiones más oscuras

## Notas Técnicas

- El hook se ejecuta automáticamente en `App.jsx`
- Los cambios en el color del evento se aplican inmediatamente
- Si no se especifica color, se usa el color por defecto `rgb(192, 0, 31)`
- El sistema es compatible con todas las versiones de CSS modernas
