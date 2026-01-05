'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTrainers, type Trainer } from '@/hooks/useTrainers';
import { Search, Mail, Phone, Briefcase } from 'lucide-react';

export function TrainersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchTrainers } = useTrainers();

  useEffect(() => {
    const loadTrainers = async () => {
      setIsLoading(true);
      const data = await fetchTrainers();
      setTrainers(data);
      setIsLoading(false);
    };
    loadTrainers();
  }, [fetchTrainers]);

  const filteredTrainers = trainers.filter((trainer) => {
    const matchesSearch = trainer.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
      trainer.specialization
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      {/* Page Header */}
      <section className="bg-secondary py-12">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-navy mb-2">
            Trenéři
          </h1>
          <p className="text-muted-foreground">
            Seznamte se s našimi ověřenými trenéry a lektory
          </p>
        </div>
      </section>

      {/* Search */}
      <section className="py-6 border-b border-border">
        <div className="container">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hledat trenéry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </section>

      {/* Trainers Grid */}
      <section className="py-10">
        <div className="container">
          <p className="text-muted-foreground mb-6">
            Nalezeno {filteredTrainers.length} trenérů
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Načítání trenérů...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrainers.map((trainer) => (
                <Card
                  key={trainer.id}
                  className="overflow-hidden border border-border/50 shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center">
                    {trainer.image ? (
                      <img
                        src={trainer.image}
                        alt={trainer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-white text-center">
                        <div className="text-6xl">👤</div>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg text-foreground mb-2">
                      {trainer.name}
                    </h3>
                    {trainer.specialization && (
                      <Badge variant="secondary" className="mb-3">
                        {trainer.specialization}
                      </Badge>
                    )}
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      {trainer.experience > 0 && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          <span>{trainer.experience} let zkušeností</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${trainer.email}`} className="hover:text-primary">
                          {trainer.email}
                        </a>
                      </div>
                      {trainer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <a href={`tel:${trainer.phone}`} className="hover:text-primary">
                            {trainer.phone}
                          </a>
                        </div>
                      )}
                    </div>
                    <Button size="sm" asChild className="w-full">
                      <Link href={`/treneri/${trainer.id}`}>Zobrazit profil</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && filteredTrainers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Žádní trenéři neodpovídají vašemu hledání
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

