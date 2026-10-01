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

### FASE 10 - Workflows n8n definidos

La rúbrica requiere un proyecto n8n con un mínimo de dos flujos relacionados con FilmDNA. Se implementan como exportaciones JSON importables, sin servicios de pago ni credenciales externas:

#### Flujo 1: Reporte de actividad cinematográfica

- **Objetivo:** consolidar automáticamente la actividad real de un usuario.
- **Trigger:** webhook HTTP `POST /filmdna/activity-report`.
- **Entrada:** `userId` en el cuerpo JSON.
- **Nodos principales:** validación de entrada, consultas HTTP a diario, favoritos, listas y relaciones, agregación y respuesta HTTP.
- **Resultado:** reporte JSON con totales, promedio de calificación y fecha de generación.

#### Flujo 2: Respaldo programado de FilmDNA

- **Objetivo:** respaldar automáticamente los recursos propios almacenados mediante JSON Server.
- **Trigger:** manual para demostración y programado diariamente a las 02:00.
- **Entrada:** recursos `usuarios`, `diario`, `favoritos`, `listas`, `listaPeliculas`, `movieDNA` y `configuracionDNA`.
- **Nodos principales:** consultas HTTP, sanitización, conversión a JSON y escritura del archivo.
- **Resultado:** archivo fechado en `/files/backups` dentro del entorno n8n.
- **Protección:** las contraseñas se eliminan antes de construir el respaldo y no se leen archivos `.env`.

Los exports y sus instrucciones se conservan en `docs/n8n/`. El script `npm run test:n8n-workflows` valida estructura, conexiones, triggers, recursos, ausencia de credenciales, sanitización y continuidad ante colecciones vacías. Ambos archivos también fueron importados correctamente mediante el CLI oficial de n8n. El respaldo se escribe en la carpeta local versionada `backups/`, cuyos archivos JSON están excluidos de Git.

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
- Gestionar ramas, commits, push e integración automáticamente únicamente cuando un bloque lógico esté terminado y validado, de acuerdo con el Protocolo de continuidad para Codex.
- Mantener el desarrollo normal en `develop` y ramas `feature/*`; no tocar `main` salvo solicitud expresa.
- Ejecutar build después de cambios importantes cuando el proyecto esté configurado.
- Reportar errores y warnings.
- Si una decisión importante no está definida, preguntar.
- No interpretar textos decorativos de Stitch como requisitos funcionales.

## 27. Estado actual

**Proyecto:** FilmDNA.

**Estado:** FASES 0 a 10 completadas. FASE 11 muy avanzada y parcialmente completada; queda la auditoría final de regresión, accesibilidad y responsive. FASE 12 pendiente.

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
- Layout reutilizable, navegación desktop y navegación móvil implementados.
- Home real implementada con Hero, selector visual de experiencia y secciones previstas.
- Estados placeholder preparados para contenido dependiente de TMDB, sin datos cinematográficos ficticios.
- Introducción conceptual de Movie DNA implementada sin valores ni cálculos inventados.
- Responsive base y accesibilidad de navegación aplicados para FASE 1.
- FASE 1 integrada y subida a `develop`.
- Servicio centralizado para tendencias, películas populares, búsqueda y detalle mediante TMDB.
- Home preparada para mostrar tendencias reales de TMDB.
- Página Explorar implementada con catálogo, búsqueda y paginación.
- Detalle de película implementado con información real de TMDB.
- Estados de configuración, carga, error, contenido vacío e imágenes faltantes implementados.
- Navegación actualizada para `/explorar` y `/pelicula/:id`.
- Movie DNA conservado como espacio informativo sin cálculos ni valores ficticios.
- FASE 2 integrada y subida a `develop`.
- JSON Server configurado como backend simulado con la estructura base de `db.json`.
- Servicio de autenticación centralizado para login, registro y consulta de usuarios.
- AuthContext implementado con estados de comprobación, sesión autenticada y sesión no autenticada.
- Persistencia demostrativa de sesión implementada con `localStorage`, sin almacenar contraseñas.
- Login y registro implementados con validación, estados de petición y errores comprensibles.
- Perfil básico implementado únicamente con nombre, email y rol reales del usuario autenticado.
- Guards reutilizables implementados para rutas privadas, rutas de invitado y autorización por rol.
- Roles `usuario` y `admin` verificados mediante una ruta administrativa mínima y una página 403.
- Navegación desktop y móvil adaptada al estado de autenticación.
- Movie DNA implementado con contrato único, validación estricta, radar accesible y persistencia por `tmdbId` en JSON Server.
- Fallback secuencial de IA implementado: Gemini, DeepSeek y Groq, con modelos configurables mediante variables de entorno.
- Metadata técnica de proveedor y modelo preparada para persistirse sin duplicar datos de la película.
- TMDB conservado como fuente principal y OMDb integrado como fallback limitado para búsqueda y detalle básicos, sin mezclar IDs IMDb con `tmdbId`.
- Limitación de claves `VITE_*` documentada para el alcance académico; una versión de producción deberá usar backend, serverless o proxy.
- Incidencias externas conocidas de Gemini, DeepSeek y Groq documentadas sin bloquear el resto de FilmDNA.
- Recomendaciones por seis criterios de experiencia implementadas con TMDB y reglas deterministas independientes de IA.
- Búsqueda por Movie DNA similar implementada mediante distancia euclidiana normalizada sobre perfiles almacenados.
- Favoritos, pendientes, listas personalizadas y biblioteca personal implementados.
- Diario cinematográfico con fecha, calificación y reseña implementado.
- Estadísticas reales derivadas de la actividad del usuario implementadas.
- Perfil personalizable y administración de usuarios implementados.
- Tema claro, oscuro y alto contraste, tamaño de texto y mejoras responsive implementados.
- Jest configurado con 3 suites y 22 pruebas aprobadas en la validación de FASE 10.
- Pruebas E2E y auditorías específicas disponibles para perfil, estadísticas, diario, biblioteca, recomendaciones e infraestructura de IA.
- Dos workflows n8n exportables implementados: reporte de actividad y respaldo programado sanitizado.
- Workflows n8n validados por script local e importados correctamente con el CLI oficial.
- FAQ pública implementada con acceso desde la navegación principal y móvil.
- Tarjetas de Recomendaciones completamente navegables, con acciones independientes para Pendientes y descarte.
- Tarjetas de Explorar con acciones rápidas de Favoritos y Pendientes, reutilizando la biblioteca existente.
- Filtro Tono eliminado por solaparse con la preferencia emocional; pesos de compatibilidad redistribuidos entre preferencias activas.
- Interpretación de búsqueda actualizada para no emitir el filtro Tono y conservar conceptos no representables de forma explícita.
- Home actualizado para presentar funciones reales de Recomendaciones, Movie DNA, Explorar, Biblioteca y Diario sin mensajes temporales de fases anteriores.
- Resumen reutilizable de preguntas frecuentes integrado al final del Home; `/ayuda` conserva la colección completa desde una única fuente de contenido.
- Auditoría E2E del Home añadida para `375px`, `768px` y `1280px`, enlaces funcionales, acordeones y ausencia de contenido obsoleto.
- Tour Guide global implementado con seis pasos sobre Inicio, Explorar, Recomendaciones, Accesibilidad y FAQ.
- Tutorial accesible con navegación automática entre rutas, foco visual, controles anterior/siguiente, cierre con Escape y persistencia local de finalización.
- Botón global para iniciar o repetir el tutorial y auditoría E2E aprobada en escritorio y móvil a `375px`.
- Porcentaje de coincidencia unificado en escala `1–100%` con ponderación de género, duración, época, puntuación, idioma, país, plataforma y preferencias de experiencia.
- Cobertura y confianza visibles por tarjeta mediante criterios comprobados; los datos desconocidos se informan y no se convierten artificialmente en `0%`.
- Orden de compatibilidad, fórmula combinada y fallback de IA validados con pruebas unitarias y auditorías E2E sobre seis combinaciones reales.
- Quiz inicial de personalización implementado para cuentas nuevas con cinco pasos sobre géneros, emoción, ritmo, atención y compañía.
- Preferencias del quiz persistidas en el usuario y reutilizadas como selección inicial en Recomendaciones; el resultado final abre una búsqueda ya aplicada.
- Cuentas antiguas conservan su acceso, las cuentas nuevas pendientes retoman el quiz al iniciar sesión y el recorrido puede omitirse explícitamente.
- Auditoría E2E del quiz aprobada en móvil a `390px`, incluyendo registro, persistencia, restauración de filtros y reanudación posterior.
- Campos de contraseña y confirmación del registro alineados con dimensiones visuales equivalentes en escritorio, sin alterar el flujo móvil.

**Fase actual:** FASE 11 - Jest, accesibilidad y responsive final, muy avanzada y pendiente de auditoría global.

## 28. Siguiente paso

Implementar reseñas públicas o privadas en el Diario y mostrar las reseñas públicas en la página correspondiente de cada película.

## 29. Decisiones pendientes y contradicciones registradas

- Proveedor y modelo de IA: no definidos.
- Fórmula de Movie DNA y similitud: no definida.
- Esquemas detallados de `db.json`: no definidos.
- URLs exactas y matriz detallada de rutas: no definidas.
- Mecanismo concreto de autenticación y persistencia: no definido.
- Métricas específicas de estadísticas y administración: no definidas.
- La ejecución de los workflows n8n requiere una instancia local con acceso a JSON Server y una ruta `/files/backups` escribible; los exports no incluyen configuración privada del entorno.
- El anteproyecto contempla TMDB como principal y OMDb como complemento; el contexto oficial posterior selecciona TMDB. Se adopta TMDB y no se incorpora OMDb sin autorización.
- El manual usa `#08090C` como fondo principal; los tokens de Stitch asignan `background: #121316`. La diferencia se conserva en `DESIGN_SYSTEM.md`.
- El requisito responsive valida `375px`, `768px` y `1280px+`; Stitch define cortes de cuadrícula en `640px` y `1024px`. La relación final debe validarse al implementar.

## 30. Protocolo de continuidad para Codex

Cuando el usuario diga solamente **“siguiente paso”**, Codex debe ejecutar este protocolo automáticamente, sin esperar recordatorios separados para actualizar el planeamiento, gestionar Git/GitHub o sincronizar Trello.

### Inicio de cada bloque

1. Leer `PLANEAMIENTO.md` y localizar la primera tarea pendiente de la sección **Siguiente paso**.
2. Auditar el estado real del repositorio: rama actual, `git status`, historial pertinente, ramas, stashes y sincronización con el remoto.
3. Considerar el código real como fuente principal de verdad sobre lo implementado; no marcar trabajo como terminado si el repositorio no lo respalda.
4. Inspeccionar el código, scripts, pruebas y documentación relacionados antes de modificar algo.
5. Revisar el estado real de la tarea/card de Trello y moverla o actualizarla cuando corresponda, si la integración está disponible.
6. Partir de `develop` actualizado y crear o continuar una rama `feature/<nombre>` adecuada para el bloque.
7. Ejecutar únicamente el siguiente bloque lógico de trabajo. No rehacer funcionalidades completadas ni inventar requisitos históricos.
8. Se permiten decisiones técnicas conservadoras necesarias para avanzar cuando no contradigan requisitos existentes. Se debe pedir autorización antes de usar credenciales privadas, servicios de pago, eliminar datos, realizar cambios destructivos o cambiar de forma importante la arquitectura.

### Trello

Trello debe mantenerse sincronizado con el estado real del proyecto.

Antes de comenzar cada bloque correspondiente a una tarea/card:

1. Revisar el estado real de la tarea.
2. Actualizar o mover su card cuando corresponda.

Después de completar un bloque:

1. Ejecutar primero las pruebas necesarias.
2. Actualizar Trello únicamente si el bloque está realmente completado.
3. Marcar automáticamente solo los criterios de aceptación existentes que se hayan cumplido.
4. No crear criterios de aceptación nuevos salvo solicitud expresa del usuario.
5. No marcar una tarea como **Finalizada** mientras falten pruebas, integración o validaciones requeridas.
6. Cuando el trabajo esté completamente integrado en `develop` y pase las pruebas finales, mover la card correspondiente a **Finalizado** cuando proceda.
7. Registrar en la card información útil como commits, merge y validaciones cuando sea relevante.

Si Trello o su integración/MCP no están disponibles, no inventar actualizaciones ni afirmar que Trello fue actualizado. Informar claramente que no pudo sincronizarse y continuar con el resto del trabajo cuando sea seguro.

### Git y GitHub

Cuando un bloque lógico esté realmente terminado, Codex debe gestionar Git y GitHub automáticamente mediante este flujo normal:

```text
develop actualizado
→ feature/<nombre>
→ implementación
→ pruebas
→ git diff --check
→ commit
→ push feature
→ merge --no-ff a develop
→ pruebas/regresión final
→ push develop
→ comprobar develop == origin/develop
→ working tree limpio
```

Reglas permanentes:

- Hacer commit, push y merge solo cuando el bloque esté terminado y validado.
- Crear commits lógicos y descriptivos; no crear un commit por cada cambio pequeño.
- Si una tarea requiere varios bloques, mantenerla en su rama feature hasta que exista un bloque integrable realmente listo.
- Si las pruebas fallan, no integrar en `develop` ni publicar un `develop` defectuoso; corregir primero o reportar el bloqueo.
- No hacer force push.
- No realizar rebases destructivos.
- No tocar `main` durante el desarrollo normal.
- No incluir `.env`, credenciales, datos locales protegidos ni archivos ajenos a la tarea.
- No eliminar stashes protegidos sin autorización.
- Mantener estables `main` y los datos locales protegidos.

### Cierre y sincronización de cada bloque

Después de cada bloque completado deben quedar sincronizados, cuando exista acceso:

1. El código real.
2. `PLANEAMIENTO.md`.
3. Trello.
4. Git/GitHub.

Antes de declarar el bloque completado:

1. Ejecutar las pruebas relevantes.
2. Ejecutar el build cuando corresponda.
3. Ejecutar `git diff --check`.
4. Actualizar `PLANEAMIENTO.md` con el resultado real y actualizar la sección **Siguiente paso** con una única acción concreta.
5. Completar el flujo Git/GitHub y confirmar que `develop` coincide con `origin/develop` y que el working tree está limpio.
6. Actualizar Trello conforme a las reglas anteriores.
7. Reportar brevemente qué se hizo, las pruebas ejecutadas, el estado de Git, la sincronización de Trello y qué sigue.

No avanzar múltiples fases grandes en silencio. Si una integración externa no está disponible, informar la limitación sin representar como realizada ninguna actualización externa.

