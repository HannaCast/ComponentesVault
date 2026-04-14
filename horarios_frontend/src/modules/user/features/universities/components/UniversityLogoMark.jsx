import React from 'react';
import PropTypes from 'prop-types';
import { School } from 'lucide-react';
import { resolveMediaUrl } from '../utils/resolveMediaUrl';

const sizeClass = {
  md: {
    box: 'w-14 h-14 sm:w-16 sm:h-16',
    icon: 'w-7 h-7 sm:w-8 sm:h-8',
  },
  lg: {
    box: 'w-16 h-16 sm:w-20 sm:h-20',
    icon: 'w-8 h-8 sm:w-10 sm:h-10',
  },
};

/**
 * Logo de universidad o icono por defecto (escuela).
 */
export const UniversityLogoMark = ({
  imageUrl,
  name,
  size = 'md',
  className = '',
}) => {
  const src = resolveMediaUrl(imageUrl);
  const sc = sizeClass[size] || sizeClass.md;

  return (
    <div
      className={`${sc.box} rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-[var(--border-default,#e5e7eb)] ${className}`}
      style={{
        backgroundColor: src
          ? 'var(--bg-elevated,#ffffff)'
          : 'var(--accent-subtle, #dbeafe)',
        color: src ? undefined : 'var(--accent, #2563eb)',
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name ? `Logo de ${name}` : 'Logo de la universidad'}
          className="w-full h-full object-contain p-1"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <School className={sc.icon} aria-hidden />
      )}
    </div>
  );
};

UniversityLogoMark.propTypes = {
  imageUrl: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.oneOf(['md', 'lg']),
  className: PropTypes.string,
};
