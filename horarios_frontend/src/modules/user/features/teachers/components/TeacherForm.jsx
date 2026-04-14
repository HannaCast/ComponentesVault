import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Trash2, Plus } from 'lucide-react';
import Input from '@shared/components/inputs/InputText';
import Checkbox from '@shared/components/inputs/Checkbox';
import { Select } from '@shared/components/inputs/Select';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { teacherValidationSchema } from '../validations/teacherValidationSchema';
import {
  DAY_OF_WEEK_OPTIONS,
  mapAvailabilityFromApi,
  createEmptyAvailabilityRow,
  buildAvailabilitiesPayload,
  validateAvailabilityRows,
} from '../utils/teacherAvailabilityUtils';

const createDefaultFormData = () => ({
  name: '',
  surname: '',
  last_name: '',
  require_classroom: false,
});

export const TeacherForm = ({
  initialData = null,
  isLoading = false,
  onSubmit,
  onCancel,
  mode = 'create',
}) => {
  const [formData, setFormData] = useState(createDefaultFormData);
  const [availabilityRows, setAvailabilityRows] = useState([]);
  const [availabilityError, setAvailabilityError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const previousModeRef = useRef(mode);

  useEffect(() => {
    if (!initialData) {
      return;
    }

    setFormData({
      name: initialData.name || '',
      surname: initialData.surname || '',
      last_name: initialData.last_name || '',
      require_classroom: Number(initialData.require_classroom) === 1,
    });

    const raw = Array.isArray(initialData.availabilities)
      ? initialData.availabilities
      : [];
    setAvailabilityRows(raw.map((a, i) => mapAvailabilityFromApi(a, i)));
    setAvailabilityError('');
  }, [initialData]);

  useEffect(() => {
    const previousMode = previousModeRef.current;
    const enteringCreateMode = mode === 'create' && previousMode !== 'create';
    previousModeRef.current = mode;

    if (mode !== 'create' || initialData) {
      return;
    }

    if (enteringCreateMode) {
      setFormData(createDefaultFormData());
      setAvailabilityRows([]);
      setAvailabilityError('');
    }
  }, [mode, initialData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setFormErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }

      return {
        ...prev,
        [field]: '',
      };
    });
  };

  const updateAvailabilityRow = (rowKey, patch) => {
    setAvailabilityRows((prev) =>
      prev.map((row) => (row.rowKey === rowKey ? { ...row, ...patch } : row)),
    );
    setAvailabilityError('');
  };

  const removeAvailabilityRow = (rowKey) => {
    setAvailabilityRows((prev) => prev.filter((row) => row.rowKey !== rowKey));
    setAvailabilityError('');
  };

  const addAvailabilityRow = () => {
    setAvailabilityRows((prev) => [...prev, createEmptyAvailabilityRow()]);
    setAvailabilityError('');
  };

  const validateForm = async (dataToValidate = formData) => {
    try {
      await teacherValidationSchema.validate(dataToValidate, {
        abortEarly: false,
      });
      setFormErrors({});
      return true;
    } catch (validationError) {
      const nextErrors = {};

      if (Array.isArray(validationError?.inner) && validationError.inner.length > 0) {
        validationError.inner.forEach((err) => {
          if (!err?.path || nextErrors[err.path]) {
            return;
          }
          nextErrors[err.path] = err.message;
        });
      }

      setFormErrors(nextErrors);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!(await validateForm())) {
      return;
    }

    const availErr = validateAvailabilityRows(availabilityRows);
    if (availErr) {
      setAvailabilityError(availErr);
      return;
    }

    const trimmedLast = String(formData.last_name || '').trim();
    const payload = {
      name: String(formData.name || '').trim(),
      surname: String(formData.surname || '').trim(),
      require_classroom: Boolean(formData.require_classroom),
      availabilities: buildAvailabilitiesPayload(availabilityRows),
    };

    if (trimmedLast) {
      payload.last_name = trimmedLast;
    } else {
      payload.last_name = null;
    }

    if (mode === 'create') {
      payload.subjects = [];
    }

    onSubmit(payload);
  };

  const isViewMode = mode === 'view';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <div>
        <Input
          label="Nombre"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Ej: Juan"
          error={formErrors.name}
          disabled={isViewMode || isLoading}
          required
          reserveHelperSpace={false}
        />
      </div>

      <div>
        <Input
          label="Apellido paterno"
          type="text"
          value={formData.surname}
          onChange={(e) => handleInputChange('surname', e.target.value)}
          placeholder="Ej: Pérez"
          error={formErrors.surname}
          disabled={isViewMode || isLoading}
          required
          reserveHelperSpace={false}
        />
      </div>

      <div>
        <Input
          label="Apellido materno"
          type="text"
          value={formData.last_name}
          onChange={(e) => handleInputChange('last_name', e.target.value)}
          placeholder="Opcional"
          error={formErrors.last_name}
          disabled={isViewMode || isLoading}
          reserveHelperSpace={false}
        />
      </div>

      <Checkbox
        label="Requiere salón de clase"
        checked={formData.require_classroom}
        onChange={(e) => handleInputChange('require_classroom', e.target.checked)}
        disabled={isViewMode || isLoading}
        helperText="Si no está marcado, se asume que el docente tiene oficina y puede impartir sin aula fija."
      />

      {!isViewMode && (
        <div className="space-y-3 pt-2 border-t border-[var(--border-default)]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Disponibilidad horaria
            </p>
            <button
              type="button"
              onClick={addAvailabilityRow}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:opacity-90 disabled:opacity-50"
            >
              <Plus size={16} />
              Agregar intervalo
            </button>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Define en qué días y horarios el docente puede impartir clases. Puedes dejar la lista vacía y editarla después.
          </p>
          {availabilityError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{availabilityError}</p>
          ) : null}
          <div className="space-y-3">
            {availabilityRows.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)] italic">
                Sin intervalos. Usa &quot;Agregar intervalo&quot; para añadir uno.
              </p>
            ) : (
              availabilityRows.map((row) => (
                <div
                  key={row.rowKey}
                  className="flex flex-col gap-3 rounded-lg border border-[var(--border-default)] p-3 sm:flex-row sm:flex-wrap sm:items-end"
                >
                  <div className="min-w-[140px] flex-1">
                    <Select
                      label="Día"
                      options={DAY_OF_WEEK_OPTIONS}
                      value={row.day_of_week}
                      onChange={(e) =>
                        updateAvailabilityRow(row.rowKey, { day_of_week: e.target.value })
                      }
                      disabled={isLoading}
                      showPlaceholderOption={false}
                      reserveHelperSpace={false}
                    />
                  </div>
                  <div className="flex flex-1 flex-wrap gap-3 min-w-0">
                    <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-secondary)]">
                      <span>Inicio</span>
                      <input
                        type="time"
                        value={row.start_time}
                        onChange={(e) =>
                          updateAvailabilityRow(row.rowKey, { start_time: e.target.value })
                        }
                        disabled={isLoading}
                        className="rounded-md border border-[var(--border-default)] bg-[var(--surface)] px-2 py-2 text-sm text-[var(--text-primary)]"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-secondary)]">
                      <span>Fin</span>
                      <input
                        type="time"
                        value={row.end_time}
                        onChange={(e) =>
                          updateAvailabilityRow(row.rowKey, { end_time: e.target.value })
                        }
                        disabled={isLoading}
                        className="rounded-md border border-[var(--border-default)] bg-[var(--surface)] px-2 py-2 text-sm text-[var(--text-primary)]"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:pb-1">
                    <Checkbox
                      label="Disponible"
                      checked={row.is_available}
                      onChange={(e) =>
                        updateAvailabilityRow(row.rowKey, { is_available: e.target.checked })
                      }
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => removeAvailabilityRow(row.rowKey)}
                      disabled={isLoading}
                      className="inline-flex items-center gap-1 rounded-md p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-red-600 disabled:opacity-50"
                      aria-label="Eliminar intervalo"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {!isViewMode && (
        <div className="flex gap-3 pt-6 border-t border-[var(--border-default)]">
          <ActionButton
            label="Cancelar"
            onClick={onCancel}
            disabled={isLoading}
            variant="secondary"
            className="flex-1"
          />
          <ActionButton
            label={mode === 'edit' ? 'Guardar cambios' : 'Crear profesor'}
            type="submit"
            isLoading={isLoading}
            disabled={isLoading}
            variant="primary"
            className="flex-1"
          />
        </div>
      )}

      {isViewMode && (
        <div className="flex gap-3 pt-6 border-t border-[var(--border-default)]">
          <ActionButton
            label="Cerrar"
            onClick={onCancel}
            variant="secondary"
            className="flex-1"
          />
        </div>
      )}
    </form>
  );
};

const TeacherInitialDataShape = PropTypes.shape({
  name: PropTypes.string,
  surname: PropTypes.string,
  last_name: PropTypes.string,
  require_classroom: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
  availabilities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      day_of_week: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      start_time: PropTypes.string,
      end_time: PropTypes.string,
      is_available: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
    }),
  ),
});

TeacherForm.propTypes = {
  initialData: TeacherInitialDataShape,
  isLoading: PropTypes.bool,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  mode: PropTypes.oneOf(['create', 'edit', 'view']),
};
