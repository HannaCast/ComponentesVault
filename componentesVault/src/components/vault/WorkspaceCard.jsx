import PropTypes from 'prop-types';
import { MoreVertical, Users } from 'lucide-react';
import { VaultIconBadge } from './VaultIconBadge.jsx';

export function WorkspaceCard({ icon = Users, title, description, meta, role, onMenuClick }) {
  return (
    <article className="rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-card)]">
      <div className="mb-8 flex items-start justify-between">
        <VaultIconBadge icon={icon} />
        {onMenuClick ? (
          <button type="button" onClick={onMenuClick} className="rounded-lg p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]">
            <MoreVertical className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <h3 className="font-bold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-5 line-clamp-2 text-sm text-[var(--text-secondary)]">{description}</p>
      <div className="mt-7 flex items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
        <span>{meta}</span>
        {role ? <span className="rounded-full bg-[var(--accent-subtle)] px-2 py-1 font-semibold text-[var(--accent)]">{role}</span> : null}
      </div>
    </article>
  );
}

WorkspaceCard.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
  title: PropTypes.node,
  description: PropTypes.node,
  meta: PropTypes.node,
  role: PropTypes.node,
  onMenuClick: PropTypes.func,
};
