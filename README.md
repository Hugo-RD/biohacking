# Biohack

Bio-hacking tracker con estética Neon Biohacker. Diseño basado en investigación de neurociencia sobre formación de hábitos.

## Setup

```bash
# Instalar dependencias
npm install

# Arrancar en local
npm run dev

# Build para producción
npm run build
```

## Deploy en Vercel

1. Sube este repo a GitHub
2. Ve a [vercel.com](https://vercel.com) y conecta tu cuenta de GitHub
3. Importa el repo → Vercel detecta Vite automáticamente
4. Click en "Deploy"
5. Comparte el link con tus amigos

## Instalar como app móvil (PWA)

1. Abre el link de Vercel en el móvil (Chrome o Safari)
2. Chrome: menú ⋮ → "Añadir a pantalla de inicio"
3. Safari: botón compartir → "Añadir a pantalla de inicio"
4. Se abre como app nativa

## Estructura

```
src/
├── App.jsx              # Shell principal, estado global
├── storage.js           # Capa de persistencia (localStorage → Supabase)
├── constants.js         # Colores, badges, estado default
├── utils.js             # Cálculos: streaks, consistencia, correlaciones
├── styles.css           # Estilos globales + animaciones
├── components/
│   ├── Header.jsx       # Nombre + status + indicadores
│   ├── QuickLog.jsx     # Log diario: supps + entreno + sueño
│   ├── Heatmap.jsx      # Mapa de actividad tipo GitHub
│   ├── ConsistencyRings.jsx  # Anillos de consistencia + expandible
│   ├── Ring.jsx         # SVG donut reutilizable
│   ├── WeeklySummary.jsx # Informe semanal
│   └── Nav.jsx          # Navegación inferior
└── views/
    ├── Home.jsx         # Pantalla principal
    ├── Stats.jsx        # Estadísticas + insights + badges
    └── Config.jsx       # Configuración
```

## Próximos pasos

- [ ] Reemplazar iconos placeholder (public/icon-*.png)
- [ ] Conectar Supabase (solo tocar storage.js)
- [ ] Añadir auth
- [ ] Leaderboard social
- [ ] Onboarding para nuevos usuarios

## Notas de diseño

- **Sin XP/niveles** — métricas reales, no artificiales
- **Consistencia > rachas** — porcentaje de 30 días, no días consecutivos
- **Grace period** — las rachas permiten 1 fallo sin romperse
- **Diario vs condicional** — no penaliza por no tomar algo que no tocaba
- **Correlaciones** — insights automáticos basados en tus datos reales
