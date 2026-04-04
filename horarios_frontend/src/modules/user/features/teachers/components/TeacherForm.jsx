import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Input from '@shared/components/inputs/InputText';
import Checkbox from '@shared/components/inputs/Checkbox';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { teacherValidationSchema } from '../validations/teacherValidationSchema';

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

    const trimmedLast = String(formData.last_name || '').trim();
    const payload = {
      name: String(formData.name || '').trim(),
      surname: String(formData.surname || '').trim(),
      require_classroom: formData.require_classroom ? 1 : 0,
    };

    if (trimmedLast) {
      payload.last_name = trimmedLast;
    } else {
      payload.last_name = null;
    }

    onSubmit(payload);
  };

  const isViewMode = mode === 'view';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <div>
        <Input
          label="Nombre *"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Ej: Juan"
          error={formErrors.name}
          disabled={isViewMode || isLoading}
          reserveHelperSpace={false}
        />
      </div>

      <div>
        <Input
          label="Apellido paterno *"
          type="text"
          value={formData.surname}
          onChange={(e) => handleInputChange('surname', e.target.value)}
          placeholder="Ej: Pérez"
          error={formErrors.surname}
          disabled={isViewMode || isLoading}
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
});

TeacherForm.propTypes = {
  initialData: TeacherInitialDataShape,
  isLoading: PropTypes.bool,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  mode: PropTypes.oneOf(['create', 'edit', 'view']),
};
