import PropTypes from 'prop-types';

const LEGACY_SIZE_MAP = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
};

const resolveVariant = (variant) => {
  if (variant === 'user' || variant === 'default') {
    return 'primary';
  }

  if (variant === 'ghost') {
    return 'outline';
  }

  if (variant === 'danger') {
    return 'danger';
  }

  return ['primary', 'secondary', 'outline'].includes(variant) ? variant : 'secondary';
};

export function ActionButton({
  children,
  label,
  icon: Icon,
  onClick,
  variant = 'secondary',
  colorVariant = 'user',
  size = 'medium',
  align = 'center',
  iconPosition = 'left',
  iconSize,
  className = '',
  fullWidth = true,
  disabled = false,
  loading = false,
  loadingLabel = 'Cargando...',
  customStyle,
  customHoverStyle,
  customBackgroundColor,
  customTextColor,
  type = 'button',
  ...props
}) {
  const isBlocked = disabled || loading;
  const resolvedVariant = resolveVariant(variant);
  const resolvedSize = LEGACY_SIZE_MAP[size] || size;
  const normalizedColorVariant = colorVariant === 'default' ? 'default' : 'user';
  const useSystemColors = normalizedColorVariant === 'default' || variant === 'default';

  const palette = useSystemColors
    ? {
        accent: 'var(--system-accent, var(--accent, #2563eb))',
        accentHover: 'var(--system-accent-hover, var(--accent-hover, #1d4ed8))',
        accentSubtle: 'var(--system-accent-subtle, var(--accent-subtle, #eff6ff))',
        textOnAccent: 'var(--system-text-on-accent, #ffffff)',
        outlineBg: 'var(--system-button-outline-bg, transparent)',
        outlineText: 'var(--system-button-outline-text, var(--text-primary, #111827))',
        outlineBorder: 'var(--system-button-outline-border, var(--border-strong, #9ca3af))',
        outlineHoverBg: 'var(--system-button-outline-hover-bg, var(--system-accent-subtle, var(--accent-subtle, #eff6ff)))',
        outlineHoverBorder: 'var(--system-button-outline-hover-border, var(--system-accent, var(--accent, #2563eb)))',
        outlineHoverText: 'var(--system-button-outline-hover-text, var(--text-primary, #111827))',
        secondaryBorder: 'var(--system-secondary-border, var(--border-default, #d1d5db))',
        secondaryHoverBorder: 'var(--system-secondary-hover-border, var(--border-strong, #9ca3af))',
      }
    : {
        accent: 'var(--accent, #2563eb)',
        accentHover: 'var(--accent-hover, #1d4ed8)',
        accentSubtle: 'var(--accent-subtle, #eff6ff)',
        textOnAccent: 'var(--text-on-accent, #ffffff)',
        outlineBg: 'var(--button-outline-bg, transparent)',
        outlineText: 'var(--button-outline-text, var(--text-primary, #111827))',
        outlineBorder: 'var(--button-outline-border, var(--border-strong, #9ca3af))',
        outlineHoverBg: 'var(--button-outline-hover-bg, var(--accent-subtle, #eff6ff))',
        outlineHoverBorder: 'var(--button-outline-hover-border, var(--accent, #2563eb))',
        outlineHoverText: 'var(--button-outline-hover-text, var(--text-primary, #111827))',
        secondaryBorder: 'var(--border-default, #d1d5db)',
        secondaryHoverBorder: 'var(--border-strong, #9ca3af)',
      };

  const sizeConfig = {
    small: { padding: '0.375rem 0.625rem', fontSize: '0.8125rem', gap: '0.375rem', iconSize: iconSize || 16 },
    medium: { padding: '0.5rem 0.75rem', fontSize: '0.875rem', gap: '0.5rem', iconSize: iconSize || 18 },
    large: { padding: '0.75rem 1rem', fontSize: '1rem', gap: '0.625rem', iconSize: iconSize || 22 },
    hero: { padding: '1rem 2rem', fontSize: '1rem', gap: '0.625rem', iconSize: iconSize || 22 },
  };

  const currentSize = sizeConfig[resolvedSize] || sizeConfig.medium;
  const isPrimary = resolvedVariant === 'primary';
  const isSecondary = resolvedVariant === 'secondary';
  const isOutline = resolvedVariant === 'outline';
  const isDanger = resolvedVariant === 'danger';

  const baseStyles = {
    display: 'inline-flex',
    width: fullWidth ? '100%' : undefined,
    alignItems: 'center',
    justifyContent: align === 'center' ? 'center' : 'flex-start',
    gap: currentSize.gap,
    padding: currentSize.padding,
    fontSize: currentSize.fontSize,
    fontWeight: '600',
    borderRadius: '0.5rem',
    border: '1px solid transparent',
    cursor: isBlocked ? 'not-allowed' : 'pointer',
    transition: 'all 150ms ease',
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    opacity: isBlocked ? 0.6 : 1,
  };

  let variantStyles;
  if (isPrimary) {
    variantStyles = {
      backgroundColor: customBackgroundColor || palette.accent,
      color: customTextColor || palette.textOnAccent,
    };
  } else if (isOutline) {
    variantStyles = {
      backgroundColor: palette.outlineBg,
      color: palette.outlineText,
      borderColor: palette.outlineBorder,
    };
  } else if (isDanger) {
    variantStyles = {
      backgroundColor: 'var(--error, #ef4444)',
      color: 'white',
      borderColor: 'var(--error, #ef4444)',
    };
  } else {
    variantStyles = {
      backgroundColor: 'transparent',
      color: 'var(--text-primary, #111827)',
      borderColor: palette.secondaryBorder,
    };
  }

  const styles = customStyle ? { ...baseStyles, ...variantStyles, ...customStyle } : { ...baseStyles, ...variantStyles };
  const content = children ?? label;

  const applyStyleObject = (target, styleObject) => {
    if (!styleObject) return;
    Object.entries(styleObject).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        target.style[key] = value;
      }
    });
  };

  const handleHover = (event) => {
    if (isBlocked) return;

    if (isPrimary) {
      if (customBackgroundColor) {
        event.currentTarget.style.opacity = '0.9';
      } else {
        event.currentTarget.style.backgroundColor = palette.accentHover;
      }
    } else if (isOutline) {
      event.currentTarget.style.backgroundColor = palette.outlineHoverBg;
      event.currentTarget.style.borderColor = palette.outlineHoverBorder;
      event.currentTarget.style.color = palette.outlineHoverText;
    } else if (isSecondary) {
      event.currentTarget.style.backgroundColor = palette.accentSubtle;
      event.currentTarget.style.borderColor = palette.secondaryHoverBorder;
    } else if (isDanger) {
      event.currentTarget.style.filter = 'brightness(0.95)';
    }

    applyStyleObject(event.currentTarget, customHoverStyle);
  };

  const handleHoverOut = (event) => {
    if (isBlocked) return;

    if (isPrimary) {
      event.currentTarget.style.opacity = '1';
      if (!customBackgroundColor) {
        event.currentTarget.style.backgroundColor = palette.accent;
      }
    } else if (isOutline) {
      event.currentTarget.style.backgroundColor = palette.outlineBg;
      event.currentTarget.style.borderColor = palette.outlineBorder;
      event.currentTarget.style.color = palette.outlineText;
    } else if (isSecondary) {
      event.currentTarget.style.backgroundColor = 'transparent';
      event.currentTarget.style.borderColor = palette.secondaryBorder;
    } else if (isDanger) {
      event.currentTarget.style.filter = 'none';
    }

    if (customHoverStyle) {
      applyStyleObject(event.currentTarget, {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        border: styles.border,
        borderColor: styles.borderColor,
        opacity: String(styles.opacity ?? 1),
      });
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
      {...props}
    >
      {iconPosition === 'left' && renderIcon()}
      {loading ? loadingLabel : content}
      {iconPosition === 'right' && renderIcon()}
    </button>
  );
}

ActionButton.propTypes = {
  children: PropTypes.node,
  label: PropTypes.node,
  icon: PropTypes.elementType,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost', 'danger', 'user', 'default']),
  colorVariant: PropTypes.oneOf(['user', 'default']),
  size: PropTypes.oneOf(['small', 'medium', 'large', 'hero', 'sm', 'md', 'lg']),
  align: PropTypes.oneOf(['center', 'left']),
  iconPosition: PropTypes.oneOf(['left', 'right']),
  iconSize: PropTypes.number,
  className: PropTypes.string,
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  loadingLabel: PropTypes.node,
  customStyle: PropTypes.object,
  customHoverStyle: PropTypes.object,
  customBackgroundColor: PropTypes.string,
  customTextColor: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export { ActionButton as VaultButton };