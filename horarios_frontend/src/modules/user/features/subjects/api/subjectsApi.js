import apiToken from "@requests/apiToken";

// Obtener todas las materias del usuario
export const getSubjects = () => 
  apiToken.get("/api/v1/university/subjects/");

// Obtener materias paginadas con filtros/orden desde backend
export const getSubjectsPaginated = ({ page = 1, limit = 10, search = '', status, careerId, sortBy = 'name', order = 'ASC' } = {}) => {
  const params = {
    page,
    limit,
    sortBy,
    order,
  };

  if (search) {
    params.search = search;
  }

  if (status !== undefined && status !== null) {
    params.status = status;
  }

  if (careerId !== undefined && careerId !== null && careerId !== 'todas') {
    params.career_id = careerId;
  }

  return apiToken.get('/api/v1/university/subjects/paginated/', { params });
};

// Obtener una materia específica
export const getSubject = (id) => 
  apiToken.get(`/api/v1/university/subjects/${id}/`);

// Obtener colores activos para seleccionar color de materia (envia id al backend)
export const getColors = () =>
  apiToken.get('/api/v1/subjects/colors/');

// Obtener carreras activas para asociarlas a una materia (definición única en careersApi)
export { getCareers } from '../../careers/api/careersApi';

// Obtener profesores activos para asociarlos a una materia
export const getTeachers = () =>
  apiToken.get('/api/v1/university/teachers/');

// Obtener tipos de aula activos para restriccion por materia
export const getClassroomTypes = () =>
  apiToken.get('/api/v1/classroom-types/');

// Crear una nueva materia
export const createSubject = (data) => 
  apiToken.post("/api/v1/university/subjects/", data);

// Actualizar una materia
export const updateSubject = (id, data) => 
  apiToken.put(`/api/v1/university/subjects/${id}/`, data);

// Cambiar estado (activo/inactivo) de una materia
export const toggleSubjectStatus = (id) =>
  apiToken.put(`/api/v1/university/subjects/${id}/toggle-status/`);

// Eliminar una materia
export const deleteSubject = (id) => 
  apiToken.delete(`/api/v1/university/subjects/${id}/`);
