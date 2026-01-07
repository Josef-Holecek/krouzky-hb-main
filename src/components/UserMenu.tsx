'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { User, Plus, Shield, List } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function UserMenu() {
  const { userProfile, logout, isAuthenticated, loading } = useAuth();

  const isAdmin = useMemo(() => {
    if (!userProfile?.email) return false;
    if (!adminEmails.length) return false; // require explicit admin list
    return adminEmails.includes(userProfile.email.toLowerCase());
  }, [userProfile?.email]);

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
      {isAdmin && (
        <Link href="/admin">
          <Button variant="default" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Administrace
          </Button>
        </Link>
      )}
      <Link href="/krouzky/moje">
        <Button variant="outline" size="sm">
          <List className="h-4 w-4 mr-2" />
          Moje kroužky
        </Button>
      </Link>
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
