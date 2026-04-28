import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Input from '@shared/components/inputs/InputText';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { useAcademicPeriods } from '../../hooks/useAcademicPeriods';

export const PeriodForm = ({ initialData, onClose }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    fecha_inicio: initialData?.start_date ? String(initialData.start_date).slice(0, 10) : '',
    fecha_fin: initialData?.end_date ? String(initialData.end_date).slice(0, 10) : '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createPeriod, updatePeriod } = useAcademicPeriods();

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setErrors({ name: 'El nombre es obligatorio' });
      return;
    }
    if (!formData.fecha_inicio || !formData.fecha_fin) {
      toast.error('Las fechas son obligatorias');
      return;
    }

    const start = new Date(`${formData.fecha_inicio}T12:00:00`);
    const end = new Date(`${formData.fecha_fin}T12:00:00`);
    if (end < start) {
      toast.error('La fecha de fin no puede ser anterior a la de inicio');
      return;
    }

    const payload = {
      name: formData.name,
      start_date: formData.fecha_inicio,
      end_date: formData.fecha_fin,
      year: start.getFullYear(),
      is_active: initialData ? initialData.is_active : 0, // En creación default 0
    };

    setIsSubmitting(true);
    let success = false;
    if (initialData?.id) {
      success = await updatePeriod(initialData.id, payload);
    } else {
      success = await createPeriod(payload);
    }

    if (success) {
      onClose();
    } else {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <Input
        label="Nombre"
        value={formData.name}
        onChange={(e) => {
          setFormData(prev => ({...prev, name: e.target.value}));
          setErrors({});
        }}
        error={errors.name}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Fecha de inicio"
          type="date"
          value={formData.fecha_inicio}
          onChange={(e) => setFormData(prev => ({...prev, fecha_inicio: e.target.value}))}
          required
        />
        <Input
          label="Fecha de fin"
          type="date"
          value={formData.fecha_fin}
          onChange={(e) => setFormData(prev => ({...prev, fecha_fin: e.target.value}))}
          required
        />
      </div>
      
      <div className="pt-4 flex justify-end gap-3">
        <ActionButton label="Cancelar" variant="secondary" onClick={onClose} disabled={isSubmitting} />
        <ActionButton label="Guardar" variant="primary" onClick={handleSave} loading={isSubmitting} />
      </div>
    </div>
  );
};
