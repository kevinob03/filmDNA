# Índice de mockups de FilmDNA

## Alcance

Los mockups de Google Stitch son referencias visuales para composición, jerarquía, layout y adaptación responsive. No agregan funcionalidades ni datos reales. Cada PNG se conserva junto con el HTML exportado que permitió identificar su contenido.

Las dimensiones del archivo de imagen no prueban por sí solas el viewport original. Por esa razón solo se indica móvil cuando la estructura exportada lo evidencia claramente; en los demás casos el tipo de dispositivo queda sin confirmar.

## Referencias disponibles

### `home.png` y `home.html`

- Pantalla: Inicio.
- Formato: composición móvil verificable por el encabezado compacto, navegación inferior y clases responsive del HTML.
- Elementos: hero, película destacada, acceso a explorar, sintonizador de experiencia, tendencias y módulos principales.
- Observaciones: textos como “Observatorio multi-dimensional”, “telemetría algorítmica”, “LIVE BIAS”, “afinidad espectral” y versiones del motor son decorativos. No constituyen requisitos.

### `explore.png` y `explore.html`

- Pantalla: Explorar catálogo.
- Formato: viewport exacto no confirmado; el HTML contiene estados y reglas responsive para distintas anchuras.
- Elementos: búsqueda, orden, vista de cuadrícula/lista, filtros por experiencia, filtros convencionales, filtros activos, cards, paginación, skeletons y estado sin resultados.
- Observaciones: títulos, cifras de catálogo, `MOTOR DNA v2.4`, porcentajes y películas son contenido ficticio. La pantalla sí sirve para estudiar jerarquía, filtros y estados visuales.

### `movie-detail.png` y `movie-detail.html`

- Pantalla: Detalle de película y Movie DNA.
- Formato: viewport exacto no confirmado; el HTML incluye variaciones responsive.
- Elementos: metadatos, sinopsis, trailer, acciones personales, listas, radar de seis ejes, métricas, ficha técnica, reparto, reseñas y películas con DNA similar.
- Observaciones: película, personas, productoras, puntuaciones, valores de DNA y datos técnicos son ficticios. “Algoritmo de afinidad cinematográfica” no define una fórmula real.

### `recommendations.png` y `recommendations.html`

- Pantalla: Recomendaciones.
- Formato: viewport exacto no confirmado; el HTML contiene adaptación responsive.
- Elementos: criterios seleccionados, entrada en lenguaje natural, generación de recomendaciones, explicación visual y cards de resultados.
- Observaciones: resultados, puntuaciones, explicaciones y valores son demostrativos. El proveedor y el modelo de IA no están definidos.

## Assets de marca relacionados

Las exportaciones 1 y 2 de Stitch no son pantallas funcionales: son dos variantes del logotipo. Se organizaron en `docs/assets/` como SVG y PNG, en vez de incluirlas en este índice de pantallas.

## Contenido decorativo que debe ignorarse

No convertir en requisitos expresiones como algoritmo cuántico, telemetría algorítmica, red neural ficticia, observatorio multidimensional, versiones inventadas, afinidad espectral, LIVE BIAS, genoma cinematográfico, identificadores ficticios ni cifras de catálogo generadas para la presentación.

