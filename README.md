<div align="center">

  <img src="client/public/logo.png" alt="CineRewind Logo" width="100" />

  # 🍿 CineRewind
  **Tu diario cinéfilo definitivo: seguimiento activo de series, co-visiones con amigos y estadísticas anuales.**

  [![Live Demo](https://img.shields.io/badge/🌐_Sitio_Web-cinerewind.com.ar-e11d48?style=for-the-badge)](https://cinerewind.com.ar)
  [![GitHub License](https://img.shields.io/badge/Licencia-MIT-zinc?style=for-the-badge)](LICENSE)

  <br />

  <p align="center">
    <a href="https://cinerewind.com.ar"><strong>🚀 Probar Aplicación en Vivo (cinerewind.com.ar) »</strong></a>
    <br />
    <br />
    <a href="#-características-principales">Características</a> ·
    <a href="#-arquitectura-y-tecnologías">Stack</a> ·
    <a href="#-instalación-local">Instalación</a> ·
    <a href="#-autor">Autor</a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB" />
    <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" />
    <img src="https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" />
    <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white" />
    <img src="https://img.shields.io/badge/TMDb_API-01B4E4?style=flat-square&logo=the-movie-database&logoColor=white" />
    <img src="https://img.shields.io/badge/Neon_Serverless-00E599?style=flat-square&logo=neon&logoColor=black" />
    <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" />
    <img src="https://img.shields.io/badge/Render-46E3B7?style=flat-square&logo=render&logoColor=black" />
  </p>

</div>

---

## 📖 Acerca del Proyecto

**CineRewind** es una plataforma web Full-Stack moderna para amantes del cine y las series. Permite documentar cada película vista, llevar el progreso exacto capítulo a capítulo de tus series en curso, calificar temporadas completas y series globales, conectar con amigos para etiquetarse en co-visiones y generar un resumen interactivo anual con estadísticas personales al estilo Spotify Wrapped.

> 🌐 **App en Producción:** [https://cinerewind.com.ar](https://cinerewind.com.ar) (Espejo Vercel: [cine-rewind.vercel.app](https://cine-rewind.vercel.app/))

---

## ✨ Características Principales

* 📺 **Tracker de Series en Curso**: Seguimiento inteligente de episodios con botón de avance rápido de 1 clic, detección de fin de temporada y rewatch.
* ⭐ **Calificación de Temporadas y Series Completas**: Posibilidad de puntuar y reseñar temporadas individuales (T1, T2...) y otorgar un veredicto definitivo a la serie completa, con filtros organizados en el perfil de usuario.
* 📅 **Selector Rápido de Fecha**: Botones de 1 toque `[ Hoy ]` `[ Ayer ]` `[ 📅 Otra fecha ]` con confirmación clara para registrar visualizaciones sin confusiones en dispositivos móviles.
* 📅 **Línea de Tiempo y Diario Cinemático**: Registro cronológico ordenado por carpetas de año y mes, con filtros por formato (película o serie), plataforma de streaming y co-visiones.

* 🍿 **Bienvenida y Onboarding Dinámico**: Detección de cuentas nuevas con buscador integrado en vivo y vitrina de inicio rápido de 1 clic.
* 🎥 **Tendencias Globales y Locales**: Cartelera actualizada de los títulos más populares de la semana con selector por país y botón directo para ver **Trailers Oficiales en YouTube**.
* 🎲 **Ruleta Cinematográfica "¿Qué ver hoy?"**: Algoritmo de recomendación aleatoria animada entre las películas y series de la cartelera o tu lista de pendientes.
* 👥 **Red Social Cinéfila**: Sistema de amistades, solicitudes en tiempo real y etiquetado en co-visiones ("Visto con...") para sincronizar registros automáticamente en ambos perfiles.
* 📂 **Importador Inteligente de Netflix**: Sube tu historial oficial de visualización en CSV desde Netflix para poblar tu catálogo sin cargar obras una por una.
* 📊 **CineRewind Wrapped Anual**: Diagnóstico anual cinéfilo, horas totales de pantalla, actor/director más visto, día preferido de reproducción y gráfico mensual de consumo.
* 🔐 **Seguridad y Recuperación de Contraseña**: Autenticación dual (Google OAuth y credenciales clásicas protegidas con bcrypt), tokens criptográficos y correos HTML transaccionales vía **Resend**.
* 🌗 **Modo Oscuro / Claro**: Interfaz cinematográfica con soporte completo para Dark Mode y Light Mode con persistencia en LocalStorage.

---

## 🛠️ Arquitectura y Tecnologías

### Frontend
* **React 19** + **Vite 6**
* **Tailwind CSS v4** con modo oscuro nativo
* **Lucide React** (iconografía cinematográfica)
* **React Router v6** con Single Page Application Tracking
* **Google Analytics 4 (GA4)** integrado para métricas de navegación en tiempo real
* **Despliegue**: [Vercel](https://vercel.com) (con reverse proxy rewrites a Render)

### Backend
* **Node.js** + **Express.js** (Arquitectura REST modular)
* **JWT (JSON Web Tokens)** + **Bcrypt.js** para cifrado y sesiones seguras
* **Google OAuth2** para inicio de sesión en un clic
* **Resend API** para envío de correos transaccionales con plantillas responsive
* **The Movie Database (TMDb) API v3** con sistema de caché en memoria de 12 horas
* **Despliegue**: [Render](https://render.com) (Web Service 24/7)

### Base de Datos
* **PostgreSQL** relacional con integridad referencial (`ON DELETE CASCADE`, constraints únicos e índices)
* **Despliegue**: [Neon.tech](https://neon.tech) (Serverless PostgreSQL en AWS US-East con connection pooler PgBouncer)

---

## 🚀 Instalación y Ejecución Local

Si deseas clonar y correr el proyecto en tu entorno local:

### 1. Clonar el repositorio
```bash
git clone https://github.com/AugustoAlmarcha/CineRewind.git
cd CineRewind
```

### 2. Configurar el Backend
```bash
cd backend
npm install
```

Crea un archivo `.env` en `backend/` con las siguientes variables:
```env
PORT=5000
DATABASE_URL=postgresql://usuario:password@localhost:5432/cinerewind
JWT_SECRET=tu_jwt_secret_seguro
TMDB_API_KEY=tu_api_key_de_themoviedb
RESEND_API_KEY=tu_api_key_de_resend
GOOGLE_CLIENT_ID=tu_google_client_id
FRONTEND_URL=http://localhost:5173
```

Inicia el servidor backend:
```bash
npm run dev
```

### 3. Configurar el Frontend
En otra terminal:
```bash
cd client
npm install
```

Crea un archivo `.env` en `client/`:
```env
VITE_GOOGLE_CLIENT_ID=tu_google_client_id
VITE_GA_MEASUREMENT_ID=tu_google_analytics_id
```

Inicia el cliente de Vite:
```bash
npm run dev
```

Abre tu navegador en `http://localhost:5173`.

---

## 👤 Autor

Desarrollado con dedicación por **Augusto Almarcha**:

* 🐙 **GitHub**: [@AugustoAlmarcha](https://github.com/AugustoAlmarcha)
* 🌐 **Web**: [cine-rewind.vercel.app](https://cine-rewind.vercel.app/)

---

<div align="center">
  <sub>Hecho con ❤️ para los apasionados del cine y las series. Si te gusta el proyecto, ¡déjale una ⭐ en GitHub!</sub>
</div>
