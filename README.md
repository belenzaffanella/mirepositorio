# Entre fechas

Un MVP de trivia de historia moderna, creado con HTML, CSS y JavaScript sin dependencias de compilación.

## Abrir el ZIP directamente

Extraé la carpeta y abrí `index.html`. No hace falta instalar nada ni iniciar un servidor. El mapa mundial de límites geográficos está incluido localmente en `assets/maps/natural-earth-countries.js`, así que al abrir el juego con `file://` no se solicitan teselas remotas. Los límites proceden de Natural Earth y son de dominio público; la atribución aparece en el mapa.

Leaflet 1.9.4 sigue cargándose desde un CDN, por lo que hace falta conexión a Internet para que aparezca el mapa. El resto de la interacción cartográfica, los marcadores, la línea y el cálculo de distancia funcionan sobre coordenadas geográficas reales.

## Ejecutar con servidor local (opcional)

Iniciá el servidor local, sin paquetes de compilación:

```powershell
node server.js
```

Después abrí <http://localhost:4173> en el navegador. Para detener el servidor, volvé a PowerShell y presioná `Ctrl+C`.

El servidor local es opcional; sirve la misma versión del juego que `file://`.

## Contenido

La base contiene 109 acontecimientos únicos en `src/events.js`. Cada registro usa `categories` con slugs reutilizables (`modern-history`, `21st-century`, `argentina`, `world-events`, `sports`, `music-pop-culture`, `technology`, `science`), además de fecha, lugar, coordenadas, dificultad, descripción y fuente. Los 97 eventos sin una foto reutilizable verificada tienen `image`, crédito, licencia y fuente en `null`, más `imageReviewRequired: true`; el juego muestra el placeholder en esos casos. Las doce imágenes con archivo, licencia y crédito registrados cargan correctamente.

La lista estructurada de trabajo y el resumen de controles mecánicos están en `research/events-candidates.json` y `research/candidate-audit.json`. Los enlaces fuente están guardados junto a cada evento; no todos fueron abiertos y revisados individualmente en esta pasada. Las coordenadas son aproximaciones al centro de la ciudad para el mapa del juego.

`src/main.js` contiene el motor de sesión y puntuación, desacoplado del flujo de turnos: sirve tanto para una partida individual como para pass-and-play local y puede recibir posteriormente un adaptador de transporte online. Leaflet dibuja localmente el mapa mundial incluido. La distancia se calcula con la fórmula de Haversine sobre latitud/longitud; geografía y año aportan hasta 500 puntos cada uno por ronda.

Cada partida crea un deck aleatorio de cinco acontecimientos distintos, equilibrado por dificultad. La sesión recuerda los acontecimientos recientes por modo y usa primero todos los que no aparecieron en la partida previa. Si el modo todavía no tiene cinco preguntas nuevas, completa solo las plazas inevitables con preguntas recientes. Los ocho modos tienen al menos cinco acontecimientos.

Tocá o hacé clic en la fotografía para ampliarla. En el lightbox, usá +/− o la rueda del mouse para ampliar y reducir, y AJUSTAR para volver al encuadre original. El gesto de dos dedos en móvil también amplía/reduce y permite desplazar la imagen ampliada dentro del marco. El botón X, Escape o un clic fuera de la imagen cierran la vista.
