"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useClubs, type Club } from "@/hooks/useClubs";
import { useTrainers, type Trainer } from "@/hooks/useTrainers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Check, X, Loader2, Eye } from "lucide-react";

const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function AdminPage() {
  const { isAuthenticated, userProfile } = useAuth();
  const {
    fetchClubsAdmin,
    setClubStatus,
    loading: clubsLoading,
  } = useClubs();
  const {
    fetchTrainersAdmin,
    setTrainerStatus,
    loading: trainersLoading,
  } = useTrainers();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const isAdmin = useMemo(() => {
    if (!userProfile?.email) return false;
    if (!adminEmails.length) return false; // require explicit admin list on production
    return adminEmails.includes(userProfile.email.toLowerCase());
  }, [userProfile?.email]);

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated || !isAdmin) {
        setIsPageLoading(false);
        return;
      }
      try {
        setIsPageLoading(true);
        const [allClubs, allTrainers] = await Promise.all([
          fetchClubsAdmin(),
          fetchTrainersAdmin(),
        ]);
        setClubs(allClubs);
        setTrainers(allTrainers);
      } finally {
        setIsPageLoading(false);
      }
    };
    load();
  }, [fetchClubsAdmin, fetchTrainersAdmin, isAuthenticated, isAdmin]);

  const handleClubStatus = async (clubId: string, status: Club["status"]) => {
    const approvedBy = userProfile?.email || null;
    let reason: string | null = null;
    if (status === "rejected") {
      // Simple prompt to capture rejection reason
      reason = window.prompt("Důvod zamítnutí (volitelné):", "") || null;
    }
    const result = await setClubStatus(clubId, status ?? "pending", approvedBy, reason);
    if (result.success) {
      setClubs((prev) =>
        prev.map((c) =>
          c.id === clubId
            ? {
                ...c,
                status,
                approvedBy,
                rejectedBy: status === "rejected" ? approvedBy : null,
                rejectReason: status === "rejected" ? reason : null,
              }
            : c,
        )
      );
      toast.success(
        status === "approved" ? "Kroužek schválen" : "Kroužek zamítnut"
      );
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  const handleTrainerStatus = async (
    trainerId: string,
    status: Trainer["status"]
  ) => {
    const approvedBy = userProfile?.email || null;
    const result = await setTrainerStatus(
      trainerId,
      status ?? "pending",
      approvedBy
    );
    if (result.success) {
      setTrainers((prev) =>
        prev.map((t) => (t.id === trainerId ? { ...t, status, approvedBy } : t))
      );
      toast.success(
        status === "approved"
          ? "Trenér schválen"
          : "Trenér byl zamítnut"
      );
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  const pendingClubs = clubs.filter((c) => c.status !== "approved");
  const pendingTrainers = trainers.filter((t) => t.status !== "approved");

  if (!isAuthenticated) {
    return (
      <section className="py-12">
        <div className="container">
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              Přihlaste se, prosím, pro vstup do administrace.
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="py-12">
        <div className="container">
          <Card className="bg-rose-50 border-rose-200">
            <CardContent className="pt-6 space-y-2">
              <p className="text-rose-900 font-semibold">Přístup zamítnut</p>
              <p className="text-sm text-rose-800">
                Tento účet nemá administrátorská oprávnění. Přidejte email do
                proměnné NEXT_PUBLIC_ADMIN_EMAILS v .env.local (oddělené čárkou)
                nebo nastavte vlastní logiku schvalování.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-brand-navy">Administrace</h1>
            <p className="text-muted-foreground">
              Schvalování nových kroužků a trenérů
            </p>
          </div>
          {(isPageLoading || clubsLoading || trainersLoading) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Načítám...
            </div>
          )}
        </div>

        <Tabs defaultValue="clubs" className="w-full">
          <TabsList>
            <TabsTrigger value="clubs">Kroužky</TabsTrigger>
            <TabsTrigger value="trainers">Trenéři</TabsTrigger>
            <TabsTrigger value="clubs-history">Historie kroužků</TabsTrigger>
          </TabsList>

          <TabsContent value="clubs" className="mt-4 space-y-4">
            {pendingClubs.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-muted-foreground">
                  Žádné kroužky nečekají na schválení.
                </CardContent>
              </Card>
            ) : (
              pendingClubs.map((club) => (
                <Card key={club.id} className="border-border/70">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{club.name}</CardTitle>
                      <div className="text-sm text-muted-foreground">
                        {club.category} • {club.trainerName}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {club.status === "rejected"
                        ? "Zamítnuto"
                        : "Čeká na schválení"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {club.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <Link href={`/krouzky/${club.id}?preview=1`}>
                            <Eye className="h-4 w-4 mr-1" /> Náhled
                          </Link>
                        </Button>
                      <Button
                        size="sm"
                        onClick={() => handleClubStatus(club.id, "approved")}
                      >
                        <Check className="h-4 w-4 mr-1" /> Schválit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleClubStatus(club.id, "rejected")}
                      >
                        <X className="h-4 w-4 mr-1" /> Zamítnout
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="trainers" className="mt-4 space-y-4">
            {pendingTrainers.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-muted-foreground">
                  Žádní trenéři nečekají na schválení.
                </CardContent>
              </Card>
            ) : (
              pendingTrainers.map((trainer) => (
                <Card key={trainer.id} className="border-border/70">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{trainer.name}</CardTitle>
                      <div className="text-sm text-muted-foreground">
                        {trainer.specialization || "Bez specializace"}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {trainer.status === "rejected"
                        ? "Zamítnuto"
                        : "Čeká na schválení"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {trainer.bio || "Bez popisu"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleTrainerStatus(trainer.id, "approved")}
                      >
                        <Check className="h-4 w-4 mr-1" /> Schválit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleTrainerStatus(trainer.id, "rejected")}
                      >
                        <X className="h-4 w-4 mr-1" /> Zamítnout
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="clubs-history" className="mt-4 space-y-4">
            {(() => {
              const historyClubs = clubs.filter(
                (c) => c.status === "approved" || c.status === "rejected",
              );
              if (historyClubs.length === 0) {
                return (
                  <Card>
                    <CardContent className="py-6 text-muted-foreground">
                      Zatím žádná historie.
                    </CardContent>
                  </Card>
                );
              }
              return historyClubs.map((club) => (
                <Card key={club.id} className="border-border/70">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{club.name}</CardTitle>
                      <div className="text-sm text-muted-foreground">
                        {club.category} • {club.trainerName}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {club.status === "approved" ? "Schváleno" : "Zamítnuto"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {club.status === "rejected" && (
                      <div className="text-sm">
                        <span className="font-medium">Důvod zamítnutí:</span>{" "}
                        <span className="text-muted-foreground">
                          {club.rejectReason || "Neuvedeno"}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <Link href={`/krouzky/${club.id}?preview=1`}>
                          <Eye className="h-4 w-4 mr-1" /> Náhled
                        </Link>
                      </Button>
                      {club.status === "rejected" ? (
                        <Button
                          size="sm"
                          onClick={() => handleClubStatus(club.id, "approved")}
                        >
                          <Check className="h-4 w-4 mr-1" /> Schválit
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleClubStatus(club.id, "rejected")}
                        >
                          <X className="h-4 w-4 mr-1" /> Zamítnout
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ));
            })()}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
