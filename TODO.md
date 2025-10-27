TODO: 
- Especificar la forma de valoración y dar puntos de actividades. 
- Valoración cuando se falla una actividad por falta de tiempo.
- Estilos
- ✅ En el mapa no debería establecerse la dirección si el equipo no es el seleccionado (implementado)
- Objetos requeridos
- En el listado de pruebas salen los puntos de las pruebas por defecto, debería salir el número de puntos que se han conseguido.
- En el listado de pruebas debería salir el estado de la prueba (sin realizar, realizando, realizada-ok, realizada-ko, suspendida)


- URL de acceso por Equipo
- Gadgets de susto

Realizado de lo que hablamos:
- Texto de prueba HTML sale RAW (con etiquetas de código)
- Si entro como equipo 2 siendo el primer equipo en entrar, el icono sale como equipo1. Solucionado
- Cerrar el bocadillo de información de la actividad al hacer click en el mapa.
- Poner botón para cambiar de camara en la prueba de foto/video.
- Verificar el envío de varias actividades a la vez por el organizador. Ya he revisado que funciona en varios escenarios.
- iPad bailaba mucho la geoposición. 
- Comprimir imágenes antes de subirlas.
- Sistema para validar estado de conexión a base de datos.

Cosas nuevas:
- Galería de fotos subidas del equipo. El equipo puede ver las fotos subidas en cada prueba
- Recepción de mensaje vía push (notificaciones con por el móvil) cuando se recibe prueba, un mensaje o una valoración. 
- Configuración por URL: esto es que por la URL podríamos personalizar aspectos de la aplicación, esto abre la puerta a personalizar cual quier cosa de la aplicación, no solo el color. 
- Instalación como PWA. Aunque la aplicación funciona en cualquier navegador web, lo ideal para una mejor experiencia es intalarla como WPA. Basicamente esto es añadir una página web al escritorio del movil, como un icono, para cuando se abra se abre solo esa web y no deja cambiar de URL. He hecho que cuando se instala como WPA se pueda poner el nombre de la aplicación e icono que se quiera por evento, para una mayor personalización. 
- Sistema de chequeo completo que ayuda a ver el estado del evento equipo y la aplicación, para deterctar si un equipo por ejemplo no le funciona el GPS o no recibe notificaciones porque no tiene permisos, etc.

Aun queda: 
- El susto

Problemas detectados:
- En el navegador web en móvil, cuando este entra en reposo, se apaga la pantalla, y no es posible capturar la posición GPS del usuario por temas de politicas de privacidad. Lo que ocasiona que si se entra en reposo deje de verse bien la posición real del equipo y el equipo sale como desconectado hasta que encienda la pantalla. Si es normal que los equipos vayan mirando la pantalla de vez en cuando no sería un problema, pues en cuanto enciendan la pantalla se actualizará, pero si queremos que vaya bien he estudiado varias soluciones: 
  * Forzar a que la pantalla no se apague de forma automática, hay una forma de decirle al navegador que la web está como reproduciendo un video y eso hace que la pantalla no se apague de forma automática. Esto no soluciona el problema, ya que el usuario puede simplemente darle al botón para apagar la pantalla y entrar en reposo, pero ayuda a mantener la pantalla encendida cuando se usa sin tener que estar tocando la pantalla constantemente, como era positivo en cualquier caso lo he implementado, estoy aun probandolo. Pero como digo esto no soluciona el problema raíz. 
  * Usar una aplicación nativa de terceros que solo envíe la posición GPS y que se ejecute durante el evento. He probado varias tanto en android como en iOS. Hay muchas aplicaciones de terceros que solo son para enviar la posición GPS cada cierto tiempo a un servidor, solo habría que ejecutar esta app en los dispositivos que serían los equipos y configurar la app para que envíe la posición a nuestro servidor. Esta solución ya está implementada y funciona correctamente.
  * Hacer nosotros la APP que mande el GPS cuando la pantalla se bloquee. No lo veo pues sería tener que estar manteniendo otra APP que era lo que queríamos evitar. 



