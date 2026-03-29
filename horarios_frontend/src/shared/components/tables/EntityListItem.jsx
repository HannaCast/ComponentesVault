import React from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { Switch } from '@shared/components/inputs/Switch';

/**
 * EntityListItem
 *
 * Props:
 * - icon: Componente de icono principal a renderizar (ej. BookOpen).
 * - title: Titulo principal del item.
 * - subtitle: Texto secundario opcional.
 * - metaItems: Lista de textos cortos para mostrar en linea, separados por punto.
 * - isActive: Valor booleano opcional para estado activo/inactivo.
 * - activeText: Etiqueta cuando isActive=true.
 * - inactiveText: Etiqueta cuando isActive=false.
 * - onToggleStatus: Callback opcional para cambiar estado (habilita el switch).
 * - onDelete: Callback opcional para accion eliminar.
 * - onContentClick: Callback opcional al hacer click en la seccion izquierda.
 */
export const EntityListItem = ({
  icon: Icon,
  title,
  subtitle,
  metaItems = [],
  isActive,
  activeText = 'Activo',
  inactiveText = 'Inactivo',
  onToggleStatus,
  onDelete,
  onContentClick,
  showBottomBorder = false,
}) => {
  const visibleMetaItems = metaItems.filter(Boolean);
  
  return (
    <div
      className="p-4 transition-colors hover:opacity-75"
      style={{
        backgroundColor: 'var(--bg-elevated, #ffffff)',
        borderBottom: showBottomBorder ? '1px solid var(--border-subtle, #e5e7eb)' : 'none',
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div
          className={`flex-1 ${onContentClick ? 'cursor-pointer' : ''}`}
          onClick={onContentClick}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--primary-100, rgba(37, 99, 235, 0.1))' }}
            >
              {Icon ? <Icon className="w-5 h-5" style={{ color: 'var(--primary-color, #2563eb)' }} /> : null}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-medium truncate" style={{ color: 'var(--text-primary, #111827)' }}>
                {title}
              </h3>

              {subtitle ? (
                <p className="text-sm mt-1 truncate" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                  {subtitle}
                </p>
              ) : null}

              {visibleMetaItems.length > 0 ? (
                <div className="flex items-center gap-2 text-sm mt-1" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                  {visibleMetaItems.map((item, idx) => (
                    <React.Fragment key={`${item}-${idx}`}>
                      {idx > 0 ? <span>•</span> : null}
                      <span className="truncate">{item}</span>
                    </React.Fragment>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                    {isActive ? activeText : inactiveText}
                </span>
                <Switch checked={isActive} onCheckedChange={onToggleStatus} />
            </div>

          {onDelete ? (
            <ActionButton
              icon={Trash2}
              label=""
              onClick={onDelete}
              variant="secondary"
              size="medium"
              fullWidth={false}
              customStyle={{ padding: '0.375rem' }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
