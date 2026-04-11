import * as Yup from 'yup';

export const classroomValidationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required('El nombre del aula es requerido'),
  classroom_type: Yup.string()
    .trim()
    .required('El tipo de aula es requerido'),
  code: Yup.string().trim(),
  floor: Yup.number()
    .transform((value, originalValue) => (originalValue === '' ? Number.NaN : value))
    .typeError('El número de piso es requerido')
    .required('El número de piso es requerido')
    .integer('Debe ser un número entero')
    .min(0, 'El piso no puede ser negativo'),
  building: Yup.string().trim(),
  building_code: Yup.string()
    .trim()
    .required('El código del edificio es requerido'),
  is_restricted: Yup.boolean(),
});
