import React, { useState, useEffect } from 'react';
import Input from '@shared/components/inputs/InputText';
import Textarea from '@shared/components/inputs/Textarea';
import Checkbox from '@shared/components/inputs/Checkbox';
import { Select } from '@shared/components/inputs/Select';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { SelectableListField } from '@shared/components/inputs/SelectableListField';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    if (initialData) {
      const parsedColorId = Number(initialData.color_id ?? initialData.color);

      setFormData({
        name: initialData.name || '',
        short_name: initialData.short_name || '',
        code: initialData.code || '',
        description: initialData.description || '',
        hours_per_week: initialData.hours_per_week || '',
        color: Number.isFinite(parsedColorId) && parsedColorId > 0 ? String(parsedColorId) : '',
        careers: initialData.careers || [],
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
  };

  const handleAddCareer = (careerValue = careersTemp) => {
    const nextCareer = String(careerValue || '').trim();

    if (nextCareer) {
      if (formData.careers.some((career) => String(career) === nextCareer)) {
        setCareersTemp('');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        careers: [...prev.careers, nextCareer],
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

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('El nombre de la materia es requerido');
      return false;
    }
    if (!formData.code.trim()) {
      toast.error('El código es requerido');
      return false;
    }
    if (!formData.short_name.trim()) {
      toast.error('El nombre corto es requerido');
      return false;
    }
    if (!formData.hours_per_week || Number(formData.hours_per_week) <= 0) {
      toast.error('Las horas por semana son requeridas y deben ser mayores a 0');
      return false;
    }
    if (mode === 'create' && !formData.color) {
      toast.error('Debes seleccionar un color');
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      hours_per_week: Number.parseInt(formData.hours_per_week, 10),
      is_mandatory: formData.is_mandatory ? 1 : 0,
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
          disabled={isViewMode || isLoading}
          reserveHelperSpace={false}
        />
        <Input
          label="Código *"
          type="text"
          value={formData.code}
          onChange={(e) => handleInputChange('code', e.target.value)}
          placeholder="Ej: ABD-01"
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
        onRemove={handleRemoveProfessor}
        placeholder="Seleccionar profesor"
        addLabel="Agregar Profesor"
        disabled={isViewMode || isLoading}
      />

      {/* Color */}
      <Select
        label="Color de la Materia *"
        value={formData.color}
        onChange={(e) => handleInputChange('color', e.target.value)}
        options={colorOptions}
        placeholder="Selecciona un color"
        disabled={isViewMode || isLoading}
        reserveHelperSpace={false}
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
