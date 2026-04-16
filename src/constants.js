export const C = {
  bg: "#08080f",
  card: "#0e0e1a",
  border: "#1a1a28",
  cyan: "#00f0ff",
  magenta: "#ff0080",
  green: "#00ff88",
  purple: "#7b68ee",
  amber: "#ffb800",
  text: "#d4d4d8",
  muted: "#666",
  dim: "#333",
};

export const WDAYS = ["L", "M", "X", "J", "V", "S", "D"];

export const TODAY = () => new Date().toISOString().split("T")[0];

export const DEFAULT_STATE = {
  profile: { name: "Biohacker", created: TODAY() },
  supplements: [
    { id: "s1", name: "Creatina", emoji: "💊", dose: "5g", freq: "daily" },
    { id: "s2", name: "Magnesio", emoji: "🧪", dose: "400mg", freq: "daily" },
    { id: "s3", name: "Omega-3", emoji: "🐟", dose: "1g", freq: "daily" },
  ],
  trainingTypes: [
    { id: "t1", name: "Gym", emoji: "🏋️" },
    { id: "t2", name: "Natación", emoji: "🏊" },
    { id: "t3", name: "Fútbol", emoji: "⚽" },
    { id: "t4", name: "Basket", emoji: "🏀" },
  ],
  logs: {},
  unlockedBadges: [],
};

export const BADGES = [
  { id: "b1", name: "Primer paso", emoji: "👣", desc: "Registra tu primer día", check: s => Object.keys(s.logs).length >= 1 },
  { id: "b2", name: "Semana activa", emoji: "📅", desc: "7 días registrados", check: s => Object.keys(s.logs).length >= 7 },
  { id: "b3", name: "Centurión", emoji: "🏛️", desc: "30 días registrados", check: s => Object.keys(s.logs).length >= 30 },
  { id: "b4", name: "Consistente", emoji: "📊", desc: "80%+ consistencia en entreno", check: (s, utils) => utils.getCons(s, "training") >= 80 },
  { id: "b5", name: "Máquina", emoji: "💪", desc: "Entrena a intensidad 5", check: s => Object.values(s.logs).some(l => l.training?.intensity === 5) },
  { id: "b6", name: "Dormilón pro", emoji: "😴", desc: "Registra 9+ horas", check: s => Object.values(s.logs).some(l => l.sleep?.hours >= 9) },
  { id: "b7", name: "Alquimista", emoji: "⚗️", desc: "5+ suplementos", check: s => s.supplements.length >= 5 },
  { id: "b8", name: "Día perfecto", emoji: "👑", desc: "Completa todo en un día", check: (s, utils) => utils.hasPerfect(s) },
  { id: "b9", name: "50 entrenos", emoji: "🔥", desc: "50 entrenamientos totales", check: (s, utils) => utils.cntTotal(s.logs, "training") >= 50 },
  { id: "b10", name: "100 días", emoji: "⭐", desc: "100 días registrados", check: s => Object.keys(s.logs).length >= 100 },
  { id: "b11", name: "Semana perfecta", emoji: "🏆", desc: "7 días perfectos seguidos", check: (s, utils) => utils.hasPerfectWeek(s) },
];
