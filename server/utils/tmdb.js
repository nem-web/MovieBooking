// utils/tmdb.js
import axios from 'axios';
import axiosRetry from 'axios-retry';

const tmdb = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  headers: {
    Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
    Accept: 'application/json',
  },
  timeout: 8000,
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
