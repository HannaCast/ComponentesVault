import PropTypes from 'prop-types';
import { Bell, Sparkles } from 'lucide-react';
import { VaultSearchBar } from './VaultSearchBar.jsx';

export function VaultTopbar({ searchValue, onSearchChange, notificationCount = 0, className = '' }) {
  return (
    <header className={`flex h-16 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-6 ${className}`}>
      <VaultSearchBar value={searchValue} onChange={onSearchChange} className="max-w-md flex-1" />
      <div className="flex items-center gap-3">
        <button type="button" className="rounded-xl p-2 text-[var(--accent-secondary)] hover:bg-[var(--accent-subtle)]">
          <Sparkles className="h-5 w-5" />
        </button>
        <button type="button" className="relative rounded-xl p-2 text-[var(--accent)] hover:bg-[var(--accent-subtle)]">
          <Bell className="h-5 w-5" />
          {notificationCount ? (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-white">
              {notificationCount}
            </span>
          ) : null}
        </button>
      </div>
    </header>
  );
}

VaultTopbar.propTypes = {
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  notificationCount: PropTypes.number,
  className: PropTypes.string,
};
