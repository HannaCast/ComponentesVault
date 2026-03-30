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
  const [careersPeriodTemp, setCareersPeriodTemp] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const getCareerById = (careerId) => {
    const target = String(careerId || '').trim();
    return careerOptions.find((career) => String(career.value) === target) || null;
  };

  const clearCareersError = () => {
    setFormErrors((prev) => {
      if (!prev.careers) {
        return prev;
      }

      return {
        ...prev,
        careers: '',
      };
    });
  };

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
              const periodNumber = Number.parseInt(career.period_number, 10);

              return value
                ? {
                    value,
                    label: String(label || value),
                    period_number: Number.isFinite(periodNumber) && periodNumber > 0
                      ? periodNumber
                      : 1,
                  }
                : null;
            }

            const value = String(career || '').trim();
            return value ? { value, label: value, period_number: 1 } : null;
          })
          .filter(Boolean)
        : [];

      const normalizedProfessors = Array.isArray(initialData.teachers)
        ? initialData.teachers
          .map((teacher) => {
            if (teacher && typeof teacher === 'object') {
              const rawValue = teacher.id ?? teacher.value;
              const value = String(rawValue || '').trim();
              const label = teacher.full_name ?? teacher.name ?? teacher.label ?? value;
              return value ? { value, label: String(label || value) } : null;
            }

            const value = String(teacher || '').trim();
            return value ? { value, label: value } : null;
          })
          .filter(Boolean)
        : Array.isArray(initialData.professors)
          ? initialData.professors
            .map((teacher) => {
              if (teacher && typeof teacher === 'object') {
                const rawValue = teacher.id ?? teacher.value;
                const value = String(rawValue || '').trim();
                const label = teacher.full_name ?? teacher.name ?? teacher.label ?? value;
                return value ? { value, label: String(label || value) } : null;
              }

              const value = String(teacher || '').trim();
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
        professors: normalizedProfessors,
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

  const handleAddCareer = (careerValue = careersTemp, careerLabel = '', periodValue = careersPeriodTemp) => {
    const nextCareer = String(careerValue || '').trim();
    const optionLabel = careerOptions.find((item) => String(item.value) === nextCareer)?.label;
    const nextCareerLabel = String(careerLabel || optionLabel || nextCareer).trim();
    const parsedPeriod = Number.parseInt(String(periodValue || '').trim(), 10);
    const nextPeriodNumber = Number.isFinite(parsedPeriod) && parsedPeriod > 0 ? parsedPeriod : 1;

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
        careers: [
          ...prev.careers,
          {
            value: nextCareer,
            label: nextCareerLabel,
            period_number: nextPeriodNumber,
          },
        ],
      }));
      setCareersTemp('');
      setCareersPeriodTemp('');
      clearCareersError();
    }
  };

  const handleRemoveCareer = (index) => {
    setFormData((prev) => ({
      ...prev,
      careers: prev.careers.filter((_, i) => i !== index),
    }));
    clearCareersError();
  };

  const handleUpdateCareer = (index, careerValue, careerLabel = '', periodValue = 1) => {
    const nextCareer = String(careerValue || '').trim();
    const optionLabel = careerOptions.find((item) => String(item.value) === nextCareer)?.label;
    const nextCareerLabel = String(careerLabel || optionLabel || nextCareer).trim();
    const parsedPeriod = Number.parseInt(String(periodValue || '').trim(), 10);
    const nextPeriodNumber = Number.isFinite(parsedPeriod) && parsedPeriod > 0 ? parsedPeriod : 1;

    if (!nextCareer) return;

    setFormData((prev) => {
      const nextCareers = [...prev.careers];
      nextCareers[index] = {
        value: nextCareer,
        label: nextCareerLabel,
        period_number: nextPeriodNumber,
      };

      return {
        ...prev,
        careers: nextCareers,
      };
    });
    clearCareersError();
  };

  const handleAddProfessor = (professorValue = professorsTemp) => {
    const nextProfessor = String(professorValue || '').trim();
    const nextProfessorLabel = String(
      professorOptions.find((item) => String(item.value) === nextProfessor)?.label || nextProfessor,
    ).trim();

    if (nextProfessor) {
      if (
        formData.professors.some((professor) => {
          if (professor && typeof professor === 'object') {
            return String(professor.value) === nextProfessor;
          }
          return String(professor) === nextProfessor;
        })
      ) {
        setProfessorsTemp('');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        professors: [...prev.professors, { value: nextProfessor, label: nextProfessorLabel }],
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

  const handleUpdateProfessor = (index, professorValue, professorLabel = '') => {
    const nextProfessor = String(professorValue || '').trim();
    const optionLabel = professorOptions.find((item) => String(item.value) === nextProfessor)?.label;
    const nextProfessorLabel = String(professorLabel || optionLabel || nextProfessor).trim();

    if (!nextProfessor) return;

    setFormData((prev) => {
      const nextProfessors = [...prev.professors];
      nextProfessors[index] = { value: nextProfessor, label: nextProfessorLabel };

      return {
        ...prev,
        professors: nextProfessors,
      };
    });
  };

  const validateForm = async (dataToValidate = formData) => {
    try {
      await subjectValidationSchema.validate(dataToValidate, {
        abortEarly: false,
        context: { mode },
      });

      for (const career of dataToValidate.careers) {
        if (!career || typeof career !== 'object') {
          continue;
        }

        const selectedCareer = getCareerById(career.value);
        const maxPeriods = Number.parseInt(selectedCareer?.total_periods, 10);
        const periodNumber = Number.parseInt(career.period_number, 10);

        if (
          Number.isFinite(maxPeriods)
          && maxPeriods > 0
          && Number.isFinite(periodNumber)
          && periodNumber > maxPeriods
        ) {
          setFormErrors({
            careers: (
              `El periodo para ${selectedCareer?.label || 'la carrera seleccionada'} `
              + `no puede ser mayor a ${maxPeriods}.`
            ),
          });
          return false;
        }
      }

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

    // Auto-attach pending selections so users don't lose a selected item if they skip "Agregar".
    const effectiveCareers = [...formData.careers];
    const pendingCareer = String(careersTemp || '').trim();
    if (pendingCareer && !effectiveCareers.some((row) => String(row?.value) === pendingCareer)) {
      const parsedPeriod = Number.parseInt(String(careersPeriodTemp || '').trim(), 10);
      const optionLabel = careerOptions.find((item) => String(item.value) === pendingCareer)?.label;

      effectiveCareers.push({
        value: pendingCareer,
        label: String(optionLabel || pendingCareer),
        period_number: Number.isFinite(parsedPeriod) && parsedPeriod > 0 ? parsedPeriod : 1,
      });
    }

    const effectiveProfessors = [...formData.professors];
    const pendingProfessor = String(professorsTemp || '').trim();
    if (pendingProfessor && !effectiveProfessors.some((row) => String(row?.value) === pendingProfessor)) {
      const optionLabel = professorOptions.find((item) => String(item.value) === pendingProfessor)?.label;
      effectiveProfessors.push({
        value: pendingProfessor,
        label: String(optionLabel || pendingProfessor),
      });
    }

    const effectiveFormData = {
      ...formData,
      careers: effectiveCareers,
      professors: effectiveProfessors,
    };

    if (!(await validateForm(effectiveFormData))) {
      return;
    }

    const submitData = {
      ...effectiveFormData,
      hours_per_week: Number.parseInt(effectiveFormData.hours_per_week, 10),
      is_mandatory: effectiveFormData.is_mandatory ? 1 : 0,
      careers: effectiveFormData.careers
        .map((career) => {
          if (career && typeof career === 'object') {
            const careerId = Number.parseInt(career.value, 10);
            const periodNumber = Number.parseInt(career.period_number, 10);

            if (!Number.isFinite(careerId)) {
              return null;
            }

            return {
              career_id: careerId,
              period_number: Number.isFinite(periodNumber) && periodNumber > 0
                ? periodNumber
                : 1,
            };
          }
          const careerId = Number.parseInt(career, 10);
          if (!Number.isFinite(careerId)) {
            return null;
          }

          return {
            career_id: careerId,
            period_number: 1,
          };
        })
        .filter(Boolean),
      teachers: effectiveFormData.professors
        .map((professor) => {
          if (professor && typeof professor === 'object') {
            const teacherId = Number.parseInt(professor.value, 10);
            if (!Number.isFinite(teacherId)) {
              return null;
            }
            return { teacher_id: teacherId };
          }

          const teacherId = Number.parseInt(professor, 10);
          if (!Number.isFinite(teacherId)) {
            return null;
          }
          return { teacher_id: teacherId };
        })
        .filter(Boolean),
    };

    delete submitData.professors;

    if (effectiveFormData.color) {
      submitData.color = Number.parseInt(effectiveFormData.color, 10);
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
        error={formErrors.careers}
        selectedValues={formData.careers}
        options={careerOptions}
        selectedOption={careersTemp}
        selectedSecondaryOption={careersPeriodTemp}
        onSelectedOptionChange={setCareersTemp}
        onSelectedSecondaryOptionChange={setCareersPeriodTemp}
        onAdd={handleAddCareer}
        onUpdate={handleUpdateCareer}
        onRemove={handleRemoveCareer}
        placeholder="Seleccionar carrera"
        addLabel="Agregar Carrera"
        enableSecondaryField
        primaryLabel="Carrera"
        secondaryLabel="Periodo"
        secondaryPlaceholder="1"
        secondaryType="number"
        secondaryMin={1}
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
