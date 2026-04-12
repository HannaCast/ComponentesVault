import * as Yup from 'yup';

export const groupValidationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required('Escribe el nombre del grupo.'),
  career: Yup.string()
    .trim()
    .required('Elige una carrera.'),
  period_number: Yup.number()
    .transform((value, originalValue) => (originalValue === '' ? Number.NaN : value))
    .typeError('Indica el número de periodo (mayor que 0).')
    .required('Indica el número de periodo (mayor que 0).')
    .moreThan(0, 'El periodo debe ser mayor que 0.'),
  letter: Yup.string()
    .trim()
    .required('Escribe la letra del grupo (una sola letra).')
    .min(1, 'Usa una sola letra.')
    .max(1, 'Usa una sola letra.'),
  shift: Yup.string()
    .trim()
    .required('Elige un turno.'),
});
