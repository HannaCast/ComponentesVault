import { createElement, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Bell,
  Check,
  ChevronLeft,
  Cloud,
  Eye,
  EyeOff,
  File,
  Folder,
  Grid3X3,
  HardDrive,
  List,
  Lock,
  Mail,
  MoreVertical,
  Plus,
  Search,
  Share2,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';

const iconMap = {
  file: File,
  folder: Folder,
  share: Share2,
  storage: HardDrive,
  users: Users,
  upload: Upload,
  cloud: Cloud,
  lock: Lock,
  mail: Mail,
  shield: Shield,
};

const resolveIcon = (icon) => {
  if (!icon) return null;
  if (typeof icon === 'string') return iconMap[icon] || File;
  return icon;
};

const renderIcon = (icon, props) => {
  const Icon = resolveIcon(icon);
  return Icon ? createElement(Icon, props) : null;
};

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

export function VaultIconBadge({ icon, tone = 'primary', className = '' }) {
  const toneClass = {
    primary: 'bg-[var(--gradient-primary)] text-white',
    cyan: 'bg-cyan-50 text-cyan-500',
    purple: 'bg-violet-50 text-violet-600',
    neutral: 'bg-slate-100 text-slate-600',
    danger: 'bg-red-50 text-red-500',
  }[tone] || 'bg-[var(--gradient-primary)] text-white';

  return (
    <span className={`inline-grid h-10 w-10 place-items-center rounded-xl ${toneClass} ${className}`}>
      {renderIcon(icon, { className: 'h-5 w-5' })}
    </span>
  );
}

VaultIconBadge.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
  tone: PropTypes.oneOf(['primary', 'cyan', 'purple', 'neutral', 'danger']),
  className: PropTypes.string,
};

export function VaultButton({
  children,
  icon: Icon,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}) {
  const variantClass = {
    primary: 'border-transparent bg-[var(--gradient-primary)] text-white shadow-[var(--shadow-soft)] hover:opacity-95',
    secondary: 'border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)]',
    ghost: 'border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)]',
    danger: 'border-transparent bg-red-500 text-white hover:bg-red-600',
  }[variant] || '';

  const sizeClass = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-sm',
    lg: 'h-12 px-5 text-base',
  }[size] || 'h-11 px-4 text-sm';

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] border font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${sizeClass} ${variantClass} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

VaultButton.propTypes = {
  children: PropTypes.node,
  icon: PropTypes.elementType,
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export function VaultTextField({
  label,
  icon,
  error,
  helperText,
  type = 'text',
  className = '',
  inputClassName = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword && showPassword ? 'text' : type;

  return (
    <label className={`block text-sm font-semibold text-[var(--text-primary)] ${className}`}>
      {label ? <span className="mb-2 block">{label}</span> : null}
      <span className={`flex h-11 items-center gap-3 rounded-[var(--radius-control)] border bg-[var(--bg-elevated)] px-3 transition-all focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_3px_var(--accent-subtle)] ${error ? 'border-[var(--error)]' : 'border-[var(--border-default)]'}`}>
        {renderIcon(icon, { className: 'h-4 w-4 text-[var(--text-secondary)]' })}
        <input
          type={effectiveType}
          className={`min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--text-primary)] outline-none placeholder:font-normal placeholder:text-[var(--text-secondary)] ${inputClassName}`}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="rounded-lg p-1 text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)]"
            aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : null}
      </span>
      {error ? <span className="mt-1.5 block text-xs text-[var(--error)]">{error}</span> : null}
      {!error && helperText ? <span className="mt-1.5 block text-xs text-[var(--text-secondary)]">{helperText}</span> : null}
    </label>
  );
}

VaultTextField.propTypes = {
  label: PropTypes.node,
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
  error: PropTypes.node,
  helperText: PropTypes.node,
  type: PropTypes.string,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
};

export function VaultFeatureCard({ icon = 'cloud', title, description, className = '' }) {
  return (
    <article className={`rounded-[var(--radius-card)] border border-white/20 bg-white/10 p-5 text-white shadow-lg backdrop-blur ${className}`}>
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15 text-white">
          {renderIcon(icon, { className: 'h-5 w-5' })}
        </span>
        <div>
          <h3 className="font-bold">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/80">{description}</p>
        </div>
      </div>
    </article>
  );
}

VaultFeatureCard.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
  title: PropTypes.node,
  description: PropTypes.node,
  className: PropTypes.string,
};

export function VaultNewItemMenu({ items = [], className = '' }) {
  return (
    <div className={`overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] ${className}`}>
      {items.map((item) => (
        <button
          key={item.key || String(item.label)}
          type="button"
          onClick={item.onClick}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-surface)]"
        >
          <VaultIconBadge icon={item.icon} tone={item.tone || 'neutral'} className="h-9 w-9" />
          <span>
            <span className="block text-sm font-bold text-[var(--text-primary)]">{item.label}</span>
            {item.description ? (
              <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">{item.description}</span>
            ) : null}
          </span>
        </button>
      ))}
    </div>
  );
}

VaultNewItemMenu.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string,
    label: PropTypes.node.isRequired,
    description: PropTypes.node,
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
    tone: PropTypes.oneOf(['primary', 'cyan', 'purple', 'neutral', 'danger']),
    onClick: PropTypes.func,
  })),
  className: PropTypes.string,
};

export function VaultSearchBar({
  placeholder = 'Buscar archivos, carpetas...',
  value,
  onChange,
  onFilterClick,
  className = '',
}) {
  return (
    <div className={`flex h-11 items-center gap-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 shadow-sm ${className}`}>
      <Search className="h-4 w-4 text-[var(--text-secondary)]" />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
      />
      {onFilterClick ? (
        <button type="button" onClick={onFilterClick} className="rounded-lg p-1 text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)]">
          <List className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

VaultSearchBar.propTypes = {
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onFilterClick: PropTypes.func,
  className: PropTypes.string,
};

export function VaultSidebar({
  items = [],
  activeKey,
  onSelect,
  storageLabel = '25 GB de 100 GB',
  storagePercent = 25,
  className = '',
}) {
  return (
    <aside className={`flex h-full w-64 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)] ${className}`}>
      <div className="flex h-16 items-center justify-between px-4">
        <VaultBrand />
        <button type="button" className="rounded-lg p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]">
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 pb-3">
        <VaultButton icon={Plus} fullWidth>Nuevo</VaultButton>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const isActive = item.key === activeKey;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect?.(item.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-[var(--gradient-primary)] text-white shadow-[var(--shadow-soft)]'
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              {renderIcon(item.icon, { className: 'h-5 w-5' })}
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <StorageUsage label={storageLabel} percent={storagePercent} className="m-4" />
    </aside>
  );
}

VaultSidebar.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.node.isRequired,
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
  })),
  activeKey: PropTypes.string,
  onSelect: PropTypes.func,
  storageLabel: PropTypes.node,
  storagePercent: PropTypes.number,
  className: PropTypes.string,
};

export function VaultTopbar({ searchValue, onSearchChange, notificationCount = 0, className = '' }) {
  return (
    <header className={`flex h-16 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-6 ${className}`}>
      <VaultSearchBar value={searchValue} onChange={onSearchChange} className="max-w-md flex-1" />
      <div className="flex items-center gap-3">
        <button type="button" className="rounded-xl p-2 text-[var(--accent-secondary)] hover:bg-[var(--accent-subtle)]">
          <Sparkles className="h-5 w-5" />
        </button>
        <button type="button" className="relative rounded-xl p-2 text-[var(--accent)] hover:bg-[var(--accent-subtle)]">
          <Bell className="h-5 w-5" />
          {notificationCount ? (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-white">
              {notificationCount}
            </span>
          ) : null}
        </button>
      </div>
    </header>
  );
}

VaultTopbar.propTypes = {
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  notificationCount: PropTypes.number,
  className: PropTypes.string,
};

export function StorageUsage({ label, percent = 0, className = '' }) {
  const normalizedPercent = Math.min(Math.max(percent, 0), 100);

  return (
    <div className={className}>
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
        <HardDrive className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--accent-subtle)]">
        <div className="h-full rounded-full bg-[var(--gradient-primary)]" style={{ width: `${normalizedPercent}%` }} />
      </div>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{normalizedPercent}% usado</p>
    </div>
  );
}

StorageUsage.propTypes = {
  label: PropTypes.node,
  percent: PropTypes.number,
  className: PropTypes.string,
};

export function MetricCard({ icon, value, label, detail, progress }) {
  return (
    <article className="rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-card)]">
      <VaultIconBadge icon={icon} className="mb-8" />
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      <p className="mt-4 text-sm text-[var(--text-secondary)]">{label}</p>
      {detail ? <p className="mt-2 text-xs text-[var(--text-secondary)]">{detail}</p> : null}
      {typeof progress === 'number' ? <StorageUsage percent={progress} className="mt-5" /> : null}
    </article>
  );
}

MetricCard.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
  value: PropTypes.node,
  label: PropTypes.node,
  detail: PropTypes.node,
  progress: PropTypes.number,
};

export function FileCard({ icon = 'file', title, type, size, date, shared = false, favorite = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-40 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 text-left shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]"
    >
      <div className="mb-8 flex items-start justify-between">
        {renderIcon(icon, { className: 'h-6 w-6 text-[var(--accent)]' })}
        {favorite ? <Sparkles className="h-4 w-4 text-[var(--accent-secondary)]" /> : null}
      </div>
      <h3 className="line-clamp-2 text-base font-semibold text-[var(--text-primary)]">{title}</h3>
      <div className="mt-7 flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <span>{type || size}</span>
        <span>{date}</span>
      </div>
      {shared ? <Share2 className="mt-4 h-4 w-4 text-[var(--accent-tertiary)]" /> : null}
    </button>
  );
}

FileCard.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
  title: PropTypes.node,
  type: PropTypes.node,
  size: PropTypes.node,
  date: PropTypes.node,
  shared: PropTypes.bool,
  favorite: PropTypes.bool,
  onClick: PropTypes.func,
};

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

export function WorkspaceCard({ icon = Users, title, description, meta, role, onMenuClick }) {
  return (
    <article className="rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-card)]">
      <div className="mb-8 flex items-start justify-between">
        <VaultIconBadge icon={icon} />
        {onMenuClick ? (
          <button type="button" onClick={onMenuClick} className="rounded-lg p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]">
            <MoreVertical className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <h3 className="font-bold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-5 line-clamp-2 text-sm text-[var(--text-secondary)]">{description}</p>
      <div className="mt-7 flex items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
        <span>{meta}</span>
        {role ? <span className="rounded-full bg-[var(--accent-subtle)] px-2 py-1 font-semibold text-[var(--accent)]">{role}</span> : null}
      </div>
    </article>
  );
}

WorkspaceCard.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
  title: PropTypes.node,
  description: PropTypes.node,
  meta: PropTypes.node,
  role: PropTypes.node,
  onMenuClick: PropTypes.func,
};

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
