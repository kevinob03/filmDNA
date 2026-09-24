# Sistema de diseño de FilmDNA

## Alcance y fuentes

Este documento resume únicamente reglas verificables en el manual de marca, el archivo `STITCH_DESIGN_SOURCE.md`, los SVG oficiales y los mockups organizados en `docs/mockups/`. Sirve como referencia técnica rápida para futuras implementaciones. Cuando las fuentes difieren, la diferencia se conserva; este documento no decide arbitrariamente cuál valor sustituye al otro.

Jerarquía para decisiones visuales: manual de marca, este documento, mockups y, por último, nuevas decisiones de implementación autorizadas.

## Identidad visual

FilmDNA utiliza una identidad cinematográfica oscura, moderna y minimalista. El manual define tres rasgos: cinematográfica, tecnológica sin tecnicismos ficticios y minimalista. El principio rector es usar fondos oscuros como base y neón como señal. Los acentos deben identificar acciones, selección y datos; no deben llenar toda la pantalla.

El sistema de Stitch denomina la propuesta `Cinematic Neon Observatory` y añade referencias conceptuales a cuarto oscuro, proyección y superficies de vidrio ahumado. Esas referencias describen la apariencia, no funcionalidades del producto.

## Paleta de colores

### Colores de marca confirmados

| Token descriptivo | Valor | Uso verificado |
| --- | --- | --- |
| Fondo principal | `#08090C` | Lienzo oscuro principal según manual y texto descriptivo de Stitch |
| Superficie principal | `#121316` | Fondos y superficies; también aparece como `surface` y `background` en los tokens de Stitch |
| Verde neón | `#00FF87` | Acento principal, CTA y estados activos |
| Verde alternativo | `#10E57A` | Extremo de gradiente y estado hover del botón principal en Stitch |
| Surface tint | `#00E478` | Tinte y variante fija atenuada en tokens de Stitch |
| Violeta | `#9D4EDD` | Acento secundario; Movie DNA e IA en el manual |
| Violeta alternativo | `#7B2CBF` | Acento espectral alternativo en Stitch |
| Secondary container | `#6D11AD` | Contenedor secundario en tokens de Stitch |
| Magenta | `#B5179E` | Acento complementario y etiquetas |
| Cian | `#00F5D4` | Acento auxiliar y glow cian |
| Texto principal | `#F5F7FA` | Texto de alto contraste sobre fondos oscuros |
| Texto secundario | `#8A90A2` | Metadatos y contenido atenuado |
| Charcoal elevated | `#101217` | Paneles y tarjetas de vidrio oscuro |
| Charcoal surface | `#181A22` | Superficies elevadas y overlays |

### Escala de superficies de Stitch

| Token | Valor |
| --- | --- |
| `surface-container-lowest` | `#0D0E11` |
| `surface-container-low` | `#1B1B1F` |
| `surface-container` | `#1F1F23` |
| `surface-container-high` | `#292A2D` |
| `surface-container-highest` | `#343538` |
| `surface-bright` | `#38393D` |

### Tokens adicionales de Stitch

| Token | Valor |
| --- | --- |
| `on-surface` | `#E3E2E6` |
| `on-surface-variant` | `#B9CBB9` |
| `outline` | `#849585` |
| `outline-variant` | `#3B4B3D` |
| `primary` | `#F1FFEF` |
| `on-primary` | `#003919` |
| `primary-container` | `#00FF87` |
| `on-primary-container` | `#007138` |
| `secondary` | `#E0B6FF` |
| `on-secondary` | `#4C007D` |
| `on-secondary-container` | `#D7A4FF` |
| `error` | `#FFB4AB` |
| `on-error` | `#690005` |
| `error-container` | `#93000A` |
| `on-error-container` | `#FFDAD6` |

### Diferencias documentadas

- El manual y la descripción de Stitch definen `#08090C` como fondo principal. El bloque de tokens de Stitch asigna `background: #121316`. No se unifican estos valores: `#08090C` queda documentado como lienzo base y `#121316` como superficie principal hasta que se valide su uso en implementación.
- El texto principal de marca es `#F5F7FA`, mientras `on-surface` de Stitch es `#E3E2E6`. Ambos se conservan para sus funciones declaradas.
- Stitch presenta `#00FF87` como `primary-container`, mientras el token `primary` es `#F1FFEF`. En el lenguaje de marca, “verde principal” se refiere a `#00FF87`.

## Tipografía

### Familias

- `Space Grotesk`: títulos, navegación, botones, contenido e interfaz general.
- `JetBrains Mono`: métricas, valores, etiquetas técnicas y datos.

Las etiquetas `data-label` y `data-micro` de Stitch se especifican en mayúsculas, con tracking entre `0.12em` y `0.16em`.

### Jerarquía tipográfica de Stitch

| Estilo | Tamaño / línea | Peso | Tracking |
| --- | --- | --- | --- |
| `display-hero` | `56px / 64px` | 700 | `-0.03em` |
| `display-hero-mobile` | `36px / 42px` | 700 | `-0.02em` |
| `headline-xl` | `40px / 48px` | 600 | `-0.02em` |
| `headline-xl-mobile` | `28px / 34px` | 600 | `-0.01em` |
| `headline-lg` | `32px / 38px` | 600 | `-0.015em` |
| `headline-md` | `24px / 30px` | 500 | `-0.01em` |
| `headline-sm` | `18px / 24px` | 500 | `0` |
| `body-lg` | `16px / 24px` | 400 | `-0.005em` |
| `body-md` | `14px / 20px` | 400 | `0` |
| `body-sm` | `12px / 18px` | 400 | `0.01em` |
| `data-metric` | `14px / 18px` | 600 | `0.04em` |
| `data-label` | `11px / 14px` | 500 | `0.12em` |
| `data-micro` | `9px / 12px` | 500 | `0.16em` |

## Fondos, superficies y elevación

- Nivel 0: `#08090C`, lienzo base.
- Nivel 1: `#101217` al 80 %, blur de `16px`, borde `1px solid rgba(255,255,255,0.08)`.
- Nivel 2: `#181A22` al 90 %, blur de `24px`, borde verde o violeta y glow localizado.
- Nivel 3: overlay oscuro con borde exterior violeta y realce interior verde.

Los niveles y transparencias provienen de Stitch. Deben usarse con moderación y comprobar legibilidad y rendimiento antes de adoptarlos ampliamente.

## Bordes, radios y efectos

- Borde de vidrio: `rgba(255,255,255,0.08)`.
- Borde verde activo: `rgba(0,255,135,0.35)`.
- Borde violeta activo: `rgba(157,78,221,0.40)`.
- Radio base: `4px`; `sm: 2px`, `md: 6px`, `lg: 8px`, `xl: 12px` y círculo `9999px`.
- Tarjetas, modales e inputs: normalmente `8px` según el texto de Stitch.
- Chips, botones y etiquetas: normalmente `4px`.
- Formas circulares completas: indicadores, nodos y controles que lo requieran.
- Glow de nivel 2: `0 0 20px -4px rgba(0,255,135,0.25), 0 12px 32px -8px rgba(0,0,0,0.8)`.

El manual prohíbe el exceso de glow y los efectos 3D aplicados al logo.

## Componentes

### Cards

Fondo `#101217` al 85 %, blur de `12px`, radio de `8px` y borde de vidrio. En hover o selección, Stitch propone un borde superior degradado entre verde y violeta. Los mockups muestran cards de películas con imagen, metadatos, etiquetas y acción de detalle.

### Botones

- Primario: fondo `#00FF87`, texto `#08090C`, Space Grotesk Medium, mayúsculas y tracking `0.06em`; hover `#10E57A` y glow verde.
- Secundario: fondo violeta translúcido, texto `#F5F7FA`, borde `#9D4EDD`; hover con mayor relleno y glow violeta.
- Ghost: transparente, texto `#8A90A2`, borde blanco al 12 %; hover verde y texto `#F5F7FA`.

No se verificaron alturas mínimas universales ni una escala completa de tamaños de botón.

### Inputs

Fondo `#101217`, borde blanco al 12 %, texto `#F5F7FA` y placeholder `#8A90A2`. En focus: borde `#00FF87` y glow `0 0 12px rgba(0,255,135,0.25)`. Los atajos visuales usan JetBrains Mono y violeta.

### Chips y filtros

- Inactivo: fondo `#101217`, texto `#8A90A2`, borde de vidrio y radio de `4px`.
- Activo: verde al 10 %, texto y borde `#00FF87`, con punto indicador verde según Stitch.

### Checkboxes, radios y sliders

- Checkbox: `16px`, radio `3px`; seleccionado en verde con glifo oscuro.
- Radio: `16px`; seleccionado con núcleo y halo violeta.
- Slider: rail de `4px` en `#181A22`; progreso con gradiente verde-violeta; retícula propuesta de `10px × 18px`.

## Navegación

Los mockups de detalle, exploración y recomendaciones muestran navegación principal con Inicio, Explorar, Recomendaciones, Diario, Mis listas, Estadísticas, Perfil y Administración. La vista de inicio exportada usa encabezado compacto y navegación inferior. Estas composiciones son referencias visuales; no determinan por sí solas visibilidad por rol ni comportamiento funcional.

## Espaciado

| Token | Valor |
| --- | --- |
| `gutter` | `1.5rem` |
| `gutter-mobile` | `0.75rem` |
| `margin` | `2.5rem` |
| `margin-mobile` | `1rem` |
| `space-xs` | `0.25rem` |
| `space-sm` | `0.5rem` |
| `space-md` | `1rem` |
| `space-lg` | `1.5rem` |
| `space-xl` | `2.5rem` |

## Layout, breakpoints y responsive

Stitch define una cuadrícula fluida de 12 columnas desde `1024px`, 8 columnas entre `640px` y `1023px`, y 4 columnas por debajo de `640px`.

Los requisitos del proyecto exigen comprobar al menos `375px`, `768px` y `1280px+`. Estas medidas son objetivos de validación responsive, no sustituyen automáticamente los breakpoints de la cuadrícula. La relación exacta entre ambos conjuntos deberá confirmarse al implementar.

## Movie DNA

La representación visual confirmada utiliza seis ejes: Misterio, Oscuridad, Complejidad, Tensión, Surrealismo y Ritmo. Los mockups muestran un radar/polígono, métricas desglosadas y valores de ejemplo. La escala funcional prevista es de 0 a 100.

Los valores de los mockups son ficticios y no deben copiarse como datos reales. Movie DNA es un perfil estimado, no una medición científica. Ritmo describe la percepción pausada o dinámica, no la duración.

## Estados visuales

Las fuentes verifican estados de hover, focus, selección, carga mediante skeletons, sin resultados con mensaje y acción, y estados activos/inactivos. No existe todavía una especificación completa de estados disabled, error, success o validación de formularios.

## Accesibilidad visual

El anteproyecto exige implementar al menos tres prácticas entre control de tema/contraste, tamaño de texto ajustable, semántica/ARIA y estados que no dependan únicamente del color. Los mockups incluyen referencias a alto contraste, teclado y ARIA en algunos elementos exportados.

No se proporcionaron mediciones de contraste WCAG, tamaños mínimos de objetivo táctil ni comportamiento completo de foco. Deben verificarse durante la implementación y no asumirse a partir del aspecto de los mockups.

## Uso del logotipo

- Usar los SVG originales conservados en `docs/assets/`; no redibujar ni sustituir el logo.
- Construcción: símbolo más wordmark. La variante con tagline agrega `CINEMATIC INTELLIGENCE`.
- Uso preferente sobre fondos oscuros; usar una variante aprobada cuando el contraste no sea suficiente.
- Área segura propuesta por el manual: una unidad `x`, donde `x` es la altura del símbolo.
- Tamaño mínimo del conjunto según el manual: `96px` digital y `25mm` impreso.
- No deformar, rotar, recolorear arbitrariamente, aplicar glow excesivo, usar con bajo contraste ni añadir efectos 3D.

## Assets oficiales

- `docs/assets/filmdna-logo-primary-dark.svg`: logo con fondo `#08090C`.
- `docs/assets/filmdna-logo-primary-dark.png`: raster correspondiente.
- `docs/assets/filmdna-logo-with-tagline.svg`: logo transparente con tagline.
- `docs/assets/filmdna-logo-with-tagline.png`: raster correspondiente.
- `docs/brand/Manual_de_Marca_FilmDNA.pdf`: fuente principal de identidad.
- `docs/design/STITCH_DESIGN_SOURCE.md`: exportación textual original de Stitch.

Los archivos llamados originalmente `code.html` para los logos contenían SVG completos. Se conservaron sin alterar su contenido y se les asignó extensión `.svg`.

