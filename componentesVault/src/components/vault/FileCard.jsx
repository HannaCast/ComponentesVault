import PropTypes from 'prop-types';
import { Share2, Sparkles } from 'lucide-react';
import { renderIcon } from '../../shared/components/vault-utils.js';

export function FileCard({ icon = 'file', title, type, size, date, shared = false, favorite = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-40 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 text-left shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]"
    >
      <div className="mb-8 flex items-start justify-between">
        {renderIcon(icon, { className: 'h-6 w-6 text-[var(--accent)]' })}
        {favorite ? <Sparkles className="h-4 w-4 text-[var(--accent-secondary)]" /> : null}
      </div>
      <h3 className="line-clamp-2 text-base font-semibold text-[var(--text-primary)]">{title}</h3>
      <div className="mt-7 flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <span>{type || size}</span>
        <span>{date}</span>
      </div>
      {shared ? <Share2 className="mt-4 h-4 w-4 text-[var(--accent-tertiary)]" /> : null}
    </button>
  );
}

FileCard.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
  title: PropTypes.node,
  type: PropTypes.node,
  size: PropTypes.node,
  date: PropTypes.node,
  shared: PropTypes.bool,
  favorite: PropTypes.bool,
  onClick: PropTypes.func,
};
