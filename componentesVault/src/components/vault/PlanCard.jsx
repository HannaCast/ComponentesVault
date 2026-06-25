import PropTypes from 'prop-types';
import { Check } from 'lucide-react';
import { VaultButton } from '../../shared/inputs/ActionButton.jsx';

export function PlanCard({ name, price, period = '/mes', features = [], selected = false, actionLabel = 'Seleccionar', onAction }) {
  return (
    <article className={`rounded-[var(--radius-card)] border bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-card)] ${selected ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]' : 'border-[var(--border-default)]'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">{name}</h3>
          <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
            {price}<span className="text-sm font-medium text-[var(--text-secondary)]">{period}</span>
          </p>
        </div>
        {selected ? <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-white">Plan actual</span> : null}
      </div>
      <ul className="mt-6 space-y-3">
        {features.map((feature) => (
          <li key={String(feature)} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
            <Check className="h-4 w-4 text-emerald-500" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <VaultButton className="mt-7" fullWidth disabled={selected} variant={selected ? 'secondary' : 'primary'} onClick={onAction}>
        {selected ? 'Plan actual' : actionLabel}
      </VaultButton>
    </article>
  );
}

PlanCard.propTypes = {
  name: PropTypes.node,
  price: PropTypes.node,
  period: PropTypes.node,
  features: PropTypes.arrayOf(PropTypes.node),
  selected: PropTypes.bool,
  actionLabel: PropTypes.node,
  onAction: PropTypes.func,
};
