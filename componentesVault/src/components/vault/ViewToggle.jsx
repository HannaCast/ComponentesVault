import PropTypes from 'prop-types';
import { Grid3X3, List } from 'lucide-react';

export function ViewToggle({ view = 'grid', onChange }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange?.('grid')} className={`rounded-lg p-2 ${view === 'grid' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'}`}>
        <Grid3X3 className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => onChange?.('list')} className={`rounded-lg p-2 ${view === 'list' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'}`}>
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}

ViewToggle.propTypes = {
  view: PropTypes.oneOf(['grid', 'list']),
  onChange: PropTypes.func,
};
