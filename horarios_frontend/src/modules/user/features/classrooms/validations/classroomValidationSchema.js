import * as Yup from 'yup';

export const classroomValidationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required('Escribe el nombre de la aula.'),
  classroom_type: Yup.string()
    .trim()
    .required('Elige un tipo de aula.'),
  code: Yup.string().trim(),
  floor: Yup.number()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .nullable()
    .notRequired()
    .typeError('Indica el número de piso (0 o mayor).')
    .integer('El piso debe ser un número entero.')
    .min(0, 'El piso no puede ser negativo.'),
  building: Yup.string().trim(),
  building_code: Yup.string()
    .trim()
    .required('Escribe el código del edificio.'),
  is_restricted: Yup.boolean(),
});
