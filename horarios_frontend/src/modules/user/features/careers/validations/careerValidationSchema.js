import * as Yup from 'yup';

export const careerValidationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required('Escribe el nombre de la carrera.'),
  short_name: Yup.string().trim(),
  code: Yup.string().trim(),
  modality: Yup.string()
    .trim()
    .required('Elige una modalidad.'),
  total_periods: Yup.number()
    .transform((value, originalValue) => (originalValue === '' ? Number.NaN : value))
    .typeError('Indica cuántos periodos tiene la carrera (número mayor que 0).')
    .required('Indica cuántos periodos tiene la carrera (número mayor que 0).')
    .moreThan(0, 'El total de periodos debe ser mayor que 0.'),
  parent_career_id: Yup.string().nullable(),
  continuation_from_period: Yup.number()
    .nullable()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .typeError('El periodo de continuación debe ser un número.')
    .min(1, 'Debe ser mayor o igual a 1.'),
});
