import PropTypes from 'prop-types';
import { renderIcon } from '../../shared/components/vault-utils.js';

export function VaultIconBadge({ icon, tone = 'primary', className = '' }) {
  const toneClass = {
    primary: 'bg-[var(--gradient-primary)] text-white',
    cyan: 'bg-cyan-50 text-cyan-500',
    purple: 'bg-violet-50 text-violet-600',
    neutral: 'bg-slate-100 text-slate-600',
    danger: 'bg-red-50 text-red-500',
  }[tone] || 'bg-[var(--gradient-primary)] text-white';

  return (
    <span className={`inline-grid h-10 w-10 place-items-center rounded-xl ${toneClass} ${className}`}>
      {renderIcon(icon, { className: 'h-5 w-5' })}
    </span>
  );
}

VaultIconBadge.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
  tone: PropTypes.oneOf(['primary', 'cyan', 'purple', 'neutral', 'danger']),
  className: PropTypes.string,
};
