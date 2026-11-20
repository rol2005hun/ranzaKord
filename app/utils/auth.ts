export function getAuthHeaders(): Record<string, string> {
  if (!import.meta.client) return {};
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
    'x-h3-session': token
  };
}
