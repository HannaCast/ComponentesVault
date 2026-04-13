import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Trash2 } from 'lucide-react';
import Input from '@shared/components/inputs/InputText';
import { Select } from '@shared/components/inputs/Select';
import Checkbox from '@shared/components/inputs/Checkbox';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { classroomValidationSchema } from '../validations/classroomValidationSchema';

const createDefaultFormData = () => ({
  name: '',
  classroom_type: '',
  code: '',
  floor: '',
  building: '',
  building_code: '',
  is_restricted: false,
  /** Restricción por materias (generador de horarios); sin UI aún: se conserva al editar. */
  is_restricted_to_subjects: false,
});

const resolveClassroomTypeValue = (initialData, typeOptions) => {
  if (!initialData) return '';

  if (initialData.classroom_type_id != null && initialData.classroom_type_id !== '') {
    return String(initialData.classroom_type_id);
  }

  const name = initialData.classroom_type;
  if (!name || !Array.isArray(typeOptions)) return '';

  const match = typeOptions.find((opt) => String(opt.label) === String(name));
  return match ? String(match.value) : '';
};

export const ClassroomForm = ({
  initialData = null,
  isLoading = false,
  onSubmit,
  onCancel,
  mode = 'create',
  typeOptions = [],
  careerOptions = [],
  classroomId = null,
  classroomCareers = [],
  classroomCareersLoading = false,
  onAddClassroomCareer,
  onRemoveClassroomCareer,
}) => {
  const [formData, setFormData] = useState(createDefaultFormData);
  const [formErrors, setFormErrors] = useState({});
  const [pendingCareers, setPendingCareers] = useState([]);
  const [careerToAdd, setCareerToAdd] = useState('');
  const [linkBusyId, setLinkBusyId] = useState(null);
  const previousModeRef = useRef(mode);

  useEffect(() => {
    if (!initialData) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- alinear formulario con datos al editar
    setFormData({
      name: initialData.name || '',
      classroom_type: resolveClassroomTypeValue(initialData, typeOptions),
      code: initialData.code || '',
      floor:
        initialData.floor != null && initialData.floor !== ''
          ? String(initialData.floor)
          : '',
      building: initialData.building || '',
      building_code: initialData.building_code || '',
      is_restricted: Number(initialData.is_restricted) === 1,
      is_restricted_to_subjects: Number(initialData.is_restricted_to_subjects) === 1,
    });
  }, [initialData, typeOptions]);

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
      setPendingCareers([]);
      setCareerToAdd('');
    }
  }, [mode, initialData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === 'is_restricted' && !value) {
      setPendingCareers([]);
      setCareerToAdd('');
    }

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

  const handleAddPendingCareer = () => {
    const id = String(careerToAdd || '').trim();
    if (!id) return;

    if (pendingCareers.some((p) => String(p.careerId) === id)) {
      setCareerToAdd('');
      return;
    }

    const label = careerOptions.find((o) => String(o.value) === id)?.label || id;
    setPendingCareers((prev) => [...prev, { careerId: id, label }]);
    setCareerToAdd('');
  };

  const handleRemovePendingCareer = (careerId) => {
    setPendingCareers((prev) => prev.filter((p) => String(p.careerId) !== String(careerId)));
  };

  const handleAddLinkedCareer = async () => {
    const id = String(careerToAdd || '').trim();
    if (!classroomId || !id) return;

    const numericId = Number.parseInt(id, 10);
    if (!Number.isFinite(numericId)) return;

    if (classroomCareers.some((row) => Number(row.careers) === numericId)) {
      setCareerToAdd('');
      return;
    }

    setLinkBusyId('add');
    const ok = await onAddClassroomCareer({
      classroomId,
      careerId: numericId,
    });
    setLinkBusyId(null);
    if (ok) {
      setCareerToAdd('');
    }
  };

  const handleRemoveLinkedCareer = async (row) => {
    if (!classroomId || !row?.id) return;
    setLinkBusyId(row.id);
    await onRemoveClassroomCareer(row.id, classroomId);
    setLinkBusyId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const values = {
      ...formData,
      floor:
        formData.floor === ''
          ? ''
          : Number.parseInt(formData.floor, 10),
      is_restricted: Boolean(formData.is_restricted),
    };

    try {
      await classroomValidationSchema.validate(values, { abortEarly: false });
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

    const hasRestrictedCareers = classroomId
      ? classroomCareers.length > 0
      : pendingCareers.length > 0;

    if (formData.is_restricted && !hasRestrictedCareers) {
      setFormErrors((prev) => ({
        ...prev,
        restricted_careers: 'Si el aula es restringida, agrega al menos una carrera con acceso.',
      }));
      return;
    }

    setFormErrors((prev) => {
      if (!prev.restricted_careers) return prev;
      const next = { ...prev };
      delete next.restricted_careers;
      return next;
    });

    const payload = {
      name: formData.name.trim(),
      classroom_type: Number.parseInt(formData.classroom_type, 10),
      floor: Number.parseInt(formData.floor, 10),
      building_code: formData.building_code.trim(),
      is_restricted: formData.is_restricted ? 1 : 0,
      is_restricted_to_subjects: formData.is_restricted_to_subjects ? 1 : 0,
    };

    const code = formData.code.trim();
    if (code) {
      payload.code = code;
    }

    const building = formData.building.trim();
    if (building) {
      payload.building = building;
    }

    if (formData.is_restricted) {
      const careerIds = classroomId
        ? classroomCareers
          .map((row) => Number(row.careers))
          .filter((id) => Number.isFinite(id))
        : pendingCareers.map((p) => Number.parseInt(p.careerId, 10));
      payload.careers = careerIds;
    }

    onSubmit(payload);
  };

  const showRestrictedSection = formData.is_restricted;
  const careerSelectOptions = careerOptions.filter((opt) => {
    if (!classroomId) {
      return !pendingCareers.some((p) => String(p.careerId) === String(opt.value));
    }
    return !classroomCareers.some((row) => Number(row.careers) === Number(opt.value));
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6" noValidate>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-6">
          <Input
            label="Nombre de la aula"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Ej: A1"
            error={formErrors.name}
            disabled={isLoading}
            required
            reserveHelperSpace={false}
          />
        </div>

        <div className="md:col-span-6">
          <Select
            label="Tipo de aula"
            options={typeOptions}
            value={formData.classroom_type}
            onChange={(e) => handleInputChange('classroom_type', e.target.value)}
            placeholder="Selecciona un tipo de aula"
            error={formErrors.classroom_type}
            disabled={isLoading}
            required
            reserveHelperSpace={false}
          />
        </div>

        <div className="md:col-span-6">
          <Input
            label="Código"
            type="text"
            value={formData.code}
            onChange={(e) => handleInputChange('code', e.target.value)}
            placeholder="Ej: A1-01"
            error={formErrors.code}
            disabled={isLoading}
            reserveHelperSpace={false}
          />
        </div>

        <div className="md:col-span-6">
          <Input
            label="Número de piso"
            type="number"
            min="0"
            value={formData.floor}
            onChange={(e) => handleInputChange('floor', e.target.value)}
            placeholder="Ej: 1"
            error={formErrors.floor}
            disabled={isLoading}
            required
            reserveHelperSpace={false}
          />
        </div>

        <div className="md:col-span-6">
          <Input
            label="Edificio"
            type="text"
            value={formData.building}
            onChange={(e) => handleInputChange('building', e.target.value)}
            placeholder="Ej: Edificio A"
            error={formErrors.building}
            disabled={isLoading}
            reserveHelperSpace={false}
          />
        </div>

        <div className="md:col-span-6">
          <Input
            label="Código del edificio"
            type="text"
            value={formData.building_code}
            onChange={(e) => handleInputChange('building_code', e.target.value)}
            placeholder="Ej: D1"
            error={formErrors.building_code}
            disabled={isLoading}
            required
            reserveHelperSpace={false}
          />
        </div>

        <div className="md:col-span-12">
          <Checkbox
            label="Restringida a carreras específicas"
            checked={formData.is_restricted}
            onChange={(e) => handleInputChange('is_restricted', e.target.checked)}
            disabled={isLoading}
          />
        </div>

        {showRestrictedSection && (
          <div className="md:col-span-12 space-y-3 pt-2 border-t border-dashed border-[var(--border-default)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Carreras con acceso
              </span>
              <button
                type="button"
                className="text-sm font-medium text-[var(--accent,#2563eb)] hover:underline disabled:opacity-50"
                onClick={classroomId ? handleAddLinkedCareer : handleAddPendingCareer}
                disabled={
                  isLoading
                  || classroomCareersLoading
                  || linkBusyId != null
                  || !careerToAdd
                }
              >
                + Agregar Carrera
              </button>
            </div>

            <Select
              label=""
              options={careerSelectOptions}
              value={careerToAdd}
              onChange={(e) => setCareerToAdd(e.target.value)}
              placeholder="Selecciona una carrera"
              disabled={isLoading || classroomCareersLoading}
              reserveHelperSpace={false}
            />

            {formErrors.restricted_careers && (
              <p className="text-xs" style={{ color: 'var(--error, #dc2626)' }}>
                {formErrors.restricted_careers}
              </p>
            )}

            <div className="min-h-[2.5rem] rounded-lg border border-[var(--border-default)] p-3 bg-[var(--bg-surface)]">
              {classroomId && classroomCareersLoading ? (
                <p className="text-sm text-[var(--text-secondary)]">Cargando carreras…</p>
              ) : classroomId ? (
                classroomCareers.length === 0 ? (
                  <p className="text-sm italic text-[var(--text-tertiary)]">
                    No hay carreras asignadas
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {classroomCareers.map((row) => (
                      <li
                        key={row.id}
                        className="flex items-center justify-between gap-2 text-sm text-[var(--text-primary)]"
                      >
                        <span>{row.career_name || '—'}</span>
                        <button
                          type="button"
                          className="p-1 rounded text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--error,#dc2626)]"
                          onClick={() => handleRemoveLinkedCareer(row)}
                          disabled={linkBusyId != null}
                          aria-label="Quitar carrera"
                        >
                          {linkBusyId === row.id ? (
                            <span className="text-xs">…</span>
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )
              ) : pendingCareers.length === 0 ? (
                <p className="text-sm italic text-[var(--text-tertiary)]">
                  Se guardarán al crear el aula
                </p>
              ) : (
                <ul className="space-y-2">
                  {pendingCareers.map((row) => (
                    <li
                      key={row.careerId}
                      className="flex items-center justify-between gap-2 text-sm text-[var(--text-primary)]"
                    >
                      <span>{row.label}</span>
                      <button
                        type="button"
                        className="p-1 rounded text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--error,#dc2626)]"
                        onClick={() => handleRemovePendingCareer(row.careerId)}
                        aria-label="Quitar carrera"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
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

ClassroomForm.propTypes = {
  initialData: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    classroom_type_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    code: PropTypes.string,
    floor: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    building: PropTypes.string,
    building_code: PropTypes.string,
    is_restricted: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
  }),
  isLoading: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']),
  typeOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
    }),
  ),
  careerOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
    }),
  ),
  classroomId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  classroomCareers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      careers: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      career_name: PropTypes.string,
    }),
  ),
  classroomCareersLoading: PropTypes.bool,
  onAddClassroomCareer: PropTypes.func,
  onRemoveClassroomCareer: PropTypes.func,
};
