import PropTypes from 'prop-types';
import { useState } from 'react';
import { Check, Download, SlidersHorizontal } from 'lucide-react';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import Checkbox from '@shared/components/inputs/Checkbox';
import { Select } from '@shared/components/inputs/Select';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';
import { LoadingStatePanel } from '@shared/components/layout/LoadingStatePanel';

const DAY_LABELS = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miercoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sabado',
  7: 'Domingo',
};

const parseTimeToMinutes = (timeText) => {
  const [hoursText = '0', minutesText = '0'] = String(timeText || '').split(':');
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0;
  }

  return (hours * 60) + minutes;
};

const formatMinutesToTime = (totalMinutes) => {
  const safeMinutes = Math.max(0, Number(totalMinutes) || 0);
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const parseTimeParts = (timeText) => {
  const [hoursText = '', minutesText = ''] = String(timeText || '').trim().split(':');
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null;
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
};

const formatTimeForDisplay = (timeText, use12HourFormat = false) => {
  const parts = parseTimeParts(timeText);
  const fallback = String(timeText || '').trim();

  if (!parts) {
    return fallback;
  }

  const { hours, minutes } = parts;

  if (!use12HourFormat) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  const meridiem = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${meridiem}`;
};

const formatAcademicPeriod = (academicPeriod) => {
  if (!academicPeriod) {
    return 'Sin periodo';
  }

  const periodName = academicPeriod?.name ? String(academicPeriod.name).trim() : '';
  const periodYear = academicPeriod?.year ? String(academicPeriod.year).trim() : '';

  if (periodName && periodYear && periodName.toLowerCase().includes(periodYear.toLowerCase())) {
    return periodName;
  }

  return `${periodName} ${periodYear}`.trim() || 'Sin periodo';
};

const splitTrailingParenthetical = (value) => {
  const text = String(value || '').trim();

  if (!text.endsWith(')')) {
    return {
      baseText: text,
      trailingText: '',
    };
  }

  const openParenIndex = text.lastIndexOf('(');
  if (openParenIndex <= 0) {
    return {
      baseText: text,
      trailingText: '',
    };
  }

  const baseText = text.slice(0, openParenIndex).trim();
  const trailingText = text.slice(openParenIndex + 1, -1).trim();

  if (!baseText || !trailingText) {
    return {
      baseText: text,
      trailingText: '',
    };
  }

  return {
    baseText,
    trailingText,
  };
};

const formatUniversityTitle = (value) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return 'Universidad seleccionada';
  }

  const {
    baseText: universityName,
    trailingText: abbreviation,
  } = splitTrailingParenthetical(raw);

  if (universityName && abbreviation) {
    return `${universityName} (${abbreviation})`;
  }

  return raw;
};

const formatDateTime = (value) => {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getPalette = (forceWhiteBackground) => {
  if (forceWhiteBackground) {
    return {
      pageBg: '#FFFFFF',
      panelBg: '#FFFFFF',
      textPrimary: '#111827',
      textSecondary: '#374151',
      border: '#374151',
      tableHeaderBg: '#F3F4F6',
      emptyCellBg: '#FFFFFF',
    };
  }

  return {
    pageBg: 'var(--bg-elevated, #ffffff)',
    panelBg: 'var(--bg-base, #ffffff)',
    textPrimary: 'var(--text-primary, #111827)',
    textSecondary: 'var(--text-secondary, #6b7280)',
    border: 'var(--border-default, #d1d5db)',
    tableHeaderBg: 'var(--bg-surface, #f3f4f6)',
    emptyCellBg: 'var(--bg-elevated, #ffffff)',
  };
};

const normalizeAllowedDays = (allowedDays) => {
  if (!Array.isArray(allowedDays)) {
    return [];
  }

  const normalized = allowedDays
    .map(Number)
    .filter((day) => Number.isInteger(day) && day >= 1 && day <= 7);

  return Array.from(new Set(normalized)).sort((a, b) => a - b);
};

const buildSlotsFromShiftWindow = (group) => {
  const shiftStart = String(group?.shift?.start_time || '').trim();
  const shiftEnd = String(group?.shift?.end_time || '').trim();

  if (!shiftStart.includes(':') || !shiftEnd.includes(':')) {
    return [];
  }

  const startMinutes = parseTimeToMinutes(shiftStart);
  const endMinutes = parseTimeToMinutes(shiftEnd);
  const slotDurationMinutes = 60;

  if (endMinutes <= startMinutes) {
    return [];
  }

  const slots = [];
  for (
    let currentStart = startMinutes;
    currentStart + slotDurationMinutes <= endMinutes;
    currentStart += slotDurationMinutes
  ) {
    const currentEnd = currentStart + slotDurationMinutes;
    const startTime = formatMinutesToTime(currentStart);
    const endTime = formatMinutesToTime(currentEnd);
    const key = `${startTime}-${endTime}`;

    slots.push({
      key,
      startTime,
      endTime,
    });
  }

  return slots;
};

const buildGridModel = (group, options = {}) => {
  const { adjustToShiftWindow = true } = options;
  const blocks = Array.isArray(group?.blocks) ? group.blocks : [];
  const allowedDays = normalizeAllowedDays(group?.allowed_days);

  const daySet = new Set();
  const slotMap = new Map();
  const cellMap = new Map();

  blocks.forEach((block) => {
    const day = Number(block?.slot?.day_of_week);
    const startTime = String(block?.slot?.start_time || '');
    const endTime = String(block?.slot?.end_time || '');

    if (!day || !startTime || !endTime) {
      return;
    }

    daySet.add(day);

    const slotKey = `${startTime}-${endTime}`;
    if (!slotMap.has(slotKey)) {
      slotMap.set(slotKey, {
        key: slotKey,
        startTime,
        endTime,
      });
    }

    cellMap.set(`${slotKey}:${day}`, block);
  });

  if (adjustToShiftWindow) {
    const shiftSlots = buildSlotsFromShiftWindow(group);
    shiftSlots.forEach((slot) => {
      if (!slotMap.has(slot.key)) {
        slotMap.set(slot.key, slot);
      }
    });
  }

  const dayColumns = Array.from(new Set([...allowedDays, ...Array.from(daySet)])).sort((a, b) => a - b);
  const slots = Array.from(slotMap.values()).sort((a, b) => {
    const startA = parseTimeToMinutes(a.startTime);
    const startB = parseTimeToMinutes(b.startTime);

    if (startA === startB) {
      return parseTimeToMinutes(a.endTime) - parseTimeToMinutes(b.endTime);
    }

    return startA - startB;
  });

  return {
    dayColumns: dayColumns.length ? dayColumns : [1, 2, 3, 4, 5],
    slots,
    cellMap,
  };
};

const buildTeachersSummary = (group) => {
  const blocks = Array.isArray(group?.blocks) ? group.blocks : [];
  const bySubject = new Map();

  blocks.forEach((block) => {
    const subjectName = String(block?.subject?.name || 'Sin materia').trim();
    const teacherName = String(block?.teacher?.name || '').trim();

    if (!bySubject.has(subjectName)) {
      bySubject.set(subjectName, new Set());
    }

    if (teacherName) {
      bySubject.get(subjectName).add(teacherName);
    }
  });

  return Array.from(bySubject.entries())
    .map(([subjectName, teachersSet]) => ({
      subjectName,
      teachers: Array.from(teachersSet),
    }))
    .sort((a, b) => a.subjectName.localeCompare(b.subjectName, 'es'));
};

const buildUnassignedReasons = (unassigned) => {
  const reasons = new Map();

  unassigned.forEach((item) => {
    const reason = String(item?.reason || 'SIN_RAZON');
    reasons.set(reason, (reasons.get(reason) || 0) + 1);
  });

  return Array.from(reasons.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
};

const getGroupCareerLabel = (group) => {
  const careerName = String(group?.career?.name || '').trim();
  const careerShortName = String(group?.career?.short_name || '').trim();
  const careerCode = String(group?.career?.code || '').trim();

  if (careerName && careerShortName) {
    return `${careerName} (${careerShortName})`;
  }

  if (careerName && careerCode) {
    return `${careerName} (${careerCode})`;
  }

  if (careerName) {
    return careerName;
  }

  return String(group?.career_id || '-');
};

const getGroupCareerKey = (group) => {
  const careerId = Number(group?.career?.id || group?.career_id);
  if (Number.isInteger(careerId) && careerId > 0) {
    return `id:${careerId}`;
  }

  const fallbackLabel = getGroupCareerLabel(group).trim().toLowerCase();
  return `label:${fallbackLabel || 'sin-carrera'}`;
};

const getGroupPeriodNumber = (group) => {
  const periodNumber = Number(group?.period_number);
  if (Number.isInteger(periodNumber) && periodNumber > 0) {
    return periodNumber;
  }

  return null;
};

const getGroupPeriodKey = (group) => {
  const periodNumber = getGroupPeriodNumber(group);
  return periodNumber === null ? 'sin-periodo' : String(periodNumber);
};

const compareGroupNames = (leftGroup, rightGroup) => {
  const leftName = String(leftGroup?.group_name || '').trim();
  const rightName = String(rightGroup?.group_name || '').trim();

  return leftName.localeCompare(rightName, 'es', { numeric: true, sensitivity: 'base' });
};

const compareNullablePeriods = (leftPeriod, rightPeriod) => {
  if (leftPeriod === null && rightPeriod !== null) {
    return 1;
  }
  if (leftPeriod !== null && rightPeriod === null) {
    return -1;
  }
  if (leftPeriod !== rightPeriod) {
    return (leftPeriod || 0) - (rightPeriod || 0);
  }
  return 0;
};

const compareGroupsByCareerPeriodAndName = (leftGroup, rightGroup) => {
  const leftCareerLabel = getGroupCareerLabel(leftGroup);
  const rightCareerLabel = getGroupCareerLabel(rightGroup);
  const careerCompare = leftCareerLabel.localeCompare(rightCareerLabel, 'es', {
    sensitivity: 'base',
  });

  if (careerCompare !== 0) {
    return careerCompare;
  }

  const periodCompare = compareNullablePeriods(
    getGroupPeriodNumber(leftGroup),
    getGroupPeriodNumber(rightGroup),
  );

  if (periodCompare !== 0) {
    return periodCompare;
  }

  return compareGroupNames(leftGroup, rightGroup);
};

const buildGroupedCareers = (groups) => {
  const sortedGroups = [...groups].sort(compareGroupsByCareerPeriodAndName);
  const careersMap = new Map();

  sortedGroups.forEach((group) => {
    const careerKey = getGroupCareerKey(group);
    if (!careersMap.has(careerKey)) {
      careersMap.set(careerKey, {
        key: careerKey,
        label: getGroupCareerLabel(group),
        periodsMap: new Map(),
      });
    }

    const careerEntry = careersMap.get(careerKey);
    const periodNumber = getGroupPeriodNumber(group);
    const periodKey = getGroupPeriodKey(group);

    if (!careerEntry.periodsMap.has(periodKey)) {
      careerEntry.periodsMap.set(periodKey, {
        key: periodKey,
        periodNumber,
        label: periodNumber === null ? 'Sin periodo' : `Periodo ${periodNumber}`,
        groups: [],
      });
    }

    careerEntry.periodsMap.get(periodKey).groups.push(group);
  });

  return Array.from(careersMap.values())
    .map((careerEntry) => {
      const periods = Array.from(careerEntry.periodsMap.values()).sort((leftPeriod, rightPeriod) => (
        compareNullablePeriods(leftPeriod.periodNumber, rightPeriod.periodNumber)
      ));

      return {
        key: careerEntry.key,
        label: careerEntry.label,
        periods,
      };
    })
    .sort((leftCareer, rightCareer) => leftCareer.label.localeCompare(rightCareer.label, 'es', {
      sensitivity: 'base',
    }));
};

const getScheduleWindowLabel = (
  group,
  gridModel,
  adjustToShiftWindow = true,
  use12HourFormat = false,
) => {
  const shiftName = String(group?.shift?.name || '').trim();
  const shiftStart = String(group?.shift?.start_time || '').trim();
  const shiftEnd = String(group?.shift?.end_time || '').trim();
  const gridTimeRange = gridModel.slots.length
    ? `${formatTimeForDisplay(gridModel.slots[0].startTime, use12HourFormat)} - ${formatTimeForDisplay(gridModel.slots[gridModel.slots.length - 1].endTime, use12HourFormat)}`
    : '';

  let timeRange = 'Sin bloques programados';

  if (adjustToShiftWindow && shiftStart && shiftEnd) {
    timeRange = `${formatTimeForDisplay(shiftStart, use12HourFormat)} - ${formatTimeForDisplay(shiftEnd, use12HourFormat)}`;
  } else if (gridTimeRange) {
    timeRange = gridTimeRange;
  } else if (shiftStart && shiftEnd) {
    timeRange = `${formatTimeForDisplay(shiftStart, use12HourFormat)} - ${formatTimeForDisplay(shiftEnd, use12HourFormat)}`;
  }

  if (shiftName && timeRange !== 'Sin bloques programados') {
    return `${shiftName} (${timeRange})`;
  }

  if (shiftName) {
    return shiftName;
  }

  return timeRange;
};

const GroupScheduleView = ({
  group,
  scheduleVersion,
  userUniversityName,
  viewConfig,
  palette,
  className = '',
  rowHeightClass = 'h-20',
}) => {
  const adjustToShiftWindow = viewConfig?.adjustToShiftWindow !== false;
  const use12HourFormat = Boolean(viewConfig?.use12HourFormat);
  const showTeacherNames = Boolean(viewConfig?.showTeacherNames);
  const showTeachersSummary = showTeacherNames === false;
  const gridModel = buildGridModel(group, { adjustToShiftWindow });
  const teachersSummary = buildTeachersSummary(group);
  const scheduleWindowLabel = getScheduleWindowLabel(
    group,
    gridModel,
    adjustToShiftWindow,
    use12HourFormat,
  );
  const periodToDisplay = group?.academic_period || scheduleVersion?.data?.active_academic_period || scheduleVersion?.academic_period;

  return (
    <div
      className={`space-y-4 rounded-xl border p-4 ${className}`.trim()}
      style={{
        backgroundColor: palette.pageBg,
        borderColor: palette.border,
        color: palette.textPrimary,
      }}
    >
      {viewConfig?.includeHeader ? (
        <div className="space-y-2 border-b pb-3" style={{ borderColor: palette.border }}>
          <h4 className="text-center text-xl font-bold uppercase" style={{ color: palette.textPrimary }}>
            {formatUniversityTitle(userUniversityName)}
          </h4>
          <p className="text-center text-sm font-semibold uppercase" style={{ color: palette.textPrimary }}>
            Horario de grupo
          </p>

          <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            <div className="rounded border px-2 py-1" style={{ borderColor: palette.border }}>
              <span className="font-semibold">Carrera:</span> {getGroupCareerLabel(group)}
            </div>
            <div className="rounded border px-2 py-1" style={{ borderColor: palette.border }}>
              <span className="font-semibold">Periodo:</span> {formatAcademicPeriod(periodToDisplay)}
            </div>
            <div className="rounded border px-2 py-1" style={{ borderColor: palette.border }}>
              <span className="font-semibold">Turno:</span> {scheduleWindowLabel}
            </div>
            <div className="rounded border px-2 py-1" style={{ borderColor: palette.border }}>
              <span className="font-semibold">Grupo:</span> {group?.group_name || '-'}
            </div>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: palette.border }}>
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th
                className="border px-3 py-2 text-center font-semibold"
                style={{ borderColor: palette.border, backgroundColor: palette.tableHeaderBg }}
              >
                Hora
              </th>
              {gridModel.dayColumns.map((day) => (
                <th
                  key={day}
                  className="border px-3 py-2 text-center font-semibold"
                  style={{ borderColor: palette.border, backgroundColor: palette.tableHeaderBg }}
                >
                  {DAY_LABELS[day] || `Dia ${day}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gridModel.slots.map((slot) => {
              const slotRangeLabel = `${formatTimeForDisplay(slot.startTime, use12HourFormat)} - ${formatTimeForDisplay(slot.endTime, use12HourFormat)}`;

              return (
                <tr key={slot.key}>
                  <td
                    className="border px-3 py-2 text-center font-medium"
                    style={{ borderColor: palette.border, backgroundColor: palette.tableHeaderBg }}
                  >
                    {slotRangeLabel}
                  </td>

                  {gridModel.dayColumns.map((day) => {
                    const block = gridModel.cellMap.get(`${slot.key}:${day}`);
                    const subjectColor = block?.color?.hex || '#E5E7EB';
                    const contrastColor = block?.color?.contrast_hex || palette.textPrimary;
                    const useColoredBlock = Boolean(viewConfig?.useSubjectColors && block);

                    return (
                      <td
                        key={`${slot.key}:${day}`}
                        className="border align-top"
                        style={{
                          borderColor: palette.border,
                          backgroundColor: useColoredBlock ? subjectColor : palette.emptyCellBg,
                          color: useColoredBlock ? contrastColor : palette.textPrimary,
                        }}
                      >
                        {block ? (
                          <div className="space-y-1 p-2">
                            <p className="text-sm font-semibold">{block?.subject?.name || 'Materia'}</p>

                            {showTeacherNames ? (
                              <p className="text-xs">{block?.teacher?.name || 'Sin profesor'}</p>
                            ) : null}

                            <p className="text-xs">{block?.classroom?.name || 'Sin aula'}</p>
                          </div>
                        ) : (
                          <div className={rowHeightClass} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showTeachersSummary ? (
        <div className="rounded-lg border" style={{ borderColor: palette.border }}>
          <div
            className="grid grid-cols-2 border-b px-3 py-2 text-sm font-semibold"
            style={{
              borderColor: palette.border,
              backgroundColor: palette.tableHeaderBg,
              color: palette.textPrimary,
            }}
          >
            <span>Asignatura</span>
            <span>Profesores</span>
          </div>

          {teachersSummary.length ? (
            teachersSummary.map((row) => (
              <div
                key={row.subjectName}
                className="grid grid-cols-2 border-b px-3 py-2 text-sm last:border-b-0"
                style={{ borderColor: palette.border, color: palette.textSecondary }}
              >
                <span>{row.subjectName}</span>
                <span>{row.teachers.length ? row.teachers.join(', ') : 'Sin profesor asignado'}</span>
              </div>
            ))
          ) : (
            <div className="px-3 py-3 text-sm" style={{ color: palette.textSecondary }}>
              No hay profesores para mostrar en el resumen.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

GroupScheduleView.propTypes = {
  group: PropTypes.shape({
    group_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    group_name: PropTypes.string,
    career_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    period_number: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    allowed_days: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string])),
    academic_period: PropTypes.shape({
      name: PropTypes.string,
      year: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
    shift: PropTypes.shape({
      name: PropTypes.string,
      start_time: PropTypes.string,
      end_time: PropTypes.string,
    }),
    career: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      name: PropTypes.string,
      short_name: PropTypes.string,
      code: PropTypes.string,
    }),
    blocks: PropTypes.arrayOf(
      PropTypes.shape({
        slot: PropTypes.shape({
          day_of_week: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
          start_time: PropTypes.string,
          end_time: PropTypes.string,
        }),
        color: PropTypes.shape({
          hex: PropTypes.string,
          contrast_hex: PropTypes.string,
        }),
        subject: PropTypes.shape({ name: PropTypes.string }),
        teacher: PropTypes.shape({ name: PropTypes.string }),
        classroom: PropTypes.shape({ name: PropTypes.string }),
      }),
    ),
  }),
  scheduleVersion: PropTypes.shape({
    academic_period: PropTypes.shape({
      name: PropTypes.string,
      year: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
    data: PropTypes.shape({
      active_academic_period: PropTypes.shape({
        name: PropTypes.string,
        year: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      }),
    }),
  }),
  userUniversityName: PropTypes.string,
  viewConfig: PropTypes.shape({
    showTeacherNames: PropTypes.bool,
    includeHeader: PropTypes.bool,
    useSubjectColors: PropTypes.bool,
    adjustToShiftWindow: PropTypes.bool,
    use12HourFormat: PropTypes.bool,
  }),
  palette: PropTypes.shape({
    pageBg: PropTypes.string,
    panelBg: PropTypes.string,
    textPrimary: PropTypes.string,
    textSecondary: PropTypes.string,
    border: PropTypes.string,
    tableHeaderBg: PropTypes.string,
    emptyCellBg: PropTypes.string,
  }).isRequired,
  className: PropTypes.string,
  rowHeightClass: PropTypes.string,
};

const deriveSchedulePanelState = (scheduleVersion, selectedGroupId) => {
  const data = scheduleVersion?.data || {};
  const groups = Array.isArray(data?.groups) ? data.groups : [];
  const unassigned = Array.isArray(data?.unassigned) ? data.unassigned : [];
  const summary = data?.summary && typeof data.summary === 'object' ? data.summary : {};

  const currentGroup = groups.find((group) => Number(group?.group_id) === Number(selectedGroupId)) || groups[0] || null;
  const groupedCareers = buildGroupedCareers(groups);

  const selectedCareerKey = currentGroup ? getGroupCareerKey(currentGroup) : groupedCareers[0]?.key || null;
  const selectedCareer = groupedCareers.find((career) => career.key === selectedCareerKey) || groupedCareers[0] || null;

  const selectedPeriodKey = currentGroup ? getGroupPeriodKey(currentGroup) : selectedCareer?.periods?.[0]?.key || null;
  const selectedPeriod = selectedCareer?.periods?.find((period) => period.key === selectedPeriodKey)
    || selectedCareer?.periods?.[0]
    || null;

  const visibleGroups = selectedPeriod?.groups || [];
  const careerOptions = groupedCareers.map((career) => {
    const careerGroupCount = career.periods.reduce(
      (accumulator, period) => accumulator + period.groups.length,
      0,
    );

    return {
      value: career.key,
      label: `${career.label} (${careerGroupCount})`,
    };
  });
  const periodOptions = (selectedCareer?.periods || []).map((period) => ({
    value: period.key,
    label: `${period.label} (${period.groups.length})`,
  }));
  const groupOptions = visibleGroups.map((group) => {
    const groupId = Number(group?.group_id);
    return {
      value: String(groupId),
      label: group?.group_name || `Grupo ${groupId}`,
    };
  });

  const groupsScheduled = Number(summary?.groups_scheduled) || groups.length;
  const assignedCount = Number(scheduleVersion?.assigned_count) || Number(summary?.total_blocks_assigned) || 0;
  const unassignedCount = Number(scheduleVersion?.unassigned_count) || Number(summary?.total_blocks_unassigned) || 0;

  return {
    groups,
    summary,
    currentGroup,
    groupedCareers,
    selectedCareer,
    selectedPeriod,
    visibleGroups,
    unassignedReasons: buildUnassignedReasons(unassigned),
    careerOptions,
    periodOptions,
    groupOptions,
    groupsScheduled,
    assignedCount,
    unassignedCount,
  };
};

export const ScheduleGeneratedPanel = ({
  loading,
  scheduleVersion,
  selectedGroupId,
  onSelectGroup,
  userUniversityName,
  pendingAction,
  onRequestConfirmVersion,
  onExportPdf,
  viewConfig,
  onToggleViewConfig,
}) => {
  const [showViewSettings, setShowViewSettings] = useState(false);

  const {
    groups,
    currentGroup,
    groupedCareers,
    selectedCareer,
    selectedPeriod,
    unassignedReasons,
    careerOptions,
    periodOptions,
    groupOptions,
    groupsScheduled,
    assignedCount,
    unassignedCount,
  } = deriveSchedulePanelState(scheduleVersion, selectedGroupId);

  const handleCareerChange = (event) => {
    const careerKey = String(event.target.value || '');
    const nextCareer = groupedCareers.find((career) => career.key === careerKey);
    const nextGroupId = Number(nextCareer?.periods?.[0]?.groups?.[0]?.group_id);

    if (Number.isFinite(nextGroupId)) {
      onSelectGroup?.(nextGroupId);
    }
  };

  const handlePeriodChange = (event) => {
    const periodKey = String(event.target.value || '');
    const nextPeriod = selectedCareer?.periods?.find((period) => period.key === periodKey);
    const nextGroupId = Number(nextPeriod?.groups?.[0]?.group_id);

    if (Number.isFinite(nextGroupId)) {
      onSelectGroup?.(nextGroupId);
    }
  };

  const handleGroupChange = (event) => {
    const groupId = Number(event.target.value);

    if (Number.isFinite(groupId)) {
      onSelectGroup?.(groupId);
    }
  };

  const isConfirmed = Number(scheduleVersion?.is_confirmed) === 1;
  const isConfirming = pendingAction?.type === 'confirm' && Number(pendingAction?.versionId) === Number(scheduleVersion?.id);

  const palette = getPalette(viewConfig?.forceWhiteBackground);

  if (loading) {
    return <LoadingStatePanel message="Cargando version seleccionada..." />;
  }

  if (!scheduleVersion) {
    return (
      <SurfacePanel>
        <p className="text-center text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
          No hay version seleccionada. Genera un horario o selecciona una version del historial.
        </p>
      </SurfacePanel>
    );
  }

  return (
    <div className="space-y-4">
      <div className="screen-only grid grid-cols-1 gap-3 md:grid-cols-3">
        <SurfacePanel className="h-full" padding="p-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>Bloques asignados</p>
          <p className="mt-2 text-4xl font-bold" style={{ color: '#047857' }}>{assignedCount}</p>
        </SurfacePanel>

        <SurfacePanel className="h-full" padding="p-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>Sin asignar</p>
          <p className="mt-2 text-4xl font-bold" style={{ color: 'var(--text-primary, #111827)' }}>{unassignedCount}</p>
        </SurfacePanel>

        <SurfacePanel className="h-full" padding="p-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>Grupos programados</p>
          <p className="mt-2 text-4xl font-bold" style={{ color: 'var(--text-primary, #111827)' }}>{groupsScheduled}</p>
        </SurfacePanel>
      </div>

      <SurfacePanel className="space-y-4 print-schedule-wrapper" padding="p-4">
        <div className="screen-only flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-start lg:justify-between" style={{ borderColor: 'var(--border-subtle, #e5e7eb)' }}>
          <div>
            <h3 className="text-2xl font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>Horario semanal</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
              {scheduleVersion?.label || 'Version sin nombre'}
              {' · '}
              {formatDateTime(scheduleVersion?.updated_at || scheduleVersion?.created_at)}
              {' · '}
              <span style={{ color: unassignedCount > 0 ? '#b45309' : '#047857', fontWeight: 600 }}>
                {unassignedCount > 0 ? 'Con conflictos' : 'Sin conflictos'}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <ActionButton
              icon={Download}
              label="Exportar PDF"
              variant="secondary"
              fullWidth={false}
              onClick={() => onExportPdf?.(scheduleVersion)}
            />

            {isConfirmed ? (
              <ActionButton
                icon={Check}
                label="Version confirmada"
                variant="outline"
                fullWidth={false}
                disabled
              />
            ) : (
              <ActionButton
                icon={Check}
                label="Confirmar version"
                variant="outline"
                fullWidth={false}
                onClick={() => onRequestConfirmVersion?.(scheduleVersion)}
                loading={isConfirming}
                loadingLabel="Confirmando..."
                disabled={Boolean(pendingAction?.type) && !isConfirming}
              />
            )}
          </div>
        </div>

        <div className="screen-only">
          <ActionButton
            icon={SlidersHorizontal}
            label={showViewSettings ? 'Ocultar configuraciones de vista' : 'Mostrar configuraciones de vista'}
            variant="secondary"
            fullWidth={false}
            onClick={() => setShowViewSettings((prev) => !prev)}
          />
        </div>

        {showViewSettings ? (
          <div className="screen-only grid grid-cols-1 gap-2 md:grid-cols-2">
            <Checkbox
              checked={Boolean(viewConfig?.showTeacherNames)}
              onChange={(event) => onToggleViewConfig?.('showTeacherNames', event.target.checked)}
              label="Incluir nombres de profesores"
              helperText="Desactivado: se muestran abajo en tabla resumen."
            />
            <Checkbox
              checked={Boolean(viewConfig?.includeHeader)}
              onChange={(event) => onToggleViewConfig?.('includeHeader', event.target.checked)}
              label="Incluir encabezado institucional"
              helperText="Muestra datos de universidad, periodo y grupo en la parte superior."
            />
            <Checkbox
              checked={Boolean(viewConfig?.useSubjectColors)}
              onChange={(event) => onToggleViewConfig?.('useSubjectColors', event.target.checked)}
              label="Usar colores de materias"
              helperText="Aplica el color configurado de cada materia dentro de su bloque."
            />
            <Checkbox
              checked={Boolean(viewConfig?.forceWhiteBackground)}
              onChange={(event) => onToggleViewConfig?.('forceWhiteBackground', event.target.checked)}
              label="Fondo blanco del horario"
              helperText="Ignora el tema actual de la aplicacion para esta vista."
            />
            <Checkbox
              checked={viewConfig?.adjustToShiftWindow !== false}
              onChange={(event) => onToggleViewConfig?.('adjustToShiftWindow', event.target.checked)}
              label="Ajustar rejilla al turno"
              helperText="Activo: completa el rango del turno. Inactivo: muestra solo horarios con bloques asignados."
            />
            <Checkbox
              checked={Boolean(viewConfig?.use12HourFormat)}
              onChange={(event) => onToggleViewConfig?.('use12HourFormat', event.target.checked)}
              label="Usar formato de 12 horas"
              helperText="Activo: 1:00 PM. Inactivo: 13:00 (24 horas)."
            />
          </div>
        ) : null}

        <div className="screen-only rounded-lg border p-3" style={{ borderColor: 'var(--border-subtle, #e5e7eb)' }}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Select
              label="Carrera"
              value={selectedCareer?.key || ''}
              onChange={handleCareerChange}
              options={careerOptions}
              placeholder="Sin carreras disponibles"
              showPlaceholderOption={careerOptions.length === 0}
              disabled={careerOptions.length === 0}
              reserveHelperSpace={false}
            />

            <Select
              label="Periodo"
              value={selectedPeriod?.key || ''}
              onChange={handlePeriodChange}
              options={periodOptions}
              placeholder="Sin periodos disponibles"
              showPlaceholderOption={periodOptions.length === 0}
              disabled={periodOptions.length === 0}
              reserveHelperSpace={false}
            />

            <Select
              label="Grupo"
              value={currentGroup?.group_id ? String(currentGroup.group_id) : ''}
              onChange={handleGroupChange}
              options={groupOptions}
              placeholder="Sin grupos disponibles"
              showPlaceholderOption={groupOptions.length === 0}
              disabled={groupOptions.length === 0}
              reserveHelperSpace={false}
            />
          </div>
        </div>

        <div className="screen-only">
          {currentGroup ? (
            <GroupScheduleView
              group={currentGroup}
              scheduleVersion={scheduleVersion}
              userUniversityName={userUniversityName}
              viewConfig={viewConfig}
              palette={palette}
            />
          ) : (
            <SurfacePanel>
              <p className="text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                La version seleccionada no contiene grupos programados.
              </p>
            </SurfacePanel>
          )}
        </div>

        <div className="print-only space-y-4">
          {groups.length ? (
            groups.map((group, index) => (
              <GroupScheduleView
                key={`${group?.group_id || index}`}
                group={group}
                scheduleVersion={scheduleVersion}
                userUniversityName={userUniversityName}
                viewConfig={viewConfig}
                palette={palette}
                className={`print-schedule-page ${index < groups.length - 1 ? 'print-break-after' : ''} print-avoid-break`}
                rowHeightClass="h-14"
              />
            ))
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
              Esta version no contiene grupos para impresion.
            </p>
          )}
        </div>

        {unassignedReasons.length ? (
          <SurfacePanel className="space-y-2 print-avoid-break" padding="p-4">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
              Bloques sin asignar por razon
            </h4>

            <div className="flex flex-wrap gap-2">
              {unassignedReasons.map((row) => (
                <span
                  key={row.reason}
                  className="rounded-full border px-3 py-1 text-xs font-medium"
                  style={{
                    color: '#92400E',
                    borderColor: '#FCD34D',
                    backgroundColor: '#FFFBEB',
                  }}
                >
                  {row.reason}: {row.count}
                </span>
              ))}
            </div>
          </SurfacePanel>
        ) : null}
      </SurfacePanel>
    </div>
  );
};

ScheduleGeneratedPanel.propTypes = {
  loading: PropTypes.bool,
  scheduleVersion: PropTypes.object,
  selectedGroupId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onSelectGroup: PropTypes.func,
  userUniversityName: PropTypes.string,
  pendingAction: PropTypes.shape({
    type: PropTypes.string,
    versionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  onRequestConfirmVersion: PropTypes.func,
  onExportPdf: PropTypes.func,
  viewConfig: PropTypes.shape({
    showTeacherNames: PropTypes.bool,
    includeHeader: PropTypes.bool,
    useSubjectColors: PropTypes.bool,
    forceWhiteBackground: PropTypes.bool,
    adjustToShiftWindow: PropTypes.bool,
    use12HourFormat: PropTypes.bool,
  }),
  onToggleViewConfig: PropTypes.func,
};
