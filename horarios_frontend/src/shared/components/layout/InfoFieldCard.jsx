import React from 'react';
import PropTypes from 'prop-types';

export const InfoFieldCard = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div className="rounded-lg border px-4 py-3" style={{ borderColor: 'var(--border-default, #d1d5db)' }}>
      <div className="flex items-start gap-3">
        {Icon ? (
          <Icon className="w-4 h-4 mt-1" style={{ color: 'var(--text-secondary, #6b7280)' }} />
        ) : null}

        <div>
          <p className="text-xs" style={{ color: 'var(--text-secondary, #6b7280)' }}>
            {label}
          </p>
          <p className="font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

InfoFieldCard.propTypes = {
  icon: PropTypes.elementType,
  label: PropTypes.node.isRequired,
  value: PropTypes.node.isRequired,
};
