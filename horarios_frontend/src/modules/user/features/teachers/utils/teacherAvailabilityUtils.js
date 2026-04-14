/** Convierte TIME del API ("08:00:00") a valor de <input type="time"> ("08:00"). */
export function timeApiToInput(value) {
  if (value == null || value === '') return '';
  const s = String(value);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

/** Convierte "08:00" o "08:00:00" a "HH:MM:SS" para el API. */
export function timeInputToApi(value) {
  if (value == null || value === '') return '08:00:00';
  const s = String(value).trim();
  if (s.length === 5) return `${s}:00`;
  return s;
}

export const DAY_OF_WEEK_OPTIONS = [
  { value: '1', label: 'Lunes' },
  { value: '2', label: 'Martes' },
  { value: '3', label: 'Miércoles' },
  { value: '4', label: 'Jueves' },
  { value: '5', label: 'Viernes' },
  { value: '6', label: 'Sábado' },
];

/** Etiqueta para lectura (detalle); domingo solo si hay datos históricos en API. */
export function dayOfWeekLabel(dayOfWeek) {
  const match = DAY_OF_WEEK_OPTIONS.find((o) => String(o.value) === String(dayOfWeek));
  if (match) return match.label;
  if (String(dayOfWeek) === '7') return 'Domingo';
  return String(dayOfWeek ?? '');
}

/** Fila del formulario (clave estable para React). */
export function mapAvailabilityFromApi(item, index) {
  const key = item?.id == null ? `row-${index}` : `srv-${item.id}`;
  let day = String(item.day_of_week ?? '1');
  if (day === '7') {
    day = '1';
  }
  return {
    rowKey: key,
    day_of_week: day,
    start_time: timeApiToInput(item.start_time),
    end_time: timeApiToInput(item.end_time),
    is_available: Number(item.is_available) === 1,
  };
}

let availabilityTempRowSequence = 0;

const getAvailabilityTempRowSuffix = () => {
  availabilityTempRowSequence += 1;
  return `${Date.now()}-${availabilityTempRowSequence.toString(36)}`;
};

export function createEmptyAvailabilityRow() {
  const randomSuffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : getAvailabilityTempRowSuffix();

  return {
    rowKey: `new-${randomSuffix}`,
    day_of_week: '1',
    start_time: '08:00',
    end_time: '09:00',
    is_available: true,
  };
}

/** Lista de filas UI → payload API (POST/PUT compuesto). */
export function buildAvailabilitiesPayload(rows) {
  return rows.map((r) => ({
    day_of_week: Number(r.day_of_week),
    start_time: timeInputToApi(r.start_time),
    end_time: timeInputToApi(r.end_time),
    is_available: Boolean(r.is_available),
  }));
}

export function validateAvailabilityRows(rows) {
  for (let i = 0; i < rows.length; i += 1) {
    const r = rows[i];
    const start = String(r.start_time || '');
    const end = String(r.end_time || '');
    if (!start || !end) {
      return `Intervalo ${i + 1}: indica hora de inicio y fin.`;
    }
    if (start >= end) {
      return `Intervalo ${i + 1}: la hora de fin debe ser mayor que la de inicio.`;
    }
  }
  return null;
}
