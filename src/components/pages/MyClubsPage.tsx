"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useClubs, type Club } from "@/hooks/useClubs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Archive, Clock, Edit, Eye } from "lucide-react";

export function MyClubsPage() {
  const { isAuthenticated, userProfile } = useAuth();
  const { fetchClubsByUser, updateClub } = useClubs();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [processingClubId, setProcessingClubId] = useState<string | null>(null);

  const uid = userProfile?.uid;

  const { activeClubs, archivedClubs } = useMemo(() => {
    const active = clubs.filter((club) => !club.archived);
    const archived = clubs.filter((club) => club.archived);

    return { activeClubs: active, archivedClubs: archived };
  }, [clubs]);

  const visibleClubs = showArchived ? archivedClubs : activeClubs;

  const handleArchiveClub = async (clubId: string) => {
    if (!uid) {
      setError("Pro archivaci je potřeba být přihlášen.");
      return;
    }

    const confirmed = window.confirm("Opravdu chcete tento kroužek archivovat?");
    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      setProcessingClubId(clubId);

      const result = await updateClub(clubId, {
        archived: true,
        archivedAt: new Date().toISOString(),
        archivedBy: uid,
      });

      if (!result.success) {
        throw new Error(result.error || "Archivaci se nepodařilo dokončit.");
      }

      setClubs((prev) =>
        prev.map((club) =>
          club.id === clubId
            ? {
                ...club,
                archived: true,
                archivedAt: new Date().toISOString(),
                archivedBy: uid,
              }
            : club
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Neznámá chyba";
      setError(errorMessage);
    } finally {
      setProcessingClubId(null);
    }
  };

  const handleRestoreClub = async (clubId: string) => {
    const confirmed = window.confirm(
      "Obnovený kroužek bude znovu odeslán ke schválení administrátorem. Pokračovat?"
    );
    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      setProcessingClubId(clubId);

      const now = new Date().toISOString();
      const result = await updateClub(clubId, {
        archived: false,
        archivedAt: null,
        archivedBy: null,
        status: "pending",
        approvedAt: null,
        approvedBy: null,
        rejectedAt: null,
        rejectedBy: null,
        rejectReason: null,
        resubmittedAt: now,
      });

      if (!result.success) {
        throw new Error(result.error || "Obnovení se nepodařilo dokončit.");
      }

      setClubs((prev) =>
        prev.map((club) =>
          club.id === clubId
            ? {
                ...club,
                archived: false,
                archivedAt: null,
                archivedBy: null,
                status: "pending",
                approvedAt: null,
                approvedBy: null,
                rejectedAt: null,
                rejectedBy: null,
                rejectReason: null,
                resubmittedAt: now,
              }
            : club
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Neznámá chyba";
      setError(errorMessage);
    } finally {
      setProcessingClubId(null);
    }
  };

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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-brand-navy">Moje kroužky</h1>
              <p className="text-muted-foreground">Přehled vašich založených kroužků</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowArchived((prev) => !prev)}
            >
              {showArchived
                ? "Zobrazit aktivní kroužky"
                : `Zobrazit archivované (${archivedClubs.length})`}
            </Button>
          </div>
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
        ) : visibleClubs.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-muted-foreground">
              {showArchived
                ? "Nemáte žádné archivované kroužky."
                : "Zatím jste nevytvořili žádný aktivní kroužek."}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {visibleClubs.map((club) => (
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
                    {!showArchived && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleArchiveClub(club.id)}
                        disabled={processingClubId === club.id}
                      >
                        <Archive className="h-4 w-4 mr-1" />
                        {processingClubId === club.id ? "Archivuji..." : "Archivovat"}
                      </Button>
                    )}
                    {showArchived && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestoreClub(club.id)}
                        disabled={processingClubId === club.id}
                      >
                        {processingClubId === club.id ? "Obnovuji..." : "Obnovit (ke schválení)"}
                      </Button>
                    )}
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
