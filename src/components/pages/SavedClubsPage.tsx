"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useClubs, type Club } from "@/hooks/useClubs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Clock, Users } from "lucide-react";

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

const pricePeriodLabels: Record<string, string> = {
  per_lesson: 'Kč/lekci',
  monthly: 'Kč/měsíc',
  quarterly: 'Kč/čtvrtletí',
  semester: 'Kč/semestr',
  yearly: 'Kč/rok',
  one_time: 'Kč (jednorázově)',
};

const formatPrice = (price: number, period?: string) => {
  const suffix = period ? pricePeriodLabels[period] : undefined;
  return `${price.toLocaleString('cs-CZ')} ${suffix || 'Kč'}`;
};

export function SavedClubsPage() {
  const { isAuthenticated, userProfile } = useAuth();
  const { fetchSavedClubs, unsaveClub, loading } = useClubs();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const uid = userProfile?.uid;

  useEffect(() => {
    const load = async () => {
      if (!uid) {
        console.log('No UID, skipping fetch');
        setIsPageLoading(false);
        return;
      }
      try {
        setIsPageLoading(true);
        setError(null);
        const data = await fetchSavedClubs(uid);
        console.log('Loaded saved clubs for user:', uid, data);
        setClubs(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Neznámá chyba';
        console.error('Error loading saved clubs:', errorMessage, err);
        setError(errorMessage);
      } finally {
        setIsPageLoading(false);
      }
    };
    load();
  }, [uid, fetchSavedClubs]);

  const handleUnsave = async (clubId: string) => {
    if (!uid) return;
    
    try {
      await unsaveClub(uid, clubId);
      setClubs(clubs.filter(club => club.id !== clubId));
    } catch (err) {
      console.error('Error removing saved club:', err);
      setError('Chyba při odebírání uloženého kroužku');
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="py-12">
        <div className="container">
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              Pro zobrazení vašich uložených kroužků se prosím přihlaste.
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="container">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-brand-navy">Uložené kroužky</h1>
          <p className="text-muted-foreground">Kroužky, které jste si uložili</p>
        </div>

        {error && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <CardContent className="pt-6 text-red-900">
              <p className="font-semibold mb-2">Chyba při načítání kroužků:</p>
              <p className="text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {isPageLoading ? (
          <div className="text-muted-foreground">Načítání…</div>
        ) : clubs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">Zatím jste si neuložili žádný kroužek.</p>
              <Button asChild>
                <Link href="/krouzky">Prohlédnout kroužky</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {clubs.map((club) => (
              <Card key={club.id} className="border-border/70 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Image */}
                    <div className="md:col-span-1">
                      {club.image ? (
                        <img
                          src={club.image}
                          alt={club.name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-muted-foreground text-xs">Bez obrázku</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="md:col-span-3">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Link href={`/krouzky/${club.id}`}>
                            <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                              {club.name}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {club.address}
                          </div>
                        </div>
                        <Badge className={`${categoryColors[club.category]} text-white border-0`}>
                          {getCategoryLabel(club.category)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                        <div>
                          <p className="text-muted-foreground text-xs">Věk</p>
                          <p className="font-medium">{club.ageFrom}-{club.ageTo} let</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Úroveň</p>
                          <p className="font-medium">{club.level}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Čas</p>
                          <p className="font-medium">{club.dayTime}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Cena</p>
                          <p className="font-medium">{formatPrice(club.price, club.pricePeriod)}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button asChild variant="default" size="sm">
                          <Link href={`/krouzky/${club.id}`}>Zobrazit kroužek</Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUnsave(club.id)}
                        >
                          <Heart className="h-4 w-4 mr-2 fill-current" />
                          Odebrat
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
