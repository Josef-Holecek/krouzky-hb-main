"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useClubs, type Club } from "@/hooks/useClubs";
import { useTrainers, type Trainer } from "@/hooks/useTrainers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Check, X, Loader2, Eye, Search, Shield } from "lucide-react";
import { useClaims, type ClaimRequest } from "@/hooks/useClaims";

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
  const { fetchClaims, resolveClaim, loading: claimsLoading } = useClaims();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  // History filters
  const [historySearch, setHistorySearch] = useState("");
  const [historyType, setHistoryType] = useState<"all" | "clubs" | "trainers">("all");
  const [historyStatus, setHistoryStatus] = useState<"all" | "approved" | "rejected">("all");

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
        const [allClubs, allTrainers, allClaims] = await Promise.all([
          fetchClubsAdmin(),
          fetchTrainersAdmin(),
          fetchClaims(),
        ]);
        setClubs(allClubs);
        setTrainers(allTrainers);
        setClaims(allClaims);
      } finally {
        setIsPageLoading(false);
      }
    };
    load();
  }, [fetchClubsAdmin, fetchTrainersAdmin, fetchClaims, isAuthenticated, isAdmin]);

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

  const handleClaimResolve = async (claim: ClaimRequest, status: 'approved' | 'rejected') => {
    const resolvedBy = userProfile?.email || '';
    const result = await resolveClaim(
      claim.id,
      status,
      resolvedBy,
      status === 'approved' ? claim.clubId : undefined,
      status === 'approved' ? claim.userId : undefined
    );
    if (result.success) {
      setClaims((prev) =>
        prev.map((c) =>
          c.id === claim.id ? { ...c, status, resolvedAt: new Date().toISOString(), resolvedBy } : c
        )
      );
      if (status === 'approved') {
        // Update club's createdBy locally too
        setClubs((prev) =>
          prev.map((c) =>
            c.id === claim.clubId ? { ...c, createdBy: claim.userId } : c
          )
        );
      }
      toast.success(
        status === 'approved'
          ? 'Žádost schválena – vlastnictví kroužku převedeno'
          : 'Žádost zamítnuta'
      );
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  const pendingClubs = clubs.filter((c) => c.status === "pending");
  const pendingTrainers = trainers.filter((t) => t.status === "pending");
  const pendingClaims = claims.filter((c) => c.status === 'pending');
  const resolvedClaims = claims.filter((c) => c.status !== 'pending');

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
          {(isPageLoading || clubsLoading || trainersLoading || claimsLoading) && (
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
            <TabsTrigger value="claims">
              Žádosti o převzetí
              {pendingClaims.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1">
                  {pendingClaims.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">Historie</TabsTrigger>
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
                        variant="outline"
                        asChild
                      >
                        <Link href={`/treneri/${trainer.id}?preview=1`}>
                          <Eye className="h-4 w-4 mr-1" /> Náhled
                        </Link>
                      </Button>
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

          <TabsContent value="claims" className="mt-4 space-y-6">
            {/* Pending claims */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Čekající žádosti</h2>
              {pendingClaims.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-muted-foreground">
                    Žádné žádosti o převzetí nečekají na schválení.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pendingClaims.map((claim) => (
                    <Card key={claim.id} className="border-blue-200">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{claim.clubName}</CardTitle>
                          <div className="text-sm text-muted-foreground">
                            Žadatel: {claim.userName}
                          </div>
                        </div>
                        <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">
                          Čeká na schválení
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="font-medium">Email:</span>{' '}
                            <span className="text-muted-foreground">{claim.email}</span>
                          </div>
                          <div>
                            <span className="font-medium">Telefon:</span>{' '}
                            <span className="text-muted-foreground">{claim.phone}</span>
                          </div>
                        </div>
                        {claim.message && (
                          <div className="text-sm">
                            <span className="font-medium">Zpráva:</span>{' '}
                            <span className="text-muted-foreground">{claim.message}</span>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Odesláno: {new Date(claim.createdAt).toLocaleString('cs-CZ')}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <Link href={`/krouzky/${claim.clubId}?preview=1`}>
                              <Eye className="h-4 w-4 mr-1" /> Náhled kroužku
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleClaimResolve(claim, 'approved')}
                          >
                            <Check className="h-4 w-4 mr-1" /> Schválit a převést
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleClaimResolve(claim, 'rejected')}
                          >
                            <X className="h-4 w-4 mr-1" /> Zamítnout
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Resolved claims */}
            {resolvedClaims.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Vyřízené žádosti</h2>
                <div className="space-y-4">
                  {resolvedClaims.map((claim) => (
                    <Card key={claim.id} className="border-border/70">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{claim.clubName}</CardTitle>
                          <div className="text-sm text-muted-foreground">
                            Žadatel: {claim.userName} • {claim.email}
                          </div>
                        </div>
                        <Badge variant="outline" className={
                          claim.status === 'approved'
                            ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                            : 'border-rose-500 text-rose-700 bg-rose-50'
                        }>
                          {claim.status === 'approved' ? 'Schváleno' : 'Zamítnuto'}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xs text-muted-foreground">
                          Vyřízeno: {claim.resolvedAt ? new Date(claim.resolvedAt).toLocaleString('cs-CZ') : '–'} • {claim.resolvedBy || ''}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Hledat podle jména..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Type filter */}
                  <Select value={historyType} onValueChange={(value: "all" | "clubs" | "trainers") => setHistoryType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Typ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Vše</SelectItem>
                      <SelectItem value="clubs">Kroužky</SelectItem>
                      <SelectItem value="trainers">Trenéři</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Status filter */}
                  <Select value={historyStatus} onValueChange={(value: "all" | "approved" | "rejected") => setHistoryStatus(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Stav" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Vše</SelectItem>
                      <SelectItem value="approved">Schválené</SelectItem>
                      <SelectItem value="rejected">Zamítnuté</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {(() => {
              // Filter clubs
              let filteredClubs = clubs.filter(
                (c) => c.status === "approved" || c.status === "rejected"
              );
              
              // Filter trainers
              let filteredTrainers = trainers.filter(
                (t) => t.status === "approved" || t.status === "rejected"
              );
              
              // Apply type filter
              if (historyType === "clubs") {
                filteredTrainers = [];
              } else if (historyType === "trainers") {
                filteredClubs = [];
              }
              
              // Apply status filter
              if (historyStatus !== "all") {
                filteredClubs = filteredClubs.filter((c) => c.status === historyStatus);
                filteredTrainers = filteredTrainers.filter((t) => t.status === historyStatus);
              }
              
              // Apply search filter
              if (historySearch) {
                const search = historySearch.toLowerCase();
                filteredClubs = filteredClubs.filter((c) =>
                  c.name.toLowerCase().includes(search) ||
                  c.trainerName?.toLowerCase().includes(search)
                );
                filteredTrainers = filteredTrainers.filter((t) =>
                  t.name.toLowerCase().includes(search) ||
                  t.specialization?.toLowerCase().includes(search)
                );
              }
              
              // Combine and sort by date
              const combinedItems: Array<{
                type: "club" | "trainer";
                item: Club | Trainer;
              }> = [
                ...filteredClubs.map((club) => ({ type: "club" as const, item: club })),
                ...filteredTrainers.map((trainer) => ({ type: "trainer" as const, item: trainer })),
              ];
              
              if (combinedItems.length === 0) {
                return (
                  <Card>
                    <CardContent className="py-6 text-muted-foreground">
                      Žádné výsledky.
                    </CardContent>
                  </Card>
                );
              }
              
              return combinedItems.map(({ type, item }) => {
                if (type === "club") {
                  const club = item as Club;
                  return (
                    <Card key={`club-${club.id}`} className="border-border/70">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{club.name}</CardTitle>
                          <div className="text-sm text-muted-foreground">
                            Kroužek • {club.category} • {club.trainerName}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {club.status === "approved" ? "Schváleno" : "Zamítnuto"}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {club.status === "rejected" && club.rejectReason && (
                          <div className="text-sm">
                            <span className="font-medium">Důvod zamítnutí:</span>{" "}
                            <span className="text-muted-foreground">
                              {club.rejectReason}
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
                  );
                } else {
                  const trainer = item as Trainer;
                  return (
                    <Card key={`trainer-${trainer.id}`} className="border-border/70">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{trainer.name}</CardTitle>
                          <div className="text-sm text-muted-foreground">
                            Trenér • {trainer.specialization || "Bez specializace"}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {trainer.status === "approved" ? "Schváleno" : "Zamítnuto"}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {trainer.bio || "Bez popisu"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <Link href={`/treneri/${trainer.id}`}>
                              <Eye className="h-4 w-4 mr-1" /> Náhled
                            </Link>
                          </Button>
                          {trainer.status === "rejected" ? (
                            <Button
                              size="sm"
                              onClick={() => handleTrainerStatus(trainer.id, "approved")}
                            >
                              <Check className="h-4 w-4 mr-1" /> Schválit
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleTrainerStatus(trainer.id, "rejected")}
                            >
                              <X className="h-4 w-4 mr-1" /> Zamítnout
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
              });
            })()}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
