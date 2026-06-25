import PropTypes from 'prop-types';
import { ChevronLeft, Plus } from 'lucide-react';
import { VaultButton } from '../../shared/inputs/ActionButton.jsx';
import { VaultBrand } from './VaultBrand.jsx';
import { StorageUsage } from './StorageUsage.jsx';
import { renderIcon } from '../../shared/components/vault-utils.js';

export function VaultSidebar({
  items = [],
  activeKey,
  onSelect,
  storageLabel = '25 GB de 100 GB',
  storagePercent = 25,
  className = '',
}) {
  return (
    <aside className={`flex h-full w-64 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)] ${className}`}>
      <div className="flex h-16 items-center justify-between px-4">
        <VaultBrand />
        <button type="button" className="rounded-lg p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]">
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 pb-3">
        <VaultButton icon={Plus} fullWidth>Nuevo</VaultButton>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const isActive = item.key === activeKey;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect?.(item.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-[var(--gradient-primary)] text-white shadow-[var(--shadow-soft)]'
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              {renderIcon(item.icon, { className: 'h-5 w-5' })}
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <StorageUsage label={storageLabel} percent={storagePercent} className="m-4" />
    </aside>
  );
}

VaultSidebar.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.node.isRequired,
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
  })),
  activeKey: PropTypes.string,
  onSelect: PropTypes.func,
  storageLabel: PropTypes.node,
  storagePercent: PropTypes.number,
  className: PropTypes.string,
};
