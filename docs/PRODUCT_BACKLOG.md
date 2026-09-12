# CineRewind - Product Backlog & Requisitos

**Proyecto:** CineRewind  
**Autor:** Augusto Almarcha  
**Metodología:** Agile / Scrum  

---

## 1. Visión del Producto
CineRewind es un diario audiovisual personal y social. Permite a los usuarios registrar cronológicamente películas y series consumidas, documentar el contexto de cada reproducción (plataforma, país y acompañantes) e interactuar con amigos mediante confirmaciones compartidas de co-visualización.

---

## 2. Historias de Usuario (Requisitos Funcionales)

| ID | Módulo | Historia de Usuario | Prioridad | Sprint |
| :--- | :--- | :--- | :--- | :--- |
| **HU-01** | Búsqueda / Catálogo | **Como** cinéfilo, **quiero** buscar obras en TMDb y agregarlas con fecha a mi registro, **para** llevar mi historial personal al día. | Alta | Sprint 1 (MVP) |
| **HU-02** | Tracker Activo | **Como** espectador de series, **quiero** presionar "Visto" en un capítulo y que el sistema avance automáticamente al siguiente, **para** no perder el hilo de mis temporadas. | Alta | Sprint 1 (MVP) |
| **HU-03** | Timeline | **Como** usuario, **quiero** ver una línea de tiempo ordenada cronológicamente de todo lo visto, **para** revivir mis consumos pasados. | Alta | Sprint 1 (MVP) |
| **HU-04** | Exploración / Populares | **Como** usuario indeciso, **quiero** ver las tendencias del momento y en qué plataforma verlas, **para** descubrir nuevo contenido. | Media | Sprint 2 |
| **HU-05** | Contexto de Visualización | **Como** usuario detallista, **quiero** registrar plataforma (Netflix, Cine, etc.) y país, **para** filtrar mi historial por ubicación y servicio. | Media | Sprint 2 |
| **HU-06** | Exploración de Reparto | **Como** aficionado, **quiero** ver la filmografía completa de un actor o director, **para** descubrir obras relacionadas. | Media | Sprint 2 |
| **HU-07** | Co-visualización y Etiquetas | **Como** usuario social, **quiero** etiquetar con quién vi una película, **para** documentar la compañía de ese momento. | Media | Sprint 3 |
| **HU-08** | Confirmación Social | **Como** amigo etiquetado, **quiero** recibir una notificación para sumar la obra a mi propio perfil con un clic, **para** no registrarla a mano. | Baja | Sprint 3 |
| **HU-09** | Métricas y Estadísticas | **Como** usuario analítico, **quiero** ver estadísticas anuales (horas vistas, directores y actores más frecuentes), **para** conocer mi perfil cinéfilo. | Baja | Sprint 4 |

---

## 3. Requisitos No Funcionales (RNF)

* **RNF-01 (Responsive Design):** Interfaz adaptable a pantallas móviles mediante diseño mobile-first (CSS / Tailwind).
* **RNF-02 (PWA):** Soporte para instalación como aplicación web progresiva en smartphones (`manifest.json` y Service Worker).
* **RNF-03 (Rendimiento):** Almacenamiento local de metadatos consultados para reducir latencia y optimizar el consumo de la API de TMDb.
