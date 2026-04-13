import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Input from '@shared/components/inputs/InputText';
import Textarea from '@shared/components/inputs/Textarea';
import Checkbox from '@shared/components/inputs/Checkbox';
import { ColorSwatchPicker } from '@shared/components/inputs/ColorSwatchPicker';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { SelectableListField } from '@shared/components/inputs/SelectableListField';
import { subjectValidationSchema } from '../validations/subjectValidationSchema';

const getFirstColorValue = (options = []) => {
  const firstColorValue = options[0]?.value;
  if (firstColorValue === undefined || firstColorValue === null) {
    return '';
  }

  return String(firstColorValue);
};

const normalizeOptionLabel = (value) => String(value || '').trim().toLowerCase();

const getDefaultClassroomTypeOption = (options = []) => {
  const source = Array.isArray(options) ? options : [];
  const aulaOption = source.find((option) => normalizeOptionLabel(option?.label) === 'aula');

  if (!aulaOption) {
    return null;
  }

  return {
    value: String(aulaOption.value),
    label: String(aulaOption.label || 'Aula'),
  };
};

const createDefaultFormData = (defaultColor = '', defaultClassroomTypeOption = null) => ({
  name: '',
  short_name: '',
  code: '',
  description: '',
  hours_per_week: '',
  color: defaultColor,
  careers: [],
  professors: [],
  classroom_types: defaultClassroomTypeOption ? [defaultClassroomTypeOption] : [],
  is_mandatory: true,
});

export const SubjectForm = ({
  initialData = null,
  isLoading = false,
  onSubmit,
  onCancel,
  mode = 'create', // 'create' | 'edit' | 'view'
  careerOptions = [],
  professorOptions = [],
  colorOptions = [],
  classroomTypeOptions = [],
}) => {
  const [formData, setFormData] = useState(() => createDefaultFormData(
    getFirstColorValue(colorOptions),
    getDefaultClassroomTypeOption(classroomTypeOptions)
  ));

  const [professorsTemp, setProfessorsTemp] = useState('');
  const [classroomTypesTemp, setClassroomTypesTemp] = useState('');
  const [careersTemp, setCareersTemp] = useState('');
  const [careersPeriodTemp, setCareersPeriodTemp] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const previousModeRef = useRef(mode);

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

      let professorSource = [];
      if (Array.isArray(initialData.teachers)) {
        professorSource = initialData.teachers;
      } else if (Array.isArray(initialData.professors)) {
        professorSource = initialData.professors;
      }

      const normalizedProfessors = professorSource
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
        .filter(Boolean);

      const normalizedClassroomTypes = Array.isArray(initialData.classroom_types)
        ? initialData.classroom_types
          .map((classroomType) => {
            if (classroomType && typeof classroomType === 'object') {
              const rawValue = classroomType.id ?? classroomType.classroom_type_id ?? classroomType.value;
              const value = String(rawValue || '').trim();
              const label = classroomType.name ?? classroomType.label ?? value;
              return value ? { value, label: String(label || value) } : null;
            }

            const value = String(classroomType || '').trim();
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
        classroom_types: normalizedClassroomTypes,
        is_mandatory: Number(initialData.is_mandatory) === 1,
      });
    }
  }, [initialData]);

  useEffect(() => {
    const previousMode = previousModeRef.current;
    const enteringCreateMode = mode === 'create' && previousMode !== 'create';
    previousModeRef.current = mode;

    if (mode !== 'create' || initialData) {
      return;
    }

    const firstColorValue = getFirstColorValue(colorOptions);
    const defaultClassroomTypeOption = getDefaultClassroomTypeOption(classroomTypeOptions);

    if (enteringCreateMode) {
      setFormData(createDefaultFormData(firstColorValue, defaultClassroomTypeOption));
      return;
    }

    setFormData((prev) => {
      let changed = false;
      const next = { ...prev };

      if (!next.color && firstColorValue) {
        next.color = firstColorValue;
        changed = true;
      }

      if (
        defaultClassroomTypeOption
        && (!Array.isArray(next.classroom_types) || next.classroom_types.length === 0)
      ) {
        next.classroom_types = [defaultClassroomTypeOption];
        changed = true;
      }

      if (!changed) {
        return prev;
      }

      return next;
    });
  }, [mode, initialData, colorOptions, classroomTypeOptions]);

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

  const handleAddClassroomType = (classroomTypeValue = classroomTypesTemp) => {
    const nextClassroomType = String(classroomTypeValue || '').trim();
    const nextClassroomTypeLabel = String(
      classroomTypeOptions.find((item) => String(item.value) === nextClassroomType)?.label
      || nextClassroomType,
    ).trim();

    if (!nextClassroomType) {
      return;
    }

    if (
      formData.classroom_types.some((classroomType) => {
        if (classroomType && typeof classroomType === 'object') {
          return String(classroomType.value) === nextClassroomType;
        }
        return String(classroomType) === nextClassroomType;
      })
    ) {
      setClassroomTypesTemp('');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      classroom_types: [
        ...prev.classroom_types,
        {
          value: nextClassroomType,
          label: nextClassroomTypeLabel,
        },
      ],
    }));
    setClassroomTypesTemp('');
  };

  const handleRemoveClassroomType = (index) => {
    setFormData((prev) => ({
      ...prev,
      classroom_types: prev.classroom_types.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateClassroomType = (index, classroomTypeValue, classroomTypeLabel = '') => {
    const nextClassroomType = String(classroomTypeValue || '').trim();
    const optionLabel = classroomTypeOptions.find((item) => String(item.value) === nextClassroomType)?.label;
    const nextClassroomTypeLabel = String(classroomTypeLabel || optionLabel || nextClassroomType).trim();

    if (!nextClassroomType) return;

    setFormData((prev) => {
      const nextClassroomTypes = [...prev.classroom_types];
      nextClassroomTypes[index] = {
        value: nextClassroomType,
        label: nextClassroomTypeLabel,
      };

      return {
        ...prev,
        classroom_types: nextClassroomTypes,
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

    const effectiveClassroomTypes = [...formData.classroom_types];
    const pendingClassroomType = String(classroomTypesTemp || '').trim();
    if (
      pendingClassroomType
      && !effectiveClassroomTypes.some((row) => String(row?.value) === pendingClassroomType)
    ) {
      const optionLabel = classroomTypeOptions.find((item) => String(item.value) === pendingClassroomType)?.label;
      effectiveClassroomTypes.push({
        value: pendingClassroomType,
        label: String(optionLabel || pendingClassroomType),
      });
    }

    const effectiveFormData = {
      ...formData,
      careers: effectiveCareers,
      professors: effectiveProfessors,
      classroom_types: effectiveClassroomTypes,
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
      classroom_types: effectiveFormData.classroom_types
        .map((classroomType) => {
          if (classroomType && typeof classroomType === 'object') {
            const classroomTypeId = Number.parseInt(classroomType.value, 10);
            if (!Number.isFinite(classroomTypeId)) {
              return null;
            }
            return { classroom_type_id: classroomTypeId };
          }

          const classroomTypeId = Number.parseInt(classroomType, 10);
          if (!Number.isFinite(classroomTypeId)) {
            return null;
          }
          return { classroom_type_id: classroomTypeId };
        })
        .filter(Boolean),
    };

    submitData.is_restricted_to_classroom_types = submitData.classroom_types.length > 0 ? 1 : 0;

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
          label="Nombre de la Materia"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Ej: Administración de Base de Datos"
          error={formErrors.name}
          disabled={isViewMode || isLoading}
          reserveHelperSpace={false}
          required
        />
      </div>

      {/* Nombre Corto y Código */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Nombre Corto"
          type="text"
          value={formData.short_name}
          onChange={(e) => handleInputChange('short_name', e.target.value)}
          placeholder="Ej: ABD"
          error={formErrors.short_name}
          disabled={isViewMode || isLoading}
          reserveHelperSpace={false}
          required
        />
        <Input
          label="Código"
          type="text"
          value={formData.code}
          onChange={(e) => handleInputChange('code', e.target.value)}
          placeholder="Ej: ABD-01"
          error={formErrors.code}
          disabled={isViewMode || isLoading}
          reserveHelperSpace={false}
          required
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
        label="Horas por Semana"
        type="number"
        value={formData.hours_per_week}
        onChange={(e) => handleInputChange('hours_per_week', e.target.value)}
        placeholder="Ej: 4"
        error={formErrors.hours_per_week}
        disabled={isViewMode || isLoading}
        min="0"
        max="168"
        reserveHelperSpace={false}
        required
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

      {/* Tipos de aula */}
      <SelectableListField
        label="Tipos de aula permitidos para esta materia"
        infoMessage="Si agregas uno o mas tipos de aula, la materia quedara restringida a esos salones. Por defecto se agrega Aula cuando esta disponible."
        selectedValues={formData.classroom_types}
        options={classroomTypeOptions}
        selectedOption={classroomTypesTemp}
        onSelectedOptionChange={setClassroomTypesTemp}
        onAdd={handleAddClassroomType}
        onUpdate={handleUpdateClassroomType}
        onRemove={handleRemoveClassroomType}
        placeholder="Seleccionar tipo de aula"
        addLabel="Agregar Tipo de Aula"
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

const SubjectOptionShape = PropTypes.shape({
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string,
});

const SubjectInitialDataShape = PropTypes.shape({
  name: PropTypes.string,
  short_name: PropTypes.string,
  code: PropTypes.string,
  description: PropTypes.string,
  hours_per_week: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  color_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  color: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  is_mandatory: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
  careers: PropTypes.array,
  teachers: PropTypes.array,
  professors: PropTypes.array,
  classroom_types: PropTypes.array,
});

SubjectForm.propTypes = {
  initialData: SubjectInitialDataShape,
  isLoading: PropTypes.bool,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  mode: PropTypes.oneOf(['create', 'edit', 'view']),
  careerOptions: PropTypes.arrayOf(SubjectOptionShape),
  professorOptions: PropTypes.arrayOf(SubjectOptionShape),
  classroomTypeOptions: PropTypes.arrayOf(SubjectOptionShape),
  colorOptions: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string,
    hex: PropTypes.string,
  })),
};
