import * as Yup from 'yup';

export const subjectValidationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required('El nombre de la materia es requerido'),
  code: Yup.string()
    .trim()
    .required('El código es requerido'),
  short_name: Yup.string()
    .trim()
    .required('El nombre corto es requerido'),
  hours_per_week: Yup.number()
    .transform((value, originalValue) => (originalValue === '' ? Number.NaN : value))
    .typeError('Las horas por semana son requeridas y deben ser mayores a 0')
    .required('Las horas por semana son requeridas y deben ser mayores a 0')
    .moreThan(0, 'Las horas por semana son requeridas y deben ser mayores a 0'),
  color: Yup.string().when('$mode', {
    is: 'create',
    then: (schema) => schema.required('Debes seleccionar un color'),
    otherwise: (schema) => schema.notRequired(),
  }),
});
