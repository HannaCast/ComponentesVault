import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Trash2, ArrowUpDown, AlertCircle } from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { ConfirmModal } from '@shared/components/ConfirmModal';
import { Switch } from '@shared/components/inputs/Switch';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import Input from '@shared/components/inputs/InputText';
import { Select } from '@shared/components/inputs/Select';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';
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
          />

          <Select
            label="Estado"
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            options={statusOptions}
            placeholder="Todas"
          />

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary, #111827)' }}>
              Orden
            </label>
            <ActionButton
              icon={ArrowUpDown}
              label={ordenAscendente ? 'A-Z' : 'Z-A'}
              onClick={() => setOrdenAscendente((prev) => !prev)}
              variant="outline"
              size="medium"
            />
          </div>
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
            <div
              key={subject.id}
              className="p-4 transition-colors hover:opacity-75"
              style={{ backgroundColor: 'var(--bg-elevated, #ffffff)' }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 cursor-pointer" onClick={() => navigate(`/usuario/materias/editar/${subject.id}`)}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'var(--primary-100, rgba(37, 99, 235, 0.1))' }}
                    >
                      <BookOpen className="w-5 h-5" style={{ color: 'var(--primary-color, #2563eb)' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium truncate" style={{ color: 'var(--text-primary, #111827)' }}>
                        {subject.name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm mt-1" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                        <span className="truncate">Codigo: {subject.code || '-'}</span>
                        {subject.credits ? (
                          <>
                            <span>•</span>
                            <span>{subject.credits} creditos</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                      {subject.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                    <Switch
                      checked={subject.is_active}
                      onCheckedChange={() => handleToggleStatus(subject.id, subject.is_active)}
                    />
                  </div>
                  <ActionButton
                    icon={Trash2}
                    label=""
                    onClick={() => setDeleteModal({ isOpen: true, id: subject.id })}
                    variant="secondary"
                    size="small"
                    fullWidth={false}
                    customStyle={{ padding: '0.375rem' }}
                  />
                </div>
              </div>
            </div>
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
