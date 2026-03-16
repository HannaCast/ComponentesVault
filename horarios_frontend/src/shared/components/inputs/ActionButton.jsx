/**
 * ActionButton
 * Props:
 * - icon: Componente de icono (opcional).
 * - label: Texto del boton.
 * - onClick: Funcion a ejecutar en click.
 * - variant: 'primary' | 'secondary' | 'outline' (outline se trata como secundario).
 * - size: 'small' | 'medium' | 'large'.
 * - align: 'center' | 'left'.
 * - iconPosition: 'left' | 'right'.
 * - iconSize: Tamano del icono (opcional).
 * - className: Clases adicionales.
 * - disabled: Deshabilita el boton.
 * - loading: Muestra estado de carga.
 * - loadingLabel: Texto a mostrar cuando loading=true.
 * - customBackgroundColor: Color de fondo personalizado para variante primary.
 * - customTextColor: Color de texto personalizado para variante primary.
 * - type: Tipo HTML del boton (button | submit | reset).
 */
export function ActionButton({
  icon: Icon,
  label,
  onClick,
  variant = 'secondary',
  size = 'medium',
  align = 'center',
  iconPosition = 'left',
  iconSize,
  className = '',
  disabled = false,
  loading = false,
  loadingLabel = 'Cargando...',
  customBackgroundColor,
  customTextColor,
  type = 'button',
}) {
  const isBlocked = disabled || loading;
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary' || variant === 'outline';

  const sizeConfig = {
    small: {
      padding: '0.375rem 0.625rem',
      fontSize: '0.8125rem',
      gap: '0.375rem',
      iconSize: iconSize || 16,
    },
    medium: {
      padding: '0.5rem 0.75rem',
      fontSize: '0.875rem',
      gap: '0.5rem',
      iconSize: iconSize || 18,
    },
    large: {
      padding: '0.75rem 1rem',
      fontSize: '1rem',
      gap: '0.625rem',
      iconSize: iconSize || 22,
    },
  };

  const currentSize = sizeConfig[size] || sizeConfig.medium;

  const baseStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: align === 'center' ? 'center' : 'flex-start',
    gap: currentSize.gap,
    padding: currentSize.padding,
    fontSize: currentSize.fontSize,
    fontWeight: '500',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: isBlocked ? 'not-allowed' : 'pointer',
    transition: 'all 150ms ease',
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    opacity: isBlocked ? 0.6 : 1,
  };

  const variantStyles = isPrimary
    ? {
        backgroundColor: customBackgroundColor || 'var(--accent, #2563eb)',
        color: customTextColor || 'var(--text-on-accent, #ffffff)',
      }
    : {
        backgroundColor: 'transparent',
        color: 'var(--text-primary, #111827)',
        border: '1px solid var(--border-default, #d1d5db)',
      };

  const styles = { ...baseStyles, ...variantStyles };

  const handleHover = (e) => {
    if (isBlocked) return;

    if (isPrimary) {
      if (customBackgroundColor) {
        e.currentTarget.style.opacity = '0.9';
      } else {
        e.currentTarget.style.backgroundColor = 'var(--accent-hover, #1d4ed8)';
      }
    } else if (isSecondary) {
      e.currentTarget.style.backgroundColor = 'var(--accent-subtle, #eff6ff)';
      e.currentTarget.style.borderColor = 'var(--border-strong, #9ca3af)';
    }
  };

  const handleHoverOut = (e) => {
    if (isBlocked) return;

    if (isPrimary) {
      e.currentTarget.style.opacity = '1';
      if (!customBackgroundColor) {
        e.currentTarget.style.backgroundColor = 'var(--accent, #2563eb)';
      }
    } else if (isSecondary) {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.borderColor = 'var(--border-default, #d1d5db)';
    }
  };

  const renderIcon = () => {
    if (loading) {
      return (
        <svg className="animate-spin" style={{ width: currentSize.iconSize, height: currentSize.iconSize }} viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      );
    }

    return Icon ? <Icon size={currentSize.iconSize} /> : null;
  };

  return (
    <button
      type={type}
      onClick={isBlocked ? undefined : onClick}
      className={className}
      style={styles}
      onMouseEnter={handleHover}
      onMouseLeave={handleHoverOut}
      disabled={isBlocked}
      aria-busy={loading}
    >
      {iconPosition === 'left' && renderIcon()}
      {loading ? loadingLabel : label}
      {iconPosition === 'right' && renderIcon()}
    </button>
  );
}
