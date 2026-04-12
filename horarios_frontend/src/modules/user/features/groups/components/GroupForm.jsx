import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Input from '@shared/components/inputs/InputText';
import { Select } from '@shared/components/inputs/Select';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { groupValidationSchema } from '../validations/groupValidationSchema';

const createDefaultFormData = () => ({
  name: '',
  career: '',
  period_number: '',
  letter: '',
  shift: '',
});

export const GroupForm = ({
  initialData = null,
  isLoading = false,
  onSubmit,
  onCancel,
  mode = 'create',
  careerOptions = [],
  shiftOptions = [],
}) => {
  const [formData, setFormData] = useState(createDefaultFormData);
  const [formErrors, setFormErrors] = useState({});
  const previousModeRef = useRef(mode);

  const getCareerById = (careerId) => {
    const target = String(careerId || '').trim();
    return careerOptions.find((c) => String(c.value) === target) || null;
  };

  useEffect(() => {
    if (!initialData) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- alinear formulario con datos al editar
    setFormData({
      name: initialData.name || '',
      career:
        initialData.career_id != null && initialData.career_id !== ''
          ? String(initialData.career_id)
          : '',
      period_number:
        initialData.period_number != null && initialData.period_number !== ''
          ? String(initialData.period_number)
          : '',
      letter: initialData.letter != null ? String(initialData.letter).trim().slice(0, 1) : '',
      shift:
        initialData.shift_id != null && initialData.shift_id !== ''
          ? String(initialData.shift_id)
          : '',
    });
  }, [initialData]);

  useEffect(() => {
    const previousMode = previousModeRef.current;
    const enteringCreateMode = mode === 'create' && previousMode !== 'create';
    previousModeRef.current = mode;

    if (mode !== 'create' || initialData) {
      return;
    }

    if (enteringCreateMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reinicio al modo crear
      setFormData(createDefaultFormData());
      setFormErrors({});
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

  const handleLetterChange = (e) => {
    const raw = e.target.value;
    const next = raw.slice(0, 1).toUpperCase();
    handleInputChange('letter', next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const values = {
      ...formData,
      period_number:
        formData.period_number === ''
          ? ''
          : Number.parseInt(formData.period_number, 10),
    };

    try {
      await groupValidationSchema.validate(values, { abortEarly: false });
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

    const selectedCareer = getCareerById(formData.career);
    const maxPeriods = Number.parseInt(selectedCareer?.total_periods, 10);
    const periodNum = Number.parseInt(String(formData.period_number), 10);
    if (
      Number.isFinite(maxPeriods)
      && maxPeriods > 0
      && Number.isFinite(periodNum)
      && periodNum > maxPeriods
    ) {
      setFormErrors({
        period_number: (
          `El periodo no puede ser mayor a ${maxPeriods} para ${selectedCareer?.label || 'esta carrera'}.`
        ),
      });
      return;
    }

    const payload = {
      name: formData.name.trim(),
      career: Number.parseInt(formData.career, 10),
      period_number: Number.parseInt(formData.period_number, 10),
      letter: formData.letter.trim().slice(0, 1).toUpperCase(),
      shift: Number.parseInt(formData.shift, 10),
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6" noValidate>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-12">
          <Input
            label="Nombre del grupo"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Ej: 3D"
            error={formErrors.name}
            disabled={isLoading}
            required
            reserveHelperSpace={false}
          />
        </div>

        <div className="md:col-span-12">
          <Select
            label="Carrera"
            options={careerOptions}
            value={formData.career}
            onChange={(e) => handleInputChange('career', e.target.value)}
            error={formErrors.career}
            disabled={isLoading}
            required
            reserveHelperSpace={false}
          />
        </div>

        <div className="md:col-span-6">
          <Input
            label="Periodo"
            type="number"
            min="1"
            value={formData.period_number}
            onChange={(e) => handleInputChange('period_number', e.target.value)}
            placeholder="Ej: 1"
            error={formErrors.period_number}
            disabled={isLoading}
            required
            reserveHelperSpace={false}
          />
        </div>

        <div className="md:col-span-6">
          <Input
            label="Letra del grupo"
            type="text"
            value={formData.letter}
            onChange={handleLetterChange}
            placeholder="Ej: D"
            maxLength={1}
            error={formErrors.letter}
            disabled={isLoading}
            required
            reserveHelperSpace={false}
          />
        </div>

        <div className="md:col-span-12">
          <Select
            label="Turno"
            options={shiftOptions}
            value={formData.shift}
            onChange={(e) => handleInputChange('shift', e.target.value)}
            error={formErrors.shift}
            disabled={isLoading}
            required
            reserveHelperSpace={false}
          />
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

GroupForm.propTypes = {
  initialData: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    career_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    period_number: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    letter: PropTypes.string,
    shift_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  isLoading: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']),
  careerOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
      total_periods: PropTypes.number,
    }),
  ),
  shiftOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
    }),
  ),
};
