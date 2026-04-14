import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UniversityDetail } from '../components/UniversityDetail';
import { UniversityScreenShell } from '../components/UniversityScreenShell';
import { useUniversities } from '../hooks/useUniversities';

export const UniversityViewPage = () => {
  const { universityId } = useParams();
  const navigate = useNavigate();
  const {
    universityProfile,
    profileLoading,
    fetchUniversityProfile,
    clearUniversityProfile,
  } = useUniversities();

  useEffect(() => {
    if (!universityId) {
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        await fetchUniversityProfile(universityId);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          toast.error('No se pudo cargar el perfil de la universidad.');
          navigate('/usuario/universidades', { replace: true });
        }
      }
    })();
    return () => {
      cancelled = true;
      clearUniversityProfile();
    };
  }, [universityId, fetchUniversityProfile, navigate, clearUniversityProfile]);

  const title = useMemo(() => {
    if (profileLoading) {
      return 'Cargando universidad…';
    }
    return universityProfile?.name || 'Universidad';
  }, [profileLoading, universityProfile?.name]);

  const subtitle = universityProfile?.short_name || null;

  const goToList = () => navigate('/usuario/universidades');
  const goToEdit = () => {
    if (universityId) {
      navigate(`/usuario/universidades/${universityId}/editar`);
    }
  };

  return (
    <UniversityScreenShell
      onBack={goToList}
      title={title}
      subtitle={subtitle}
    >
      <UniversityDetail
        profile={universityProfile}
        isLoading={profileLoading}
        onClose={goToList}
        onEdit={goToEdit}
      />
    </UniversityScreenShell>
  );
};
