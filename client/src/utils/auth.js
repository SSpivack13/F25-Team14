export function getToken() {
  try {
    const raw = localStorage.getItem('token');
    return raw || null;
  } catch {
    return null;
  }
}

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}