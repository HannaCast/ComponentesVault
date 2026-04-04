import * as Yup from 'yup';

export const teacherValidationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required('El nombre es requerido'),
  surname: Yup.string()
    .trim()
    .required('El apellido paterno es requerido'),
  last_name: Yup.string()
    .trim()
    .nullable()
    .notRequired(),
});
