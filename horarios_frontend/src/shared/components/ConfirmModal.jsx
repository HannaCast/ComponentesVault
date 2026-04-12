import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { AlertCircle, X } from 'lucide-react';

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Aceptar',
  confirmLoadingLabel = 'Cargando...',
  closeOnConfirm = true,
  zIndexClass = 'z-50',
  zIndex = 70,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async (event) => {
    if (isConfirming) return;

    event?.stopPropagation();
    setIsConfirming(true);

    try {
      await onConfirm?.();

      if (closeOnConfirm) {
        onClose?.();
      }
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCloseOnlyModal = (event) => {
    if (isConfirming) return;

    event?.stopPropagation();
    onClose?.();
  };

  const modalContent = (
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center`}
      style={{ zIndex }}
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40 border-0 p-0"
        onClick={handleCloseOnlyModal}
        aria-label="Cerrar modal"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-lg max-w-sm mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            type="button"
            onClick={handleCloseOnlyModal}
            disabled={isConfirming}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="text-gray-700">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCloseOnlyModal}
            disabled={isConfirming}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirming}
            className="inline-flex items-center gap-2 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isConfirming ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>{confirmLoadingLabel}</span>
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  onConfirm: PropTypes.func,
  title: PropTypes.node,
  message: PropTypes.node,
  confirmLabel: PropTypes.node,
  confirmLoadingLabel: PropTypes.node,
  closeOnConfirm: PropTypes.bool,
  zIndexClass: PropTypes.string,
  zIndex: PropTypes.number,
};
