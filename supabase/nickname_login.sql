-- ============================================
-- Nickname login: ejecutar DESPUÉS de schema.sql
-- ============================================

-- Nickname único (case-insensitive)
CREATE UNIQUE INDEX idx_profiles_name_lower ON profiles (LOWER(name));

-- RPC: resolver nickname → email para login
-- SECURITY DEFINER para que funcione sin estar autenticado
CREATE OR REPLACE FUNCTION get_email_by_nickname(nick TEXT)
RETURNS TEXT AS $$
  SELECT u.email FROM auth.users u
  JOIN profiles p ON p.id = u.id
  WHERE LOWER(p.name) = LOWER(nick)
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
