import PropTypes from 'prop-types';
import { Sparkles } from 'lucide-react';

export function VaultBrand({ compact = false, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)]">
        <Sparkles className="h-4 w-4" />
      </div>
      {!compact ? (
        <span className="bg-[var(--gradient-primary)] bg-clip-text text-xl font-bold text-transparent">
          Infinity Vault
        </span>
      ) : null}
    </div>
  );
}

VaultBrand.propTypes = {
  compact: PropTypes.bool,
  className: PropTypes.string,
};
