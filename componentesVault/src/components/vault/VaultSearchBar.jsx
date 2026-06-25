import PropTypes from 'prop-types';
import { List, Search } from 'lucide-react';

export function VaultSearchBar({
  placeholder = 'Buscar archivos, carpetas...',
  value,
  onChange,
  onFilterClick,
  className = '',
}) {
  return (
    <div className={`flex h-11 items-center gap-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 shadow-sm ${className}`}>
      <Search className="h-4 w-4 text-[var(--text-secondary)]" />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
      />
      {onFilterClick ? (
        <button type="button" onClick={onFilterClick} className="rounded-lg p-1 text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)]">
          <List className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

VaultSearchBar.propTypes = {
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onFilterClick: PropTypes.func,
  className: PropTypes.string,
};
