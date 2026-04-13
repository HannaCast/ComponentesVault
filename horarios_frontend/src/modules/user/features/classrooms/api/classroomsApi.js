import apiToken from '@requests/apiToken';

/** Listado reducido de aulas activas (p. ej. selects). */
export const getClassrooms = () => apiToken.get('/api/v1/university/classrooms/');

/** Lista paginada con filtros y orden (misma convención que grupos / materias). */
export const getClassroomsPaginated = ({
  page = 1,
  limit = 10,
  search = '',
  status,
  classroomTypeId,
  sortBy = 'name',
  order = 'ASC',
} = {}) => {
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

  if (
    classroomTypeId !== undefined
    && classroomTypeId !== null
    && classroomTypeId !== 'todas'
  ) {
    params.classroom_type_id = classroomTypeId;
  }

  return apiToken.get('/api/v1/university/classrooms/paginated/', { params });
};

export const toggleClassroomStatus = (id) =>
  apiToken.put(`/api/v1/university/classrooms/${id}/toggle-status/`);

export const deleteClassroom = (id) =>
  apiToken.delete(`/api/v1/university/classrooms/${id}/`);

export const getClassroomTypes = () =>
  apiToken.get('/api/v1/classroom-types/');

export const getClassroom = (id) =>
  apiToken.get(`/api/v1/university/classrooms/${id}/`);

export const createClassroom = (data) =>
  apiToken.post('/api/v1/university/classrooms/', data);

export const updateClassroom = (id, data) =>
  apiToken.put(`/api/v1/university/classrooms/${id}/`, data);

/** Carreras activas (mismo endpoint que grupos / materias). */
export { getCareers } from '../../careers/api/careersApi';

export const getClassroomCareers = ({ classroomId } = {}) => {
  const params = {};
  if (classroomId != null) {
    params.classroom_id = classroomId;
  }
  return apiToken.get('/api/v1/university/classroom-careers/', { params });
};

export const getClassroomSubjectPeriods = ({ careerId } = {}) => {
  const params = {};
  if (careerId != null && careerId !== '') {
    params.career_id = careerId;
  }
  return apiToken.get('/api/v1/university/classrooms/subject-periods/', { params });
};

export const getClassroomSubjectOptions = ({ careerId, periodNumber } = {}) => {
  const params = {};
  if (careerId != null && careerId !== '') {
    params.career_id = careerId;
  }
  if (periodNumber != null && periodNumber !== '') {
    params.period_number = periodNumber;
  }
  return apiToken.get('/api/v1/university/classrooms/subject-options/', { params });
};

export const createClassroomCareer = (data) =>
  apiToken.post('/api/v1/university/classroom-careers/', data);

export const deleteClassroomCareer = (id) =>
  apiToken.delete(`/api/v1/university/classroom-careers/${id}/`);
