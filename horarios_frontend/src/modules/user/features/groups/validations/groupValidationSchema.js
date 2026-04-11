import * as Yup from 'yup';

export const groupValidationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required('El nombre del grupo es requerido'),
  career: Yup.string()
    .trim()
    .required('La carrera es requerida'),
  period_number: Yup.number()
    .transform((value, originalValue) => (originalValue === '' ? Number.NaN : value))
    .typeError('El periodo es requerido y debe ser mayor a 0')
    .required('El periodo es requerido y debe ser mayor a 0')
    .moreThan(0, 'El periodo es requerido y debe ser mayor a 0'),
  letter: Yup.string()
    .trim()
    .required('La letra del grupo es requerida')
    .min(1, 'Indica una sola letra')
    .max(1, 'Indica una sola letra'),
  shift: Yup.string()
    .trim()
    .required('El turno es requerido'),
});
