const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000";

export async function apiFetch(path: string, options?: RequestInit) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "API Error");
  }
  return res.json();
}