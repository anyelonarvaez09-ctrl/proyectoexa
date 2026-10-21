const SUPABASE_URL = "PEGA_AQUI_TU_URL";
const SUPABASE_KEY = "PEGA_AQUI_TU_CLAVE_PUBLICABLE";

const URL_FUNCION = `${SUPABASE_URL}/functions/v1/registropro`;

async function llamarServidor(code, action, extra = {}) {
  const response = await fetch(URL_FUNCION, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY
    },
    body: JSON.stringify({ code, action, ...extra })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Error al conectar con Supabase.");
  }

  return result;
}
