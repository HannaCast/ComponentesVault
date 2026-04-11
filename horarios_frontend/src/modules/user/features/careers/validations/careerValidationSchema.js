import * as Yup from 'yup';

export const careerValidationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required('El nombre de la carrera es requerido'),
  short_name: Yup.string().trim(),
  code: Yup.string().trim(),
  modality: Yup.string()
    .trim()
    .required('La modalidad es requerida'),
  total_periods: Yup.number()
    .transform((value, originalValue) => (originalValue === '' ? Number.NaN : value))
    .typeError('El total de periodos es requerido y debe ser mayor a 0')
    .required('El total de periodos es requerido y debe ser mayor a 0')
    .moreThan(0, 'El total de periodos es requerido y debe ser mayor a 0'),
});
