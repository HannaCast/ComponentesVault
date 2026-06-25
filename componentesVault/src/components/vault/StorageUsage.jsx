import PropTypes from 'prop-types';
import { HardDrive } from 'lucide-react';

export function StorageUsage({ label, percent = 0, className = '' }) {
  const normalizedPercent = Math.min(Math.max(percent, 0), 100);

  return (
    <div className={className}>
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
        <HardDrive className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--accent-subtle)]">
        <div className="h-full rounded-full bg-[var(--gradient-primary)]" style={{ width: `${normalizedPercent}%` }} />
      </div>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{normalizedPercent}% usado</p>
    </div>
  );
}

StorageUsage.propTypes = {
  label: PropTypes.node,
  percent: PropTypes.number,
  className: PropTypes.string,
};
