const SUPABASE_URL = "TU_URL_REAL";
const SUPABASE_KEY = "TU_CLAVE_PUBLICABLE";

const clienteSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
