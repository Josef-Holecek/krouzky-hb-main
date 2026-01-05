'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClubs, type Club } from '@/hooks/useClubs';
import { Search, MapPin, Users, Clock, Filter } from 'lucide-react';

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

export function ClubsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAge, setSelectedAge] = useState('all');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchClubs } = useClubs();

  useEffect(() => {
    const loadClubs = async () => {
      setIsLoading(true);
      const data = await fetchClubs();
      setClubs(data);
      setIsLoading(false);
    };
    loadClubs();
  }, [fetchClubs]);

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

  const filteredClubs = clubs.filter((club) => {
    const matchesSearch = club.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || club.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      {/* Page Header */}
      <section className="bg-secondary py-12">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-navy mb-2">
            Kroužky
          </h1>
          <p className="text-muted-foreground">
            Najděte ten pravý kroužek pro sebe nebo své děti
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 border-b border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Hledat kroužky..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny kategorie</SelectItem>
                <SelectItem value="sport">Sport</SelectItem>
                <SelectItem value="hudba">Hudba</SelectItem>
                <SelectItem value="jazyky">Jazyky</SelectItem>
                <SelectItem value="technika">Technika</SelectItem>
                <SelectItem value="umeni">Umění</SelectItem>
                <SelectItem value="tanec">Tanec</SelectItem>
                <SelectItem value="veda">Věda</SelectItem>
                <SelectItem value="ostatni">Ostatní</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedAge} onValueChange={setSelectedAge}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Věk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny věky</SelectItem>
                <SelectItem value="5-8">5-8 let</SelectItem>
                <SelectItem value="9-12">9-12 let</SelectItem>
                <SelectItem value="13-18">13-18 let</SelectItem>
                <SelectItem value="18+">18+ let</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Clubs Grid */}
      <section className="py-10">
        <div className="container">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-muted-foreground">
              Nalezeno {filteredClubs.length} kroužků
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Načítání kroužků...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClubs.map((club) => (
                <Card
                  key={club.id}
                  className="overflow-hidden border border-border/50 shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative h-48 overflow-hidden bg-gray-100 flex items-center justify-center">
                    {club.image ? (
                      <img
                        src={club.image}
                        alt={club.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground">Bez obrázku</div>
                    )}
                    <Badge
                      className={`absolute top-3 left-3 ${
                        categoryColors[club.category]
                      } text-white border-0`}
                    >
                      {getCategoryLabel(club.category)}
                    </Badge>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg text-foreground mb-2">
                      {club.name}
                    </h3>
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>
                          {club.ageFrom}-{club.ageTo} let
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{club.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{club.dayTime}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">
                        {club.price.toLocaleString("cs-CZ")} Kč/rok
                      </span>
                      <Button size="sm" asChild>
                        <Link href={`/krouzky/${club.id}`}>Detail</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredClubs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Žádné kroužky neodpovídají vašemu hledání
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
