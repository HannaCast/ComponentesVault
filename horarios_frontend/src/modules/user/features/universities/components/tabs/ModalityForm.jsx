import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Input from '@shared/components/inputs/InputText';
import Checkbox from '@shared/components/inputs/Checkbox';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { useModalities } from '../../hooks/useModalities';

const WEEKDAYS = [
  { day: 1, label: 'L' },
  { day: 2, label: 'Ma' },
  { day: 3, label: 'Mi' },
  { day: 4, label: 'J' },
  { day: 5, label: 'V' },
  { day: 6, label: 'S' },
  { day: 7, label: 'D' },
];

export const ModalityForm = ({ initialData, onClose }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    classroom_days_per_week: initialData?.configurations?.classroom_days_per_week ?? 0,
    allowed_days: initialData?.configurations?.allowed_days ? [...initialData.configurations.allowed_days] : [1,2,3,4,5],
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createModality, updateModality } = useModalities();

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setErrors({ name: 'El nombre es obligatorio' });
      return;
    }
    if (formData.classroom_days_per_week > formData.allowed_days.length) {
      toast.error('Días con salón no puede superar días permitidos');
      return;
    }

    const payload = {
      name: formData.name,
      require_classroom: formData.classroom_days_per_week > 0 ? 1 : 0,
      configurations: {
        classroom_days_per_week: Number(formData.classroom_days_per_week),
        allowed_days: formData.allowed_days.sort((a,b)=>a-b),
      }
    };

    setIsSubmitting(true);
    let success = false;
    if (initialData?.id) {
      success = await updateModality(initialData.id, payload);
    } else {
      success = await createModality(payload);
    }

    if (success) {
      onClose();
    } else {
      setIsSubmitting(false);
    }
  };

  const toggleDay = (day) => {
    setFormData(prev => {
      const set = new Set(prev.allowed_days);
      if (set.has(day)) set.delete(day);
      else set.add(day);
      return { ...prev, allowed_days: [...set] };
    });
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
      <Input
        label="Días con salón por semana"
        type="number"
        min={0}
        max={7}
        value={formData.classroom_days_per_week}
        onChange={(e) => setFormData(prev => ({...prev, classroom_days_per_week: e.target.value}))}
        required
      />
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[var(--text-primary)]">
          Días permitidos para programar clases
        </label>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((d) => (
            <div
              key={d.day}
              role="button"
              tabIndex={0}
              className={`flex h-10 w-10 items-center justify-center rounded-xl font-medium transition-colors ${
                formData.allowed_days.includes(d.day)
                  ? 'bg-[var(--accent,#2563eb)] text-white shadow-sm'
                  : 'bg-[var(--bg-surface,#f1f5f9)] text-[var(--text-secondary,#64748b)] hover:bg-[var(--bg-surface-hover,#e2e8f0)]'
              }`}
              onClick={() => toggleDay(d.day)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleDay(d.day);
                }
              }}
            >
              {d.label}
            </div>
          ))}
        </div>
      </div>
      <div className="pt-4 flex justify-end gap-3">
        <ActionButton label="Cancelar" variant="secondary" onClick={onClose} disabled={isSubmitting} />
        <ActionButton label="Guardar" variant="primary" onClick={handleSave} loading={isSubmitting} />
      </div>
    </div>
  );
};
