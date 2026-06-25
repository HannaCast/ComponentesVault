import PropTypes from 'prop-types';
import { VaultIconBadge } from './VaultIconBadge.jsx';
import { StorageUsage } from './StorageUsage.jsx';

export function MetricCard({ icon, value, label, detail, progress }) {
  return (
    <article className="rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-card)]">
      <VaultIconBadge icon={icon} className="mb-8" />
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      <p className="mt-4 text-sm text-[var(--text-secondary)]">{label}</p>
      {detail ? <p className="mt-2 text-xs text-[var(--text-secondary)]">{detail}</p> : null}
      {typeof progress === 'number' ? <StorageUsage percent={progress} className="mt-5" /> : null}
    </article>
  );
}

MetricCard.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
  value: PropTypes.node,
  label: PropTypes.node,
  detail: PropTypes.node,
  progress: PropTypes.number,
};
