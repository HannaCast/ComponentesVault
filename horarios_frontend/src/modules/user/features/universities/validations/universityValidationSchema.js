import * as yup from 'yup';

const timePattern = /^([01]?\d|2[0-3]):[0-5]\d$/;
const timePartsPattern = /^([01]?\d|2[0-3]):([0-5]\d)$/;

const parseIntegerInput = (value) => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return Number.parseInt(value.trim(), 10);
  }

  return Number.NaN;
};

const parseTimeToMinutes = (raw) => {
  if (raw == null || raw === '') {
    return null;
  }
  const s = String(raw).trim();
  const m = timePartsPattern.exec(s);
  if (!m) {
    return null;
  }
  return Number(m[1]) * 60 + Number(m[2]);
};

const modalitySchema = yup.object({
  key: yup.string(),
  name: yup
    .string()
    .trim()
    .max(20, 'El nombre admite como máximo 20 caracteres')
    .required('El nombre de la modalidad es obligatorio'),
  classroom_days_per_week: yup
    .mixed()
    .required()
    .test('is-int', 'Indica un número válido', (v) => {
      const n = parseIntegerInput(v);
      return Number.isFinite(n) && n >= 0 && n <= 7;
    }),
  allowed_days: yup
    .array()
    .of(yup.number().min(1).max(7))
    .min(1, 'Selecciona al menos un día de estudio')
    .required(),
});

const shiftSchema = yup.object({
  key: yup.string(),
  name: yup.string().trim().required('El nombre del turno es obligatorio'),
  order: yup
    .mixed()
    .required()
    .test('order', 'Orden inválido', (v) => {
      const n = parseIntegerInput(v);
      return Number.isFinite(n) && n >= 1;
    }),
  start_time: yup
    .string()
    .matches(timePattern, 'Hora de inicio inválida')
    .required('Hora de inicio obligatoria'),
  end_time: yup
    .string()
    .matches(timePattern, 'Hora de fin inválida')
    .required('Hora de fin obligatoria'),
});

const periodSchema = yup.object({
  key: yup.string(),
  name: yup
    .string()
    .trim()
    .max(50, 'El nombre admite como máximo 50 caracteres')
    .required('El nombre del periodo es obligatorio'),
  fecha_inicio: yup.string().required('Fecha de inicio obligatoria'),
  fecha_fin: yup.string().required('Fecha de fin obligatoria'),
  order: yup.mixed().nullable(),
  is_active: yup.boolean(),
});

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
  modalities: yup
    .array()
    .of(modalitySchema)
    .min(1, 'Debe existir al menos una modalidad')
    .required(),
  shifts: yup
    .array()
    .of(shiftSchema)
    .min(1, 'Agrega al menos un turno'),
  academic_periods: yup.mixed().when('uses_period_groups', {
    is: true,
    then: () => yup
      .array()
      .of(periodSchema)
      .min(1, 'Agrega al menos un periodo académico'),
    otherwise: () => yup.array().max(0),
  }),
});

/**
 * Validaciones cruzadas (horarios, modalidades y periodos) que no expresamos solo con Yup.
 */
export const validateUniversityCrossRules = (data) => {
  const errors = {};

  const open = parseTimeToMinutes(data.start_time);
  const close = parseTimeToMinutes(data.end_time);
  if (open != null && close != null && open >= close) {
    errors.end_time = 'La hora de cierre debe ser posterior a la de apertura';
  }

  (data.modalities || []).forEach((m, idx) => {
    const cdpw = typeof m.classroom_days_per_week === 'number'
      ? m.classroom_days_per_week
      : Number.parseInt(String(m.classroom_days_per_week ?? '').trim(), 10);
    const allowed = Array.isArray(m.allowed_days) ? m.allowed_days.length : 0;
    if (Number.isFinite(cdpw) && cdpw > allowed) {
      errors[`modality_${idx}_cdpw`] = 'No puede superar la cantidad de días en que se estudia';
    }
  });

  if (open != null && close != null) {
    (data.shifts || []).forEach((s, idx) => {
      const st = parseTimeToMinutes(s.start_time);
      const en = parseTimeToMinutes(s.end_time);
      if (st == null || en == null) {
        return;
      }
      if (st < open || en > close) {
        errors[`shift_${idx}_range`] = (
          `El turno debe estar entre ${data.start_time} y ${data.end_time}`
        );
      }
      if (st >= en) {
        errors[`shift_${idx}_order`] = 'La hora de fin debe ser posterior a la de inicio';
      }
    });
  }

  if (data.uses_period_groups) {
    (data.academic_periods || []).forEach((p, idx) => {
      if (!p.fecha_inicio || !p.fecha_fin) {
        return;
      }
      const a = new Date(`${p.fecha_inicio}T12:00:00`);
      const b = new Date(`${p.fecha_fin}T12:00:00`);
      if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
        errors[`period_${idx}_date`] = 'Fechas inválidas';
        return;
      }
      if (b < a) {
        errors[`period_${idx}_range`] = 'La fecha de fin no puede ser anterior a la de inicio';
      }
      if (a.getFullYear() !== b.getFullYear()) {
        errors[`period_${idx}_year`] = 'El periodo debe estar dentro del mismo año calendario';
      }
    });

    const activeCount = (data.academic_periods || []).filter((p) => p.is_active).length;
    if (activeCount > 1) {
      errors.periods_active = 'Solo un periodo puede estar activo';
    }
    if ((data.academic_periods || []).length > 0 && activeCount === 0) {
      errors.periods_active = 'Debes marcar un periodo como activo';
    }
  }

  return errors;
};
