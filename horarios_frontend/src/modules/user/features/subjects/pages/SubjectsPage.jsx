import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, AlertCircle } from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { ConfirmModal } from '@shared/components/ConfirmModal';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import Input from '@shared/components/inputs/InputText';
import { Select } from '@shared/components/inputs/Select';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';
import { EntityListItem } from '@shared/components/lists/EntityListItem';
import { useSubjects } from '../hooks/useSubjects';

export const SubjectsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    subjectsFiltered,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    estadoFiltro,
    setEstadoFiltro,
    ordenAscendente,
    setOrdenAscendente,
    deleteModal,
    setDeleteModal,
    statusOptions,
    handleToggleStatus,
    handleDelete,
    subjects,
  } = useSubjects();

  if (!user?.selected_university) {
    return (
      <div
        className="rounded-lg border p-6 text-center"
        style={{
          backgroundColor: 'var(--warning-subtle, #fef3c7)',
          borderColor: 'var(--warning-border, #fcd34d)',
        }}
      >
        <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--warning, #f59e0b)' }} />
        <p className="font-medium" style={{ color: 'var(--warning-text, #92400e)' }}>
          Por favor selecciona una universidad en el apartado de Universidades
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
            Materias
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary, #6b7280)' }}>
            Gestiona las materias de tu universidad
          </p>
        </div>
        <ActionButton
          icon={Plus}
          label="Nueva Materia"
          onClick={() => navigate('/usuario/materias/crear')}
          variant="primary"
          size="medium"
          fullWidth={false}
        />
      </div>

      {error && (
        <div
          className="rounded-lg p-4 border"
          style={{
            backgroundColor: 'var(--error-subtle, #fef2f2)',
            borderColor: 'var(--error-border, #fee2e2)',
          }}
        >
          <p style={{ color: 'var(--error, #dc2626)' }}>{error}</p>
        </div>
      )}

      <SurfacePanel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Buscar Materia"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nombre o codigo"
            reserveHelperSpace={false}
          />

          <Select
            label="Estado"
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            options={statusOptions}
            placeholder="Todas"
            reserveHelperSpace={false}
          />

          <Select
            label="Orden"
            value={ordenAscendente ? 'asc' : 'desc'}
            onChange={(e) => setOrdenAscendente(e.target.value === 'asc')}
            options={[
              { value: 'asc', label: 'Ascendente' },
              { value: 'desc', label: 'Descendente' },
            ]}
            placeholder="Ascendente"
            showPlaceholderOption={false}
            reserveHelperSpace={false}
          />
        </div>
      </SurfacePanel>

      {loading ? (
        <SurfacePanel padding="p-12" centered>
          <div className="inline-block">
            <div
              className="animate-spin w-8 h-8 border-4 rounded-full"
              style={{
                borderColor: 'var(--border-default, #d1d5db)',
                borderTopColor: 'var(--primary-color, #2563eb)',
              }}
            />
          </div>
          <p className="mt-4" style={{ color: 'var(--text-secondary, #6b7280)' }}>
            Cargando materias...
          </p>
        </SurfacePanel>
      ) : subjectsFiltered.length === 0 ? (
        <SurfacePanel padding="p-12" centered>
          <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-secondary, #6b7280)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary, #111827)' }}>
            {subjects.length === 0 ? 'No hay materias registradas' : 'No se encontraron materias'}
          </h3>
          <p className="mb-6" style={{ color: 'var(--text-secondary, #6b7280)' }}>
            {subjects.length === 0 ? 'Comienza agregando tu primera materia' : 'Intenta con otros terminos de busqueda'}
          </p>
          {subjects.length === 0 && (
            <div className="flex justify-center">
              <ActionButton
                icon={Plus}
                label="Agregar Materia"
                onClick={() => navigate('/usuario/materias/crear')}
                variant="primary"
                size="medium"
                fullWidth={false}
              />
            </div>
          )}
        </SurfacePanel>
      ) : (
        <SurfacePanel className="divide-y" padding="p-0">
          {subjectsFiltered.map((subject) => (
            <EntityListItem
              key={subject.id}
              icon={BookOpen}
              title={subject.name}
              metaItems={[
                `Codigo: ${subject.code || '-'}`,
                subject.credits ? `${subject.credits} creditos` : null,
              ]}
              isActive={subject.is_active}
              activeText="Activa"
              inactiveText="Inactiva"
              onToggleStatus={() => handleToggleStatus(subject.id, subject.is_active)}
              onDelete={() => setDeleteModal({ isOpen: true, id: subject.id })}
              onContentClick={() => navigate(`/usuario/materias/editar/${subject.id}`)}
            />
          ))}
        </SurfacePanel>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Eliminar Materia"
        message="Esta seguro que desea eliminar esta materia? Esta accion no se puede deshacer."
      />
    </div>
  );
};
