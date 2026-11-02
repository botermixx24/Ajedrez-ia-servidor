# Servidor para Ajedrez con IA

Este proyecto crea el backend que conecta el juego web con Hugging Face Inference Providers.

## Antes de empezar
- Necesitas una cuenta de Hugging Face y un token con permisos de inferencia.
- La cuota gratuita puede ser limitada y cambiar. No actives pagos si tu objetivo es gastar $0.
- El modelo configurado es un ejemplo; comprueba que esté disponible en tu cuenta/proveedor.

## Probar en tu ordenador
1. Instala Node.js 20 o posterior.
2. Abre una terminal en esta carpeta.
3. Ejecuta `npm install`.
4. Copia `.env.example` a `.env` y rellena `HF_TOKEN`.
5. Pon en `SITE_ORIGIN` el origen exacto de la página del juego. Para pruebas locales puedes usar `http://localhost:5173`.
6. Ejecuta `npm start`.
7. Prueba `http://localhost:3000/` en el navegador.
8. El endpoint para el juego es `http://localhost:3000/move` en local. Para producción debe ser HTTPS.

## Publicarlo
Sube estos archivos a un servicio que permita ejecutar Node.js y configure las variables de entorno desde su panel:
- `HF_TOKEN`: tu token secreto.
- `HF_MODEL`: modelo disponible en tu cuenta.
- `SITE_ORIGIN`: origen exacto de la página del juego.

No subas `.env` a GitHub. No pongas el token en el HTML, JavaScript del navegador ni lo compartas por chat.
Al terminar, el proveedor te dará una URL pública, por ejemplo `https://tu-app.example`. La URL que debes pegar en el juego termina en `/move`.

## Formato esperado
El juego envía `POST /move` con `fen` y `legalMoves`.
El servidor devuelve `{"move":"e7e5"}` y comprueba que esa jugada esté dentro de la lista legal.
El botón de prueba del juego envía `{"test":true}` y el servidor responde `{"ok":true}`.

## Límites y seguridad
- Este ejemplo no tiene autenticación de usuario ni protección avanzada contra abuso; no publiques el endpoint ampliamente sin añadir rate limiting.
- CORS solo permite el origen configurado en `SITE_ORIGIN`.
- El token solo vive como variable de entorno del servidor.
- Si Hugging Face responde 429, se alcanzó un límite o cuota; el juego debe seguir usando su IA local.
