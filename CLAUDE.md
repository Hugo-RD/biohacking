# CLAUDE.md

## Qué es este proyecto

Biohack es una app de tracking de hábitos de bio-hacking con diseño basado en investigación de neurociencia sobre formación de hábitos. El objetivo es ayudar al usuario a ser consistente con sus suplementos, entrenos y sueño sin gamificación artificial ni métricas vacías.

## Estado actual

MVP funcional como PWA con Vite + React. Persistencia en localStorage. Sin backend, sin auth, sin social. La prioridad ahora es validar con 5-10 amigos para obtener feedback real antes de sobrecomplicar.

## Stack

- **Frontend**: Vite + React 18 (no Next.js — no necesitamos SSR)
- **Persistencia**: localStorage via `src/storage.js` (preparado para migrar a Supabase)
- **Gráficas**: recharts
- **Estilo**: CSS-in-JS inline + `src/styles.css` para animaciones globales
- **Deploy target**: Vercel como PWA

## Principios de diseño (basados en neurociencia)

Estos principios no son opiniones estéticas — están respaldados por investigación. No se deben cambiar sin discusión.

### Consistencia > rachas
La investigación muestra que las rachas consecutivas motivan un 40% más de esfuerzo, pero cuando se rompen causan abandono desproporcionado. Por eso mostramos **porcentaje de consistencia en 30 días** como métrica principal, y rachas como dato secundario. Las rachas tienen **grace period** (1 día de fallo sin romperse).

### Sin XP ni niveles
Se eliminó deliberadamente el sistema de XP/niveles porque genera "metric fixation" — el usuario optimiza para un número que no significa nada real. La progresión se mide con datos reales: consistencia, totales acumulados, insights de correlación.

### Tracking binario para hábitos en formación
Estudios muestran que el tracking simple sí/no mantiene hábitos un 27% más que sistemas de métricas complejas. Los suplementos son checkboxes, el entreno es hecho/no hecho. La complejidad (tipo, intensidad) es opcional.

### Diario vs condicional
No todos los hábitos son diarios. Forzar tracking diario de algo condicional genera culpa falsa. Los suplementos tienen frecuencia configurable: "diario" (afecta consistencia) o "condicional" (se registra cuando toca, no penaliza cuando no).

### Menos datos, más significado
La investigación de National Geographic vincula exceso de datos biométricos con ansiedad. Máximo 3 anillos de consistencia en home. Los suplementos se agrupan en uno expandible. Los insights de correlación son 1-2 máximo, no un dashboard.

## Estética: Neon Biohacker

- **Fondo**: negro profundo `#08080f`
- **Tarjetas**: `#0e0e1a` con bordes `#1a1a28`
- **Acento principal**: cyan `#00f0ff` (acciones, datos, heatmap)
- **Éxito/entreno**: verde `#00ff88`
- **Sueño**: púrpura `#7b68ee`
- **Rachas/badges**: magenta `#ff0080` / amber `#ffb800`
- **Tipografía**: `Space Mono` para labels técnicos y datos, `Inter` para texto de lectura
- **Secciones**: prefijadas con `//` estilo comentario de código
- **NO usar**: glow exagerado, scanlines, fuentes pixel art, emojis como decoración estructural

Los colores están centralizados en `src/constants.js` como objeto `C`. Siempre usar `C.cyan`, nunca hardcodear `#00f0ff` en componentes.

## Arquitectura y convenciones

### Flujo de datos
Unidireccional y simple: `App.jsx` es el dueño del estado. Carga con `storage.load()`, pasa estado a views como props, y recibe acciones de vuelta via callbacks (`onToggleSupp`, `onTrain`, `onSleep`). Las views pasan lo que necesitan a sus components.

### storage.js es el único punto de contacto con persistencia
Cuando migremos a Supabase, SOLO se toca este archivo. Exporta `load()`, `save(state)`, `reset()`. Ningún otro archivo debe acceder a localStorage directamente.

### utils.js son funciones puras
Todas las funciones de cálculo (streaks, consistencia, correlaciones, scores) son puras: entrada → salida, sin side effects, sin estado. Esto permite testearlas fácilmente.

### constants.js es configuración estática
Colores, badges, estado por defecto, días de la semana. Si es un valor que no cambia en runtime, va aquí.

### Components vs Views
- **Views** (`src/views/`): pantallas completas (Home, Stats, Config). Componen componentes.
- **Components** (`src/components/`): piezas reutilizables. No conocen el estado global — reciben datos via props.

### Estilo
CSS inline para estilos específicos de componente. `src/styles.css` solo para: animaciones `@keyframes`, clases globales reutilizables (`.card`, `.btn`, `.pill`, `.mono`), y reset básico. No usar CSS modules ni styled-components.

### Nombrado
- Archivos: PascalCase para componentes (`QuickLog.jsx`), camelCase para utilidades (`storage.js`)
- Funciones: camelCase (`getStreak`, `toggleSupp`)
- Constantes: UPPER_CASE para arrays/objetos exportados (`BADGES`, `DEFAULT_STATE`), camelCase para funciones helper (`TODAY()`)
- CSS classes: kebab-case (`btn-cyan`, `pill-done`)

## Roadmap

### Ahora (validación)
- [x] MVP funcional
- [x] Estética Neon Biohacker
- [x] PWA ready
- [ ] Reemplazar iconos placeholder
- [ ] Deploy en Vercel
- [ ] Compartir con 5-10 amigos
- [ ] Recoger feedback durante 2-3 semanas

### Después (si la validación es positiva)
- [ ] Supabase: auth + persistencia en la nube (solo tocar `storage.js`)
- [ ] Onboarding: primera experiencia guiada, empezar vacío
- [ ] Social: sección de amigos, ver progreso de otros
- [ ] Leaderboard semanal (score semanal, no XP — para que todos compitan igual)
- [ ] Correlaciones más avanzadas (supps ↔ calidad sueño, etc.)

### No hacer (decisiones conscientes)
- **No** añadir árbol de habilidades / skill tree (sobrecomplicación)
- **No** añadir boss fights (gamificación que distrae del tracking real)
- **No** añadir notificaciones push hasta tener datos de retención
- **No** añadir tracking de macros/calorías (scope creep, hay apps mejores para eso)
- **No** volver a añadir XP/niveles sin evidencia de que mejora la retención

## Métricas de éxito para la validación

Lo que queremos observar en los amigos:
1. **Retención día 7**: ¿cuántos siguen abriendo la app después de una semana?
2. **Frecuencia de uso**: ¿la abren todos los días o se les olvida?
3. **Completitud**: ¿registran todo o solo una cosa?
4. **Feedback cualitativo**: ¿qué les gusta? ¿qué les sobra? ¿qué echan en falta?
5. **Momento de abandono**: si dejan de usarla, ¿cuándo y por qué?

## Cómo trabajar en este proyecto

### Añadir un nuevo componente
1. Crear archivo en `src/components/NuevoComponente.jsx`
2. Importar colores de `../constants` y utils de `../utils` según necesite
3. El componente recibe datos via props, no accede a estado global
4. Usarlo desde la view correspondiente

### Añadir un nuevo badge
1. Añadir entrada al array `BADGES` en `src/constants.js`
2. La función `check` recibe `(state, utils)` y devuelve boolean
3. El badge se desbloquea automáticamente — no hay que tocar más código

### Añadir una nueva métrica/cálculo
1. Añadir función pura en `src/utils.js`
2. Exportarla
3. Usarla donde se necesite importándola

### Migrar a Supabase
1. `npm install @supabase/supabase-js`
2. Reescribir `src/storage.js` para usar Supabase en vez de localStorage
3. Mantener la misma interfaz: `load()`, `save(state)`, `reset()`
4. Añadir auth en `App.jsx` (wrapper)
5. El resto de la app no cambia

## Errores comunes a evitar

- **No poner lógica de negocio en componentes** — va en `utils.js`
- **No acceder a localStorage fuera de `storage.js`**
- **No hardcodear colores** — usar siempre el objeto `C` de constants
- **No añadir métricas que puedan bajar a cero** — la investigación dice que desmotiva
- **No complicar el quick log** — el flujo diario debe ser <30 segundos, <6 toques
- **No añadir features sin preguntarse: ¿esto ayuda a la consistencia del usuario o es feature creep?**
