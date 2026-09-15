# CineRewind - Product Backlog & Requisitos

**Proyecto:** CineRewind  
**Autor:** Augusto Almarcha  
**Metodología:** Agile / Scrum  

---

## 1. Visión del Producto
CineRewind es un diario audiovisual personal y social. Permite a los usuarios registrar cronológicamente películas y series consumidas, documentar el contexto de cada reproducción (plataforma, país y acompañantes) e interactuar con amigos mediante confirmaciones compartidas de co-visualización.

---

## 2. Product Backlog Consolidado

| ID | Módulo | Historia de Usuario | Prioridad | Sprint | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **HU-01** | Búsqueda / Catálogo | **Como** cinéfilo, **quiero** buscar obras en TMDb y agregarlas con fecha a mi registro, **para** llevar mi historial personal al día. | Alta | Sprint 1 (MVP) | **Completado** |
| **HU-02** | Tracker Activo | **Como** espectador de series, **quiero** presionar "Visto" en un capítulo y que el sistema avance automáticamente al siguiente, **para** no perder el hilo de mis temporadas. | Alta | Sprint 1 (MVP) | **Completado** |
| **HU-03** | Timeline | **Como** usuario, **quiero** ver una línea de tiempo ordenada cronológicamente de todo lo visto, **para** revivir mis consumos pasados. | Alta | Sprint 1 (MVP) | **Completado** |
| **HU-04** | Exploración / Populares | **Como** usuario indeciso, **quiero** ver las tendencias del momento, país y plataformas donde verlas, **para** descubrir nuevo contenido. | Media | Sprint 2 | **Completado** |
| **HU-05** | Contexto de Visualización | **Como** usuario detallista, **quiero** registrar plataforma, país y calificación milimétrica, **para** contextualizar mis reproducciones. | Media | Sprint 2 | **Completado** |
| **HU-06** | Exploración de Reparto | **Como** aficionado, **quiero** consultar los créditos de un episodio y la filmografía completa de un actor, **para** descubrir obras relacionadas. | Media | Sprint 2 | **Completado** |
| **HU-07** | Autenticación Dual | **Como** usuario, **quiero** registrarme e iniciar sesión tanto con correo/contraseña como con un clic mediante Google OAuth, **para** acceder a mi perfil seguro de forma flexible. | Alta | Sprint 3 | **Por hacer** |
| **HU-08** | Perfil de Usuario | **Como** usuario registrado, **quiero** personalizar mi foto de perfil, nombre visible y biografía cinéfila, **para** tener una identidad reconocible frente a mis amigos. | Media | Sprint 3 | **Por hacer** |
| **HU-09** | Comunidad y Amigos | **Como** usuario social, **quiero** buscar otros cinéfilos por nombre/email y enviar solicitudes de amistad, **para** conformar mi red de contactos. | Media | Sprint 3 | **Por hacer** |
| **HU-10** | Co-visualización ("Visto con...") | **Como** usuario social, **quiero** etiquetar amigos en el momento de registrar una película o capítulo, **para** dejar asentada la compañía de esa función. | Media | Sprint 3 | **Por hacer** |
| **HU-11** | Notificaciones y Confirmación Social | **Como** amigo etiquetado, **quiero** recibir una notificación y aceptar la visualización conjunta en un clic, **para** que se añada a mi propio historial sin registrarla manualmente. | Media | Sprint 3 | **Por hacer** |
| **HU-12** | Panel de Administración (RBAC) | **Como** administrador de la plataforma, **quiero** moderar cuentas de usuario, depurar reseñas inapropiadas y ver estadísticas globales, **para** mantener el servicio ordenado y seguro. | Media | Sprint 3 | **Por hacer** |
| **HU-13** | Estadísticas y Wrapped Anual (IA) | **Como** cinéfilo analítico, **quiero** ver mis métricas anuales reales (horas, géneros, actores y directores más vistos) junto a un arquetipo cómico e ingenioso redactado por IA, **para** celebrar mi año en cine. | Baja | Sprint 4 | **Por hacer** |
| **HU-14** | Watchlist y Ruleta Indecisa | **Como** espectador indeciso, **quiero** guardar obras pendientes y accionar una ruleta aleatoria con filtros de plataforma y género, **para** decidir qué ver en segundos. | Baja | Sprint 4 | **Por hacer** |

---

## 3. Requisitos No Funcionales (RNF)

* **RNF-01 (Diseño Adaptativo):** Interfaz responsive construida bajo el enfoque mobile-first mediante Tailwind CSS.
* **RNF-02 (PWA):** Soporte para instalación como aplicación web progresiva en dispositivos móviles (`manifest.json` y Service Worker).
* **RNF-03 (Rendimiento y Latencia):** Capa de persistencia local en PostgreSQL y estructuras en memoria (`Set` / `Map`) para optimizar el consumo de la API externa de TMDb y responder en menos de 200 ms.
* **RNF-04 (Criptografía y Contraseñas):** Hasheo unidireccional e irreversible de contraseñas con `bcrypt` (mínimo 10 rondas de salt). Queda terminantemente prohibido almacenar texto plano en la base de datos.
* **RNF-05 (Autenticación y Sesiones):** Control de acceso a endpoints protegidos mediante JSON Web Tokens (JWT) con clave secreta y validación criptográfica de tokens OAuth 2.0 de Google.
* **RNF-06 (Control de Acceso Basado en Roles - RBAC):** Middleware en backend que valida el rol (`rol === 'admin'`) para restringir las rutas de administración (`/api/admin/...`), respondiendo con código HTTP `403 Forbidden` a usuarios comunes.
* **RNF-07 (Prevención de Inyecciones SQL):** Ejecución estricta de consultas preparadas y parametrizadas (`$1, $2, ...`) en el driver `pg` de PostgreSQL, impidiendo cualquier concatenación manual de cadenas en sentencias SQL.
* **RNF-08 (Aislamiento de Secretos):** Variables de entorno sensibles (claves de TMDb, base de datos, credenciales OAuth y secretos JWT) resguardadas en `.env`, estrictamente excluidas de Git mediante `.gitignore`.
