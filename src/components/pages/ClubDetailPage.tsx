'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Users,
  Clock,
  Calendar,
  Phone,
  Mail,
  ArrowLeft,
  Heart,
  Share2,
  Edit,
} from 'lucide-react';
import { useClubs, type Club } from '@/hooks/useClubs';
import { useAuth } from '@/hooks/useAuth';

const categoryColors: Record<string, string> = {
  sport: "bg-category-sport",
  hudba: "bg-category-music",
  jazyky: "bg-category-language",
  technika: "bg-category-tech",
  umeni: "bg-category-art",
  tanec: "bg-category-dance",
  veda: "bg-category-science",
  ostatni: "bg-category-other",
};

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    sport: 'Sport',
    hudba: 'Hudba',
    jazyky: 'Jazyky',
    technika: 'Technika',
    umeni: 'Umění',
    tanec: 'Tanec',
    veda: 'Věda',
    ostatni: 'Ostatní',
  };
  return labels[category] || category;
};

const ClubDetailPageComponent = () => {
  const params = useParams();
  const id = params?.id as string;
  const [club, setClub] = useState<Club | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchClubById } = useClubs();
  const { userProfile } = useAuth();

  useEffect(() => {
    const loadClub = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchClubById(id);
        if (data) {
          setClub(data);
        } else {
          setError('Kroužek nebyl nalezen');
        }
      } catch (err) {
        console.error('Error loading club:', err);
        setError('Chyba při načítání kroužku');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadClub();
    }
  }, [id, fetchClubById]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Načítání kroužku...</p>
      </div>
    );
  }

  if (error || !club) {
    return (
      <section className="py-12">
        <div className="container">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <p className="text-red-900">{error || 'Kroužek nebyl nalezen'}</p>
              <Button variant="outline" asChild className="mt-4">
                <Link href="/krouzky">Zpět na kroužky</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Back Button */}
      <div className="bg-secondary py-4">
        <div className="container">
          <Button variant="ghost" size="sm" asChild>
            <Link href={userProfile?.uid === club.createdBy ? "/krouzky/moje" : "/krouzky"}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {userProfile?.uid === club.createdBy ? "Zpět na moje kroužky" : "Zpět na kroužky"}
            </Link>
          </Button>
        </div>
      </div>

      <section className="py-8">
        <div className="container">
          {userProfile?.uid === club.createdBy && club.status === 'rejected' && (
            <Card className="mb-6 border-rose-200 bg-rose-50">
              <CardContent className="p-4">
                <div className="flex flex-col gap-2">
                  <div className="text-rose-900 font-semibold">Váš kroužek byl zamítnut</div>
                  <div className="text-sm text-rose-800">
                    Důvod: {club.rejectReason || 'Neuveden'}
                  </div>
                  <div>
                    <Button asChild size="sm" variant="outline" className="border-rose-300 text-rose-900 hover:bg-rose-100">
                      <Link href={`/krouzky/${club.id}/upravit`}>Upravit kroužek a znovu odeslat</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {userProfile?.uid === club.createdBy && club.status === 'pending' && (
            <Card className="mb-6 border-amber-200 bg-amber-50">
              <CardContent className="p-4 text-amber-900">
                Váš kroužek čeká na schválení administrátorem.
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Placeholder */}
              {club.image ? (
                <div className="rounded-xl overflow-hidden">
                  <img
                    src={club.image}
                    alt={club.name}
                    className="w-full h-64 md:h-96 object-cover"
                  />
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden bg-gray-100 h-64 md:h-96 flex items-center justify-center">
                  <p className="text-muted-foreground">Bez obrázku</p>
                </div>
              )}

              {/* Title & Category */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Badge className={`${categoryColors[club.category]} text-white border-0`}>
                    {getCategoryLabel(club.category)}
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    {club.ageFrom}-{club.ageTo} let
                  </span>
                  {userProfile?.uid === club.createdBy && (
                    <Badge 
                      variant="outline" 
                      className={
                        club.status === 'approved' 
                          ? 'border-emerald-500 text-emerald-700 bg-emerald-50' 
                          : club.status === 'rejected'
                          ? 'border-rose-500 text-rose-700 bg-rose-50'
                          : 'border-amber-500 text-amber-700 bg-amber-50'
                      }
                    >
                      {club.status === 'approved' 
                        ? '✓ Schváleno' 
                        : club.status === 'rejected'
                        ? '✗ Zamítnuto'
                        : '⏱ Čeká na schválení'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-3xl font-bold text-brand-navy">
                    {club.name}
                  </h1>
                  {userProfile?.uid === club.createdBy && (
                    <Button variant="outline" asChild>
                      <Link href={`/krouzky/${club.id}/upravit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Upravit kroužek
                      </Link>
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {club.address}
                  </div>
                </div>
              </div>

              {/* Description */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-semibold text-lg mb-4">O kroužku</h2>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {club.description}
                  </p>
                </CardContent>
              </Card>

              {/* Schedule */}
              {club.dayTime && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="font-semibold text-lg mb-4">Čas tréninku</h2>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{club.dayTime}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Details Grid */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-semibold text-lg mb-4">Informace</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Věková skupina</p>
                      <p className="font-medium">{club.ageFrom}-{club.ageTo} let</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Úroveň</p>
                      <p className="font-medium">{club.level}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Kapacita</p>
                      <p className="font-medium">{club.capacity} míst</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cena</p>
                      <p className="font-medium">{club.price.toLocaleString('cs-CZ')} Kč/rok</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Price Card */}
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {club.price.toLocaleString('cs-CZ')} Kč
                    </div>
                    <span className="text-muted-foreground text-sm">za rok</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Kapacita</span>
                      <span className="font-medium">{club.capacity} míst</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button className="w-full" size="lg">
                      Kontaktovat trenéra
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1">
                        <Heart className="h-4 w-4 mr-2" />
                        Uložit
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Share2 className="h-4 w-4 mr-2" />
                        Sdílet
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trainer Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Trenér</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Jméno</p>
                      <p className="font-medium">{club.trainerName}</p>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${club.trainerEmail}`} className="hover:text-primary">
                        {club.trainerEmail}
                      </a>
                    </div>
                    {club.trainerPhone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${club.trainerPhone}`} className="hover:text-primary">
                          {club.trainerPhone}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Contact Card */}
              {club.web && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Webové stránky</h3>
                    <a 
                      href={club.web} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline break-all text-sm"
                    >
                      {club.web}
                    </a>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export function ClubDetailPage() {
  return <ClubDetailPageComponent />;
}
