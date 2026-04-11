import React from 'react';
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
  closeOnConfirm = true,
  zIndexClass = 'z-50',
  zIndex = 70,
}) => {
  if (!isOpen) return null;

  const handleConfirm = async (event) => {
    event?.stopPropagation();
    await onConfirm?.();

    if (closeOnConfirm) {
      onClose?.();
    }
  };

  const handleCloseOnlyModal = (event) => {
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
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            {confirmLabel}
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
  closeOnConfirm: PropTypes.bool,
  zIndexClass: PropTypes.string,
  zIndex: PropTypes.number,
};
