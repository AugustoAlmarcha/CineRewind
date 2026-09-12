# CineRewind - Arquitectura del Sistema

**Proyecto:** CineRewind  
**Autor:** Augusto Almarcha  
**Patrón Arquitectónico:** Cliente-Servidor Desacoplado (REST API + SPA)

---

## 1. Stack Tecnológico Seleccionado

| Capa | Tecnología | Justificación Técnica |
| :--- | :--- | :--- |
| **Frontend** | React + Tailwind CSS | Interfaz declarativa (SPA) que permite navegación fluida sin recargas completas y diseño responsivo mobile-first. |
| **Backend** | Node.js + Express | Manejo eficiente de operaciones asíncronas no bloqueantes para la integración con la API externa de TMDb y unificación de JavaScript en cliente/servidor. |
| **Base de Datos** | PostgreSQL | Motor relacional con soporte estricto ACID, integridad referencial sólida y optimización mediante índices para consultas cronológicas (Timeline). |
| **Catálogo Externo** | The Movie Database (TMDb) API | Proveedor de metadatos cinematográficos, créditos y disponibilidad de streaming geolocalizada. |

---

## 2. Estrategia de Persistencia y Caché Local

Para evitar saturar la cuota de peticiones de TMDb y reducir la latencia en el cliente:
* El backend consulta la API de TMDb solo cuando una obra no existe en la base de datos local.
* Los metadatos consultados se persisten en una tabla local (`obras_catalogo`), actuando como una capa de almacenamiento en caché.

---

## 3. Modelo de Datos Relacional Inicial (Sprint 1)

### `usuarios`
* `id` (UUID / Serial, PK): Identificador único del usuario.
* `email` (VARCHAR, Unique): Correo de autenticación.
* `password_hash` (VARCHAR): Hash seguro de la contraseña.
* `nombre` (VARCHAR): Nombre de perfil.

### `obras_catalogo`
* `id` (SERIAL, PK): Identificador interno.
* `tmdb_id` (INT, Unique): ID oficial provisto por TMDb.
* `tipo` (VARCHAR): `'pelicula'` o `'serie'`.
* `titulo` (VARCHAR): Nombre de la obra.
* `poster_path` (VARCHAR): Ruta relativa a la imagen en el CDN de TMDb.

### `historial_visualizaciones`
* `id` (SERIAL, PK): Identificador único del registro.
* `usuario_id` (FK -> `usuarios.id`): Usuario que realizó el registro.
* `obra_id` (FK -> `obras_catalogo.id`): Obra visualizada.
* `temporada` (INT, Nullable): Número de temporada (solo series).
* `episodio` (INT, Nullable): Número de capítulo (solo series).
* `fecha_visto` (DATE): Fecha en que se consumió.
* `plataforma` (VARCHAR): Servicio de reproducción (Netflix, Max, Cine, etc.).
* `pais` (VARCHAR): Ubicación geográfica del consumo.
