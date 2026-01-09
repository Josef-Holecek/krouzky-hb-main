'use client';

import { Suspense } from 'react';
import { ClubsPage } from '@/components/pages/ClubsPage';

function ClubsPageWrapper() {
  return <ClubsPage />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="py-12 text-center">Načítání...</div>}>
      <ClubsPageWrapper />
    </Suspense>
  );
}

