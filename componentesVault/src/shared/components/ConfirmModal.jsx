import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { AlertCircle, X } from 'lucide-react';
import { ActionButton } from '../inputs/ActionButton.jsx';

export function ConfirmModal({
  isOpen,
  open,
  onClose,
  onCancel,
  onConfirm,
  title,
  message,
  description,
  confirmLabel = 'Aceptar',
  confirmLoadingLabel = 'Cargando...',
  cancelLabel = 'Cancelar',
  closeOnConfirm = true,
  zIndexClass = 'z-50',
  zIndex = 70,
  children,
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const isVisible = Boolean(isOpen ?? open);

  if (!isVisible) return null;

  const modalMessage = message ?? description;

  const handleConfirm = async (event) => {
    if (isConfirming) return;

    event?.stopPropagation();
    setIsConfirming(true);

    try {
      await onConfirm?.();

      if (closeOnConfirm) {
        onClose?.();
        onCancel?.();
      }
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCloseOnlyModal = (event) => {
    if (isConfirming) return;

    event?.stopPropagation();
    onClose?.();
    onCancel?.();
  };

  const modalContent = (
    <div className={`fixed inset-0 ${zIndexClass} flex items-center justify-center`} style={{ zIndex }}>
      <button
        type="button"
        className="absolute inset-0 border-0 bg-black/40 p-0"
        onClick={handleCloseOnlyModal}
        aria-label="Cerrar modal"
      />

      <div className="relative mx-4 max-w-sm rounded-lg bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            type="button"
            onClick={handleCloseOnlyModal}
            disabled={isConfirming}
            className="text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {modalMessage ? <p className="text-gray-700">{modalMessage}</p> : null}
          {children}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-4">
          <ActionButton variant="secondary" onClick={handleCloseOnlyModal} disabled={isConfirming}>
            {cancelLabel}
          </ActionButton>
          <ActionButton onClick={handleConfirm} disabled={isConfirming}>
            {isConfirming ? confirmLoadingLabel : confirmLabel}
          </ActionButton>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onCancel: PropTypes.func,
  onConfirm: PropTypes.func,
  title: PropTypes.node,
  message: PropTypes.node,
  description: PropTypes.node,
  confirmLabel: PropTypes.node,
  confirmLoadingLabel: PropTypes.node,
  cancelLabel: PropTypes.node,
  closeOnConfirm: PropTypes.bool,
  zIndexClass: PropTypes.string,
  zIndex: PropTypes.number,
  children: PropTypes.node,
};