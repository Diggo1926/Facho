import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({ baseURL: BASE });

// Shared promise so concurrent requests wait on a single in-flight refresh.
let refreshPromise = null;

function jwtExpired(token) {
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1]));
    return Date.now() / 1000 >= exp - 30; // 30s early-refresh buffer
  } catch {
    return true;
  }
}

async function acquireFreshToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = axios
    .post(`${BASE}/api/auth/refresh`, {
      refreshToken: localStorage.getItem('refreshToken'),
    })
    .then(({ data }) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data.accessToken;
    })
    .catch((err) => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw err;
    })
    .finally(() => { refreshPromise = null; });

  return refreshPromise;
}

// Proactive refresh: renew before the request if the token is already expired.
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('accessToken');

  if (token && !jwtExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  }

  if (!localStorage.getItem('refreshToken')) return config;

  try {
    const fresh = await acquireFreshToken();
    if (fresh) config.headers.Authorization = `Bearer ${fresh}`;
  } catch {
    // redirect already handled inside acquireFreshToken
  }
  return config;
});

// Safety net: catch any 401 that slips through (e.g. server-side revocation).
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      const fresh = await acquireFreshToken();
      original.headers.Authorization = `Bearer ${fresh}`;
      return api(original);
    } catch {
      return Promise.reject(error);
    }
  }
);

export default api;
