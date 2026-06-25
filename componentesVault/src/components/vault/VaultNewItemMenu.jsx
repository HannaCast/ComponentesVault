import PropTypes from 'prop-types';
import { VaultIconBadge } from './VaultIconBadge.jsx';

export function VaultNewItemMenu({ items = [], className = '' }) {
  return (
    <div className={`overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] ${className}`}>
      {items.map((item) => (
        <button
          key={item.key || String(item.label)}
          type="button"
          onClick={item.onClick}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-surface)]"
        >
          <VaultIconBadge icon={item.icon} tone={item.tone || 'neutral'} className="h-9 w-9" />
          <span>
            <span className="block text-sm font-bold text-[var(--text-primary)]">{item.label}</span>
            {item.description ? <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">{item.description}</span> : null}
          </span>
        </button>
      ))}
    </div>
  );
}

VaultNewItemMenu.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string,
    label: PropTypes.node.isRequired,
    description: PropTypes.node,
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
    tone: PropTypes.oneOf(['primary', 'cyan', 'purple', 'neutral', 'danger']),
    onClick: PropTypes.func,
  })),
  className: PropTypes.string,
};
