const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

function getToken() {
  return localStorage.getItem("token");
}

export async function apiFetch(path, { method = "GET", body, auth = true, headers = {} } = {}) {
  const finalHeaders = { "Content-Type": "application/json", ...headers };

  if (auth) {
    const token = getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Serverga ulanib bo'lmadi. Internetni yoki backendni tekshiring.");
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    // bo'sh javob (masalan 204 No Content)
  }

  if (!res.ok || json?.success === false) {
    const message = json?.message || `Xatolik yuz berdi (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return json?.data ?? json;
}