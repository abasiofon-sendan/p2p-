const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL 

export async function apiFetch(path: string, options?: RequestInit) {
  // Ensure path starts with / for proper concatenation
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${BASE_URL}${normalizedPath}`;
  
  console.log('API Request URL:', url); // Debug log
  
  const res = await fetch(url, options);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "API Error");
  }
  return res.json();
}