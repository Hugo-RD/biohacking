-- ============================================
-- BIOHACK — Schema completo para Supabase
-- Ejecutar en SQL Editor de Supabase Dashboard
-- ============================================

-- Borrar tabla vieja (JSONB blob)
DROP TABLE IF EXISTS user_state;

-- ============================================
-- TABLAS CORE
-- ============================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Biohacker',
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE user_supplements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '💊',
  dose TEXT NOT NULL DEFAULT '—',
  freq TEXT NOT NULL DEFAULT 'daily' CHECK (freq IN ('daily', 'conditional')),
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_training_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🏋️',
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE supplement_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  supplement_id UUID REFERENCES user_supplements(id) ON DELETE CASCADE NOT NULL,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  taken BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, supplement_id, logged_date)
);

CREATE TABLE training_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  training_type_id UUID REFERENCES user_training_types(id) ON DELETE SET NULL,
  type_name TEXT NOT NULL,
  type_emoji TEXT NOT NULL,
  intensity SMALLINT NOT NULL CHECK (intensity BETWEEN 1 AND 5),
  UNIQUE(user_id, logged_date)
);

CREATE TABLE sleep_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours NUMERIC(3,1) NOT NULL CHECK (hours BETWEEN 0 AND 24),
  quality SMALLINT NOT NULL CHECK (quality BETWEEN 1 AND 5),
  UNIQUE(user_id, logged_date)
);

CREATE TABLE unlocked_badges (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY(user_id, badge_id)
);

-- ============================================
-- TABLAS SOCIAL (future-ready)
-- ============================================

CREATE TABLE friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_b UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_a, user_b),
  CHECK (user_a < user_b)
);

CREATE TABLE weekly_scores (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  days_completed SMALLINT NOT NULL DEFAULT 0,
  days_active SMALLINT NOT NULL DEFAULT 0,
  days_in_week SMALLINT NOT NULL DEFAULT 7,
  completion_pct SMALLINT NOT NULL DEFAULT 0,
  train_count SMALLINT NOT NULL DEFAULT 0,
  sleep_avg_hours NUMERIC(3,1),
  sleep_avg_quality NUMERIC(2,1),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY(user_id, week_start)
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX idx_supp_logs_user_date ON supplement_logs(user_id, logged_date);
CREATE INDEX idx_training_logs_user_date ON training_logs(user_id, logged_date);
CREATE INDEX idx_sleep_logs_user_date ON sleep_logs(user_id, logged_date);
CREATE INDEX idx_weekly_scores_week ON weekly_scores(week_start, completion_pct DESC);
CREATE INDEX idx_friendships_users ON friendships(user_a, user_b, status);
CREATE INDEX idx_user_supplements_user ON user_supplements(user_id, sort_order);
CREATE INDEX idx_user_training_types_user ON user_training_types(user_id, sort_order);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

ALTER TABLE user_supplements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own supplements" ON user_supplements FOR ALL USING (auth.uid() = user_id);

ALTER TABLE user_training_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own training types" ON user_training_types FOR ALL USING (auth.uid() = user_id);

ALTER TABLE supplement_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own supplement logs" ON supplement_logs FOR ALL USING (auth.uid() = user_id);

ALTER TABLE training_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own training logs" ON training_logs FOR ALL USING (auth.uid() = user_id);

ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own sleep logs" ON sleep_logs FOR ALL USING (auth.uid() = user_id);

ALTER TABLE unlocked_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own badges write" ON unlocked_badges FOR ALL USING (auth.uid() = user_id);

ALTER TABLE weekly_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own scores write" ON weekly_scores FOR ALL USING (auth.uid() = user_id);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Friendship participants" ON friendships FOR ALL
  USING (auth.uid() = user_a OR auth.uid() = user_b);

-- ============================================
-- RPC: cargar estado completo (1 round trip)
-- ============================================

CREATE OR REPLACE FUNCTION load_user_state()
RETURNS JSON AS $$
DECLARE
  result JSON;
  uid UUID := auth.uid();
BEGIN
  SELECT json_build_object(
    'profile', (SELECT row_to_json(p) FROM profiles p WHERE p.id = uid),
    'supplements', COALESCE((
      SELECT json_agg(row_to_json(s) ORDER BY s.sort_order)
      FROM user_supplements s WHERE s.user_id = uid
    ), '[]'::json),
    'trainingTypes', COALESCE((
      SELECT json_agg(row_to_json(t) ORDER BY t.sort_order)
      FROM user_training_types t WHERE t.user_id = uid
    ), '[]'::json),
    'supplementLogs', COALESCE((
      SELECT json_agg(json_build_object(
        'supplement_id', sl.supplement_id,
        'logged_date', sl.logged_date
      ))
      FROM supplement_logs sl WHERE sl.user_id = uid
    ), '[]'::json),
    'trainingLogs', COALESCE((
      SELECT json_agg(row_to_json(tl))
      FROM training_logs tl WHERE tl.user_id = uid
    ), '[]'::json),
    'sleepLogs', COALESCE((
      SELECT json_agg(row_to_json(sl))
      FROM sleep_logs sl WHERE sl.user_id = uid
    ), '[]'::json),
    'unlockedBadges', COALESCE((
      SELECT json_agg(ub.badge_id)
      FROM unlocked_badges ub WHERE ub.user_id = uid
    ), '[]'::json)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: crear perfil automáticamente al signup
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, onboarded)
  VALUES (NEW.id, 'Biohacker', false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
