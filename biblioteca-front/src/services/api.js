import axios from 'axios';

// ==========================================
// 1. CONFIGURACIÓN DE LA INSTANCIA DE AXIOS
// ==========================================

// Creamos la instancia apuntando a la raíz de tu servidor
const api = axios.create({
    baseURL: 'http://localhost:8000'
});

// Interceptor de Solicitud (Agrega el token si existe)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor de Respuesta (Maneja el error 401 y refresca el token)
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');

                // Usamos el axios global aquí para no disparar este mismo interceptor
                const response = await axios.post('http://localhost:8000/api/token/refresh/', {
                    refresh: refreshToken
                });

                localStorage.setItem('access_token', response.data.access);
                originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;

                return api(originalRequest);
            } catch (refreshError) {
                // Si el refresh token también expiró, limpiamos y mandamos al login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

// ==========================================
// 2. FUNCIONES CRUD PARA LIBROS
// ==========================================

// Definimos la ruta específica para este grupo de funciones
const LIBROS_URL = '/biblioteca-drf/api/libros';

// 1. LISTAR (GET)
// Fíjate que ahora usamos "api.get" en lugar de "axios.get"
export const read = () => {
    return api.get(`${LIBROS_URL}/`);
};

// 2. CREAR (POST)
export const create = (data) => {
    return api.post(`${LIBROS_URL}/`, data);
};

// 3. ACTUALIZAR (PUT)
export const update = (id, data) => {
    return api.put(`${LIBROS_URL}/${id}/`, data);
};

// 4. ELIMINAR (DELETE)
export const deleteLibro = (id) => {
    return api.delete(`${LIBROS_URL}/${id}/`);
};

export default api;
