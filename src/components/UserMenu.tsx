'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Plus, Shield, List, Heart } from 'lucide-react';
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
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground hidden sm:inline">{userProfile?.name}</span>
        <Button variant="ghost" size="sm" asChild className="h-8 px-2">
          <Link href="/krouzky/ulozene" title="Vaše uložené kroužky">
            <Heart className="h-4 w-4 text-primary" />
          </Link>
        </Button>
      </div>
      {isAdmin && (
        <Link href="/admin">
          <Button variant="default" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Administrace
          </Button>
        </Link>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <List className="h-4 w-4" />
            Moje
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Moje přehledy</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/krouzky/moje">Moje kroužky</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/krouzky/ulozene">Uložené kroužky</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/treneri/moje">Moje profily trenéra</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Vytvořit
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Vyberte co chcete vytvořit</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/krouzky/nova">Nový kroužek</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/treneri/novy">Nový profil trenéra</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
