import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { Settings, X } from 'lucide-react';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { Tooltip } from '@shared/components/Tooltip';

export const ScheduleGenerationOptionsModal = ({
  isOpen,
  onClose,
  onGenerate,
  isGenerating = false,
  initialParameters = null,
}) => {
  const [allowMultipleTeachers, setAllowMultipleTeachers] = useState(false);
  const [randomizeGeneration, setRandomizeGeneration] = useState(false);
  const [randomSeed, setRandomSeed] = useState('');

  // Inicializar estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      // Si hay parametros iniciales (ej. regenerar), pre-seleccionar opciones
      if (initialParameters) {
        // Por defecto `allowMultipleTeachers` es false en el frontend,
        // pero si en initialParameters viene definido, usar ese valor.
        setAllowMultipleTeachers(
          initialParameters.allow_multiple_teachers_per_group_subject ?? false
        );
        setRandomizeGeneration(initialParameters.randomize_generation ?? false);
        // Dejar siempre vacia la semilla para forzar una nueva generacion aleatoria
        setRandomSeed('');
      } else {
        // Valores por defecto al abrir modal sin estado (Generar por primera vez)
        setAllowMultipleTeachers(false);
        setRandomizeGeneration(false);
        setRandomSeed('');
      }
    }
  }, [isOpen, initialParameters]);

  if (!isOpen) return null;

  const handleCloseOnlyModal = (event) => {
    if (isGenerating) return;
    event?.stopPropagation();
    onClose?.();
  };

  const handleGenerate = async () => {
    const parameters = {
      allow_multiple_teachers_per_group_subject: allowMultipleTeachers,
      randomize_generation: randomizeGeneration,
    };

    if (randomizeGeneration && randomSeed.trim() !== '') {
      const parsedSeed = parseInt(randomSeed.trim(), 10);
      if (!isNaN(parsedSeed) && parsedSeed >= 0) {
        parameters.random_seed = parsedSeed;
      }
    }

    await onGenerate(parameters);
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-options-modal-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/45 border-0 p-0 cursor-default"
        onClick={handleCloseOnlyModal}
        aria-label="Cerrar modal"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-xl shadow-xl flex flex-col"
        style={{
          backgroundColor: 'var(--bg-elevated, #ffffff)',
          border: '1px solid var(--border-default, #d1d5db)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--border-subtle, #e5e7eb)' }}>
          <div className="flex items-center gap-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--accent-subtle, #eff6ff)' }}
            >
              <Settings className="h-4 w-4" style={{ color: 'var(--accent, #2563eb)' }} aria-hidden />
            </span>
            <h2
              id="schedule-options-modal-title"
              className="text-base font-semibold"
              style={{ color: 'var(--text-primary, #111827)' }}
            >
              Opciones de Generación de Horario
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCloseOnlyModal}
            disabled={isGenerating}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            style={{ color: 'var(--text-secondary, #6b7280)' }}
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 flex flex-col gap-5">
          <p className="text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
            Configura los parámetros para la creación del borrador de horarios.
          </p>

          <div className="flex flex-col gap-4">
            {/* Opcion: Multiples profesores */}
            <div className="flex items-start gap-3">
              <div className="flex items-center h-5 mt-0.5">
                <input
                  id="opt-multiple-teachers"
                  type="checkbox"
                  checked={allowMultipleTeachers}
                  onChange={(e) => setAllowMultipleTeachers(e.target.checked)}
                  disabled={isGenerating}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label
                  htmlFor="opt-multiple-teachers"
                  className="text-sm font-medium flex items-center gap-2 cursor-pointer select-none"
                  style={{ color: 'var(--text-primary, #111827)' }}
                >
                  Múltiples profesores por grupo/materia
                  <Tooltip 
                    content="Permite que una misma materia en un mismo grupo sea impartida por varios profesores en lugar de forzar que sea el mismo." 
                  />
                </label>
              </div>
            </div>

            {/* Opcion: Aleatorio */}
            <div className="flex items-start gap-3">
              <div className="flex items-center h-5 mt-0.5">
                <input
                  id="opt-randomize"
                  type="checkbox"
                  checked={randomizeGeneration}
                  onChange={(e) => setRandomizeGeneration(e.target.checked)}
                  disabled={isGenerating}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col w-full">
                <label
                  htmlFor="opt-randomize"
                  className="text-sm font-medium flex items-center gap-2 cursor-pointer select-none"
                  style={{ color: 'var(--text-primary, #111827)' }}
                >
                  Generación aleatoria
                  <Tooltip 
                    content="Activa el uso de una semilla para desempatar asignaciones de forma aleatoria. Útil si deseas resultados variados." 
                  />
                </label>
                
                {randomizeGeneration && (
                  <div className="mt-3 w-full animate-in fade-in slide-in-from-top-2 duration-200">
                    <label 
                      htmlFor="opt-seed" 
                      className="block text-xs font-medium mb-1"
                      style={{ color: 'var(--text-secondary, #6b7280)' }}
                    >
                      Semilla numérica (Opcional)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="opt-seed"
                        type="number"
                        min="0"
                        value={randomSeed}
                        onChange={(e) => setRandomSeed(e.target.value)}
                        placeholder="Ej: 12345"
                        disabled={isGenerating}
                        className="w-full sm:w-1/2 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          backgroundColor: 'var(--bg-base, #ffffff)',
                          borderColor: 'var(--border-default, #d1d5db)',
                          color: 'var(--text-primary, #111827)'
                        }}
                      />
                      <Tooltip 
                        content="Si dejas este campo vacío, el sistema generará una semilla automáticamente. Usa el mismo número para reproducir resultados." 
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 border-t px-5 py-4" style={{ borderColor: 'var(--border-subtle, #e5e7eb)' }}>
          <div className="w-full sm:w-auto order-2 sm:order-1">
            <ActionButton
              label="Cancelar"
              variant="outline"
              onClick={handleCloseOnlyModal}
              disabled={isGenerating}
              fullWidth={true}
            />
          </div>
          <div className="w-full sm:w-auto order-1 sm:order-2">
            <ActionButton
              label="Generar Horario"
              variant="primary"
              onClick={handleGenerate}
              loading={isGenerating}
              loadingLabel="Generando..."
              disabled={isGenerating}
              fullWidth={true}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

ScheduleGenerationOptionsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onGenerate: PropTypes.func.isRequired,
  isGenerating: PropTypes.bool,
  initialParameters: PropTypes.object,
};
