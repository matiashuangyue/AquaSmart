const KEY = "aquasmart.token";

export function saveToken(t) { localStorage.setItem(KEY, t); }
export function getToken() { return localStorage.getItem(KEY); }
export function clearToken() { localStorage.removeItem(KEY); }
