import apiToken from "@requests/apiToken";

// Obtener todas las materias del usuario
export const getSubjects = () => 
  apiToken.get("/api/v1/subjects/subjects/");

// Obtener una materia específica
export const getSubject = (id) => 
  apiToken.get(`/api/v1/subjects/subjects/${id}/`);

// Crear una nueva materia
export const createSubject = (data) => 
  apiToken.post("/api/v1/subjects/subjects/", data);

// Actualizar una materia
export const updateSubject = (id, data) => 
  apiToken.patch(`/api/v1/subjects/subjects/${id}/`, data);

// Eliminar una materia
export const deleteSubject = (id) => 
  apiToken.delete(`/api/v1/subjects/subjects/${id}/`);
