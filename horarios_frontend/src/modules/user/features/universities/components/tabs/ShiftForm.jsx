import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Input from '@shared/components/inputs/InputText';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { useShifts } from '../../hooks/useShifts';
import { toApiTime } from '../../utils/universityPayloadUtils';

export const ShiftForm = ({ initialData, onClose }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    start_time: initialData?.start_time ? String(initialData.start_time).slice(0,5) : '07:00',
    end_time: initialData?.end_time ? String(initialData.end_time).slice(0,5) : '14:00',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createShift, updateShift } = useShifts();

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setErrors({ name: 'El nombre es obligatorio' });
      return;
    }
    
    const parseTime = (t) => {
      const [h,m] = t.split(':');
      return parseInt(h)*60 + parseInt(m);
    }
    
    if (parseTime(formData.start_time) >= parseTime(formData.end_time)) {
      toast.error('La hora de fin debe ser posterior a la de inicio');
      return;
    }

    const payload = {
      name: formData.name,
      start_time: toApiTime(formData.start_time),
      end_time: toApiTime(formData.end_time),
    };

    setIsSubmitting(true);
    let success = false;
    if (initialData?.id) {
      success = await updateShift(initialData.id, payload);
    } else {
      success = await createShift(payload);
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
          label="Hora de inicio"
          type="time"
          value={formData.start_time}
          onChange={(e) => setFormData(prev => ({...prev, start_time: e.target.value}))}
          required
        />
        <Input
          label="Hora de fin"
          type="time"
          value={formData.end_time}
          onChange={(e) => setFormData(prev => ({...prev, end_time: e.target.value}))}
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
