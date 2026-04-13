import React, { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Info } from 'lucide-react';

/**
 * Tooltip
 *
 * Props:
 * - content: Contenido mostrado dentro del tooltip (texto o nodo).
 * - icon: Icono opcional para el disparador; por defecto usa Info.
 * - position: Posicion del tooltip ('top' | 'bottom' | 'left' | 'right').
 * - className: Clases CSS adicionales para el contenedor del tooltip.
 * - iconClassName: Clases CSS adicionales para el boton/icono disparador.
 * - disabled: Si es true, deshabilita la interaccion y no abre el tooltip.
 */

const POSITION_STYLES = {
  top: {
    tooltip: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    arrow: '-bottom-1 left-1/2 -translate-x-1/2',
    arrowBorderStyle: {
      borderRight: '1px solid var(--border-default, #334155)',
      borderBottom: '1px solid var(--border-default, #334155)',
    },
  },
  bottom: {
    tooltip: 'top-full left-1/2 -translate-x-1/2 mt-2',
    arrow: '-top-1 left-1/2 -translate-x-1/2',
    arrowBorderStyle: {
      borderTop: '1px solid var(--border-default, #334155)',
      borderLeft: '1px solid var(--border-default, #334155)',
    },
  },
  left: {
    tooltip: 'right-full top-1/2 -translate-y-1/2 mr-2',
    arrow: '-right-1 top-1/2 -translate-y-1/2',
    arrowBorderStyle: {
      borderTop: '1px solid var(--border-default, #334155)',
      borderRight: '1px solid var(--border-default, #334155)',
    },
  },
  right: {
    tooltip: 'left-full top-1/2 -translate-y-1/2 ml-2',
    arrow: '-left-1 top-1/2 -translate-y-1/2',
    arrowBorderStyle: {
      borderLeft: '1px solid var(--border-default, #334155)',
      borderBottom: '1px solid var(--border-default, #334155)',
    },
  },
};

export const Tooltip = ({
  content,
  icon,
  position = 'top',
  className = '',
  iconClassName = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef(null);
  const tooltipId = useId();
  const currentPosition = POSITION_STYLES[position] || POSITION_STYLES.top;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  const openTooltip = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const closeTooltip = () => {
    setIsOpen(false);
  };

  const toggleTooltip = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) {
      return;
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <div ref={tooltipRef} className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={openTooltip}
        onMouseLeave={closeTooltip}
        onClick={toggleTooltip}
        className={`inline-flex items-center justify-center focus:outline-none transition-colors ${iconClassName}`}
        style={{ color: 'var(--text-secondary, #6b7280)' }}
        aria-label="Ver informacion adicional"
        aria-describedby={isOpen ? tooltipId : undefined}
        aria-expanded={isOpen}
        disabled={disabled}
      >
        {icon || <Info className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`absolute z-50 w-64 p-3 text-xs rounded-lg shadow-lg ${currentPosition.tooltip} ${className}`}
          style={{
            backgroundColor: 'var(--bg-base, #111827)',
            color: 'var(--text-primary, #f1f5f9)',
            border: '1px solid var(--border-default, #334155)',
          }}
        >
          <div
            className={`absolute w-2 h-2 rotate-45 ${currentPosition.arrow}`}
            style={{
              backgroundColor: 'var(--bg-base, #111827)',
              ...currentPosition.arrowBorderStyle,
            }}
          />
          {content}
        </div>
      )}
    </div>
  );
};

Tooltip.propTypes = {
  content: PropTypes.node.isRequired,
  icon: PropTypes.node,
  position: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  className: PropTypes.string,
  iconClassName: PropTypes.string,
  disabled: PropTypes.bool,
};

export default Tooltip;