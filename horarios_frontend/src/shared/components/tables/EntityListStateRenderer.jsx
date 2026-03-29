import React from 'react';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';
import { LoadingStatePanel } from '@shared/components/layout/LoadingStatePanel';
import { EmptyStatePanel } from './EmptyStatePanel';
import { Pagination } from './Pagination';

/**
 * EntityListStateRenderer
 *
 * Renderiza de forma reusable los estados de lista: loading, empty y data + paginacion.
 */
export const EntityListStateRenderer = ({
  loading,
  loadingMessage = 'Cargando...',
  items = [],
  getItemKey,
  renderItem,
  emptyState,
  pagination,
  containerClassName = 'space-y-4',
  listPanelPadding = 'p-0',
}) => {
  if (loading) {
    return <LoadingStatePanel message={loadingMessage} />;
  }

  if (!items.length) {
    return (
      <EmptyStatePanel
        icon={emptyState?.icon}
        title={emptyState?.title}
        description={emptyState?.description}
        actionIcon={emptyState?.actionIcon}
        actionLabel={emptyState?.actionLabel}
        onAction={emptyState?.onAction}
      />
    );
  }

  return (
    <div className={containerClassName}>
      <SurfacePanel padding={listPanelPadding}>
        {items.map((item, index) => {
          const key = getItemKey ? getItemKey(item, index) : index;
          return <React.Fragment key={key}>{renderItem(item, index)}</React.Fragment>;
        })}
      </SurfacePanel>

      {pagination ? (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.onPageChange}
          hasPreviousPage={pagination.hasPreviousPage}
          hasNextPage={pagination.hasNextPage}
        />
      ) : null}
    </div>
  );
};
