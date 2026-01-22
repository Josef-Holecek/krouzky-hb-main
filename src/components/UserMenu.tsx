'use client';

import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Plus, Shield, List, Heart, MessageSquare, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';

const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

interface UserMenuProps {
  isMobile?: boolean;
  onMenuItemClick?: () => void;
}

export function UserMenu({ isMobile = false, onMenuItemClick }: UserMenuProps) {
  const { userProfile, logout, isAuthenticated, loading } = useAuth();
  const { unreadCount } = useMessages();

  const isAdmin = useMemo(() => {
    if (!userProfile?.email) return false;
    if (!adminEmails.length) return false;
    return adminEmails.includes(userProfile.email.toLowerCase());
  }, [userProfile?.email]);

  if (loading) {
    return <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />;
  }

  if (!isAuthenticated) {
    if (isMobile) {
      return (
        <div className="flex flex-col gap-3">
          <Link 
            href="/prihlaseni" 
            onClick={onMenuItemClick}
            className="flex items-center gap-2 w-full py-3 px-4 text-sm font-medium rounded-md hover:bg-accent transition-colors touch-manipulation"
          >
            <User className="h-4 w-4" />
            Přihlásit se
          </Link>
          <Link 
            href="/registrace" 
            onClick={onMenuItemClick}
            className="flex items-center justify-center w-full py-3 px-4 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors touch-manipulation"
          >
            Zaregistrovat se
          </Link>
        </div>
      );
    }
    return (
      <Link href="/prihlaseni">
        <Button variant="outline" size="sm">
          <User className="h-4 w-4 mr-2" />
          Přihlášení
        </Button>
      </Link>
    );
  }

  if (isMobile) {
    return (
      <div className="flex flex-col gap-2">
        <div className="px-2 py-3 text-sm font-medium border-b border-border mb-2">
          {userProfile?.name}
        </div>
        
        {/* Quick Actions */}
<<<<<<< HEAD
        <Button variant="ghost" asChild className="w-full justify-start">
          <Link href="/zpravy" onClick={onMenuItemClick}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Zprávy
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {unreadCount}
              </Badge>
            )}
          </Link>
        </Button>
        <Button variant="ghost" asChild className="w-full justify-start">
          <Link href="/krouzky/ulozene" onClick={onMenuItemClick}>
            <Heart className="h-4 w-4 mr-2" />
            Uložené kroužky
          </Link>
        </Button>
        
        {/* Admin */}
        {isAdmin && (
          <Button variant="ghost" asChild className="w-full justify-start">
            <Link href="/admin" onClick={onMenuItemClick}>
              <Shield className="h-4 w-4 mr-2" />
              Administrace
            </Link>
          </Button>
=======
        <Link href="/zpravy" onClick={onMenuItemClick} className="flex items-center gap-2 w-full py-2 px-2 text-sm font-medium rounded-md hover:bg-accent transition-colors touch-manipulation">
          <MessageSquare className="h-4 w-4" />
          Zprávy
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {unreadCount}
            </Badge>
          )}
        </Link>
        <Link href="/krouzky/ulozene" onClick={onMenuItemClick} className="flex items-center gap-2 w-full py-2 px-2 text-sm font-medium rounded-md hover:bg-accent transition-colors touch-manipulation">
          <Heart className="h-4 w-4" />
          Uložené kroužky
        </Link>
        
        {/* Admin */}
        {isAdmin && (
          <Link href="/admin" onClick={onMenuItemClick} className="flex items-center gap-2 w-full py-2 px-2 text-sm font-medium rounded-md hover:bg-accent transition-colors touch-manipulation">
            <Shield className="h-4 w-4" />
            Administrace
          </Link>
>>>>>>> HEAD@{1}
        )}
        
        <div className="border-t border-border my-2"></div>
        
        {/* Moje sekce */}
        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
          Moje přehledy
        </div>
<<<<<<< HEAD
        <Button variant="ghost" asChild className="w-full justify-start">
          <Link href="/krouzky/moje" onClick={onMenuItemClick}>
            Moje kroužky
          </Link>
        </Button>
        <Button variant="ghost" asChild className="w-full justify-start">
          <Link href="/krouzky/ulozene" onClick={onMenuItemClick}>
            Uložené kroužky
          </Link>
        </Button>
        <Button variant="ghost" asChild className="w-full justify-start">
          <Link href="/treneri/moje" onClick={onMenuItemClick}>
            Moje profily trenéra
          </Link>
        </Button>
=======
        <Link href="/krouzky/moje" onClick={onMenuItemClick} className="w-full py-2 px-2 text-sm rounded-md hover:bg-accent transition-colors touch-manipulation block">
          Moje kroužky
        </Link>
        <Link href="/krouzky/ulozene" onClick={onMenuItemClick} className="w-full py-2 px-2 text-sm rounded-md hover:bg-accent transition-colors touch-manipulation block">
          Uložené kroužky
        </Link>
        <Link href="/treneri/moje" onClick={onMenuItemClick} className="w-full py-2 px-2 text-sm rounded-md hover:bg-accent transition-colors touch-manipulation block">
          Moje profily trenéra
        </Link>
>>>>>>> HEAD@{1}
        
        <div className="border-t border-border my-2"></div>
        
        {/* Vytvořit sekce */}
        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
          Vytvořit
        </div>
<<<<<<< HEAD
        <Button variant="ghost" asChild className="w-full justify-start">
          <Link href="/krouzky/nova" onClick={onMenuItemClick}>
            Nový kroužek
          </Link>
        </Button>
        <Button variant="ghost" asChild className="w-full justify-start">
          <Link href="/treneri/novy" onClick={onMenuItemClick}>
            Nový profil trenéra
          </Link>
        </Button>
=======
        <Link href="/krouzky/nova" onClick={onMenuItemClick} className="w-full py-2 px-2 text-sm rounded-md hover:bg-accent transition-colors touch-manipulation block">
          Nový kroužek
        </Link>
        <Link href="/treneri/novy" onClick={onMenuItemClick} className="w-full py-2 px-2 text-sm rounded-md hover:bg-accent transition-colors touch-manipulation block">
          Nový profil trenéra
        </Link>
>>>>>>> HEAD@{1}
        
        <div className="border-t border-border my-2"></div>
        
        {/* Odhlásit */}
<<<<<<< HEAD
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive"
=======
        <button
          className="flex items-center gap-2 w-full py-2 px-2 text-sm font-medium rounded-md hover:bg-accent transition-colors touch-manipulation text-destructive hover:text-destructive text-left"
>>>>>>> HEAD@{1}
          onClick={async () => {
            await logout();
            onMenuItemClick?.();
          }}
        >
<<<<<<< HEAD
          <LogOut className="h-4 w-4 mr-2" />
          Odhlásit se
        </Button>
=======
          <LogOut className="h-4 w-4" />
          Odhlásit se
        </button>
>>>>>>> HEAD@{1}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Link href="/treneri/moje" className="text-sm text-muted-foreground hidden sm:inline hover:text-primary transition-colors cursor-pointer" title="Moje profily trenéra">
          {userProfile?.name}
        </Link>
        <Button variant="ghost" size="sm" asChild className="h-8 px-2">
          <Link href="/krouzky/ulozene" title="Vaše uložené kroužky">
            <Heart className="h-4 w-4 text-primary" />
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild className="h-8 px-2 relative">
          <Link href="/zpravy" title="Vaše zprávy">
            <MessageSquare className="h-4 w-4 text-primary" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount}
              </Badge>
            )}
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
