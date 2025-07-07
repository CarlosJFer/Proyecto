// ARCHIVO: src/services/api.js

import axios from 'axios';

// 1. Creamos una instancia de Axios con la URL base de nuestro backend.
const apiClient = axios.create({
  baseURL: 'http://localhost:5001/api', // La base de todas tus rutas de la API
});

// 2. Usamos un interceptor para añadir el token de autenticación a cada petición.
apiClient.interceptors.request.use(
  (config) => {
    // Obtenemos la información del usuario desde localStorage
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    if (userInfo && userInfo.token) {
      // Si existe el token, lo añadimos a la cabecera 'Authorization'
      config.headers['Authorization'] = `Bearer ${userInfo.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;