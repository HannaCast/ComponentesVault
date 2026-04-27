import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { Check, Download, Eye, Search, Trash2, X } from 'lucide-react';
import Input from '@shared/components/inputs/InputText';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';
import { LoadingStatePanel } from '@shared/components/layout/LoadingStatePanel';
import { Pagination } from '@shared/components/tables/Pagination';

const formatDateTime = (dateLike) => {
  if (!dateLike) {
    return 'Sin fecha';
  }

  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatRelativeTime = (dateLike) => {
  if (!dateLike) {
    return 'Sin fecha';
  }

  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 1) {
    return 'hace unos segundos';
  }

  if (diffMinutes < 60) {
    return `hace ${diffMinutes} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `hace ${diffHours} h`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) {
    return `hace ${diffDays} d`;
  }

  return formatDateTime(dateLike);
};

const getVersionStatus = (version) => {
  const isConfirmed = Number(version?.is_confirmed) === 1;

  if (isConfirmed) {
    return {
      label: 'Confirmado',
      textColor: '#166534',
      bgColor: '#DCFCE7',
    };
  }

  return {
    label: 'Borrador',
    textColor: '#92400E',
    bgColor: '#FEF3C7',
  };
};

const getVersionMetaText = (version) => {
  const assignedCount = Number(version?.assigned_count) || 0;
  const unassignedCount = Number(version?.unassigned_count) || 0;
  const isConfirmed = Number(version?.is_confirmed) === 1;

  if (isConfirmed) {
    return `${assignedCount} asignados · ${unassignedCount} sin asignar · Confirmado ${formatDateTime(version?.confirmed_at)}`;
  }

  return `${assignedCount} asignados · ${unassignedCount} sin asignar · Actualizado ${formatRelativeTime(version?.updated_at || version?.created_at)}`;
};

const getButtonDisabledState = (pendingAction, versionId, currentAction, globalDisabled) => {
  if (globalDisabled && pendingAction?.versionId !== versionId) {
    return true;
  }

  if (pendingAction?.versionId === versionId && pendingAction?.type && pendingAction.type !== currentAction) {
    return true;
  }

  return false;
};

export const ScheduleVersionHistoryPanel = ({
  versions,
  loading,
  searchInput,
  onSearchInputChange,
  onViewVersion,
  onRenameVersion,
  onConfirmVersion,
  onDeleteDraft,
  onExportPdf,
  pendingAction,
  actionsDisabled = false,
  pagination,
}) => {
  const [editingVersionId, setEditingVersionId] = useState(null);
  const [editingLabel, setEditingLabel] = useState('');
  const hasVersions = versions.length > 0;

  useEffect(() => {
    if (editingVersionId === null) {
      return;
    }

    const version = versions.find((item) => Number(item?.id) === Number(editingVersionId));
    if (!version || Number(version?.is_confirmed) === 1) {
      setEditingVersionId(null);
      setEditingLabel('');
    }
  }, [editingVersionId, versions]);

  const startInlineRename = (version) => {
    if (!version || Number(version?.is_confirmed) === 1 || actionsDisabled) {
      return;
    }

    setEditingVersionId(version.id);
    setEditingLabel(String(version?.label || ''));
  };

  const cancelInlineRename = () => {
    setEditingVersionId(null);
    setEditingLabel('');
  };

  const submitInlineRename = async (version) => {
    if (!version || Number(version?.is_confirmed) === 1) {
      cancelInlineRename();
      return;
    }

    const normalizedLabel = String(editingLabel || '').trim();
    const currentLabel = String(version?.label || '').trim();

    if (!normalizedLabel) {
      return;
    }

    if (normalizedLabel === currentLabel) {
      cancelInlineRename();
      return;
    }

    const result = await onRenameVersion?.(version, normalizedLabel);
    const isFailure = result === false || result?.success === false;

    if (!isFailure) {
      cancelInlineRename();
    }
  };

  let historyContent = null;

  if (loading) {
    historyContent = <LoadingStatePanel message="Cargando historial de versiones..." />;
  } else if (hasVersions) {
    historyContent = (
      <div className="space-y-3">
        {versions.map((version) => {
          const isConfirmed = Number(version?.is_confirmed) === 1;
          const status = getVersionStatus(version);
          const isInlineEditing = Number(editingVersionId) === Number(version?.id);

          const isViewing = pendingAction?.versionId === version.id && pendingAction?.type === 'view';
          const isConfirming = pendingAction?.versionId === version.id && pendingAction?.type === 'confirm';
          const isDeleting = pendingAction?.versionId === version.id && pendingAction?.type === 'delete';
          const isRenaming = pendingAction?.versionId === version.id && pendingAction?.type === 'rename';

          return (
            <SurfacePanel
              key={version.id}
              className="transition-all"
              padding="p-4"
            >
              <div
                className="rounded-lg border p-4"
                style={{
                  borderColor: 'var(--border-default, #d1d5db)',
                  backgroundColor: 'var(--bg-elevated, #ffffff)',
                }}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isInlineEditing ? (
                        <div className="flex max-w-full items-center gap-2">
                          <input
                            type="text"
                            value={editingLabel}
                            onChange={(event) => setEditingLabel(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                submitInlineRename(version);
                              }
                              if (event.key === 'Escape') {
                                event.preventDefault();
                                cancelInlineRename();
                              }
                            }}
                            className="h-10 w-56 max-w-full rounded-lg border px-3 text-base font-semibold md:w-72"
                            style={{
                              borderColor: 'var(--accent, #2563eb)',
                              color: 'var(--text-primary, #111827)',
                              backgroundColor: 'var(--bg-elevated, #ffffff)',
                            }}
                            autoFocus
                          />

                          <button
                            type="button"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border"
                            style={{ borderColor: 'var(--border-default, #d1d5db)' }}
                            onClick={() => submitInlineRename(version)}
                            disabled={isRenaming}
                            aria-label="Guardar nombre"
                          >
                            <Check className="h-4 w-4" style={{ color: 'var(--accent, #2563eb)' }} />
                          </button>

                          <button
                            type="button"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border"
                            style={{ borderColor: 'var(--border-default, #d1d5db)' }}
                            onClick={cancelInlineRename}
                            disabled={isRenaming}
                            aria-label="Cancelar edicion"
                          >
                            <X className="h-4 w-4" style={{ color: 'var(--text-secondary, #6b7280)' }} />
                          </button>
                        </div>
                      ) : (
                        <h4
                          className="truncate text-lg font-semibold"
                          style={{ color: 'var(--text-primary, #111827)' }}
                          onDoubleClick={() => startInlineRename(version)}
                          title={isConfirmed ? undefined : 'Doble clic para editar nombre'}
                        >
                          {version?.label || `Version ${version?.id}`}
                        </h4>
                      )}
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{
                          color: status.textColor,
                          backgroundColor: status.bgColor,
                        }}
                      >
                        {status.label}
                      </span>
                    </div>

                    <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                      {getVersionMetaText(version)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    {isConfirmed ? (
                      <>
                        <ActionButton
                          icon={Eye}
                          label="Ver"
                          variant="secondary"
                          fullWidth={false}
                          onClick={() => onViewVersion(version.id)}
                          disabled={getButtonDisabledState(pendingAction, version.id, 'view', actionsDisabled)}
                          loading={isViewing}
                          loadingLabel="Abriendo..."
                        />
                        <ActionButton
                          icon={Download}
                          label="PDF"
                          variant="secondary"
                          fullWidth={false}
                          onClick={() => onExportPdf(version)}
                          disabled={actionsDisabled}
                        />
                      </>
                    ) : (
                      <>
                        <ActionButton
                          icon={Eye}
                          label="Ver"
                          variant="secondary"
                          fullWidth={false}
                          onClick={() => onViewVersion(version.id)}
                          disabled={getButtonDisabledState(pendingAction, version.id, 'view', actionsDisabled)}
                          loading={isViewing}
                          loadingLabel="Abriendo..."
                        />
                        <ActionButton
                          icon={Check}
                          label="Confirmar"
                          variant="outline"
                          fullWidth={false}
                          onClick={() => onConfirmVersion(version)}
                          disabled={getButtonDisabledState(pendingAction, version.id, 'confirm', actionsDisabled)}
                          loading={isConfirming}
                          loadingLabel="Confirmando..."
                        />
                        <ActionButton
                          icon={Trash2}
                          label=""
                          variant="secondary"
                          fullWidth={false}
                          onClick={() => onDeleteDraft(version)}
                          disabled={getButtonDisabledState(pendingAction, version.id, 'delete', actionsDisabled)}
                          loading={isDeleting}
                          loadingLabel=""
                          customStyle={{ padding: '0.55rem' }}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </SurfacePanel>
          );
        })}
      </div>
    );
  } else {
    historyContent = (
      <SurfacePanel>
        <p className="text-center text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
          Aun no hay versiones generadas para esta universidad.
        </p>
      </SurfacePanel>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="m-0 text-xl font-semibold leading-tight" style={{ color: 'var(--text-primary, #111827)' }}>
          Versiones guardadas
        </h3>

        <div className="relative w-full md:w-72">
          <Input
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            placeholder="Buscar por nombre..."
            reserveHelperSpace={false}
            className="pl-10"
          />
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: 'var(--text-secondary, #6b7280)' }}
          />
        </div>
      </div>
      {historyContent}

      {pagination ? (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.onPageChange}
        />
      ) : null}
    </div>
  );
};

ScheduleVersionHistoryPanel.propTypes = {
  versions: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  searchInput: PropTypes.string,
  onSearchInputChange: PropTypes.func,
  onViewVersion: PropTypes.func,
  onRenameVersion: PropTypes.func,
  onConfirmVersion: PropTypes.func,
  onDeleteDraft: PropTypes.func,
  onExportPdf: PropTypes.func,
  pendingAction: PropTypes.shape({
    type: PropTypes.string,
    versionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  actionsDisabled: PropTypes.bool,
  pagination: PropTypes.shape({
    currentPage: PropTypes.number,
    totalPages: PropTypes.number,
    totalItems: PropTypes.number,
    itemsPerPage: PropTypes.number,
    onPageChange: PropTypes.func,
  }),
};
