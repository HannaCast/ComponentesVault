import PropTypes from 'prop-types';
import { renderIcon } from '../../shared/components/vault-utils.js';

export function VaultFeatureCard({ icon = 'cloud', title, description, className = '' }) {
  return (
    <article className={`rounded-[var(--radius-card)] border border-white/20 bg-white/10 p-5 text-white shadow-lg backdrop-blur ${className}`}>
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15 text-white">
          {renderIcon(icon, { className: 'h-5 w-5' })}
        </span>
        <div>
          <h3 className="font-bold">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/80">{description}</p>
        </div>
      </div>
    </article>
  );
}

VaultFeatureCard.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
  title: PropTypes.node,
  description: PropTypes.node,
  className: PropTypes.string,
};
