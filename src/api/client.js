export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3107";

export function getToken() {
  return localStorage.getItem("token");
}

export function getUser(){
  try{
    return JSON.parse(localStorage.getItem("user"));
  } catch{
    return null;
  }
}
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

export async function api(path, { method = "GET", body, headers = {}, raw = false } = {}) {
  const token = getToken();
  const isForm = body instanceof FormData;

  const res = await fetch(BASE_URL + path, {
    method,
    headers: {
      ...(body && !isForm ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && token && path !== "/auth/login") logout();

  if (raw) {
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res;
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(json.message || `HTTP ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return json;
}