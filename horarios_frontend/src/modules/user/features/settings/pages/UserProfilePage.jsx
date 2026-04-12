import { UserRound, Mail, Shield, BadgeCheck } from 'lucide-react';
import { PageSectionHeader } from '@shared/components/layout/PageSectionHeader';
import { SurfacePanel } from '@shared/components/layout/SurfacePanel';
import { InfoFieldCard } from '@shared/components/layout/InfoFieldCard';
import { LoadingStatePanel } from '@shared/components/layout/LoadingStatePanel';
import { useAccountSettings } from '../hooks/useAccountSettings';

const formatStatus = (status) => {
  if (status == null || status === '') {
    return '—';
  }
  return Number(status) === 1 ? 'Activo' : 'Inactivo';
};

const textOrDash = (value) => {
  if (value == null) return '—';
  const s = String(value).trim();
  return s || '—';
};

export const UserProfilePage = () => {
  const { profile, profileLoading, profileError } = useAccountSettings();

  return (
    <div className="space-y-6 w-full max-w-4xl">
      <PageSectionHeader
        title="Mi perfil"
        contextLabel="Datos de tu cuenta en el sistema"
      />

      {profileLoading ? (
        <LoadingStatePanel message="Cargando tu información..." />
      ) : null}

      {!profileLoading && profileError ? (
        <SurfacePanel className="border border-[var(--warning-border,#fcd34d)] bg-[var(--warning-subtle,#fffbeb)] text-[var(--warning-text,#92400e)]">
          <p className="text-sm">{profileError}</p>
        </SurfacePanel>
      ) : null}

      {!profileLoading && !profileError && profile ? (
        <SurfacePanel className="space-y-4">
          <div className="flex items-center gap-2">
            <UserRound className="w-5 h-5" style={{ color: 'var(--text-secondary, #6b7280)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary, #111827)' }}>
              Información personal
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoFieldCard
              icon={UserRound}
              label="Nombre"
              value={textOrDash(profile.name)}
            />
            <InfoFieldCard
              icon={UserRound}
              label="Primer apellido"
              value={textOrDash(profile.surname)}
            />
            <InfoFieldCard
              icon={UserRound}
              label="Segundo apellido"
              value={textOrDash(profile.last_name)}
            />
            <InfoFieldCard
              icon={Mail}
              label="Correo electrónico"
              value={textOrDash(profile.email)}
            />
            <InfoFieldCard
              icon={Shield}
              label="Rol"
              value={textOrDash(profile.role)}
            />
            <InfoFieldCard
              icon={BadgeCheck}
              label="Estado"
              value={formatStatus(profile.status)}
            />
          </div>
        </SurfacePanel>
      ) : null}
    </div>
  );
};
