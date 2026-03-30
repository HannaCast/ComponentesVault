import React, { useState, useEffect } from 'react';
import Input from '@shared/components/inputs/InputText';
import Textarea from '@shared/components/inputs/Textarea';
import Checkbox from '@shared/components/inputs/Checkbox';
import { ColorSwatchPicker } from '@shared/components/inputs/ColorSwatchPicker';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { SelectableListField } from '@shared/components/inputs/SelectableListField';
import { subjectValidationSchema } from '../validations/subjectValidationSchema';

export const SubjectForm = ({
  initialData = null,
  isLoading = false,
  onSubmit,
  onCancel,
  mode = 'create', // 'create' | 'edit' | 'view'
  careerOptions = [],
  professorOptions = [],
  colorOptions = [],
}) => {
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    code: '',
    description: '',
    hours_per_week: '',
    color: '',
    careers: [],
    professors: [],
    is_mandatory: false,
  });

  const [professorsTemp, setProfessorsTemp] = useState('');
  const [careersTemp, setCareersTemp] = useState('');
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      const parsedColorId = Number(initialData.color_id ?? initialData.color);
      const normalizedCareers = Array.isArray(initialData.careers)
        ? initialData.careers
          .map((career) => {
            if (career && typeof career === 'object') {
              const rawValue = career.id ?? career.value;
              const value = String(rawValue || '').trim();
              const label = career.name ?? career.label ?? value;
              return value ? { value, label: String(label || value) } : null;
            }

            const value = String(career || '').trim();
            return value ? { value, label: value } : null;
          })
          .filter(Boolean)
        : [];

      setFormData({
        name: initialData.name || '',
        short_name: initialData.short_name || '',
        code: initialData.code || '',
        description: initialData.description || '',
        hours_per_week: initialData.hours_per_week || '',
        color: Number.isFinite(parsedColorId) && parsedColorId > 0 ? String(parsedColorId) : '',
        careers: normalizedCareers,
        professors: initialData.professors || [],
        is_mandatory: Number(initialData.is_mandatory) === 1,
      });
    }
  }, [initialData]);

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

  const handleAddCareer = (careerValue = careersTemp, careerLabel = '') => {
    const nextCareer = String(careerValue || '').trim();
    const nextCareerLabel = String(careerLabel || nextCareer).trim();

    if (nextCareer) {
      if (
        formData.careers.some((career) => {
          if (career && typeof career === 'object') {
            return String(career.value) === nextCareer;
          }
          return String(career) === nextCareer;
        })
      ) {
        setCareersTemp('');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        careers: [...prev.careers, { value: nextCareer, label: nextCareerLabel }],
      }));
      setCareersTemp('');
    }
  };

  const handleRemoveCareer = (index) => {
    setFormData((prev) => ({
      ...prev,
      careers: prev.careers.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateCareer = (index, careerValue, careerLabel = '') => {
    const nextCareer = String(careerValue || '').trim();
    const nextCareerLabel = String(careerLabel || nextCareer).trim();

    if (!nextCareer) return;

    setFormData((prev) => {
      const nextCareers = [...prev.careers];
      nextCareers[index] = { value: nextCareer, label: nextCareerLabel };

      return {
        ...prev,
        careers: nextCareers,
      };
    });
  };

  const handleAddProfessor = (professorValue = professorsTemp) => {
    const nextProfessor = String(professorValue || '').trim();

    if (nextProfessor) {
      if (formData.professors.some((professor) => String(professor) === nextProfessor)) {
        setProfessorsTemp('');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        professors: [...prev.professors, nextProfessor],
      }));
      setProfessorsTemp('');
    }
  };

  const handleRemoveProfessor = (index) => {
    setFormData((prev) => ({
      ...prev,
      professors: prev.professors.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateProfessor = (index, professorValue) => {
    const nextProfessor = String(professorValue || '').trim();

    if (!nextProfessor) return;

    setFormData((prev) => {
      const nextProfessors = [...prev.professors];
      nextProfessors[index] = nextProfessor;

      return {
        ...prev,
        professors: nextProfessors,
      };
    });
  };

  const validateForm = async () => {
    try {
      await subjectValidationSchema.validate(formData, {
        abortEarly: false,
        context: { mode },
      });

      setFormErrors({});
      return true;
    } catch (error) {
      const nextErrors = {};

      if (Array.isArray(error?.inner) && error.inner.length > 0) {
        error.inner.forEach((validationError) => {
          if (!validationError?.path || nextErrors[validationError.path]) {
            return;
          }

          nextErrors[validationError.path] = validationError.message;
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

    const submitData = {
      ...formData,
      hours_per_week: Number.parseInt(formData.hours_per_week, 10),
      is_mandatory: formData.is_mandatory ? 1 : 0,
      careers: formData.careers
        .map((career) => {
          if (career && typeof career === 'object') {
            return Number.parseInt(career.value, 10);
          }
          return Number.parseInt(career, 10);
        })
        .filter(Number.isFinite),
    };

    if (formData.color) {
      submitData.color = Number.parseInt(formData.color, 10);
    } else {
      delete submitData.color;
    }

    onSubmit(submitData);
  };

  const isViewMode = mode === 'view';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      {/* Nombre de la Materia */}
      <div>
        <Input
          label="Nombre de la Materia *"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Ej: Administración de Base de Datos"
          error={formErrors.name}
          disabled={isViewMode || isLoading}
          reserveHelperSpace={false}
        />
      </div>

      {/* Nombre Corto y Código */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Nombre Corto *"
          type="text"
          value={formData.short_name}
          onChange={(e) => handleInputChange('short_name', e.target.value)}
          placeholder="Ej: ABD"
          error={formErrors.short_name}
          disabled={isViewMode || isLoading}
          reserveHelperSpace={false}
        />
        <Input
          label="Código *"
          type="text"
          value={formData.code}
          onChange={(e) => handleInputChange('code', e.target.value)}
          placeholder="Ej: ABD-01"
          error={formErrors.code}
          disabled={isViewMode || isLoading}
          reserveHelperSpace={false}
        />
      </div>

      {/* Descripción */}
      <Textarea
        label="Descripción"
        value={formData.description}
        onChange={(e) => handleInputChange('description', e.target.value)}
        placeholder="Descripción de la materia"
        disabled={isViewMode || isLoading}
        rows={4}
        reserveHelperSpace={false}
      />

      {/* Horas por Semana */}
      <Input
        label="Horas por Semana *"
        type="number"
        value={formData.hours_per_week}
        onChange={(e) => handleInputChange('hours_per_week', e.target.value)}
        placeholder="Ej: 4"
        error={formErrors.hours_per_week}
        disabled={isViewMode || isLoading}
        min="0"
        max="168"
        reserveHelperSpace={false}
      />

      {/* Carreras */}
      <SelectableListField
        label="Carreras a las que pertenece esta materia"
        selectedValues={formData.careers}
        options={careerOptions}
        selectedOption={careersTemp}
        onSelectedOptionChange={setCareersTemp}
        onAdd={handleAddCareer}
        onUpdate={handleUpdateCareer}
        onRemove={handleRemoveCareer}
        placeholder="Seleccionar carrera"
        addLabel="Agregar Carrera"
        disabled={isViewMode || isLoading}
      />

      {/* Profesores */}
      <SelectableListField
        label="Profesores que pueden impartir esta materia"
        selectedValues={formData.professors}
        options={professorOptions}
        selectedOption={professorsTemp}
        onSelectedOptionChange={setProfessorsTemp}
        onAdd={handleAddProfessor}
        onUpdate={handleUpdateProfessor}
        onRemove={handleRemoveProfessor}
        placeholder="Seleccionar profesor"
        addLabel="Agregar Profesor"
        disabled={isViewMode || isLoading}
      />

      {/* Color */}
      <ColorSwatchPicker
        label="Color de la Materia"
        value={formData.color}
        onChange={(e) => handleInputChange('color', e.target.value)}
        options={colorOptions}
        disabled={isViewMode || isLoading}
        required={mode === 'create'}
        error={formErrors.color}
        helperText="Selecciona un color visual para identificar la materia"
      />

      {/* Es Obligatoria */}
      <Checkbox
        label="Esta materia es obligatoria"
        checked={formData.is_mandatory}
        onChange={(e) => handleInputChange('is_mandatory', e.target.checked)}
        disabled={isViewMode || isLoading}
        helperText="Marca esta opción si la materia es requerida para los estudiantes, de lo contrario se considerará optativa."
      />

      {/* Botones de Acción */}
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
            label={mode === 'edit' ? 'Guardar Cambios' : 'Crear Materia'}
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
