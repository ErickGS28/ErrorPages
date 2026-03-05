import axios from 'axios';

const BASE_URL = 'http://localhost:8000/biblioteca-drf/api/libros';

// Obtener todos los libros
export const read = () => {
    return axios.get(`${BASE_URL}/`);
};

// Crear un libro nuevo
export const create = (data) => {
    const formData = new FormData();
    for (const key in data) {
        formData.append(key, data[key]);
    }
    return axios.post(`${BASE_URL}/`, formData);
};

// Actualizar un libro existente
export const update = (id, data) => {
    const formData = new FormData();
    for (const key in data) {
        formData.append(key, data[key]);
    }
    return axios.put(`${BASE_URL}/${id}/`, formData);
};

// Eliminar un libro
export const deleteLibro = (id) => {
    return axios.delete(`${BASE_URL}/${id}/`);
};
