"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useClubs, type Club } from "@/hooks/useClubs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, Edit, Eye } from "lucide-react";

export function MyClubsPage() {
  const { isAuthenticated, userProfile } = useAuth();
  const { fetchClubsByUser, loading } = useClubs();
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
        const data = await fetchClubsByUser(uid);
        console.log('Loaded clubs for user:', uid, data);
        setClubs(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Neznámá chyba';
        console.error('Error loading clubs:', errorMessage, err);
        setError(errorMessage);
      } finally {
        setIsPageLoading(false);
      }
    };
    load();
  }, [uid, fetchClubsByUser]);

  if (!isAuthenticated) {
    return (
      <section className="py-12">
        <div className="container">
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              Pro zobrazení vašich kroužků se prosím přihlaste.
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
          <h1 className="text-3xl font-bold text-brand-navy">Moje kroužky</h1>
          <p className="text-muted-foreground">Přehled vašich založených kroužků</p>
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
            <CardContent className="py-6 text-muted-foreground">
              Zatím jste nevytvořili žádný kroužek.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {clubs.map((club) => (
              <Card key={club.id} className="border-border/70">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{club.name}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {club.address} • {club.dayTime}
                    </div>
                  </div>
                  <Badge 
                    className={
                      club.status === "approved" 
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300" 
                        : club.status === "rejected"
                        ? "bg-rose-100 text-rose-800 border-rose-300"
                        : "bg-amber-100 text-amber-800 border-amber-300"
                    }
                    variant="outline"
                  >
                    {club.status === "approved"
                      ? "✓ Schváleno"
                      : club.status === "rejected"
                      ? "✗ Zamítnuto"
                      : "⏱ Čeká na schválení"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {club.status === "rejected" && (
                    <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm">
                      <AlertCircle className="h-4 w-4 text-rose-700 mt-0.5" />
                      <div>
                        <div className="text-rose-900 font-medium">Kroužek byl zamítnut</div>
                        <div className="text-rose-800">Důvod: {club.rejectReason || "Neuveden"}</div>
                      </div>
                    </div>
                  )}
                  {club.status === "pending" && (
                    <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      <Clock className="h-4 w-4 mt-0.5" />
                      Čeká na schválení administrátorem
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" asChild>
                      <Link href={`/krouzky/${club.id}`}>
                        <Eye className="h-4 w-4 mr-1" /> Zobrazit
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/krouzky/${club.id}/upravit`}>
                        <Edit className="h-4 w-4 mr-1" /> Upravit
                      </Link>
                    </Button>
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
