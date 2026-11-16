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

// ===== Pagination helpers (BE trả { data, pagination: { page, limit, totalItems, totalPages } }) =====

// Ghép query string, bỏ qua giá trị rỗng
export function withQuery(path, params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  return qs ? `${path}?${qs}` : path;
}

export const EMPTY_PAGINATION = { page: 1, limit: 10, totalItems: 0, totalPages: 0 };

// Lấy toàn bộ bản ghi qua nhiều trang (dùng cho dropdown/select cần đủ danh sách)
export async function fetchAll(fetchPage, { limit = 100, maxPages = 50 } = {}) {
  const all = [];
  for (let page = 1; page <= maxPages; page++) {
    const { data, pagination } = await fetchPage({ page, limit });
    all.push(...(data || []));
    if (!pagination || page >= pagination.totalPages) break;
  }
  return all;
}

// "created_at:DESC" -> { sortBy: "created_at", sortOrder: "DESC" }
export const parseSort = (v) => {
  const [sortBy, sortOrder] = String(v).split(":");
  return { sortBy, sortOrder };
};
