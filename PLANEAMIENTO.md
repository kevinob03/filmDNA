# Planeamiento de FilmDNA

## 1. Descripción del proyecto

FilmDNA es una plataforma inteligente de descubrimiento cinematográfico desarrollada con React. Permite descubrir, consultar, organizar y analizar películas según la experiencia deseada, más allá de géneros tradicionales.

Los criterios de experiencia previstos son estado de ánimo, atmósfera, ritmo, complejidad, duración e intensidad. La plataforma combinará información cinematográfica externa con herramientas propias de seguimiento y recomendación.

## 2. Objetivo

Desarrollar una aplicación web modular, responsive y accesible que permita explorar películas, mantener información personal de actividad cinematográfica y recibir recomendaciones apoyadas por Movie DNA e inteligencia artificial.

## 3. Stack definido

- React.
- Vite.
- JavaScript ES6+.
- React Router DOM.
- Context API y React Hooks.
- HTML5 y CSS3.
- REST APIs.
- TMDB.
- JSON Server y `db.json`.
- Integración de IA, con proveedor y modelo pendientes de definición.
- Jest.
- n8n.
- Git y GitHub.

No añadir tecnologías importantes ni dependencias sin autorización. El anteproyecto menciona OMDb como posible complemento, pero el contexto oficial posterior selecciona TMDB como API cinematográfica. OMDb no forma parte del stack confirmado.

## 4. Arquitectura prevista

```text
src/
├── modules/
│   ├── home/
│   ├── explore/
│   ├── movies/
│   ├── recommendations/
│   ├── diary/
│   ├── lists/
│   ├── statistics/
│   ├── profile/
│   ├── auth/
│   └── admin/
├── shared/
│   ├── components/
│   ├── hooks/
│   └── utils/
├── services/
├── routes/
├── context/
├── styles/
├── App.jsx
└── main.jsx
```

React será el cliente. React Router DOM centralizará la navegación. Las llamadas HTTP locales y externas se concentrarán en `services/`. JSON Server simulará el backend de los datos propios. Se debe mantener esta separación sin sobreingeniería.

## 5. Módulos

- Inicio.
- Explorar.
- Películas y detalle.
- Recomendaciones.
- Diario.
- Mis listas.
- Estadísticas.
- Perfil.
- Autenticación.
- Administración.

## 6. Rutas

Se requieren rutas públicas, privadas y restringidas por rol. La asignación exacta de URLs, rutas anidadas y redirecciones todavía no está definida. No inventar paths definitivos sin revisar la fase correspondiente y obtener autorización cuando implique una decisión importante.

La cobertura esperada corresponde a los módulos enumerados: Inicio, Explorar, detalle de película, Recomendaciones, Diario, Mis listas, Estadísticas, Perfil, Autenticación y Administración.

## 7. TMDB

TMDB es la API cinematográfica seleccionada y proporcionará los datos externos de películas. Su consumo deberá centralizarse en `services/`. Las credenciales deberán mantenerse fuera del repositorio y nunca exponerse ni subirse mediante `.env`.

No duplicar innecesariamente datos de TMDB en `db.json`; usar `tmdbId` como referencia cuando corresponda. Los endpoints concretos, estrategia de caché, idioma y tratamiento de imágenes se definirán durante la fase de integración.

## 8. JSON Server

JSON Server simulará el backend para la información propia de FilmDNA. Se consumirá mediante peticiones HTTP; no debe tratarse como importación directa de un objeto local cuando la funcionalidad requiera persistencia simulada.

`db.json` aún no debe crearse en esta preparación documental.

## 9. Modelo general de db.json

```json
{
  "usuarios": [],
  "diario": [],
  "favoritos": [],
  "listas": [],
  "listaPeliculas": [],
  "movieDNA": [],
  "configuracionDNA": []
}
```

Las relaciones, identificadores, campos obligatorios y reglas de integridad aún no están definidos. Deben concretarse antes de implementar cada recurso. Cuando una entidad se refiera a una película externa, deberá preferirse `tmdbId` sobre la duplicación de metadatos de TMDB.

## 10. Autenticación

El sistema requiere registro, inicio de sesión, persistencia de sesión y protección de rutas privadas. El mecanismo concreto de persistencia, almacenamiento de credenciales y simulación de autenticación todavía no está definido. No asumir seguridad de producción sobre JSON Server.

## 11. Roles

- `usuario`.
- `admin`.

La autorización deberá controlar acceso a funciones y rutas administrativas. La matriz detallada de permisos aún no está definida más allá de los requisitos funcionales.

## 12. Movie DNA

Movie DNA representa un perfil estimado de la experiencia cinematográfica. No debe presentarse como medición científica ni generar valores aleatorios.

Dimensiones, en escala prevista de 0 a 100:

- Misterio.
- Oscuridad.
- Complejidad.
- Tensión.
- Surrealismo.
- Ritmo.

Ritmo representa qué tan pausada o dinámica se percibe una película; no representa duración.

Los valores podrán basarse en metadatos de TMDB, géneros, keywords, reglas propias y análisis mediante IA. Debe existir posteriormente la acción “Buscar películas con DNA similar”, basada en las seis dimensiones. La fórmula de cálculo y similitud no está definida y no debe inventarse.

## 13. Inteligencia artificial

Usos previstos:

- Búsqueda cinematográfica en lenguaje natural.
- Recomendaciones.
- Apoyo al análisis Movie DNA.
- Explicaciones de recomendaciones.

Ejemplo oficial: “Quiero algo de ciencia ficción, oscuro, existencial y que no sea muy largo.”

La IA es una parte del producto, no toda la aplicación. El proveedor, modelo, contratos de respuesta, costos y estrategia de protección de claves todavía no están definidos. No seleccionar un proveedor o modelo sin autorización.

## 14. Recomendaciones

Las recomendaciones deben considerar preferencias de experiencia: estado de ánimo, atmósfera, ritmo, complejidad, duración e intensidad. Podrán apoyarse en IA y Movie DNA. La lógica de ranking, ponderaciones, explicaciones y manejo de resultados vacíos está pendiente de definición.

## 15. Diario

El diario permitirá registrar película, fecha, calificación y reseña. Los campos adicionales, validaciones, edición, eliminación y relación exacta con usuarios se definirán al modelar el recurso.

## 16. Listas

El sistema incluirá favoritos, pendientes y listas personalizadas. `listas` y `listaPeliculas` están previstos como recursos separados en `db.json`; su esquema y reglas de relación se concretarán antes de implementarlos.

## 17. Estadísticas

Las estadísticas se derivarán de la actividad registrada por el usuario. Las métricas y gráficos concretos para usuario todavía no están definidos. No usar datos ficticios como si fueran reales.

## 18. Administración

La administración requiere CRUD de los recursos propios que correspondan al sistema y un dashboard con al menos tres métricas y un gráfico. Los recursos administrables, métricas y permisos detallados se definirán durante la fase correspondiente.

## 19. Responsive

La interfaz debe funcionar correctamente en:

- Móvil: aproximadamente `375px`.
- Tablet: aproximadamente `768px`.
- Escritorio: `1280px` o más.

El sistema de Stitch propone una cuadrícula de 4 columnas por debajo de `640px`, 8 columnas entre `640px` y `1023px`, y 12 columnas desde `1024px`. Estos breakpoints visuales y los tamaños de validación del requisito deben revisarse juntos durante la implementación; no son necesariamente equivalentes.

## 20. Accesibilidad

Se implementarán al menos tres de estas cuatro prácticas establecidas en el anteproyecto:

- Control de tema o contraste.
- Tamaño de texto ajustable.
- Soporte semántico y ARIA.
- Estados que no dependan únicamente del color.

También deberán mantenerse navegación por teclado, foco visible, etiquetas comprensibles y contraste verificable cuando correspondan. Las métricas WCAG concretas deben comprobarse durante la implementación.

## 21. Requerimientos funcionales

- **RF-01:** Registro e inicio de sesión.
- **RF-02:** Persistencia de sesión y protección de rutas privadas.
- **RF-03:** Explorar y buscar películas utilizando servicio externo.
- **RF-04:** Filtros por criterios de experiencia.
- **RF-05:** Detalle de película y Movie DNA.
- **RF-06:** Recomendaciones según experiencia.
- **RF-07:** Integración de IA.
- **RF-08:** Diario con película, fecha, calificación y reseña.
- **RF-09:** Favoritos, pendientes y listas personalizadas.
- **RF-10:** Estadísticas de actividad.
- **RF-11:** CRUD administrativo.
- **RF-12:** Dashboard administrativo con un mínimo de tres métricas y un gráfico.

## 22. Requerimientos no funcionales

- **RNF-01:** Responsive en `375px`, `768px` y `1280px+`.
- **RNF-02:** Al menos tres medidas de accesibilidad requeridas.
- **RNF-03:** Arquitectura modular.
- **RNF-04:** Llamadas HTTP centralizadas en `services/`.
- **RNF-05:** JSON Server y `db.json`.
- **RNF-06:** Pruebas con Jest.

## 23. Git y GitHub

Estrategia definida:

- `main`: versión estable.
- `develop`: integración.
- `feature/*`: desarrollo por funcionalidad.

Ramas previstas:

- `feature/base-layout`.
- `feature/tmdb`.
- `feature/auth`.
- `feature/movie-dna`.
- `feature/recommendations`.
- `feature/lists`.
- `feature/diary`.
- `feature/statistics`.
- `feature/admin`.
- `feature/n8n`.
- `feature/testing`.

No hacer commits, push ni cambios de rama automáticamente. No modificar configuración Git sin solicitud.

## 24. Fases

1. **FASE 0:** Preparación, Vite y arquitectura.
2. **FASE 1:** Layout, navegación, rutas, identidad visual y responsive base.
3. **FASE 2:** TMDB.
4. **FASE 3:** JSON Server, autenticación y roles.
5. **FASE 4:** Movie DNA e IA.
6. **FASE 5:** Recomendaciones y DNA similar.
7. **FASE 6:** Listas.
8. **FASE 7:** Diario.
9. **FASE 8:** Estadísticas.
10. **FASE 9:** Administración.
11. **FASE 10:** n8n.
12. **FASE 11:** Jest, accesibilidad y responsive final.
13. **FASE 12:** Pulido, documentación y entrega.

## 25. Fuentes oficiales del proyecto

### PLANEAMIENTO.md

Fuente principal para funcionalidades, arquitectura, requisitos, modelo de datos, decisiones técnicas y fases.

### docs/brand/

Fuente principal para identidad de marca, logo, paleta, tipografía y reglas visuales oficiales.

### docs/design/DESIGN_SYSTEM.md

Fuente técnica rápida para implementar el diseño. Conserva diferencias entre fuentes sin resolverlas arbitrariamente.

### docs/mockups/

Fuente para composición, jerarquía visual, layouts y adaptación responsive. Los mockups no agregan funcionalidades automáticamente y sus textos o datos demostrativos no son requisitos.

### docs/anteproyecto/

Fuente académica del proyecto.

### Prioridad en caso de conflicto

Para funcionalidad:

```text
PLANEAMIENTO.md > Anteproyecto > Mockups
```

Para diseño:

```text
Manual de marca > DESIGN_SYSTEM.md > Mockups > nuevas decisiones de implementación
```

Si una contradicción real no puede resolverse mediante esta jerarquía, debe documentarse y solicitarse aclaración.

## 26. Reglas para Codex

Antes de cualquier implementación futura:

1. Leer `PLANEAMIENTO.md`.
2. Revisar `docs/design/DESIGN_SYSTEM.md` cuando la tarea afecte UI.
3. Consultar los mockups relevantes.
4. Inspeccionar el código existente.
5. Identificar la fase actual.
6. Modificar solamente lo necesario.

Reglas permanentes:

- No inventar funcionalidades, requisitos ni datos reales.
- No cambiar la identidad visual sin autorización.
- No seleccionar tecnologías importantes sin autorización.
- No exponer credenciales ni subir `.env`.
- No añadir dependencias innecesarias.
- Centralizar APIs en `services/`.
- Mantener arquitectura modular, responsive y accesibilidad.
- No sobreingenierizar.
- No hacer commits ni push salvo solicitud.
- No cambiar de rama salvo solicitud.
- Ejecutar build después de cambios importantes cuando el proyecto esté configurado.
- Reportar errores y warnings.
- Si una decisión importante no está definida, preguntar.
- No interpretar textos decorativos de Stitch como requisitos funcionales.

## 27. Estado actual

**Proyecto:** FilmDNA.

**Estado:** FASE 0 completada; base técnica de React preparada.

Completado:

- Concepto.
- Anteproyecto.
- Requisitos.
- Trello.
- Mockups Stitch.
- Manual de marca.
- Repositorio GitHub.
- Repositorio clonado.
- TMDB seleccionado.
- Estructura general de `db.json`.
- Concepto Movie DNA.
- Estrategia Git.
- Documentación técnica para Codex.
- React y Vite inicializados en la raíz del repositorio.
- React Router DOM configurado con rutas mínimas de inicio y página no encontrada.
- Arquitectura modular inicial de `src/` preparada.
- Estilos globales, tipografías y design tokens de FilmDNA configurados.
- Asset oficial del logo preparado para uso en runtime.
- Home temporal de verificación implementada.
- Variable de entorno de ejemplo para TMDB documentada sin credenciales reales.
- Build de producción verificado correctamente.

**Fase actual:** FASE 0 - Preparación del proyecto completada.

**Siguiente:** FASE 1 - Layout, navegación, rutas, identidad visual y responsive base. No iniciada.

## 28. Decisiones pendientes y contradicciones registradas

- Proveedor y modelo de IA: no definidos.
- Fórmula de Movie DNA y similitud: no definida.
- Esquemas detallados de `db.json`: no definidos.
- URLs exactas y matriz detallada de rutas: no definidas.
- Mecanismo concreto de autenticación y persistencia: no definido.
- Métricas específicas de estadísticas y administración: no definidas.
- Flujos concretos de n8n: no definidos.
- El anteproyecto contempla TMDB como principal y OMDb como complemento; el contexto oficial posterior selecciona TMDB. Se adopta TMDB y no se incorpora OMDb sin autorización.
- El manual usa `#08090C` como fondo principal; los tokens de Stitch asignan `background: #121316`. La diferencia se conserva en `DESIGN_SYSTEM.md`.
- El requisito responsive valida `375px`, `768px` y `1280px+`; Stitch define cortes de cuadrícula en `640px` y `1024px`. La relación final debe validarse al implementar.

