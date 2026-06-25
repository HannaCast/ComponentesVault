import PropTypes from 'prop-types';

export function CascadingSelectableListField({ groups = [], value, onChange, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {groups.map((group) => (
        <div key={group.label} className="rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4">
          <p className="mb-3 text-sm font-bold text-[var(--text-primary)]">{group.label}</p>
          <div className="space-y-2">
            {group.options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange?.(option.value)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${value === option.value ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'}`}
              >
                <span>{option.label}</span>
                {option.description ? <span className="text-xs text-[var(--text-secondary)]">{option.description}</span> : null}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

CascadingSelectableListField.propTypes = {
  groups: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.node.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.node.isRequired,
      description: PropTypes.node,
    })).isRequired,
  })),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  className: PropTypes.string,
};