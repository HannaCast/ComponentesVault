import React from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft } from 'lucide-react';

/**
 * Contenedor de página (dentro del layout principal): enlace volver y tarjeta blanca centrada.
 */
export const UniversityScreenShell = ({
  onBack,
  title,
  subtitle,
  children,
}) => (
  <div className="w-full max-w-5xl mx-auto pb-4">
    <div className="w-full">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent,#2563eb)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30 rounded"
      >
        <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden />
        Volver a Universidades
      </button>

      <div
        className="rounded-xl border border-[var(--border-default,#e5e7eb)] bg-[var(--bg-elevated,#ffffff)] px-5 py-6 sm:px-8 sm:py-8 shadow-[0_4px_24px_rgba(15,23,42,0.08)]"
      >
        <h1
          className="text-xl sm:text-2xl font-bold text-[var(--text-primary,#111827)] tracking-tight"
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm text-[var(--text-secondary,#6b7280)] mt-1.5">
            {subtitle}
          </p>
        ) : null}
        <div className="mt-6 sm:mt-8">{children}</div>
      </div>
    </div>
  </div>
);

UniversityScreenShell.propTypes = {
  onBack: PropTypes.func.isRequired,
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  children: PropTypes.node,
};
