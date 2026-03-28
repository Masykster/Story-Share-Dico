const AUTH_TOKEN_KEY = 'storyshare_token';
const AUTH_USER_KEY = 'storyshare_user';

export function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function setUserName(name) {
  localStorage.setItem(AUTH_USER_KEY, name);
}

export function getUserName() {
  return localStorage.getItem(AUTH_USER_KEY) || 'User';
}

export function isLoggedIn() {
  return !!getToken();
}
