import React from 'react';
import { useParams } from 'react-router-dom';
import { UniversityFormPageContainer } from '../components/UniversityFormPageContainer';

export const UniversityEditPage = () => {
  const { universityId } = useParams();
  return <UniversityFormPageContainer mode="edit" universityId={universityId} />;
};
