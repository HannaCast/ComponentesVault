import React from 'react';
import PropTypes from 'prop-types';

export const Switch = ({ checked, onCheckedChange, disabled = false }) => {
  return (
    <button
      onClick={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        checked
          ? 'bg-green-600 focus:ring-green-500'
          : 'bg-gray-300 focus:ring-gray-500'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
};

Switch.propTypes = {
  checked: PropTypes.bool,
  onCheckedChange: PropTypes.func,
  disabled: PropTypes.bool,
};
