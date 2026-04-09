import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

export const portfolioApi = {
  getPortfolio: () => api.get('/portfolio').then((r) => r.data),
  getHistory: () => api.get('/portfolio/history').then((r) => r.data),
  addPosition: (data) => api.post('/portfolio', data).then((r) => r.data),
  removePosition: (ticker) => api.delete(`/portfolio/${ticker}`).then((r) => r.data),
  validateTicker: (ticker) => api.get(`/portfolio/validate/${ticker}`).then((r) => r.data),
};
