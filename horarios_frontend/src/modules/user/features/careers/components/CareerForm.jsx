import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Trash2 } from 'lucide-react';
import Input from '@shared/components/inputs/InputText';
import { Select } from '@shared/components/inputs/Select';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { careerValidationSchema } from '../validations/careerValidationSchema';

const createDefaultFormData = () => ({
  name: '',
  short_name: '',
  code: '',
  modality: '',
  total_periods: '',
  parent_career_id: '',
  continuation_from_period: '1',
});

const resolveModalityValue = (initialData, modalityOptions) => {
  if (!initialData) return '';

  if (initialData.modality_id != null && initialData.modality_id !== '') {
    return String(initialData.modality_id);
  }

  const name = initialData.modality;
  if (!name || !Array.isArray(modalityOptions)) return '';

  const match = modalityOptions.find((opt) => String(opt.label) === String(name));
  return match ? String(match.value) : '';
};

let careerTempIdSequence = 0;

const getCareerTempIdFallback = () => {
  careerTempIdSequence += 1;
  return `p-${Date.now()}-${careerTempIdSequence.toString(16)}`;
};

export const CareerForm = ({
  initialData = null,
  isLoading = false,
  onSubmit,
  onCancel,
  mode = 'create',
  modalityOptions = [],
  careerOptions = [],
  careerId = null,
  periodExceptions = [],
  periodExceptionsLoading = false,
}) => {
  const [formData, setFormData] = useState(createDefaultFormData);
  const [formErrors, setFormErrors] = useState({});
  const [showAddException, setShowAddException] = useState(false);
  const [newExceptionPeriod, setNewExceptionPeriod] = useState('');
  const [newExceptionReason, setNewExceptionReason] = useState('');
  /** Excepciones locales en create/edit; se envían solo al guardar carrera. */
  const [pendingPeriodExceptions, setPendingPeriodExceptions] = useState([]);
  const previousModeRef = useRef(mode);

  const newTempId = () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : getCareerTempIdFallback();

  useEffect(() => {
    if (!initialData) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- alinear formulario con initialData al abrir editar
    setFormData({
      name: initialData.name || '',
      short_name: initialData.short_name || '',
      code: initialData.code || '',
      modality: resolveModalityValue(initialData, modalityOptions),
      total_periods:
        initialData.total_periods != null && initialData.total_periods !== ''
          ? String(initialData.total_periods)
          : '',
      parent_career_id: initialData.parent_career_id != null ? String(initialData.parent_career_id) : '',
      continuation_from_period:
        initialData.continuation_from_period != null && initialData.continuation_from_period !== ''
          ? String(initialData.continuation_from_period)
          : '1',
    });
  }, [initialData, modalityOptions]);

  useEffect(() => {
    const previousMode = previousModeRef.current;
    const enteringCreateMode = mode === 'create' && previousMode !== 'create';
    previousModeRef.current = mode;

    if (mode !== 'create' || initialData) {
      return;
    }

    if (enteringCreateMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reinicio explícito al entrar en modo crear
      setFormData(createDefaultFormData());
      setFormErrors({});
      setShowAddException(false);
      setPendingPeriodExceptions([]);
    }
  }, [mode, initialData]);

  useEffect(() => {
    if (mode === 'create') {
      return;
    }

    if (!careerId || periodExceptionsLoading) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza estado local cuando se carga la carrera en edición
    setPendingPeriodExceptions(
      (periodExceptions || []).map((ex) => ({
        id: ex.id,
        period_number: Number(ex.period_number),
        reason: ex.reason || '',
      })),
    );
  }, [mode, careerId, periodExceptionsLoading, periodExceptions]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const nextData = { ...prev, [field]: value };
      
      if (field === 'parent_career_id') {
        if (value) {
          const selectedParent = careerOptions.find((c) => String(c.value) === String(value));
          const parentPeriods = selectedParent ? Number(selectedParent.total_periods) || 0 : 0;
          nextData.continuation_from_period = String(parentPeriods + 1);
        } else {
          nextData.continuation_from_period = '1';
        }
      }
      
      return nextData;
    });

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const values = {
      ...formData,
      total_periods:
        formData.total_periods === ''
          ? ''
          : Number.parseInt(formData.total_periods, 10),
    };

    try {
      await careerValidationSchema.validate(values, { abortEarly: false });
      setFormErrors({});
    } catch (validationError) {
      if (!validationError.inner) {
        return;
      }

      const nextErrors = {};
      validationError.inner.forEach((err) => {
        if (err.path && !nextErrors[err.path]) {
          nextErrors[err.path] = err.message;
        }
      });
      setFormErrors(nextErrors);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      modality: Number.parseInt(formData.modality, 10),
      total_periods: Number.parseInt(formData.total_periods, 10),
    };

    const sn = formData.short_name.trim();
    const code = formData.code.trim();
    if (sn) payload.short_name = sn;
    if (code) payload.code = code;

    if (formData.parent_career_id) {
      payload.parent_career_id = Number.parseInt(formData.parent_career_id, 10);
    } else {
      payload.parent_career_id = null;
    }

    if (formData.continuation_from_period) {
      payload.continuation_from_period = Number.parseInt(formData.continuation_from_period, 10);
    } else {
      payload.continuation_from_period = null;
    }

    if (!periodExceptionsLoading) {
      payload.period_exceptions = pendingPeriodExceptions.map((ex) => ({
        period_number: Number(ex.period_number),
        reason: (ex.reason || '').trim(),
      }));
    }

    onSubmit(payload);
  };

  const handleAddException = () => {
    const period = Number.parseInt(newExceptionPeriod, 10);
    if (!Number.isFinite(period) || period <= 0) {
      return;
    }

    const totalPeriods = Number.parseInt(formData.total_periods, 10);
    if (Number.isFinite(totalPeriods) && period > totalPeriods) {
      setFormErrors((prev) => ({
        ...prev,
        total_periods:
          'El número de periodo de la excepción no puede ser mayor que el total de periodos.',
      }));
      return;
    }

    if (pendingPeriodExceptions.some((p) => Number(p.period_number) === period)) {
      return;
    }

    setPendingPeriodExceptions((prev) => [
      ...prev,
      {
        tempId: newTempId(),
        period_number: period,
        reason: newExceptionReason.trim(),
      },
    ]);
    setNewExceptionPeriod('');
    setNewExceptionReason('');
    setShowAddException(false);
  };

  const handleRemoveException = (exception) => {
    const targetId = exception?.id ?? exception?.tempId;
    if (targetId == null) {
      return;
    }

    setPendingPeriodExceptions((prev) =>
      prev.filter((x) => String(x.id ?? x.tempId) !== String(targetId)),
    );
  };

  const canManageExceptions = Boolean(careerId) || mode === 'create';
  const displayExceptions = pendingPeriodExceptions;

  let periodExceptionsContent = null;
  if (careerId && periodExceptionsLoading) {
    periodExceptionsContent = <p className="text-sm text-[var(--text-secondary)]">Cargando excepciones…</p>;
  } else if (displayExceptions.length === 0) {
    periodExceptionsContent = (
      <p className="text-sm italic text-[var(--text-tertiary)]">
        No hay excepciones configuradas
      </p>
    );
  } else {
    periodExceptionsContent = (
      <ul className="space-y-2">
        {displayExceptions.map((ex) => {
          const rowKey = ex.id ?? ex.tempId;
          return (
            <li
              key={rowKey}
              className="flex items-start justify-between gap-2 text-sm text-[var(--text-primary)]"
            >
              <span>
                <span className="font-medium">Periodo {ex.period_number}</span>
                {ex.reason ? (
                  <span className="text-[var(--text-secondary)]"> — {ex.reason}</span>
                ) : null}
              </span>
              <button
                type="button"
                className="p-1 rounded text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--error,#dc2626)]"
                onClick={() => handleRemoveException(ex)}
                disabled={isLoading || (Boolean(careerId) && periodExceptionsLoading)}
                aria-label="Eliminar excepción"
              >
                <Trash2 size={16} />
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  const filteredCareerOptions = careerOptions.filter(
    (c) => String(c.value) !== String(careerId)
  );

  const selectedParentCareer = careerOptions.find((c) => String(c.value) === String(formData.parent_career_id));
  const parentTotalPeriods = selectedParentCareer ? Number(selectedParentCareer.total_periods) || 0 : 0;

  const continuationOptions = formData.parent_career_id
    ? [
        { value: '1', label: '1 (Desde el inicio)' },
        { value: String(parentTotalPeriods + 1), label: `${parentTotalPeriods + 1} (Continuación de ${parentTotalPeriods} periodos)` }
      ]
    : [{ value: '1', label: '1' }];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6" noValidate>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-12">
          <Input
            label="Nombre de la carrera"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Ej: Desarrollo de Software Multiplataforma"
            error={formErrors.name}
            disabled={isLoading}
            required
            reserveHelperSpace={false}
          />
        </div>

        <div className="md:col-span-6">
          <Input
            label="Nombre Corto"
            type="text"
            value={formData.short_name}
            onChange={(e) => handleInputChange('short_name', e.target.value)}
            placeholder="Ej: DSM"
            disabled={isLoading}
            reserveHelperSpace={false}
          />
        </div>

        <div className="md:col-span-6">
          <Input
            label="Código"
            type="text"
            value={formData.code}
            onChange={(e) => handleInputChange('code', e.target.value)}
            placeholder="Ej: DSM-01"
            disabled={isLoading}
            reserveHelperSpace={false}
          />
        </div>

        <div className="md:col-span-6">
          <Select
            label="Modalidad"
            options={modalityOptions}
            value={formData.modality}
            onChange={(e) => handleInputChange('modality', e.target.value)}
            placeholder="Selecciona una modalidad"
            error={formErrors.modality}
            disabled={isLoading}
            required
            reserveHelperSpace={false}
          />
        </div>

        <div className="md:col-span-12">
          <Input
            label="Total de periodos"
            type="number"
            value={formData.total_periods}
            onChange={(e) => handleInputChange('total_periods', e.target.value)}
            placeholder="Ej: 8"
            error={formErrors.total_periods}
            disabled={isLoading}
            min="1"
            required
            reserveHelperSpace={false}
          />
        </div>

        <div className="md:col-span-6">
          <Select
            label="Carrera Anterior (Opcional)"
            options={filteredCareerOptions}
            value={formData.parent_career_id}
            onChange={(e) => handleInputChange('parent_career_id', e.target.value)}
            placeholder="Ninguna"
            error={formErrors.parent_career_id}
            disabled={isLoading}
            reserveHelperSpace={false}
          />
        </div>

        <div className="md:col-span-6">
          <Select
            label="Periodo de continuación"
            options={continuationOptions}
            value={formData.continuation_from_period}
            onChange={(e) => handleInputChange('continuation_from_period', e.target.value)}
            placeholder="Selecciona el periodo inicial"
            error={formErrors.continuation_from_period}
            disabled={isLoading || !formData.parent_career_id}
            infoMessage="Indica en qué periodo comenzará esta carrera. Por ejemplo, si es continuación de una carrera de 5 periodos, puedes indicar que inicie en el periodo 6."
            reserveHelperSpace={false}
          />
        </div>

        <div className="md:col-span-12">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Excepciones de Periodos
            </span>
            {canManageExceptions ? (
              <button
                type="button"
                className="text-sm font-medium text-[var(--accent,#2563eb)] hover:underline disabled:opacity-50 disabled:no-underline"
                onClick={() => setShowAddException((v) => !v)}
                disabled={isLoading || (Boolean(careerId) && periodExceptionsLoading)}
              >
                + Agregar Excepción
              </button>
            ) : null}
          </div>

          {canManageExceptions && showAddException && (
            <div className="mb-4 p-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-3">
                <Input
                  label="Periodo"
                  type="number"
                  min="1"
                  value={newExceptionPeriod}
                  onChange={(e) => setNewExceptionPeriod(e.target.value)}
                  placeholder="Número"
                  disabled={isLoading}
                  reserveHelperSpace={false}
                />
              </div>
              <div className="sm:col-span-7">
                <Input
                  label="Motivo"
                  type="text"
                  value={newExceptionReason}
                  onChange={(e) => setNewExceptionReason(e.target.value)}
                  placeholder="Descripción breve"
                  disabled={isLoading}
                  reserveHelperSpace={false}
                />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <ActionButton
                  type="button"
                  label="Añadir"
                  variant="primary"
                  className="flex-1"
                  onClick={handleAddException}
                  disabled={isLoading || (Boolean(careerId) && periodExceptionsLoading)}
                />
              </div>
            </div>
          )}

          <div className="min-h-[3rem] rounded-lg border border-dashed border-[var(--border-default)] p-3 bg-[var(--bg-surface)]">
            {periodExceptionsContent}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-6 border-t border-[var(--border-default)]">
        <ActionButton
          label="Cancelar"
          onClick={onCancel}
          disabled={isLoading}
          variant="secondary"
          className="flex-1"
        />
        <ActionButton
          label="Guardar"
          type="submit"
          isLoading={isLoading}
          disabled={isLoading || (Boolean(careerId) && periodExceptionsLoading)}
          variant="primary"
          className="flex-1"
        />
      </div>
    </form>
  );
};

CareerForm.propTypes = {
  initialData: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    short_name: PropTypes.string,
    code: PropTypes.string,
    modality: PropTypes.string,
    modality_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    total_periods: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  isLoading: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']),
  modalityOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
    }),
  ),
  careerOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
    }),
  ),
  careerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  periodExceptions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      career_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      period_number: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      reason: PropTypes.string,
    }),
  ),
  periodExceptionsLoading: PropTypes.bool,
};
