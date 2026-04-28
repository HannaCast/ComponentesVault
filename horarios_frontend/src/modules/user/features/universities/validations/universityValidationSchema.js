import * as yup from 'yup';

const timePattern = /^([01]?\d|2[0-3]):[0-5]\d$/;

export const universityValidationSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required('El nombre de la universidad es obligatorio')
    .max(150, 'El nombre admite como máximo 150 caracteres'),
  short_name: yup
    .string()
    .trim()
    .required('El nombre corto es obligatorio')
    .max(40, 'El nombre corto admite como máximo 40 caracteres'),
  institution_code: yup
    .string()
    .transform((v) => (v == null ? '' : String(v).trim()))
    .max(50, 'El código institucional admite como máximo 50 caracteres')
    .matches(
      /^$|^[A-Za-z0-9._\- ]+$/,
      'Usa solo letras, números, espacios, guiones o puntos',
    )
    .nullable(),
  start_time: yup
    .string()
    .matches(timePattern, 'Hora de apertura inválida')
    .required('Hora de apertura obligatoria'),
  end_time: yup
    .string()
    .matches(timePattern, 'Hora de cierre inválida')
    .required('Hora de cierre obligatoria'),
  period_type: yup.string().required('Selecciona el tipo de periodo'),
  uses_period_groups: yup.boolean(),
});

export const validateUniversityCrossRules = (data) => {
  const errors = {};

  const parseTimeToMinutes = (raw) => {
    if (raw == null || raw === '') return null;
    const [h,m] = String(raw).trim().split(':');
    return Number(h) * 60 + Number(m);
  };

  const open = parseTimeToMinutes(data.start_time);
  const close = parseTimeToMinutes(data.end_time);
  if (open != null && close != null && open >= close) {
    errors.end_time = 'La hora de cierre debe ser posterior a la de apertura';
  }

  return errors;
};
