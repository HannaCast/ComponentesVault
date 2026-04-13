import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Input from '@shared/components/inputs/InputText';
import { Select } from '@shared/components/inputs/Select';
import { CascadingSelectableListField } from '@shared/components/inputs/CascadingSelectableListField';
import { SelectableListField } from '@shared/components/inputs/SelectableListField';
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

const normalizeInitialSubjects = (subjects) => {
  if (!Array.isArray(subjects)) {
    return [];
  }

  return subjects
    .map((subject) => {
      if (!subject || typeof subject !== 'object') {
        return null;
      }

      const id = subject.id ?? subject.subject_id ?? subject.value;
      const subjectId = String(id || '').trim();
      if (!subjectId) {
        return null;
      }

      const name = String(subject.name || '').trim();
      const code = String(subject.code || '').trim();

      return {
        subjectId,
        label: code ? `${name} (${code})` : name || subjectId,
        name,
        code,
      };
    })
    .filter(Boolean);
};

const collectValidationErrors = (validationError) => {
  if (!validationError?.inner) {
    return null;
  }

  const nextErrors = {};
  validationError.inner.forEach((err) => {
    if (err.path && !nextErrors[err.path]) {
      nextErrors[err.path] = err.message;
    }
  });
  return nextErrors;
};

const removeFieldError = (setFormErrors, field) => {
  setFormErrors((prev) => {
    if (!prev[field]) {
      return prev;
    }
    const next = { ...prev };
    delete next[field];
    return next;
  });
};

const resolveRestrictedCareerIds = ({ classroomId, classroomCareers, pendingCareers }) => {
  if (classroomId) {
    return classroomCareers
      .map((row) => Number(row.careers))
      .filter((id) => Number.isFinite(id));
  }

  return pendingCareers
    .map((career) => Number.parseInt(career.careerId, 10))
    .filter((id) => Number.isFinite(id));
};

const resolveRestrictedSubjectIds = (pendingSubjects) => Array.from(
  new Set(
    pendingSubjects
      .map((subject) => Number.parseInt(subject.subjectId, 10))
      .filter((id) => Number.isFinite(id)),
  ),
);

const buildClassroomPayload = ({ formData, parsedFloor, classroomId, classroomCareers, pendingCareers, pendingSubjects }) => {
  const payload = {
    name: formData.name.trim(),
    classroom_type: Number.parseInt(formData.classroom_type, 10),
    floor: Number.isFinite(parsedFloor) ? parsedFloor : null,
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
    payload.careers = resolveRestrictedCareerIds({
      classroomId,
      classroomCareers,
      pendingCareers,
    });
  }

  if (formData.is_restricted_to_subjects) {
    payload.subjects = resolveRestrictedSubjectIds(pendingSubjects);
  }

  return payload;
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
  onLoadSubjectPeriods,
  onLoadSubjectOptions,
}) => {
  const [formData, setFormData] = useState(createDefaultFormData);
  const [formErrors, setFormErrors] = useState({});
  const [pendingCareers, setPendingCareers] = useState([]);
  const [careerToAdd, setCareerToAdd] = useState('');
  const [pendingSubjects, setPendingSubjects] = useState([]);
  const [subjectCareerToAdd, setSubjectCareerToAdd] = useState('');
  const [subjectPeriodToAdd, setSubjectPeriodToAdd] = useState('');
  const [subjectToAdd, setSubjectToAdd] = useState('');
  const [subjectPeriodOptions, setSubjectPeriodOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [subjectPeriodsLoading, setSubjectPeriodsLoading] = useState(false);
  const [subjectOptionsLoading, setSubjectOptionsLoading] = useState(false);
  const [linkBusyId, setLinkBusyId] = useState(null);
  const previousModeRef = useRef(mode);

  useEffect(() => {
    if (!initialData) {
      return;
    }

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

    setPendingSubjects(normalizeInitialSubjects(initialData.subjects));
    setSubjectCareerToAdd('');
    setSubjectPeriodToAdd('');
    setSubjectToAdd('');
    setSubjectPeriodOptions([]);
    setSubjectOptions([]);
  }, [initialData, typeOptions]);

  useEffect(() => {
    const previousMode = previousModeRef.current;
    const enteringCreateMode = mode === 'create' && previousMode !== 'create';
    previousModeRef.current = mode;

    if (mode !== 'create' || initialData) {
      return;
    }

    if (enteringCreateMode) {
      setFormData(createDefaultFormData());
      setFormErrors({});
      setPendingCareers([]);
      setCareerToAdd('');
      setPendingSubjects([]);
      setSubjectCareerToAdd('');
      setSubjectPeriodToAdd('');
      setSubjectToAdd('');
      setSubjectPeriodOptions([]);
      setSubjectOptions([]);
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
      setSubjectCareerToAdd('');
      setSubjectPeriodToAdd('');
      setSubjectToAdd('');
      setSubjectPeriodOptions([]);
      setSubjectOptions([]);
    }

    if (field === 'is_restricted_to_subjects' && !value) {
      setSubjectCareerToAdd('');
      setSubjectPeriodToAdd('');
      setSubjectToAdd('');
      setSubjectPeriodOptions([]);
      setSubjectOptions([]);
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

  const handleAddPendingCareerFromValue = (careerId, careerLabel = '') => {
    const id = String(careerId || '').trim();
    if (!id) return;

    if (pendingCareers.some((p) => String(p.careerId) === id)) {
      setCareerToAdd('');
      return;
    }

    const label = String(careerLabel || careerOptions.find((o) => String(o.value) === id)?.label || id);
    setPendingCareers((prev) => [...prev, { careerId: id, label }]);
    setCareerToAdd('');
  };

  const handleAddLinkedCareerFromValue = async (careerId) => {
    const id = String(careerId || '').trim();
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

  const restrictedCareerOptions = useMemo(() => {
    if (!formData.is_restricted) {
      return careerOptions;
    }

    if (classroomId) {
      if (classroomCareers.length > 0) {
        return classroomCareers.map((row) => ({
          value: String(row.careers),
          label: row.career_name || String(row.careers),
        }));
      }

      if (Array.isArray(initialData?.careers)) {
        return initialData.careers
          .map((career) => {
            const careerId = String(career?.id || '').trim();
            if (!careerId) {
              return null;
            }
            return {
              value: careerId,
              label: String(career?.name || careerId),
            };
          })
          .filter(Boolean);
      }

      return [];
    }

    return pendingCareers.map((career) => ({
      value: String(career.careerId),
      label: career.label,
    }));
  }, [
    formData.is_restricted,
    careerOptions,
    classroomId,
    classroomCareers,
    initialData?.careers,
    pendingCareers,
  ]);

  const subjectCareerOptions = useMemo(() => {
    const source = formData.is_restricted ? restrictedCareerOptions : careerOptions;
    const seen = new Set();

    return source
      .map((item) => {
        const value = String(item?.value || '').trim();
        if (!value || seen.has(value)) {
          return null;
        }
        seen.add(value);
        return {
          value,
          label: String(item?.label || value),
        };
      })
      .filter(Boolean);
  }, [formData.is_restricted, restrictedCareerOptions, careerOptions]);

  useEffect(() => {
    if (!subjectCareerToAdd) {
      return;
    }

    const exists = subjectCareerOptions.some(
      (option) => String(option.value) === String(subjectCareerToAdd),
    );
    if (!exists) {
      setSubjectCareerToAdd('');
      setSubjectPeriodToAdd('');
      setSubjectToAdd('');
      setSubjectPeriodOptions([]);
      setSubjectOptions([]);
    }
  }, [subjectCareerToAdd, subjectCareerOptions]);

  useEffect(() => {
    let isMounted = true;

    const loadPeriods = async () => {
      if (!formData.is_restricted_to_subjects || !subjectCareerToAdd) {
        setSubjectPeriodOptions([]);
        setSubjectPeriodToAdd('');
        setSubjectOptions([]);
        setSubjectToAdd('');
        setSubjectPeriodsLoading(false);
        return;
      }

      setSubjectPeriodsLoading(true);
      try {
        const rows = await onLoadSubjectPeriods?.(subjectCareerToAdd);
        if (!isMounted) {
          return;
        }

        const normalizedRows = Array.isArray(rows) ? rows : [];
        setSubjectPeriodOptions(normalizedRows);
        setSubjectPeriodToAdd('');
        setSubjectOptions([]);
        setSubjectToAdd('');
      } finally {
        if (isMounted) {
          setSubjectPeriodsLoading(false);
        }
      }
    };

    loadPeriods();

    return () => {
      isMounted = false;
    };
  }, [formData.is_restricted_to_subjects, subjectCareerToAdd, onLoadSubjectPeriods]);

  useEffect(() => {
    let isMounted = true;

    const loadSubjects = async () => {
      if (!formData.is_restricted_to_subjects || !subjectCareerToAdd || !subjectPeriodToAdd) {
        setSubjectOptions([]);
        setSubjectToAdd('');
        setSubjectOptionsLoading(false);
        return;
      }

      setSubjectOptionsLoading(true);
      try {
        const rows = await onLoadSubjectOptions?.({
          careerId: subjectCareerToAdd,
          periodNumber: subjectPeriodToAdd,
        });
        if (!isMounted) {
          return;
        }

        const normalizedRows = Array.isArray(rows) ? rows : [];
        setSubjectOptions(normalizedRows);
        setSubjectToAdd('');
      } finally {
        if (isMounted) {
          setSubjectOptionsLoading(false);
        }
      }
    };

    loadSubjects();

    return () => {
      isMounted = false;
    };
  }, [formData.is_restricted_to_subjects, subjectCareerToAdd, subjectPeriodToAdd, onLoadSubjectOptions]);

  const handleAddPendingSubject = () => {
    const subjectId = String(subjectToAdd || '').trim();
    if (!subjectId) {
      return;
    }

    if (pendingSubjects.some((row) => String(row.subjectId) === subjectId)) {
      setSubjectToAdd('');
      return;
    }

    const subjectOption = subjectOptions.find((option) => String(option.value) === subjectId);
    const careerOption = subjectCareerOptions.find(
      (option) => String(option.value) === String(subjectCareerToAdd),
    );
    const periodNumber = Number.parseInt(String(subjectPeriodToAdd), 10);

    setPendingSubjects((prev) => [
      ...prev,
      {
        subjectId,
        label: subjectOption?.label || subjectId,
        name: subjectOption?.name || '',
        code: subjectOption?.code || '',
        careerId: String(subjectCareerToAdd || ''),
        careerLabel: careerOption?.label || '',
        periodNumber: Number.isFinite(periodNumber) ? periodNumber : null,
      },
    ]);

    setFormErrors((prev) => {
      if (!prev.restricted_subjects) {
        return prev;
      }
      const next = { ...prev };
      delete next.restricted_subjects;
      return next;
    });

    setSubjectToAdd('');
  };

  const handleRemovePendingSubject = (subjectId) => {
    setPendingSubjects((prev) => prev.filter((row) => String(row.subjectId) !== String(subjectId)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const parsedFloor =
      formData.floor === ''
        ? null
        : Number.parseInt(formData.floor, 10);

    const values = {
      ...formData,
      floor: parsedFloor,
      is_restricted: Boolean(formData.is_restricted),
    };

    try {
      await classroomValidationSchema.validate(values, { abortEarly: false });
      setFormErrors({});
    } catch (validationError) {
      const nextErrors = collectValidationErrors(validationError);
      if (!nextErrors) {
        return;
      }
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

    removeFieldError(setFormErrors, 'restricted_careers');

    if (formData.is_restricted_to_subjects && pendingSubjects.length === 0) {
      setFormErrors((prev) => ({
        ...prev,
        restricted_subjects: 'Si el aula es restringida por materias, agrega al menos una materia permitida.',
      }));
      return;
    }

    removeFieldError(setFormErrors, 'restricted_subjects');

    const payload = buildClassroomPayload({
      formData,
      parsedFloor,
      classroomId,
      classroomCareers,
      pendingCareers,
      pendingSubjects,
    });

    onSubmit(payload);
  };

  const showRestrictedSection = formData.is_restricted;
  const showRestrictedSubjectsSection = formData.is_restricted_to_subjects;
  const careerSelectedValues = useMemo(() => {
    if (classroomId) {
      return classroomCareers.map((row) => ({
        value: String(row.careers),
        label: row.career_name || String(row.careers),
      }));
    }

    return pendingCareers.map((row) => ({
      value: String(row.careerId),
      label: row.label,
    }));
  }, [classroomId, classroomCareers, pendingCareers]);

  const handleAddCareerFromSelector = async (selectedCareerId, selectedCareerLabel) => {
    if (classroomId) {
      await handleAddLinkedCareerFromValue(selectedCareerId);
      return;
    }
    handleAddPendingCareerFromValue(selectedCareerId, selectedCareerLabel);
  };

  const handleRemoveCareerByIndex = async (index) => {
    if (classroomId) {
      const row = classroomCareers[index];
      if (!row) return;
      await handleRemoveLinkedCareer(row);
      return;
    }

    setPendingCareers((prev) => prev.filter((_, i) => i !== index));
  };

  const subjectSectionNotice = formData.is_restricted && subjectCareerOptions.length === 0
    ? 'Primero agrega al menos una carrera con acceso para poder seleccionar materias.'
    : null;

  const subjectSelectors = [
    {
      key: 'career',
      label: 'Carrera',
      options: subjectCareerOptions,
      value: subjectCareerToAdd,
      onChange: setSubjectCareerToAdd,
      placeholder: 'Selecciona una carrera',
      disabled: formData.is_restricted && subjectCareerOptions.length === 0,
    },
    {
      key: 'period',
      label: 'Periodo',
      options: subjectPeriodOptions,
      value: subjectPeriodToAdd,
      onChange: setSubjectPeriodToAdd,
      placeholder: 'Selecciona un periodo',
      disabled: subjectPeriodsLoading || !subjectCareerToAdd || subjectPeriodOptions.length === 0,
    },
    {
      key: 'subject',
      label: 'Materia',
      options: subjectOptions,
      value: subjectToAdd,
      onChange: setSubjectToAdd,
      placeholder: 'Selecciona una materia',
      disabled: (
        subjectOptionsLoading
        || !subjectCareerToAdd
        || !subjectPeriodToAdd
        || subjectOptions.length === 0
      ),
    },
  ];

  const pendingSubjectItems = pendingSubjects.map((row) => ({
    id: row.subjectId,
    primaryText: row.label || '—',
    secondaryText: [
      row.careerLabel ? `Carrera: ${row.careerLabel}` : '',
      row.periodNumber ? `Periodo: ${row.periodNumber}` : '',
    ].filter(Boolean).join(' · '),
  }));

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
            <SelectableListField
              label="Carreras con acceso"
              error={formErrors.restricted_careers}
              selectedValues={careerSelectedValues}
              options={careerOptions}
              selectedOption={careerToAdd}
              onSelectedOptionChange={setCareerToAdd}
              onAdd={handleAddCareerFromSelector}
              onRemove={handleRemoveCareerByIndex}
              placeholder="Selecciona una carrera"
              addLabel="Agregar Carrera"
              disabled={isLoading || linkBusyId != null}
              displayMode="summary"
              summaryPanelPosition="below"
              loading={classroomId && classroomCareersLoading}
              loadingText="Cargando carreras…"
              emptyText={classroomId ? 'No hay carreras asignadas' : 'Se guardarán al crear el aula'}
              allowHidePendingSelector={false}
              showAddIcon
              addButtonClassName="inline-flex items-center gap-1.5 text-sm font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        )}

        <div className="md:col-span-12">
          <Checkbox
            label="Restringida a materias específicas"
            checked={formData.is_restricted_to_subjects}
            onChange={(e) => handleInputChange('is_restricted_to_subjects', e.target.checked)}
            disabled={isLoading}
          />
        </div>

        {showRestrictedSubjectsSection && (
          <div className="md:col-span-12">
            <CascadingSelectableListField
              label="Materias permitidas"
              description="Selecciona carrera, luego periodo y finalmente la materia. Puedes mezclar materias de distintas carreras agregándolas una por una."
              selectors={subjectSelectors}
              addLabel="Agregar Materia"
              onAdd={handleAddPendingSubject}
              addDisabled={
                isLoading
                || subjectPeriodsLoading
                || subjectOptionsLoading
                || !subjectToAdd
              }
              disabled={isLoading}
              loading={subjectPeriodsLoading || subjectOptionsLoading}
              loadingText="Cargando catálogo de materias…"
              notice={subjectSectionNotice}
              error={formErrors.restricted_subjects}
              items={pendingSubjectItems}
              emptyText="No hay materias permitidas"
              onRemove={(item) => handleRemovePendingSubject(item.id)}
              removeLabel="Quitar materia"
            />
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
    classroom_type: PropTypes.string,
    code: PropTypes.string,
    floor: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    building: PropTypes.string,
    building_code: PropTypes.string,
    is_restricted: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
    is_restricted_to_subjects: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.bool,
    ]),
    careers: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
      }),
    ),
    subjects: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        code: PropTypes.string,
      }),
    ),
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
  onLoadSubjectPeriods: PropTypes.func,
  onLoadSubjectOptions: PropTypes.func,
};
