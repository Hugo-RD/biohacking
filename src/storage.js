import { supabase } from "./supabaseClient";

const LOCAL_KEY = "biohack-data";
let userId = null;

function localKey() {
  return userId ? `biohack-data-${userId}` : LOCAL_KEY;
}

// --- Init ---

export function init(uid) {
  userId = uid;
}

// --- Local cache helpers ---

function loadLocal() {
  try {
    const raw = localStorage.getItem(localKey());
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveLocal(state) {
  try { localStorage.setItem(localKey(), JSON.stringify(state)); } catch {}
}

export function resetLocal() {
  localStorage.removeItem(localKey());
}

// --- Load (1 round trip via RPC) ---

export async function load() {
  if (supabase && userId) {
    try {
      const { data, error } = await supabase.rpc("load_user_state");
      if (!error && data) {
        const state = transformFromDB(data);
        saveLocal(state);
        return state;
      }
    } catch {}

    // Migrate old localStorage blob if exists
    const old = localStorage.getItem(LOCAL_KEY);
    if (old) {
      try {
        const parsed = JSON.parse(old);
        await migrateToRelational(parsed);
        localStorage.removeItem(LOCAL_KEY);
        saveLocal(parsed);
        return parsed;
      } catch {}
    }
  }

  return loadLocal();
}

// --- Granular write operations ---

export async function saveProfile(name, onboarded) {
  if (supabase && userId) {
    await supabase.from("profiles")
      .update({ name, onboarded })
      .eq("id", userId)
      .catch(() => {});
  }
}

export async function addSupplement(supp) {
  if (supabase && userId) {
    const { data } = await supabase.from("user_supplements")
      .insert({ user_id: userId, name: supp.name, emoji: supp.emoji, dose: supp.dose, freq: supp.freq, sort_order: supp.sortOrder || 0 })
      .select("id")
      .single()
      .catch(() => ({ data: null }));
    return data?.id || supp.id;
  }
  return supp.id;
}

export async function removeSupplement(id) {
  if (supabase && userId) {
    await supabase.from("user_supplements").delete().eq("id", id).catch(() => {});
  }
}

export async function updateSupplement(id, updates) {
  if (supabase && userId) {
    await supabase.from("user_supplements").update(updates).eq("id", id).catch(() => {});
  }
}

export async function addTrainingType(tt) {
  if (supabase && userId) {
    const { data } = await supabase.from("user_training_types")
      .insert({ user_id: userId, name: tt.name, emoji: tt.emoji, sort_order: tt.sortOrder || 0 })
      .select("id")
      .single()
      .catch(() => ({ data: null }));
    return data?.id || tt.id;
  }
  return tt.id;
}

export async function removeTrainingType(id) {
  if (supabase && userId) {
    await supabase.from("user_training_types").delete().eq("id", id).catch(() => {});
  }
}

export async function toggleSupplement(suppId, date) {
  if (supabase && userId) {
    // Check if exists
    const { data } = await supabase.from("supplement_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("supplement_id", suppId)
      .eq("logged_date", date)
      .maybeSingle();

    if (data) {
      await supabase.from("supplement_logs").delete().eq("id", data.id);
    } else {
      await supabase.from("supplement_logs")
        .insert({ user_id: userId, supplement_id: suppId, logged_date: date });
    }
  }
}

export async function logTraining(date, trainingTypeId, typeName, typeEmoji, intensity) {
  if (supabase && userId) {
    await supabase.from("training_logs")
      .upsert({
        user_id: userId, logged_date: date,
        training_type_id: trainingTypeId, type_name: typeName, type_emoji: typeEmoji, intensity,
      }, { onConflict: "user_id,logged_date" });
  }
}

export async function logSleep(date, hours, quality) {
  if (supabase && userId) {
    await supabase.from("sleep_logs")
      .upsert({
        user_id: userId, logged_date: date, hours, quality,
      }, { onConflict: "user_id,logged_date" });
  }
}

export async function unlockBadge(badgeId) {
  if (supabase && userId) {
    await supabase.from("unlocked_badges")
      .upsert({ user_id: userId, badge_id: badgeId }, { onConflict: "user_id,badge_id" })
      .catch(() => {});
  }
}

export async function reset() {
  resetLocal();
  if (supabase && userId) {
    // CASCADE deletes handle logs, supps, training types, badges
    await supabase.from("profiles")
      .update({ name: "Biohacker", onboarded: false })
      .eq("id", userId)
      .catch(() => {});
    // Delete all user data (cascade from supplement_logs etc via foreign keys)
    await Promise.all([
      supabase.from("user_supplements").delete().eq("user_id", userId),
      supabase.from("user_training_types").delete().eq("user_id", userId),
      supabase.from("training_logs").delete().eq("user_id", userId),
      supabase.from("sleep_logs").delete().eq("user_id", userId),
      supabase.from("unlocked_badges").delete().eq("user_id", userId),
    ]).catch(() => {});
  }
}

// --- Save full state to localStorage (optimistic cache) ---

export function cacheState(state) {
  saveLocal(state);
}

// --- Onboarding: bulk insert initial config ---

export async function saveOnboarding(state) {
  if (supabase && userId) {
    // Mark onboarded (name already set during signup)
    await supabase.from("profiles")
      .update({ onboarded: true })
      .eq("id", userId);

    // Bulk insert supplements
    if (state.supplements.length > 0) {
      const suppRows = state.supplements.map((s, i) => ({
        user_id: userId, name: s.name, emoji: s.emoji, dose: s.dose, freq: s.freq, sort_order: i,
      }));
      const { data: insertedSupps } = await supabase.from("user_supplements")
        .insert(suppRows).select("id, name");

      // Map local IDs to DB IDs
      if (insertedSupps) {
        state.supplements = state.supplements.map(s => {
          const match = insertedSupps.find(is => is.name === s.name);
          return match ? { ...s, id: match.id } : s;
        });
      }
    }

    // Bulk insert training types
    if (state.trainingTypes.length > 0) {
      const ttRows = state.trainingTypes.map((t, i) => ({
        user_id: userId, name: t.name, emoji: t.emoji, sort_order: i,
      }));
      const { data: insertedTTs } = await supabase.from("user_training_types")
        .insert(ttRows).select("id, name");

      if (insertedTTs) {
        state.trainingTypes = state.trainingTypes.map(t => {
          const match = insertedTTs.find(it => it.name === t.name);
          return match ? { ...t, id: match.id } : t;
        });
      }
    }
  }

  saveLocal(state);
  return state;
}

// --- Transform DB response to app state ---

function transformFromDB(data) {
  const profile = data.profile || { name: "Biohacker", onboarded: false };

  const supplements = (data.supplements || []).map(s => ({
    id: s.id,
    name: s.name,
    emoji: s.emoji,
    dose: s.dose,
    freq: s.freq,
  }));

  const trainingTypes = (data.trainingTypes || []).map(t => ({
    id: t.id,
    name: t.name,
    emoji: t.emoji,
  }));

  // Build logs object keyed by date
  const logs = {};

  for (const sl of (data.supplementLogs || [])) {
    const d = sl.logged_date;
    if (!logs[d]) logs[d] = {};
    if (!logs[d].supplements) logs[d].supplements = {};
    logs[d].supplements[sl.supplement_id] = true;
  }

  for (const tl of (data.trainingLogs || [])) {
    const d = tl.logged_date;
    if (!logs[d]) logs[d] = {};
    logs[d].training = {
      done: true,
      type: tl.type_name,
      emoji: tl.type_emoji,
      intensity: tl.intensity,
    };
  }

  for (const sl of (data.sleepLogs || [])) {
    const d = sl.logged_date;
    if (!logs[d]) logs[d] = {};
    logs[d].sleep = {
      hours: parseFloat(sl.hours),
      quality: sl.quality,
    };
  }

  return {
    profile: { name: profile.name, created: profile.created_at },
    supplements,
    trainingTypes,
    logs,
    unlockedBadges: data.unlockedBadges || [],
    onboarded: profile.onboarded,
  };
}

// --- Migrate old JSONB blob to relational tables ---

async function migrateToRelational(state) {
  if (!supabase || !userId) return;

  await supabase.from("profiles")
    .update({ name: state.profile?.name || "Biohacker", onboarded: true })
    .eq("id", userId);

  // Supplements config
  const suppMap = {};
  if (state.supplements?.length) {
    const rows = state.supplements.map((s, i) => ({
      user_id: userId, name: s.name, emoji: s.emoji, dose: s.dose || "—", freq: s.freq || "daily", sort_order: i,
    }));
    const { data } = await supabase.from("user_supplements").insert(rows).select("id, name");
    if (data) data.forEach(d => { suppMap[state.supplements.find(s => s.name === d.name)?.id] = d.id; });
  }

  // Training types config
  const ttMap = {};
  if (state.trainingTypes?.length) {
    const rows = state.trainingTypes.map((t, i) => ({
      user_id: userId, name: t.name, emoji: t.emoji, sort_order: i,
    }));
    const { data } = await supabase.from("user_training_types").insert(rows).select("id, name");
    if (data) data.forEach(d => { ttMap[state.trainingTypes.find(t => t.name === d.name)?.id] = d.id; });
  }

  // Logs
  const suppLogs = [], trainLogs = [], sleepLogs = [];

  for (const [date, log] of Object.entries(state.logs || {})) {
    if (log.supplements) {
      for (const [sid, taken] of Object.entries(log.supplements)) {
        if (taken && suppMap[sid]) {
          suppLogs.push({ user_id: userId, supplement_id: suppMap[sid], logged_date: date });
        }
      }
    }
    if (log.training?.done) {
      const ttId = ttMap[state.trainingTypes?.find(t => t.name === log.training.type)?.id] || null;
      trainLogs.push({
        user_id: userId, logged_date: date, training_type_id: ttId,
        type_name: log.training.type || "Gym", type_emoji: log.training.emoji || "🏋️",
        intensity: log.training.intensity || 3,
      });
    }
    if (log.sleep?.hours) {
      sleepLogs.push({
        user_id: userId, logged_date: date, hours: log.sleep.hours, quality: log.sleep.quality || 3,
      });
    }
  }

  if (suppLogs.length) await supabase.from("supplement_logs").insert(suppLogs);
  if (trainLogs.length) await supabase.from("training_logs").insert(trainLogs);
  if (sleepLogs.length) await supabase.from("sleep_logs").insert(sleepLogs);

  // Badges
  if (state.unlockedBadges?.length) {
    const rows = state.unlockedBadges.map(b => ({ user_id: userId, badge_id: b }));
    await supabase.from("unlocked_badges").insert(rows);
  }
}
