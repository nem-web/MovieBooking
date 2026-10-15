import axios from 'axios';
import axiosRetry from 'axios-retry';

const tmdbCredential = process.env.TMDB_READ_ACCESS_TOKEN || process.env.TMDB_API_KEY || '';
const isBearerToken = tmdbCredential.startsWith('eyJ');

const tmdb = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  headers: { Accept: 'application/json' },
  timeout: 8000,
});

tmdb.interceptors.request.use((config) => {
  if (isBearerToken) {
    config.headers.Authorization = 'Bearer ' + tmdbCredential;
  } else if (tmdbCredential) {
    config.params = {
      ...(config.params || {}),
      api_key: tmdbCredential,
    };
  }

  return config;
});

axiosRetry(tmdb, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return (
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      axiosRetry.isNetworkOrIdempotentRequestError(error)
    );
  },
});

export default tmdb;
