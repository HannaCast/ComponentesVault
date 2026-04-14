/**
 * Normaliza "HH:MM" o "HH:MM:SS" para la API (TimeField Django / DRF).
 */
export const toApiTime = (value) => {
  if (value == null || value === '') {
    return null;
  }
  const s = String(value).trim();
  if (/^\d{1,2}:\d{2}$/.test(s)) {
    return `${s}:00`;
  }
  return s;
};

const sortUniqueDays = (days) => [...new Set(days)].sort((a, b) => a - b);

let universityPayloadUidSequence = 0;

const uid = () => {
  universityPayloadUidSequence += 1;
  return `${Date.now()}-${universityPayloadUidSequence.toString(36)}`;
};

/**
 * Construye el cuerpo POST/PUT para alta o actualización completa.
 * @param {object} formState
 * @param {{ isEdit?: boolean }} [options] — En edición, si no hay image_id se omite `image` para no borrar el logo en BD.
 */
export const buildFullUniversityPayload = (formState, options = {}) => {
  const { isEdit = false } = options;
  const usesGroups = Boolean(formState.uses_period_groups);

  const hasImageId = formState.image_id != null && formState.image_id !== '';
  const imageVal = hasImageId ? Number(formState.image_id) : null;

  const university = {
    name: formState.name.trim(),
    short_name: formState.short_name.trim(),
    institution_code: formState.institution_code?.trim() || null,
    start_time: toApiTime(formState.start_time),
    end_time: toApiTime(formState.end_time),
    period_type: Number(formState.period_type),
    uses_period_groups: usesGroups ? 1 : 0,
  };

  if (!isEdit || hasImageId) {
    university.image = imageVal;
  }

  const modalities = (formState.modalities || []).map((m) => {
    const allowedDays = sortUniqueDays(m.allowed_days || []);
    const cdpw = Number.parseInt(m.classroom_days_per_week, 10);
    const classroomDays = Number.isFinite(cdpw) ? Math.max(0, cdpw) : 0;

    const row = {
      name: String(m.name || '').trim(),
      require_classroom: classroomDays > 0 ? 1 : 0,
      configurations: {
        allowed_days: allowedDays,
        classroom_days_per_week: classroomDays,
      },
    };
    if (m.id != null && m.id !== '') {
      const mid = Number.parseInt(m.id, 10);
      if (Number.isFinite(mid)) {
        row.id = mid;
      }
    }
    return row;
  });

  const shifts = (formState.shifts || []).map((s, index) => {
    const row = {
      name: String(s.name || '').trim(),
      order: Number.parseInt(s.order, 10) || index + 1,
      start_time: toApiTime(s.start_time),
      end_time: toApiTime(s.end_time),
    };
    if (s.id != null && s.id !== '') {
      const sid = Number.parseInt(s.id, 10);
      if (Number.isFinite(sid)) {
        row.id = sid;
      }
    }
    return row;
  });

  let academic_periods = [];
  if (usesGroups) {
    academic_periods = (formState.academic_periods || []).map((p, idx) => {
      const start = p.fecha_inicio ? new Date(`${p.fecha_inicio}T12:00:00`) : null;
      const end = p.fecha_fin ? new Date(`${p.fecha_fin}T12:00:00`) : null;

      const row = {
        name: String(p.name || '').trim(),
        start_month: start && !Number.isNaN(start.getTime()) ? start.getMonth() + 1 : null,
        end_month: end && !Number.isNaN(end.getTime()) ? end.getMonth() + 1 : null,
        year: start && !Number.isNaN(start.getTime()) ? start.getFullYear() : null,
        order: p.order != null && p.order !== '' ? Number.parseInt(p.order, 10) : idx + 1,
        is_active: p.is_active ? 1 : 0,
      };
      if (p.id != null && p.id !== '') {
        const pid = Number.parseInt(p.id, 10);
        if (Number.isFinite(pid)) {
          row.id = pid;
        }
      }
      return row;
    });
  }

  return {
    university,
    modalities,
    shifts,
    academic_periods,
  };
};

export const createDefaultModalities = () => [
  {
    key: `m-${uid()}`,
    name: 'Presencial',
    classroom_days_per_week: 5,
    allowed_days: [1, 2, 3, 4, 5],
  },
  {
    key: `m-${uid()}`,
    name: 'En línea',
    classroom_days_per_week: 0,
    allowed_days: [1],
  },
  {
    key: `m-${uid()}`,
    name: 'Mixta',
    classroom_days_per_week: 3,
    allowed_days: [1, 3, 5],
  },
];

const pad2 = (n) => String(n).padStart(2, '0');

const normalizeOptionalId = (value) => {
  if (value == null || value === '') {
    return '';
  }
  return String(value);
};

const resolveDefaultPeriodType = (periodTypeOptions = []) => {
  const firstOptionValue = periodTypeOptions[0]?.value;
  if (firstOptionValue == null) {
    return '';
  }
  return String(firstOptionValue);
};

/**
 * Mapea la respuesta de GET .../profile/ al estado del formulario (edición).
 */
export const profileToFormState = (profile, periodTypeOptions = []) => {
  if (!profile) {
    return createDefaultFormState(periodTypeOptions);
  }

  const formatTimeInput = (value) => {
    if (value == null || value === '') {
      return '07:00';
    }
    const s = String(value);
    return s.length >= 5 ? s.slice(0, 5) : s;
  };

  let modalities = (profile.modalities || []).map((m) => ({
    key: `m-${m.id}`,
    id: m.id,
    name: m.name || '',
    classroom_days_per_week: m.configurations?.classroom_days_per_week ?? 0,
    allowed_days: Array.isArray(m.configurations?.allowed_days)
      ? [...m.configurations.allowed_days]
      : [],
  }));

  if (modalities.length === 0) {
    modalities = createDefaultModalities();
  }

  const shifts = (profile.shifts || []).map((s) => ({
    key: `s-${s.id}`,
    id: s.id,
    name: s.name || '',
    order: s.order,
    start_time: formatTimeInput(s.start_time),
    end_time: formatTimeInput(s.end_time),
  }));

  const academic_periods = (profile.academic_periods || []).map((p) => {
    const y = p.year;
    const sm = p.start_month;
    const em = p.end_month;
    let fecha_inicio = '';
    let fecha_fin = '';
    if (y && sm && em) {
      fecha_inicio = `${y}-${pad2(sm)}-01`;
      const lastD = new Date(Number(y), Number(em), 0).getDate();
      fecha_fin = `${y}-${pad2(em)}-${pad2(lastD)}`;
    }
    return {
      key: `p-${p.id}`,
      id: p.id,
      name: p.name || '',
      fecha_inicio,
      fecha_fin,
      order: p.order,
      is_active: Number(p.is_active) === 1,
    };
  });

  const pt = normalizeOptionalId(profile.period_type);
  const imageId = normalizeOptionalId(profile.image);
  const defaultPeriodType = resolveDefaultPeriodType(periodTypeOptions);

  return {
    name: profile.name || '',
    short_name: profile.short_name || '',
    institution_code: profile.institution_code || '',
    image_id: imageId,
    start_time: formatTimeInput(profile.start_time),
    end_time: formatTimeInput(profile.end_time),
    period_type: pt || defaultPeriodType,
    uses_period_groups: Number(profile.uses_period_groups) === 1,
    modalities,
    shifts,
    academic_periods,
  };
};

export const createDefaultFormState = (periodTypeOptions = []) => {
  const defaultPeriodType = resolveDefaultPeriodType(periodTypeOptions);

  return {
    name: '',
    short_name: '',
    institution_code: '',
    image_id: '',
    start_time: '07:00',
    end_time: '22:00',
    period_type: defaultPeriodType,
    uses_period_groups: false,
    modalities: createDefaultModalities(),
    shifts: [
      {
        key: `s-${uid()}`,
        name: 'Matutino',
        start_time: '07:00',
        end_time: '14:00',
        order: 1,
      },
    ],
    academic_periods: [],
  };
};
