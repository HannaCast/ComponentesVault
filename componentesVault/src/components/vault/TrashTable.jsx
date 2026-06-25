import PropTypes from 'prop-types';
import { Trash2 } from 'lucide-react';
import { VaultButton } from '../../shared/inputs/ActionButton.jsx';

export function TrashTable({ items = [], onEmptyTrash }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-end border-b border-[var(--border-subtle)] p-4">
        {onEmptyTrash ? <VaultButton icon={Trash2} variant="danger" size="sm" onClick={onEmptyTrash}>Vaciar papelera</VaultButton> : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase text-[var(--text-secondary)]">
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="px-5 py-3 font-bold">Nombre</th>
              <th className="px-5 py-3 font-bold">Ubicacion original</th>
              <th className="px-5 py-3 font-bold">Eliminado por</th>
              <th className="px-5 py-3 font-bold">Fecha</th>
              <th className="px-5 py-3 font-bold">Dias rest.</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id || item.name} className="border-b border-[var(--border-subtle)] last:border-0">
                <td className="px-5 py-4 font-semibold text-[var(--text-primary)]">{item.name}</td>
                <td className="px-5 py-4 text-[var(--text-secondary)]">{item.location}</td>
                <td className="px-5 py-4 text-[var(--text-secondary)]">{item.deletedBy}</td>
                <td className="px-5 py-4 text-[var(--text-secondary)]">{item.date}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-[var(--accent-subtle)] px-2 py-1 text-xs font-bold text-[var(--accent)]">
                    {item.daysLeft}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

TrashTable.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.node,
    location: PropTypes.node,
    deletedBy: PropTypes.node,
    date: PropTypes.node,
    daysLeft: PropTypes.node,
  })),
  onEmptyTrash: PropTypes.func,
};
