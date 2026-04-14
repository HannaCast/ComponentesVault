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
  careerId = null,
  periodExceptions = [],
  periodExceptionsLoading = false,
  onCreatePeriodException,
  onDeletePeriodException,
}) => {
  const [formData, setFormData] = useState(createDefaultFormData);
  const [formErrors, setFormErrors] = useState({});
  const [showAddException, setShowAddException] = useState(false);
  const [newExceptionPeriod, setNewExceptionPeriod] = useState('');
  const [newExceptionReason, setNewExceptionReason] = useState('');
  const [exceptionBusyId, setExceptionBusyId] = useState(null);
  /** Excepciones locales al crear carrera (se envían en el mismo POST). */
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

    if (mode === 'create' && pendingPeriodExceptions.length > 0) {
      payload.period_exceptions = pendingPeriodExceptions.map((ex) => ({
        period_number: Number(ex.period_number),
        reason: (ex.reason || '').trim(),
      }));
    } else if (careerId && !periodExceptionsLoading) {
      payload.period_exceptions = (periodExceptions || []).map((ex) => ({
        period_number: Number(ex.period_number),
        reason: (ex.reason || '').trim(),
      }));
    }

    onSubmit(payload);
  };

  const handleAddException = async () => {
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

    if (mode === 'create') {
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
      return;
    }

    if (!careerId) {
      return;
    }

    setExceptionBusyId('new');
    const ok = await onCreatePeriodException({
      careerId,
      period_number: period,
      reason: newExceptionReason,
    });
    setExceptionBusyId(null);

    if (ok) {
      setNewExceptionPeriod('');
      setNewExceptionReason('');
      setShowAddException(false);
    }
  };

  const handleRemoveException = async (exception) => {
    if (mode === 'create' && exception?.tempId) {
      setPendingPeriodExceptions((prev) => prev.filter((x) => x.tempId !== exception.tempId));
      return;
    }
    if (!careerId || !exception?.id) return;
    setExceptionBusyId(exception.id);
    await onDeletePeriodException(exception.id, careerId);
    setExceptionBusyId(null);
  };

  const canManageExceptions = Boolean(careerId) || mode === 'create';
  const displayExceptions =
    mode === 'create' ? pendingPeriodExceptions : periodExceptions;

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
          const rowKey = mode === 'create' ? ex.tempId : ex.id;
          const busy = mode === 'create' ? false : exceptionBusyId === ex.id;
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
                disabled={exceptionBusyId != null}
                aria-label="Eliminar excepción"
              >
                {busy ? <span className="text-xs">…</span> : <Trash2 size={16} />}
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

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
                  isLoading={exceptionBusyId === 'new'}
                  disabled={isLoading || exceptionBusyId === 'new'}
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
          disabled={isLoading}
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
  onCreatePeriodException: PropTypes.func,
  onDeletePeriodException: PropTypes.func,
};
