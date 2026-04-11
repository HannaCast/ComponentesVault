import React from 'react';
import PropTypes from 'prop-types';

/**
 * Pagination
 *
 * Props:
 * - currentPage: Pagina actual (base 1).
 * - totalPages: Total de paginas disponibles.
 * - totalItems: Total de registros filtrados.
 * - itemsPerPage: Cantidad de elementos por pagina.
 * - onPageChange: Callback al cambiar de pagina. Recibe el numero de pagina destino.
 * - hasPreviousPage: (Opcional) Control manual de disponibilidad de pagina previa.
 * - hasNextPage: (Opcional) Control manual de disponibilidad de pagina siguiente.
 */
export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  hasPreviousPage = currentPage > 1,
  hasNextPage = currentPage < totalPages,
}) {
  const renderPageNumbers = () => {
    const pages = [];

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    if (startPage > 2) {
      pages.push('ellipsis-start');
    }

    for (let i = startPage; i <= endPage; i += 1) {
      pages.push(i);
    }

    if (endPage < totalPages - 1) {
      pages.push('ellipsis-end');
    }

    pages.push(totalPages);

    return pages;
  };

  const renderPageNumbersMobile = () => {
    const pages = [];

    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    if (currentPage > 2) {
      pages.push('ellipsis');
    }

    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i += 1) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }

    if (currentPage < totalPages - 1) {
      pages.push('ellipsis');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const summaryText = (
    <>
      Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de{' '}
      {totalItems} resultados
    </>
  );

  const barShellClassName =
    'flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-lg border';
  const barShellStyle = {
    backgroundColor: 'var(--bg-elevated, #ffffff)',
    borderColor: 'var(--border-default, #d1d5db)',
  };

  /** Una sola página: el listado sigue siendo paginado en servidor; solo ocultamos botones de página. */
  if (totalPages <= 1) {
    if (totalItems <= 0) {
      return null;
    }

    return (
      <div className={barShellClassName} style={barShellStyle}>
        <div
          className="text-xs sm:text-sm w-full text-center sm:text-left"
          style={{ color: 'var(--text-secondary, #6b7280)' }}
        >
          {summaryText}
        </div>
      </div>
    );
  }

  let mobileEllipsisCounter = 0;

  return (
    <div className={barShellClassName} style={barShellStyle}>
      <div className="text-xs sm:text-sm hidden sm:block" style={{ color: 'var(--text-secondary, #6b7280)' }}>
        {summaryText}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPreviousPage}
          className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            color: 'var(--text-primary, #111827)',
            backgroundColor: 'var(--bg-surface, #f3f4f6)',
            border: '1px solid var(--border-default, #d1d5db)',
          }}
        >
          Anterior
        </button>

        <div className="hidden sm:flex gap-1">
          {renderPageNumbers().map((page) => {
            if (page === 'ellipsis-start' || page === 'ellipsis-end') {
              return (
                <span
                  key={page}
                  className="w-10 h-10 flex items-center justify-center"
                  style={{ color: 'var(--text-secondary, #6b7280)' }}
                >
                  ...
                </span>
              );
            }

            const isCurrentPage = page === currentPage;

            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className="w-10 h-10 text-sm font-medium rounded-lg transition-colors"
                style={
                  isCurrentPage
                    ? {
                        color: 'var(--text-on-accent, #ffffff)',
                        backgroundColor: 'var(--accent, #2563eb)',
                        border: '1px solid var(--accent, #2563eb)',
                      }
                    : {
                        color: 'var(--text-primary, #111827)',
                        backgroundColor: 'var(--bg-surface, #f3f4f6)',
                        border: '1px solid var(--border-default, #d1d5db)',
                      }
                }
              >
                {page}
              </button>
            );
          })}
        </div>

        <div className="flex sm:hidden gap-1">
          {renderPageNumbersMobile().map((page) => {
            if (page === 'ellipsis') {
              mobileEllipsisCounter += 1;
              const ellipsisKey = mobileEllipsisCounter === 1 ? 'ellipsis-start' : 'ellipsis-end';

              return (
                <span
                  key={ellipsisKey}
                  className="w-8 h-8 flex items-center justify-center text-xs"
                  style={{ color: 'var(--text-secondary, #6b7280)' }}
                >
                  ...
                </span>
              );
            }

            const isCurrentPage = page === currentPage;

            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className="w-8 h-8 text-xs font-medium rounded-lg transition-colors"
                style={
                  isCurrentPage
                    ? {
                        color: 'var(--text-on-accent, #ffffff)',
                        backgroundColor: 'var(--accent, #2563eb)',
                        border: '1px solid var(--accent, #2563eb)',
                      }
                    : {
                        color: 'var(--text-primary, #111827)',
                        backgroundColor: 'var(--bg-surface, #f3f4f6)',
                        border: '1px solid var(--border-default, #d1d5db)',
                      }
                }
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            color: 'var(--text-primary, #111827)',
            backgroundColor: 'var(--bg-surface, #f3f4f6)',
            border: '1px solid var(--border-default, #d1d5db)',
          }}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

Pagination.propTypes = {
  currentPage: PropTypes.number,
  totalPages: PropTypes.number,
  totalItems: PropTypes.number,
  itemsPerPage: PropTypes.number,
  onPageChange: PropTypes.func,
  hasPreviousPage: PropTypes.bool,
  hasNextPage: PropTypes.bool,
};
