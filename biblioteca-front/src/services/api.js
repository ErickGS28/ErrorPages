import axios from 'axios';

const BASE_URL = 'http://localhost:8000/biblioteca-drf/api/libros';

// Obtener todos los libros
export const read = () => {
    return axios.get(`${BASE_URL}/`);
};

// Crear un libro nuevo - recibe FormData ya armado desde el componente
export const create = (data) => {
    return axios.post(`${BASE_URL}/`, data);
};

// Actualizar un libro existente - recibe FormData ya armado desde el componente
export const update = (id, data) => {
    return axios.put(`${BASE_URL}/${id}/`, data);
};

// Eliminar un libro
export const deleteLibro = (id) => {
    return axios.delete(`${BASE_URL}/${id}/`);
};
