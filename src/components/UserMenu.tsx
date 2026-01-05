'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { User, Plus } from 'lucide-react';
import Link from 'next/link';

export function UserMenu() {
  const { userProfile, logout, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />;
  }

  if (!isAuthenticated) {
    return (
      <Link href="/prihlaseni">
        <Button variant="outline" size="sm">
          <User className="h-4 w-4 mr-2" />
          Přihlášení
        </Button>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">{userProfile?.name}</span>
      <Link href="/krouzky/nova">
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nový kroužek
        </Button>
      </Link>
      <Link href="/treneri/novy">
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nový profil trenéra
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        onClick={async () => {
          await logout();
        }}
      >
        Odhlásit
      </Button>
    </div>
  );
}
