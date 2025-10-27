Cachear y/o delegar la rotación de iconos.

Usar un Symbol de Google Maps que acepte rotation, o un OverlayView con CSS transform.
Si se mantiene canvas, cachear por ángulo redondeado (Math.round(angle/5)*5) y guardar el resultado en imageCache para reutilizarlo.
Desactivar logs en producción.

Rodear las trazas con if (isDebugMode) o crear un wrapper debugLog(...) que no haga nada fuera de debug.
Revisa especialmente los logs dentro de los callbacks de geolocalización y proximidad.
Reducir re-renderes desde Redux.

Sustituir useSelector((state) => state.teams.items) por un selector memoizado + shallowEqual o por una suscripción granular al equipo seleccionado.
Extraer la creación de marcadores a un useEffect que solo corra cuando cambie la lista de IDs, y elimina el setMarkersCreated desde useMemo.
Suavizar el modo seguimiento.

Aplica un throttle/debounce a panTo (por ejemplo, solo mover si el equipo se desplazó >15 m o cada 1 s).
Ofrece la opción de usar map.setCenter sin animación cuando el mapa ya está cerca.
Simplificar la ventana de muestreo.

Reemplaza positionSamples.sort por una búsqueda lineal del menor accuracy.
Evita las llamadas de getCurrentPosition “de prueba” tras activar el watch; no aportan valor en producción.
Optimizar checkActivityProximityNew.

Filtra actividades visibles una vez y evita logs detallados.
Guarda la última distancia/estado en un ref para no recalcular si no cambió de umbral.