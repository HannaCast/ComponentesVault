import PropTypes from 'prop-types';
import { Check, Download } from 'lucide-react';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import Checkbox from '@shared/components/inputs/Checkbox';
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

const formatAcademicPeriod = (academicPeriod) => {
  if (!academicPeriod) {
    return 'Sin periodo';
  }

  const periodName = academicPeriod?.name ? String(academicPeriod.name) : '';
  const periodYear = academicPeriod?.year ? String(academicPeriod.year) : '';

  return `${periodName} ${periodYear}`.trim() || 'Sin periodo';
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

const buildGridModel = (group) => {
  const blocks = Array.isArray(group?.blocks) ? group.blocks : [];

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

  const dayColumns = Array.from(daySet).sort((a, b) => a - b);
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

  const data = scheduleVersion?.data || {};
  const groups = Array.isArray(data?.groups) ? data.groups : [];
  const unassigned = Array.isArray(data?.unassigned) ? data.unassigned : [];
  const summary = data?.summary && typeof data.summary === 'object' ? data.summary : {};

  const currentGroup = groups.find((group) => Number(group?.group_id) === Number(selectedGroupId)) || groups[0] || null;

  const gridModel = buildGridModel(currentGroup);
  const teachersSummary = buildTeachersSummary(currentGroup);
  const unassignedReasons = buildUnassignedReasons(unassigned);

  const isConfirmed = Number(scheduleVersion?.is_confirmed) === 1;
  const isConfirming = pendingAction?.type === 'confirm' && Number(pendingAction?.versionId) === Number(scheduleVersion?.id);

  const palette = getPalette(viewConfig?.forceWhiteBackground);

  const scheduleWindowLabel = gridModel.slots.length
    ? `${gridModel.slots[0].startTime} - ${gridModel.slots[gridModel.slots.length - 1].endTime}`
    : 'Sin bloques programados';

  const groupsScheduled = Number(summary?.groups_scheduled) || groups.length;
  const assignedCount = Number(scheduleVersion?.assigned_count) || Number(summary?.total_blocks_assigned) || 0;
  const unassignedCount = Number(scheduleVersion?.unassigned_count) || Number(summary?.total_blocks_unassigned) || 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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

      <SurfacePanel className="space-y-4" padding="p-4">
        <div className="flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-start lg:justify-between" style={{ borderColor: 'var(--border-subtle, #e5e7eb)' }}>
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

            {!isConfirmed ? (
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
            ) : (
              <ActionButton
                icon={Check}
                label="Version confirmada"
                variant="outline"
                fullWidth={false}
                disabled
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
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
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {groups.map((group) => {
            const groupId = Number(group?.group_id);
            const isSelected = Number(currentGroup?.group_id) === groupId;

            return (
              <button
                key={groupId}
                type="button"
                onClick={() => onSelectGroup?.(groupId)}
                className="rounded-full border px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  borderColor: isSelected ? 'var(--accent, #2563eb)' : 'var(--border-default, #d1d5db)',
                  color: isSelected ? 'var(--accent, #2563eb)' : 'var(--text-primary, #111827)',
                  backgroundColor: isSelected ? 'var(--accent-subtle, #eff6ff)' : 'transparent',
                }}
              >
                {group?.group_name || `Grupo ${groupId}`}
              </button>
            );
          })}
        </div>

        {currentGroup ? (
          <div
            className="space-y-4 rounded-xl border p-4"
            style={{
              backgroundColor: palette.pageBg,
              borderColor: palette.border,
              color: palette.textPrimary,
            }}
          >
            {viewConfig?.includeHeader ? (
              <div className="space-y-2 border-b pb-3" style={{ borderColor: palette.border }}>
                <h4 className="text-center text-xl font-bold uppercase" style={{ color: palette.textPrimary }}>
                  {String(userUniversityName || 'Universidad seleccionada')}
                </h4>
                <p className="text-center text-sm font-semibold uppercase" style={{ color: palette.textPrimary }}>
                  Horario de grupo
                </p>

                <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                  <div className="rounded border px-2 py-1" style={{ borderColor: palette.border }}>
                    <span className="font-semibold">Carrera:</span> {currentGroup?.career_id || '-'}
                  </div>
                  <div className="rounded border px-2 py-1" style={{ borderColor: palette.border }}>
                    <span className="font-semibold">Periodo:</span> {formatAcademicPeriod(scheduleVersion?.academic_period)}
                  </div>
                  <div className="rounded border px-2 py-1" style={{ borderColor: palette.border }}>
                    <span className="font-semibold">Turno:</span> {scheduleWindowLabel}
                  </div>
                  <div className="rounded border px-2 py-1" style={{ borderColor: palette.border }}>
                    <span className="font-semibold">Grupo:</span> {currentGroup?.group_name || '-'}
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
                    const slotRangeLabel = `${slot.startTime} - ${slot.endTime}`;

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

                                  {viewConfig?.showTeacherNames ? (
                                    <p className="text-xs">{block?.teacher?.name || 'Sin profesor'}</p>
                                  ) : null}

                                  <p className="text-xs">{block?.classroom?.name || 'Sin aula'}</p>
                                </div>
                              ) : (
                                <div className="h-20" />
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

            {!viewConfig?.showTeacherNames ? (
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
        ) : (
          <SurfacePanel>
            <p className="text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
              La version seleccionada no contiene grupos programados.
            </p>
          </SurfacePanel>
        )}

        {unassignedReasons.length ? (
          <SurfacePanel className="space-y-2" padding="p-4">
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
  }),
  onToggleViewConfig: PropTypes.func,
};
