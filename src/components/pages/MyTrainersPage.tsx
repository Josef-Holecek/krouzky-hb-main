"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTrainers, type Trainer } from "@/hooks/useTrainers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, Edit, Eye } from "lucide-react";

export function MyTrainersPage() {
  const { isAuthenticated, userProfile } = useAuth();
  const { fetchTrainersAdmin } = useTrainers();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const uid = userProfile?.uid;

  useEffect(() => {
    const load = async () => {
      if (!uid) {
        setIsPageLoading(false);
        return;
      }
      try {
        setIsPageLoading(true);
        setError(null);
        const data = await fetchTrainersAdmin();
        const mine = data.filter((trainer) => trainer.createdBy === uid);
        setTrainers(mine);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Neznámá chyba";
        setError(errorMessage);
      } finally {
        setIsPageLoading(false);
      }
    };
    load();
  }, [uid, fetchTrainersAdmin]);

  if (!isAuthenticated) {
    return (
      <section className="py-12">
        <div className="container">
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              Pro zobrazení vašich profilů se prosím přihlaste.
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
          <h1 className="text-3xl font-bold text-brand-navy">Moje profily trenéra</h1>
          <p className="text-muted-foreground">Přehled vašich trenérských profilů</p>
        </div>

        {error && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <CardContent className="pt-6 text-red-900">
              <p className="font-semibold mb-2">Chyba při načítání profilů:</p>
              <p className="text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {isPageLoading ? (
          <div className="text-muted-foreground">Načítání…</div>
        ) : trainers.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-muted-foreground">
              Zatím jste nevytvořili žádný profil trenéra.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {trainers.map((trainer) => (
              <Card key={trainer.id} className="border-border/70">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{trainer.name}</CardTitle>
                    <div className="text-sm text-muted-foreground">{trainer.specialization || "Bez specializace"}</div>
                  </div>
                  <Badge
                    className={
                      trainer.status === "approved"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : trainer.status === "rejected"
                        ? "bg-rose-100 text-rose-800 border-rose-300"
                        : "bg-amber-100 text-amber-800 border-amber-300"
                    }
                    variant="outline"
                  >
                    {trainer.status === "approved"
                      ? "✓ Schváleno"
                      : trainer.status === "rejected"
                      ? "✗ Zamítnuto"
                      : "⏱ Čeká na schválení"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trainer.status === "rejected" && (
                    <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm">
                      <AlertCircle className="h-4 w-4 text-rose-700 mt-0.5" />
                      <div>
                        <div className="text-rose-900 font-medium">Profil byl zamítnut</div>
                        <div className="text-rose-800">Důvod: {trainer.rejectReason || "Neuveden"}</div>
                      </div>
                    </div>
                  )}
                  {trainer.status === "pending" && (
                    <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      <Clock className="h-4 w-4 mt-0.5" />
                      Čeká na schválení administrátorem
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" asChild>
                      <Link href={`/treneri/${trainer.id}`}>
                        <Eye className="h-4 w-4 mr-1" /> Zobrazit
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/treneri/${trainer.id}/upravit`}>
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
