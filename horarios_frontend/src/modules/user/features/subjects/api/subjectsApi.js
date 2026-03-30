import apiToken from "@requests/apiToken";

// Obtener todas las materias del usuario
export const getSubjects = () => 
  apiToken.get("/api/v1/university/subjects/");

// Obtener materias paginadas con filtros/orden desde backend
export const getSubjectsPaginated = ({ page = 1, limit = 10, search = '', status, sortBy = 'name', order = 'ASC' } = {}) => {
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

  return apiToken.get('/api/v1/university/subjects/paginated/', { params });
};

// Obtener una materia específica
export const getSubject = (id) => 
  apiToken.get(`/api/v1/university/subjects/${id}/`);

// Obtener colores activos para seleccionar color de materia (envia id al backend)
export const getColors = () =>
  apiToken.get('/api/v1/subjects/colors/');

// Obtener carreras activas para asociarlas a una materia
export const getCareers = () =>
  apiToken.get('/api/v1/university/careers/');

// Obtener profesores activos para asociarlos a una materia
export const getTeachers = () =>
  apiToken.get('/api/v1/teachers/');

// Crear una nueva materia
export const createSubject = (data) => 
  apiToken.post("/api/v1/university/subjects/", data);

// Actualizar una materia
export const updateSubject = (id, data) => 
  apiToken.put(`/api/v1/university/subjects/${id}/`, data);

// Eliminar una materia
export const deleteSubject = (id) => 
  apiToken.delete(`/api/v1/university/subjects/${id}/`);
